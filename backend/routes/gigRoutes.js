import express from 'express';
import { body, validationResult } from 'express-validator';
import Gig from '../models/Gig.js';
import Bid from '../models/Bid.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/gigs
// @desc    Get all gigs with optional search
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { search, status = 'open' } = req.query;

        let query = { status };

        // Add text search if search query provided
        if (search) {
            query.$text = { $search: search };
        }

        const gigs = await Gig.find(query)
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            count: gigs.length,
            gigs
        });
    } catch (error) {
        console.error('Get gigs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching gigs'
        });
    }
});

// @route   GET /api/gigs/:id
// @desc    Get single gig by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id)
            .populate('owner', 'name email');

        if (!gig) {
            return res.status(404).json({
                success: false,
                message: 'Gig not found'
            });
        }

        // Get bid count if user is the owner
        let bidCount = 0;
        if (req.user && gig.owner._id.toString() === req.user._id.toString()) {
            bidCount = await Bid.countDocuments({ gig: gig._id });
        }

        res.json({
            success: true,
            gig,
            bidCount
        });
    } catch (error) {
        console.error('Get gig error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching gig'
        });
    }
});

// @route   POST /api/gigs
// @desc    Create a new gig
// @access  Private
router.post('/', protect, [
    body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
    body('description').trim().isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
    body('budget').isNumeric().custom(value => value >= 1).withMessage('Budget must be at least $1')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { title, description, budget } = req.body;

        const gig = await Gig.create({
            title,
            description,
            budget,
            owner: req.user._id
        });

        const populatedGig = await Gig.findById(gig._id).populate('owner', 'name email');

        res.status(201).json({
            success: true,
            gig: populatedGig
        });
    } catch (error) {
        console.error('Create gig error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating gig'
        });
    }
});

export default router;
