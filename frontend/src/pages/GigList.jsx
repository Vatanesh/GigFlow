import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

export default function GigList() {
    const location = useLocation();
    const [gigs, setGigs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGigs = useCallback(async () => {
        try {
            const { data } = await api.get('/gigs', {
                params: { search: search || undefined }
            });

            if (data.success) {
                setGigs(data.gigs);
            }
        } catch (error) {
            toast.error('Failed to fetch gigs');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchGigs();
    }, [fetchGigs, location.state?.refresh]); // Refresh when location state changes

    // Listen for real-time new gigs
    useEffect(() => {
        const socket = getSocket();
        if (socket) {
            const handleNewGig = (data) => {
                toast.success(`New gig posted: "${data.gig.title}"`);
                // Add new gig to the list
                setGigs(prevGigs => [data.gig, ...prevGigs]);
            };

            socket.on('new-gig', handleNewGig);

            return () => {
                socket.off('new-gig', handleNewGig);
            };
        }
    }, []); // Only set up once

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Gigs</h1>
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search gigs by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field flex-1"
                    />
                    <Link to="/create-gig" className="btn-primary whitespace-nowrap">
                        Post a Gig
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading gigs...</p>
                </div>
            ) : gigs.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Gigs Found</h3>
                    <p className="text-gray-600 mb-6">
                        {search ? 'Try a different search term' : 'Be the first to post a gig!'}
                    </p>
                    <Link to="/create-gig" className="btn-primary inline-block">
                        Post a Gig
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gigs.map((gig) => (
                        <div key={gig._id} className="card group hover:scale-105">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                    {gig.title}
                                </h3>
                                <span className={`badge-${gig.status}`}>
                                    {gig.status.toUpperCase()}
                                </span>
                            </div>

                            <p className="text-gray-600 mb-4 line-clamp-3">{gig.description}</p>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-green-700">${gig.budget}</p>
                                    <p className="text-sm text-gray-500">Budget</p>
                                </div>
                                <Link
                                    to={`/gigs/${gig._id}`}
                                    className="btn-secondary text-sm px-4 py-2"
                                >
                                    View Details
                                </Link>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500">
                                    Posted by <span className="font-medium text-gray-700">{gig.owner.name}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
