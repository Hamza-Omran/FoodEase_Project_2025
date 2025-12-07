import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { orderAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

export default function MyOrders() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMy();
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      ready: "bg-green-100 text-green-800",
      out_for_delivery: "bg-orange-100 text-orange-800",
      delivered: "bg-green-200 text-green-900",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading)
    return <div className="text-center py-12">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <FontAwesomeIcon icon={faBox} className="text-6xl mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
        <p className="text-gray-900">Start ordering delicious food!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.order_id}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
              <div>
                <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                <p className="text-gray-900">{order.restaurant_name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.order_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end mt-2 sm:mt-0">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.replace("_", " ").toUpperCase()}
                </span>
                <p className="mt-0 sm:mt-2 font-bold text-lg">
                  {parseFloat(order.total_amount).toFixed(2)} EGP
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                to={`/orders/${order.order_id}/track`}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-center flex-1 sm:flex-none"
              >
                Track Order
              </Link>

              {order.status === 'delivered' && !order.has_review && (
                <Link
                  to={`/orders/${order.order_id}/review`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center flex-1 sm:flex-none"
                >
                  Leave Review
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
