import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';

export default function Dashboard() {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();
    const [myGigs, setMyGigs] = useState([]);
    const [hiredJobs, setHiredJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user?.id, location.state?.refresh]); // Refresh when location state changes

    const fetchDashboardData = async () => {
        try {
            // Fetch both posted gigs and hired jobs
            const [gigsResponse, hiredResponse] = await Promise.all([
                api.get('/gigs/my-gigs'),
                api.get('/bids/my-hired-jobs')
            ]);

            if (gigsResponse.data.success) {
                setMyGigs(gigsResponse.data.gigs);
            }

            if (hiredResponse.data.success) {
                setHiredJobs(hiredResponse.data.gigs);
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
                                        <span className="text-lg font-bold text-green-700">${gig.budget}</span>
                                        <Link
                                            to={`/gigs/${gig._id}`}
                                            className="text-green-700 hover:text-green-800 text-sm font-medium"
                                        >
                                            View Details →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hired Jobs - Jobs where user was hired as freelancer */}
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">My Hired Jobs</h2>
                        <Link to="/" className="btn-secondary text-sm px-4 py-2">
                            Browse More Gigs
                        </Link>
                    </div>

                    {hiredJobs.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">💼</div>
                            <p className="text-gray-600 mb-4">You haven't been hired for any jobs yet</p>
                            <Link to="/" className="btn-secondary text-sm">
                                Browse Available Gigs
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {hiredJobs.map((job) => (
                                <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors bg-green-50/30">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                Client: <span className="font-medium text-gray-700">{job.owner?.name || 'Unknown'}</span>
                                            </p>
                                        </div>
                                        <span className="badge-hired text-xs">
                                            HIRED
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <div>
                                                <span className="text-lg font-bold text-green-700">${job.bidPrice}</span>
                                                <p className="text-xs text-gray-500">Your bid</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">${job.budget}</span>
                                                <p className="text-xs text-gray-500">Original budget</p>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/gigs/${job._id}`}
                                            className="text-green-700 hover:text-green-800 text-sm font-medium"
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
