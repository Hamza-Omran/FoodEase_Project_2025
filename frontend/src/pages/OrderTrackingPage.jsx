import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrder } from '../services/api';

export default function OrderTrackingPage() {
  const { id } = useParams(); // numeric order_id
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('OrderTrackingPage: fetching order', id);
        const data = await getOrder(id);
        if (mounted) {
          setOrder(data);
        }
      } catch (e) {
        console.error('OrderTrackingPage: error loading order', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const getStepStatus = (status) => {
    if (!order) return 'inactive';
    const statuses = ['pending','confirmed','preparing','ready','out_for_delivery','delivered'];
    const currentIndex = statuses.indexOf(order.status);
    const stepIndex = statuses.indexOf(status);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  };

  if (loading) return <div className="container py-8">Loading order...</div>;
  if (!order) return <div className="container py-8">Order not found</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Track Order #{order.order_number}</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">{order.restaurant_name}</h2>
            <p className="text-gray-600">
              Estimated Delivery: {new Date(order.estimated_delivery_time).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-600">
              {parseFloat(order.total_amount).toFixed(2)} EGP
            </p>
            <p className="text-sm text-gray-600">{order.payment_status}</p>
          </div>
        </div>
        
        {/* Order Progress */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {['Confirmed', 'Preparing', 'Ready', 'Delivering', 'Delivered'].map((step, idx) => (
              <div key={idx} className="flex-1 text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                    getStepStatus(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'][idx]) === 'completed'
                      ? 'bg-green-500 text-white'
                      : getStepStatus(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'][idx]) === 'active'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <p className="text-xs mt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Items only, no delivery-address box here */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-4">Order Items</h3>
        {order.items && order.items.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <li key={item.order_item_id} className="py-3 flex justify-between">
                <div>
                  <div className="font-medium">{item.menu_item_name}</div>
                  <div className="text-sm text-gray-500">
                    Qty: {item.quantity} × {item.unit_price.toFixed(2)} EGP
                  </div>
                </div>
                <div className="font-semibold">{item.subtotal.toFixed(2)} EGP</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No items found for this order.</p>
        )}
      </div>
    </div>
  );
}
