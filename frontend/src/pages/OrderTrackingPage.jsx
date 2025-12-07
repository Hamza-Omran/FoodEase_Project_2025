import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../services/api';
import axios from 'axios';
import StarRating from '../components/StarRating';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUtensils, faBox, faTruck } from '@fortawesome/free-solid-svg-icons';

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [review, setReview] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (orderId) {
          const data = await getOrder(orderId);
          if (mounted) {
            setOrder(data);
            if (data.has_review) {
              fetchReview(data.restaurant_id, orderId);
            }
          }
        } else {
          setError('Order ID is missing');
          setLoading(false);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load order');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const fetchReview = async (restaurantId, orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/api/v1/reviews/restaurant/${restaurantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderReview = response.data.reviews.find(r => r.order_id === parseInt(orderId));
      if (orderReview) {
        setReview(orderReview);
      }
    } catch (err) {
      console.log('Failed to fetch review');
    }
  };

  const getStepStatus = (status) => {
    if (!order) return 'inactive';
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    const stepIndex = statuses.indexOf(status);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
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
            onClick={() => navigate('/my-orders')}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Back to My Orders
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
          onClick={() => navigate('/my-orders')}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
        >
          Back to My Orders
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
            onClick={() => navigate('/my-orders')}
            className="text-orange-600 hover:text-orange-700 mb-4 flex items-center gap-2"
          >
            ← Back to My Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Track Order #{order.order_number}
          </h1>
          <p className="text-gray-900 mt-2">
            Placed on {new Date(order.order_date).toLocaleString()}
          </p>
        </div>

        {/* Order Status Progress */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>

          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
              <div
                className={`h-full bg-orange-600 transition-all duration-500`}
                style={{
                  width: `${order.status === 'pending' ? '0%' :
                    order.status === 'confirmed' ? '25%' :
                      order.status === 'preparing' ? '50%' :
                        order.status === 'ready' ? '75%' :
                          order.status === 'out_for_delivery' ? '90%' :
                            order.status === 'delivered' ? '100%' : '0%'
                    }`
                }}
              />
            </div>

            {/* Status Steps */}
            <div className="relative flex justify-between">
              {['Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                const stepStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
                const status = getStepStatus(stepStatuses[idx]);

                return (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${status === 'completed'
                        ? 'bg-green-500 text-white'
                        : status === 'active'
                          ? 'bg-orange-500 text-white animate-pulse'
                          : 'bg-gray-200 text-gray-900'
                        }`}
                    >
                      {status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <p className={`text-xs mt-2 text-center ${status === 'active' ? 'font-bold text-orange-600' : 'text-gray-900'
                      }`}>
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Status Message */}
          <div className="mt-8 p-4 bg-orange-50 rounded-lg">
            <p className="text-center text-orange-800 font-semibold">
              {order.status === 'pending' && 'Your order is being confirmed...'}
              {order.status === 'confirmed' && 'Order confirmed! Restaurant is preparing your food.'}
              {order.status === 'preparing' && <><FontAwesomeIcon icon={faUtensils} className="mr-2" />Your delicious meal is being prepared!</>}
              {order.status === 'ready' && <><FontAwesomeIcon icon={faBox} className="mr-2" />Your order is ready for delivery!</>}
              {order.status === 'out_for_delivery' && <><FontAwesomeIcon icon={faTruck} className="mr-2" />Your order is on the way!</>}
              {order.status === 'delivered' && <>Order delivered! Enjoy your meal!</>}
              {order.status === 'cancelled' && 'This order has been cancelled.'}
            </p>
          </div>
        </div>

        {/* Your Review */}
        {review && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Review</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={review.rating} showCount={false} size="medium" />
                <span className="text-sm text-gray-600">
                  {new Date(review.review_date).toLocaleDateString()}
                </span>
              </div>
              {review.review_text && (
                <p className="text-gray-900 italic">"{review.review_text}"</p>
              )}
            </div>
          </div>
        )}

        {/* Restaurant Info */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Restaurant</h2>
          <p className="text-lg font-semibold text-gray-800">{order.restaurant_name || 'Restaurant'}</p>
          {order.estimated_delivery_time && (
            <p className="text-sm text-gray-900 mt-2">
              Estimated delivery: {new Date(order.estimated_delivery_time).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Delivery Address */}
        {order.delivery_address && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
            <p className="text-gray-900">{order.delivery_address}</p>
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Items</h3>
            <ul className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <li key={item.order_item_id} className="py-3 flex justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.menu_item_name}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity} × {parseFloat(item.unit_price).toFixed(2)} EGP
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {parseFloat(item.subtotal).toFixed(2)} EGP
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-xl font-bold text-orange-600">
                <span>Total:</span>
                <span>{parseFloat(order.total_amount).toFixed(2)} EGP</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-900">
              <span>Payment Method:</span>
              <span className="font-semibold">{order.payment_method ? order.payment_method.toUpperCase() : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span>Payment Status:</span>
              <span className={`font-semibold ${order.payment_status === 'completed' ? 'text-green-600' : 'text-orange-600'
                }`}>
                {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
