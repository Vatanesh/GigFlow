import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

export default function GigDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [gig, setGig] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bidFormData, setBidFormData] = useState({
        message: '',
        price: ''
    });
    const [submittingBid, setSubmittingBid] = useState(false);

    useEffect(() => {
        fetchGigDetails();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for real-time bid updates
    useEffect(() => {
        const socket = getSocket();
        if (socket && user && gig && gig.owner._id === user.id) {
            const handleNewBid = (data) => {
                if (data.gigId === id) {
                    toast.success(data.message);
                    fetchBids(); // Refresh bids list
                }
            };

            socket.on('new-bid', handleNewBid);

            return () => {
                socket.off('new-bid', handleNewBid);
            };
        }
    }, [id, user, gig]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchGigDetails = useCallback(async () => {
        try {
            const { data } = await api.get(`/gigs/${id}`);
            if (data.success) {
                setGig(data.gig);

                // Fetch bids if user is the owner
                if (user && data.gig.owner._id === user.id) {
                    fetchBids();
                }
            }
        } catch (error) {
            toast.error('Failed to fetch gig details');
            navigate('/');
        } finally {
            setLoading(false);
        }
    }, [id]); // Only depend on id, not user

    const fetchBids = useCallback(async () => {
        try {
            const { data } = await api.get(`/bids/${id}`);
            if (data.success) {
                setBids(data.bids);
            }
        } catch (error) {
            console.error('Failed to fetch bids');
        }
    }, [id]);

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        setSubmittingBid(true);

        try {
            const { data } = await api.post('/bids', {
                gigId: id,
                message: bidFormData.message,
                price: Number(bidFormData.price)
            });

            if (data.success) {
                toast.success('Bid submitted successfully! Redirecting to home...');
                setBidFormData({ message: '', price: '' });
                // Delay navigation to show success message
                setTimeout(() => navigate('/'), 1500);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to submit bid';
            toast.error(message);
        } finally {
            setSubmittingBid(false);
        }
    };

    const handleHire = async (bidId) => {
        if (!confirm('Are you sure you want to hire this freelancer? This action cannot be undone.')) {
            return;
        }

        try {
            const { data } = await api.patch(`/bids/${bidId}/hire`);

            if (data.success) {
                toast.success('Freelancer hired successfully!');
                // Refetch both gig details and bids to show updated statuses
                await fetchGigDetails();
                await fetchBids();
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to hire freelancer';
            toast.error(message);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading gig details...</p>
                </div>
            </div>
        );
    }

    if (!gig) return null;

    const isOwner = user && gig.owner._id === user.id;
    const canBid = user && !isOwner && gig.status === 'open';

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/')}
                className="text-green-700 hover:text-green-800 mb-6 flex items-center gap-2"
            >
                ← Back to Gigs
            </button>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Gig Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <div className="flex items-start justify-between mb-4">
                            <h1 className="text-3xl font-bold text-gray-900">{gig.title}</h1>
                            <span className={`badge-${gig.status} text-sm`}>
                                {gig.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                            <p className="text-gray-600 whitespace-pre-line">{gig.description}</p>
                        </div>

                        <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
                            <div>
                                <p className="text-3xl font-bold text-green-700">${gig.budget}</p>
                                <p className="text-sm text-gray-500">Budget</p>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-700">{gig.owner.name}</p>
                                <p className="text-sm text-gray-500">Posted by</p>
                            </div>
                        </div>
                    </div>

                    {/* Bid Form for Non-Owners */}
                    {canBid && (
                        <div className="card">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit Your Bid</h2>
                            <form onSubmit={handleBidSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        value={bidFormData.price}
                                        onChange={(e) => setBidFormData({ ...bidFormData, price: e.target.value })}
                                        required
                                        min={1}
                                        className="input-field"
                                        placeholder="Enter your price"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        Cover Letter
                                    </label>
                                    <textarea
                                        id="message"
                                        value={bidFormData.message}
                                        onChange={(e) => setBidFormData({ ...bidFormData, message: e.target.value })}
                                        required
                                        minLength={10}
                                        maxLength={1000}
                                        rows={4}
                                        className="input-field resize-none"
                                        placeholder="Explain why you're the best fit for this project..."
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {bidFormData.message.length}/1000 characters
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submittingBid}
                                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submittingBid ? 'Submitting...' : 'Submit Bid'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Bids List for Owner */}
                {isOwner && (
                    <div className="lg:col-span-1">
                        <div className="card sticky top-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Received Bids ({bids.length})
                            </h2>

                            {bids.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">📭</div>
                                    <p className="text-gray-600">No bids yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {bids.map((bid) => (
                                        <div key={bid._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{bid.freelancer.name}</p>
                                                    <p className="text-sm text-gray-500">{bid.freelancer.email}</p>
                                                </div>
                                                <span className={`badge-${bid.status} text-xs`}>
                                                    {bid.status.toUpperCase()}
                                                </span>
                                            </div>

                                            <p className="text-2xl font-bold text-green-700 mb-2">${bid.price}</p>
                                            <p className="text-sm text-gray-600 mb-3">{bid.message}</p>

                                            {bid.status === 'pending' && gig.status === 'open' && (
                                                <button
                                                    onClick={() => handleHire(bid._id)}
                                                    className="btn-primary w-full text-sm py-2"
                                                >
                                                    Hire This Freelancer
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
