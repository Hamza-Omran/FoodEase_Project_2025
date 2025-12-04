import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    preparing: 0,
    onTheWay: 0,
    delivered: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "restaurant_owner") {
      fetchRestaurantData();
    }
  }, [user]);

  const fetchRestaurantData = async () => {
    try {
      console.log("Fetching restaurants for owner:", user.id);
      const myRestaurantsRes = await api.get("/restaurants/my");
      console.log("My restaurants response:", myRestaurantsRes.data);

      if (myRestaurantsRes.data.length === 0) {
        console.warn("No restaurants found for this owner");
        setLoading(false);
        return;
      }

      const myRestaurant = myRestaurantsRes.data[0];
      setRestaurant(myRestaurant);

      const ordersRes = await api.get(
        `/restaurants/${myRestaurant.restaurant_id}/orders`
      );
      console.log("Orders response:", ordersRes.data);
      setOrders(ordersRes.data);

      const total = ordersRes.data.length;
      const preparing = ordersRes.data.filter(
        (o) => o.status === "preparing"
      ).length;
      const onTheWay = ordersRes.data.filter(
        (o) => o.status === "out_for_delivery"
      ).length;
      const delivered = ordersRes.data.filter(
        (o) => o.status === "delivered"
      ).length;
      const revenue = ordersRes.data
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
        .toFixed(2);

      setStats({ total, preparing, onTheWay, delivered, revenue });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching restaurant data:", err);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/status/${orderId}`, { status: newStatus });
      fetchRestaurantData();
    } catch (err) {
      alert("Failed to update order status");
    }
  };

  if (loading)
    return <div className="text-center py-12">Loading dashboard...</div>;

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">No Restaurant Found</h2>
        <p className="text-gray-600 mb-6">
          You don't have any restaurants registered yet.
        </p>
        <Link
          to="/admin/restaurant"
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
        >
          Create Restaurant
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-gray-600">Total Orders</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.preparing}</p>
            <p className="text-gray-600">Preparing</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.onTheWay}</p>
            <p className="text-gray-600">On The Way</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.delivered}</p>
            <p className="text-gray-600">Delivered</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.revenue} EGP</p>
            <p className="text-gray-600">Revenue</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-orange-600 text-white text-center">
            <h2 className="text-2xl font-bold">Your Restaurant Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <p className="text-2xl font-bold">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-gray-900">Order #</th>
                    <th className="px-6 py-4 text-gray-900">Customer</th>
                    <th className="px-6 py-4 text-gray-900">Status</th>
                    <th className="px-6 py-4 text-gray-900">Amount</th>
                    <th className="px-6 py-4 text-gray-900">Date</th>
                    <th className="px-6 py-4 text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">#{order.order_number}</td>
                      <td className="px-6 py-4 text-gray-800">{order.customer_name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "out_for_delivery"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "preparing"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-orange-600">
                        {parseFloat(order.total_amount).toFixed(2)} EGP
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(order.order_date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {order.status === "pending" && (
                          <button
                            onClick={() => updateOrderStatus(order.order_id, "confirmed")}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                          >
                            Confirm
                          </button>
                        )}
                        {order.status === "confirmed" && (
                          <button
                            onClick={() => updateOrderStatus(order.order_id, "preparing")}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() => updateOrderStatus(order.order_id, "ready")}
                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                          >
                            Mark Ready
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
