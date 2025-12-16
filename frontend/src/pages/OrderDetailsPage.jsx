import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import axios from "axios";
import StarRating from "../components/StarRating";

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);

      // If restaurant owner and order is ready, fetch available drivers
      if (user.role === 'restaurant_owner' && ['confirmed', 'preparing', 'ready'].includes(response.data.status)) {
        fetchAvailableDrivers(response.data.restaurant_id);
      }

      // If order is delivered, fetch reviews
      if (response.data.status === 'delivered') {
        fetchOrderReviews(response.data.restaurant_id);
      }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order details');
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async (restaurantId) => {
    try {
      const response = await api.get(`/drivers/available/${restaurantId}`);
      setAvailableDrivers(response.data);
    } catch (err) {
    }
  };

  const fetchOrderReviews = async (restaurantId) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const response = await axios.get(
        `${API_URL}/reviews/restaurant/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter to show only reviews for this specific order
      const orderReview = response.data.reviews.find(r => r.order_id === parseInt(orderId));
      if (orderReview) {
        setReviews([orderReview]);
      }
    } catch (err) {
      console.log('No reviews found for this order');
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      await api.put(`/orders/status/${orderId}`, { status: newStatus });
      alert('Order status updated successfully');
      fetchOrderDetails();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const assignDriver = async (driverId) => {
    try {
      await api.post('/delivery/assign', {
        orderId: parseInt(orderId),
        driverId: driverId
      });
      setShowDriverModal(false);
      fetchOrderDetails();
      alert('Driver assigned successfully!');
    } catch (err) {
      alert('Failed to assign driver');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-900">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <button
          onClick={() => navigate('/admin')}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-orange-600 hover:text-orange-700 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order.order_number || orderId}
          </h1>
          <p className="text-gray-900">
            Placed on {new Date(order.order_date).toLocaleString()}
          </p>
        </div>

        {/* Status Badge */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Order Status</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                {order.status.toUpperCase().replace('_', ' ')}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">{parseFloat(order.total_amount).toFixed(2)} EGP</p>
              <p className="text-sm text-gray-900">Payment: {order.payment_method?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {order.customer_name && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Customer</h3>
            <p className="text-gray-900">{order.customer_name}</p>
            <p className="text-gray-900">{order.customer_phone}</p>
            <p className="text-gray-900 mt-2">{order.delivery_address}, {order.delivery_city}</p>
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Items</h3>
            <ul className="divide-y">
              {order.items.map((item) => (
                <li key={item.order_item_id} className="py-3 flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.menu_item_name}</p>
                    <p className="text-sm text-gray-900">Qty: {item.quantity} × {parseFloat(item.unit_price).toFixed(2)} EGP</p>
                    {item.special_requests && (
                      <p className="text-sm text-gray-900 italic">Note: {item.special_requests}</p>
                    )}
                  </div>
                  <p className="font-bold text-gray-900">{parseFloat(item.subtotal).toFixed(2)} EGP</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status Update Buttons (Restaurant Owner) */}
        {user.role === 'restaurant_owner' && ['pending', 'confirmed', 'preparing'].includes(order.status) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Confirm Order
                </button>
              )}
              {order.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus('preparing')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus('ready')}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Mark as Ready
                </button>
              )}
            </div>
          </div>
        )}

        {/* Customer Review Section */}
        {order.status === 'delivered' && reviews.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Customer Review</h3>
            {reviews.map((review, index) => (
              <div key={index} className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={review.rating} showCount={false} size="small" />
                  <span className="text-sm text-gray-600">
                    {new Date(review.review_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{review.customer_name}</p>
                {review.review_text && (
                  <p className="text-gray-900 mt-2 italic">"{review.review_text}"</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Driver Assignment Modal */}
        {showDriverModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Driver</h3>

              {availableDrivers.length === 0 ? (
                <p className="text-gray-900 mb-4">No drivers available at the moment</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableDrivers.map((driver) => (
                    <div
                      key={driver.driver_id}
                      className="border rounded-lg p-4 hover:border-orange-500 cursor-pointer"
                      onClick={() => assignDriver(driver.driver_id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{driver.full_name}</p>
                          <p className="text-sm text-gray-900">{driver.vehicle_type} - {driver.vehicle_model}</p>
                          <p className="text-sm text-gray-900">{driver.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-900">{driver.completed_deliveries} deliveries</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowDriverModal(false)}
                className="mt-4 w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
