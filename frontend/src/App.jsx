import { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Utils
import api from './utils/api';
import { initSocket, disconnectSocket } from './utils/socket';

// Store
import { setUser, setLoading } from './store/authSlice';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import GigList from './pages/GigList';
import GigDetail from './pages/GigDetail';
import CreateGig from './pages/CreateGig';
import Dashboard from './pages/Dashboard';

function App() {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    // Define checkAuth first before it's used in useEffect
    const checkAuth = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                dispatch(setUser(data.user));
            }
        } catch (error) {
            console.log('Not authenticated');
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    // Check authentication status on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Initialize Socket.io when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            const socket = initSocket(user.id);

            // Listen for hire notifications
            socket.on('hired', (data) => {
                toast.success(data.message, {
                    duration: 5000,
                    icon: '🎉'
                });

                // Add notification to dashboard
                const notificationsArea = document.getElementById('notifications-area');
                if (notificationsArea) {
                    const notification = document.createElement('div');
                    notification.className = 'bg-green-50 border-2 border-green-300 rounded-lg p-4 animate-pulse';
                    notification.innerHTML = `
            <div class="flex items-start gap-3">
              <div class="text-2xl">🎉</div>
              <div>
                <p class="font-semibold text-green-900">${data.message}</p>
                <p class="text-sm text-green-700 mt-1">Price: $${data.bid.price}</p>
                <p class="text-xs text-green-600 mt-2">${new Date().toLocaleString()}</p>
              </div>
            </div>
          `;

                    // Clear placeholder and add notification
                    if (notificationsArea.querySelector('.text-center')) {
                        notificationsArea.innerHTML = '';
                    }
                    notificationsArea.insertBefore(notification, notificationsArea.firstChild);
                }
            });

            return () => {
                disconnectSocket();
            };
        }
    }, [isAuthenticated, user?.id]); // Only depend on user.id, not the entire user object

    return (
        <Router>
            <div className="min-h-screen">
                <Navbar />

                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
                    />
                    <Route
                        path="/register"
                        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <GigList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/gigs/:id"
                        element={
                            <ProtectedRoute>
                                <GigDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create-gig"
                        element={
                            <ProtectedRoute>
                                <CreateGig />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Toast Notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#fff',
                            color: '#363636',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            padding: '16px'
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff'
                            }
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff'
                            }
                        }
                    }}
                />
            </div>
        </Router>
    );
}

export default App;
