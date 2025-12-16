import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faMapMarkerAlt, faHome, faPhone, faSyncAlt, faClock } from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AvailableOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'driver') {
      navigate('/');
      return;
    }
    fetchAvailableOrders();
    const interval = setInterval(fetchAvailableOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAvailableOrders = async () => {
    try {
      setRefreshing(true);
      const response = await deliveryAPI.getAvailableOrders();
      setAvailableOrders(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const acceptOrder = async (orderId) => {
    if (!window.confirm('Accept this delivery?')) return;

    try {
      await deliveryAPI.acceptOrder(orderId);
      navigate('/my-deliveries');
      alert('Order accepted! Check "My Deliveries" to proceed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept order');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Orders</h1>
          <p className="text-sm sm:text-base text-gray-900 mt-2">Pick up orders ready for delivery</p>
        </div>

        {availableOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <FontAwesomeIcon icon={faBox} className="text-6xl text-gray-400 mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Orders Available</h3>
            <p className="text-sm sm:text-base text-gray-900 mb-4 sm:mb-6">Check back soon for new delivery opportunities</p>
            <button
              onClick={fetchAvailableOrders}
              disabled={refreshing}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-200 inline-flex items-center gap-2 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faSyncAlt} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {availableOrders.map((order) => (
              <div key={order.order_id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order #{order.order_number}</h3>
                    <p className="text-xs sm:text-sm text-gray-900">{new Date(order.order_date).toLocaleString()}</p>
                    {order.minutes_ready !== null && (
                      <p className="text-xs sm:text-sm text-orange-600 font-medium mt-1 inline-flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} />
                        Ready {order.minutes_ready} minutes ago
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{parseFloat(order.delivery_fee).toFixed(2)} EGP</p>
                    <p className="text-xs sm:text-sm text-gray-900">Delivery Fee</p>
                    <p className="text-xs sm:text-sm text-green-700 font-medium mt-1">
                      You earn: {(parseFloat(order.delivery_fee) * 0.7).toFixed(2)} EGP
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="border-l-4 border-orange-500 pl-3 sm:pl-4">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Pickup From:
                    </p>
                    <p className="font-bold text-sm sm:text-base text-gray-900">{order.restaurant_name}</p>
                    <p className="text-xs sm:text-sm text-gray-900">{order.restaurant_address}</p>
                    <p className="text-xs sm:text-sm text-gray-900">{order.restaurant_city}</p>
                    <p className="text-xs sm:text-sm text-gray-900 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faPhone} />
                      {order.restaurant_phone}
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faHome} />
                      Deliver To:
                    </p>
                    <p className="font-bold text-sm sm:text-base text-gray-900">{order.customer_name}</p>
                    <p className="text-xs sm:text-sm text-gray-900">{order.delivery_address}</p>
                    {order.apartment_number && (
                      <p className="text-xs sm:text-sm text-gray-900">Apt: {order.apartment_number}</p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-900">{order.delivery_city}</p>
                    <p className="text-xs sm:text-sm text-gray-900 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faPhone} />
                      {order.customer_phone}
                    </p>
                  </div>
                </div>

                {order.special_instructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-xs sm:text-sm font-bold text-yellow-800">Special Instructions:</p>
                    <p className="text-xs sm:text-sm text-yellow-900">{order.special_instructions}</p>
                  </div>
                )}

                {order.delivery_instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs sm:text-sm font-bold text-blue-800">Delivery Instructions:</p>
                    <p className="text-xs sm:text-sm text-blue-900">{order.delivery_instructions}</p>
                  </div>
                )}

                <button
                  onClick={() => acceptOrder(order.order_id)}
                  className="w-full bg-orange-600 text-white py-2 sm:py-3 rounded-lg hover:bg-orange-700 font-bold text-base sm:text-lg"
                >
                  Accept Delivery
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
