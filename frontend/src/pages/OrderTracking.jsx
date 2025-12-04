import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderAPI } from '../services/api';

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderTracking();
    const interval = setInterval(fetchOrderTracking, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderTracking = async () => {
    try {
      const response = await orderAPI.getOrder(orderId);
      setOrder(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order tracking');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tracking info...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📋' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready', icon: '🍱' },
    { key: 'out_for_delivery', label: 'On the Way', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' }
  ];

  const currentStatusIndex = statusSteps.findIndex(s => s.key === order.status);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-orange-600">Track Order</h1>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Order #{order.order_number}</h2>
            <p className="text-gray-600">{order.restaurant_name}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Order Date</p>
            <p className="font-semibold text-gray-800">
              {new Date(order.order_date).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Amount</p>
            <p className="font-semibold text-orange-600">{order.total_amount} EGP</p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-6 text-gray-800">Order Status</h3>
        
        <div className="relative">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-start mb-8 last:mb-0">
              <div className="flex flex-col items-center mr-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  index <= currentStatusIndex 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                {index < statusSteps.length - 1 && (
                  <div className={`w-1 h-16 ${
                    index < currentStatusIndex ? 'bg-orange-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              
              <div className="flex-1 pt-2">
                <p className={`font-semibold ${
                  index <= currentStatusIndex ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {index === currentStatusIndex && (
                  <p className="text-sm text-gray-600 mt-1">Current Status</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Order Items</h3>
        {order.items && order.items.map((item) => (
          <div key={item.order_item_id} className="flex justify-between py-2 border-b last:border-b-0">
            <div>
              <p className="font-medium text-gray-800">{item.menu_item_name}</p>
              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
            </div>
            <p className="font-semibold text-orange-600">{item.subtotal} EGP</p>
          </div>
        ))}
      </div>
    </div>
  );
}
