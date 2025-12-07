import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faMapMarkerAlt,
    faHome,
    faPhone,
    faStar,
    faClipboardList,
    faCheckCircle,
    faTruck,
    faClock
} from '@fortawesome/free-solid-svg-icons';

export default function DeliveryDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('available');
    const [availableOrders, setAvailableOrders] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'driver') {
            navigate('/');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const fetchData = async () => {
        try {
            const [ordersRes, assignmentsRes, statsRes] = await Promise.all([
                deliveryAPI.getAvailableOrders(),
                deliveryAPI.getMyAssignments(),
                deliveryAPI.getStats()
            ]);

            setAvailableOrders(ordersRes.data);
            setMyAssignments(assignmentsRes.data);
            setStats(statsRes.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const acceptOrder = async (orderId) => {
        if (!window.confirm('Accept this delivery?')) return;

        try {
            await deliveryAPI.acceptOrder(orderId);
            fetchData();
            setActiveTab('assigned');
            alert('Order accepted! You can now proceed to pickup.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept order');
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

    if (loading) return <div className="text-center py-12 text-gray-900">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
                    <div className="mb-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
                        <p className="text-gray-900 mt-1">Welcome, {user.name}</p>
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-bold text-center text-sm sm:text-base ${activeTab === 'available'
                                    ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                                    : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            Available Orders ({availableOrders.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('assigned')}
                            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-bold text-center text-sm sm:text-base ${activeTab === 'assigned'
                                    ? 'border-b-2 border-orange-600 text-orange-600 bg-orange-50'
                                    : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            My Deliveries ({myAssignments.length})
                        </button>
                    </div>
                </div>

                {/* Available Orders Tab */}
                {activeTab === 'available' && (
                    <div className="space-y-4">
                        {availableOrders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                                <FontAwesomeIcon icon={faBox} className="text-4xl sm:text-6xl text-gray-300 mb-4" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Orders Available</h3>
                                <p className="text-gray-900">Check back soon for new delivery opportunities</p>
                            </div>
                        ) : (
                            availableOrders.map((order) => (
                                <div key={order.order_id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order #{order.order_number}</h3>
                                            <p className="text-xs sm:text-sm text-gray-900">{new Date(order.order_date).toLocaleString()}</p>
                                            {order.minutes_ready !== null && (
                                                <p className="text-xs sm:text-sm text-orange-600 font-medium mt-1 inline-flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faClock} />
                                                    Ready {order.minutes_ready} minutes ago
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-left sm:text-right mt-2 sm:mt-0">
                                            <p className="text-xl sm:text-2xl font-bold text-green-600">{parseFloat(order.delivery_fee).toFixed(2)} EGP</p>
                                            <p className="text-xs sm:text-sm text-gray-900">Delivery Fee</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Pickup */}
                                        <div className="border-l-4 border-orange-500 pl-4 py-1">
                                            <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
                                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500" />
                                                Pickup From:
                                            </p>
                                            <p className="font-bold text-gray-900">{order.restaurant_name}</p>
                                            <p className="text-sm text-gray-900">{order.restaurant_address}</p>
                                            <p className="text-sm text-gray-900">{order.restaurant_city}</p>
                                            <p className="text-sm text-gray-900 inline-flex items-center gap-2 mt-1">
                                                <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                                                {order.restaurant_phone}
                                            </p>
                                        </div>

                                        {/* Delivery */}
                                        <div className="border-l-4 border-green-500 pl-4 py-1">
                                            <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1 inline-flex items-center gap-2">
                                                <FontAwesomeIcon icon={faHome} className="text-green-500" />
                                                Deliver To:
                                            </p>
                                            <p className="font-bold text-gray-900">{order.customer_name}</p>
                                            <p className="text-sm text-gray-900">{order.delivery_address}</p>
                                            {order.apartment_number && (
                                                <p className="text-sm text-gray-900">Apt: {order.apartment_number}</p>
                                            )}
                                            <p className="text-sm text-gray-900">{order.delivery_city}</p>
                                            <p className="text-sm text-gray-900 inline-flex items-center gap-2 mt-1">
                                                <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                                                {order.customer_phone}
                                            </p>
                                        </div>
                                    </div>

                                    {order.special_instructions && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                            <p className="text-xs sm:text-sm font-bold text-yellow-800 inline-flex items-center gap-2">
                                                <FontAwesomeIcon icon={faClipboardList} />
                                                Special Instructions:
                                            </p>
                                            <p className="text-xs sm:text-sm text-yellow-900 mt-1">{order.special_instructions}</p>
                                        </div>
                                    )}

                                    {order.delivery_instructions && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                            <p className="text-xs sm:text-sm font-bold text-blue-800 inline-flex items-center gap-2">
                                                <FontAwesomeIcon icon={faHome} />
                                                Delivery Instructions:
                                            </p>
                                            <p className="text-xs sm:text-sm text-blue-900 mt-1">{order.delivery_instructions}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => acceptOrder(order.order_id)}
                                        className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-bold text-base sm:text-lg transition-colors"
                                    >
                                        Accept Delivery
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* My Assignments Tab */}
                {activeTab === 'assigned' && (
                    <div className="space-y-4">
                        {myAssignments.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl sm:text-6xl text-gray-300 mb-4" />
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Active Deliveries</h3>
                                <p className="text-gray-900">Accept orders from the Available tab</p>
                            </div>
                        ) : (
                            myAssignments.map((assignment) => (
                                <div key={assignment.assignment_id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order #{assignment.order_number}</h3>
                                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${assignment.delivery_status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                                                    assignment.delivery_status === 'picked_up' ? 'bg-purple-100 text-purple-800' :
                                                        assignment.delivery_status === 'in_transit' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
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
                                        {/* Pickup */}
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

                                        {/* Delivery */}
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

                                    {/* Action Buttons */}
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
            </div>
        </div>
    );
}
