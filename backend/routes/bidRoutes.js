import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Gig from '../models/Gig.js';
import { protect } from '../middleware/authMiddleware.js';
import { getIO, getUserSocketId } from '../socket/socket.js';

const router = express.Router();

// @route   POST /api/bids
// @desc    Submit a bid on a gig
// @access  Private
router.post('/', protect, [
    body('gigId').isMongoId().withMessage('Invalid gig ID'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10-1000 characters'),
    body('price').isNumeric().custom(value => value >= 1).withMessage('Price must be at least $1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { gigId, message, price } = req.body;

        // Check if gig exists and is open
        const gig = await Gig.findById(gigId);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found'
            });
        }

        if (gig.status !== 'open') {
            return res.status(400).json({
                success: false,
                message: 'This gig is no longer accepting bids'
            });
        }

        // Check if user is not the gig owner
        if (gig.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot bid on your own gig'
            });
        }

        // Check if user already submitted a bid
        const existingBid = await Bid.findOne({
            gig: gigId,
            freelancer: req.user._id
        });

        if (existingBid) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a bid for this gig'
            });
        }

        // Create bid
        const bid = await Bid.create({
            gig: gigId,
            freelancer: req.user._id,
            message,
            price
        });

        const populatedBid = await Bid.findById(bid._id)
            .populate('freelancer', 'name email')
            .populate('gig', 'title');

        // Emit real-time notification to gig owner
        const io = getIO();
        const ownerSocketId = getUserSocketId(gig.owner.toString());

        if (ownerSocketId) {
            io.to(ownerSocketId).emit('new-bid', {
                bid: populatedBid,
                gigId: gig._id,
                message: `New bid from ${req.user.name} on "${gig.title}"`
            });
        }

        res.status(201).json({
            success: true,
            bid: populatedBid
        });
    } catch (error) {
        console.error('Submit bid error:', error);

        // Handle duplicate bid error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a bid for this gig'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error submitting bid'
        });
    }
});

// @route   GET /api/bids/:gigId
// @desc    Get all bids for a specific gig
// @access  Private (gig owner only)
router.get('/:gigId', protect, async (req, res) => {
    try {
        const { gigId } = req.params;

        // Verify gig exists
        const gig = await Gig.findById(gigId);

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found'
            });
        }

        // Verify user is the gig owner
        if (gig.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view bids for this gig'
            });
        }

        // Get all bids for this gig
        const bids = await Bid.find({ gig: gigId })
            .populate('freelancer', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bids.length,
            bids
        });
    } catch (error) {
        console.error('Get bids error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching bids'
        });
    }
});

// @route   PATCH /api/bids/:bidId/hire
// @desc    Hire a freelancer (atomic operation with transaction)
// @access  Private (gig owner only)
router.patch('/:bidId/hire', protect, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        // Start transaction
        session.startTransaction();

        // Find the bid with session
        const bid = await Bid.findById(req.params.bidId)
            .populate('gig')
            .session(session);

        if (!bid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                message: 'Bid not found'
            });
        }

        // Verify user is the gig owner
        if (bid.gig.owner.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to hire for this gig'
            });
        }

        // Check if bid is still pending
        if (bid.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: `This bid has already been ${bid.status}`
            });
        }

        // CRITICAL: Check if gig is still open (prevents race condition)
        if (bid.gig.status !== 'open') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'This gig has already been assigned to another freelancer'
            });
        }

        // 1. Update the gig status to 'assigned'
        await Gig.findByIdAndUpdate(
            bid.gig._id,
            { status: 'assigned' },
            { session }
        );

        // 2. Update the hired bid status to 'hired'
        await Bid.findByIdAndUpdate(
            bid._id,
            { status: 'hired' },
            { session }
        );

        // 3. Update all other bids for this gig to 'rejected'
        await Bid.updateMany(
            {
                gig: bid.gig._id,
                _id: { $ne: bid._id },
                status: 'pending'
            },
            { status: 'rejected' },
            { session }
        );

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // Get updated bid with populated data
        const updatedBid = await Bid.findById(bid._id)
            .populate('freelancer', 'name email')
            .populate('gig', 'title description budget');

        // Send real-time notification to hired freelancer
        const io = getIO();
        const freelancerSocketId = getUserSocketId(bid.freelancer.toString());

        if (freelancerSocketId) {
            io.to(freelancerSocketId).emit('hired', {
                message: `You have been hired for "${bid.gig.title}"!`,
                gig: {
                    id: bid.gig._id,
                    title: bid.gig.title
                },
                bid: {
                    id: updatedBid._id,
                    price: updatedBid.price
                }
            });
        }

        res.json({
            success: true,
            message: 'Freelancer hired successfully',
            bid: updatedBid
        });

    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();

        console.error('Hire bid error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during hiring process'
        });
    }
});

export default router;
