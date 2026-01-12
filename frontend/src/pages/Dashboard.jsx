import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Dashboard() {
    const { user } = useSelector((state) => state.auth);
    const [myGigs, setMyGigs] = useState([]);
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user?.id]); // Only depend on user.id to prevent infinite loops

    const fetchDashboardData = async () => {
        try {
            // This is a simplified version - you'd need additional endpoints for user-specific data
            // For now, we'll just fetch all gigs and filter client-side
            const gigsResponse = await api.get('/gigs', { params: { status: undefined } });

            if (gigsResponse.data.success) {
                // Filter gigs owned by the user
                const userGigs = gigsResponse.data.gigs.filter(
                    gig => gig.owner._id === user.id
                );
                setMyGigs(userGigs);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* My Posted Gigs */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">My Posted Gigs</h2>
                        <Link to="/create-gig" className="btn-primary text-sm px-4 py-2">
                            + New Gig
                        </Link>
                    </div>

                    {myGigs.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">📝</div>
                            <p className="text-gray-600 mb-4">You haven't posted any gigs yet</p>
                            <Link to="/create-gig" className="btn-secondary text-sm">
                                Post Your First Gig
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myGigs.map((gig) => (
                                <div key={gig._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">{gig.title}</h3>
                                        <span className={`badge-${gig.status} text-xs`}>
                                            {gig.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{gig.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-blue-600">${gig.budget}</span>
                                        <Link
                                            to={`/gigs/${gig._id}`}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            View Details →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Real-time Notifications Area */}
                <div className="card">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
                    <div id="notifications-area" className="space-y-3">
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">🔔</div>
                            <p className="text-gray-600">You'll receive real-time notifications here when you're hired!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
