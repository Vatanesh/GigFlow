import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { logout } from '../store/authSlice';
import { disconnectSocket } from '../utils/socket';

export default function Navbar() {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            dispatch(logout());
            disconnectSocket();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            toast.error('Failed to logout');
        }
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            GigFlow
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
                                    Browse Gigs
                                </Link>
                                <Link to="/dashboard" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
                                    Dashboard
                                </Link>
                                <Link to="/create-gig" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
                                    Post Gig
                                </Link>
                                <div className="flex items-center gap-3 border-l border-gray-300 pl-4 ml-2">
                                    <span className="text-gray-700 font-medium">{user?.name}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-700 hover:text-green-700 font-medium transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
