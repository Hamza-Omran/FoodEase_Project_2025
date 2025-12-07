import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

export default function OrderReviewPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [restaurantRating, setRestaurantRating] = useState(0);
    const [restaurantReview, setRestaurantReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            const response = await orderAPI.getById(orderId);
            setOrder(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load order details');
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (restaurantRating === 0) {
            setError('Please select a rating');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            await axios.post(
                `${API_URL}/reviews/restaurant`,
                {
                    restaurant_id: order.restaurant_id,
                    order_id: parseInt(orderId),
                    rating: restaurantRating,
                    review_text: restaurantReview
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess(true);
            setTimeout(() => {
                navigate('/my-orders');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review');
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading order details...</div>;
    }

    if (!order) {
        return <div className="text-center py-12">Order not found</div>;
    }

    if (order.status !== 'delivered') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold mb-2">Cannot Review Yet</h2>
                    <p className="text-gray-700">You can only review orders that have been delivered.</p>
                    <button
                        onClick={() => navigate('/my-orders')}
                        className="mt-4 bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700"
                    >
                        Back to My Orders
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold mb-2 text-green-800">Review Submitted!</h2>
                    <p className="text-gray-700">Thank you for your feedback.</p>
                    <p className="text-sm text-gray-500 mt-2">Redirecting to my orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Leave a Review</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-2">{order.restaurant_name}</h2>
                <p className="text-gray-600">Order #{order.order_number}</p>
                <p className="text-sm text-gray-500">
                    Delivered on {new Date(order.order_date).toLocaleDateString()}
                </p>
            </div>

            <form onSubmit={handleSubmitReview} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">Rate Your Experience</h3>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                        Restaurant Rating *
                    </label>
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRestaurantRating(star)}
                                className={`text-3xl sm:text-4xl transition-colors ${star <= restaurantRating ? 'text-yellow-400' : 'text-gray-300'
                                    } hover:text-yellow-400 focus:outline-none`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {restaurantRating > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                            {restaurantRating} star{restaurantRating > 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                        Your Review (Optional)
                    </label>
                    <textarea
                        value={restaurantReview}
                        onChange={(e) => setRestaurantReview(e.target.value)}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Share your experience with this restaurant..."
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={submitting || restaurantRating === 0}
                        className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/my-orders')}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
