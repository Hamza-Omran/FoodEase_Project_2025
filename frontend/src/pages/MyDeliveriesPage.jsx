import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faBox,
  faTruck,
  faMapMarkerAlt,
  faHome,
  faPhone,
  faStar,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function MyDeliveriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'completed'
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'driver') {
      navigate('/');
      return;
    }
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    try {
      const [assignmentsRes, statsRes] = await Promise.all([
        deliveryAPI.getMyAssignments(),
        deliveryAPI.getStats()
      ]);

      const allAssignments = assignmentsRes.data || [];

      const current = allAssignments.filter(a =>
        ['accepted', 'picked_up', 'in_transit'].includes(a.delivery_status)
      );

      const completed = allAssignments.filter(a =>
        ['delivered', 'failed', 'rejected'].includes(a.delivery_status)
      );

      setCurrentAssignments(current);
      setCompletedAssignments(completed);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const updateStatus = async (assignmentId, status) => {
    try {
      await deliveryAPI.updateStatus(assignmentId, {
        delivery_status: status,
        latitude: null,
        longitude: null
      });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'accepted': 'bg-blue-100 text-blue-800',
      'picked_up': 'bg-purple-100 text-purple-800',
      'in_transit': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'rejected': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">My Deliveries</h1>

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">Today's Deliveries</p>
                <p className="text-2xl font-bold text-blue-600">{stats.stats.today.deliveries}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">Today's Earnings</p>
                <p className="text-2xl font-bold text-green-600">{stats.stats.today.earnings} EGP</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">Total Completed</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completed_deliveries}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">Rating</p>
                <p className="text-2xl font-bold text-orange-600 inline-flex items-center gap-1">
                  <FontAwesomeIcon icon={faStar} className="text-orange-500" />
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex justify-around">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 max-w-md px-8 py-3 font-semibold text-sm rounded-lg transition-all duration-200 ${activeTab === 'current'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
            >
              Current ({currentAssignments.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 max-w-md px-8 py-3 font-semibold text-sm rounded-lg transition-all duration-200 ${activeTab === 'completed'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
            >
              Completed ({completedAssignments.length})
            </button>
          </div>
        </div>

        {activeTab === 'current' && (
          <div className="space-y-4">
            {currentAssignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl sm:text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Active Deliveries</h3>
                <p className="text-gray-900 mb-6">Accept orders from Available Orders page</p>
                <button
                  onClick={() => navigate('/available-orders')}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-bold w-full sm:w-auto"
                >
                  Browse Available Orders
                </button>
              </div>
            ) : (
              currentAssignments.map((assignment) => (
                <div key={assignment.assignment_id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order #{assignment.order_number}</h3>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${getStatusColor(assignment.delivery_status)}`}>
                        {assignment.delivery_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {parseFloat(assignment.driver_earnings).toFixed(2)} EGP
                      </p>
                      <p className="text-xs sm:text-sm text-gray-900">Your Earnings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border-l-4 border-orange-500 pl-4 py-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                        Pickup:
                      </p>
                      <p className="font-bold text-gray-900">{assignment.restaurant_name}</p>
                      <p className="text-sm text-gray-900">{assignment.restaurant_address}</p>
                      <p className="text-sm text-gray-900 inline-flex items-center gap-2 mt-1">
                        <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                        {assignment.restaurant_phone}
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4 py-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faHome} className="text-green-500" />
                        Deliver:
                      </p>
                      <p className="font-bold text-gray-900">{assignment.customer_name}</p>
                      <p className="text-sm text-gray-900">{assignment.delivery_address}</p>
                      {assignment.apartment_number && (
                        <p className="text-sm text-gray-900">Apt: {assignment.apartment_number}</p>
                      )}
                      <p className="text-sm text-gray-900 inline-flex items-center gap-2 mt-1">
                        <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                        {assignment.customer_phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {assignment.delivery_status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(assignment.assignment_id, 'picked_up')}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Picked Up
                      </button>
                    )}
                    {assignment.delivery_status === 'picked_up' && (
                      <button
                        onClick={() => updateStatus(assignment.assignment_id, 'in_transit')}
                        className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTruck} />
                        On The Way
                      </button>
                    )}
                    {assignment.delivery_status === 'in_transit' && (
                      <button
                        onClick={() => updateStatus(assignment.assignment_id, 'delivered')}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedAssignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                <FontAwesomeIcon icon={faBox} className="text-4xl sm:text-6xl text-gray-300 mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Completed Deliveries</h3>
                <p className="text-gray-900">Your completed deliveries will appear here</p>
              </div>
            ) : (
              completedAssignments.map((assignment) => (
                <div key={assignment.assignment_id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order #{assignment.order_number}</h3>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${getStatusColor(assignment.delivery_status)}`}>
                        {assignment.delivery_status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-xs sm:text-sm text-gray-900 mt-2">
                        {assignment.delivery_time ?
                          `Completed: ${new Date(assignment.delivery_time).toLocaleString()}` :
                          `Assigned: ${new Date(assignment.assigned_at).toLocaleString()}`
                        }
                      </p>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {parseFloat(assignment.driver_earnings).toFixed(2)} EGP
                      </p>
                      <p className="text-xs sm:text-sm text-gray-900">Earned</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pickup */}
                    <div className="border-l-4 border-gray-300 pl-4 py-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                        Pickup:
                      </p>
                      <p className="font-medium text-gray-900">{assignment.restaurant_name}</p>
                      <p className="text-sm text-gray-900">{assignment.restaurant_address}</p>
                    </div>

                    {/* Delivery */}
                    <div className="border-l-4 border-gray-300 pl-4 py-1">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faHome} className="text-gray-400" />
                        Deliver:
                      </p>
                      <p className="font-medium text-gray-900">{assignment.customer_name}</p>
                      <p className="text-sm text-gray-900">{assignment.delivery_address}</p>
                      {assignment.apartment_number && (
                        <p className="text-sm text-gray-900">Apt: {assignment.apartment_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Failure/Rejection Reason */}
                  {assignment.failure_reason && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-bold text-red-800 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        Failure Reason:
                      </p>
                      <p className="text-sm text-red-900 mt-1">{assignment.failure_reason}</p>
                    </div>
                  )}

                  {assignment.rejection_reason && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-bold text-gray-800 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-gray-900 mt-1">{assignment.rejection_reason}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
