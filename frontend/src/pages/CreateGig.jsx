import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function CreateGig() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.post('/gigs', {
                ...formData,
                budget: Number(formData.budget)
            });

            if (data.success) {
                toast.success('Gig posted successfully!');
                // Navigate with state to trigger list refresh
                navigate('/', { state: { refresh: true } });
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to create gig';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="card">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Post a New Gig</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Gig Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            minLength={5}
                            maxLength={100}
                            className="input-field"
                            placeholder="e.g., Build a responsive landing page"
                        />
                        <p className="text-sm text-gray-500 mt-1">Minimum 5 characters, maximum 100</p>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            minLength={20}
                            maxLength={2000}
                            rows={6}
                            className="input-field resize-none"
                            placeholder="Describe your project requirements in detail..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Minimum 20 characters, maximum 2000 ({formData.description.length}/2000)
                        </p>
                    </div>

                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                            Budget ($)
                        </label>
                        <input
                            type="number"
                            id="budget"
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            required
                            min={1}
                            className="input-field"
                            placeholder="500"
                        />
                        <p className="text-sm text-gray-500 mt-1">Enter your budget in USD</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Posting...' : 'Post Gig'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
