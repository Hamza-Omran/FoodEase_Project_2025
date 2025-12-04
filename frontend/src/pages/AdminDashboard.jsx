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
      // Fetch restaurant owned by this user
      const restaurantsRes = await api.get("/restaurants");
      const myRestaurant = restaurantsRes.data.find(
        (r) => r.owner_id === user.id
      );

      if (myRestaurant) {
        setRestaurant(myRestaurant);

        // Fetch orders for this restaurant
        const ordersRes = await api.get(
          `/restaurants/${myRestaurant.restaurant_id}/orders`
        );
        setOrders(ordersRes.data);

        // Calculate stats
        const total = ordersRes.data.length;
        const preparing = ordersRes.data.filter(
          (o) => o.status === "preparing"
        ).length;
        const onTheWay = ordersRes.data.filter(
          (o) => o.status === "on_the_way"
        ).length;
        const delivered = ordersRes.data.filter(
          (o) => o.status === "delivered"
        ).length;
        const revenue = ordersRes.data
          .filter((o) => o.status === "delivered")
          .reduce((sum, o) => sum + (o.netPrice || o.totalPrice || 0), 0)
          .toFixed(2);

        setStats({ total, preparing, onTheWay, delivered, revenue });
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
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
  if (!restaurant)
    return (
      <div className="text-center py-12">
        No restaurant found for your account
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-orange-600">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Welcome, {user.name} ← Restaurant ID: {user.restaurant_id}
            </p>
          </div>
          <Link
            to="/admin/restaurants"
            className="bg-orange-600 text-white px-6 py-4 rounded-xl font-bold"
          >
            Mange Restaurants and Menu
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-gray-600">إجمالي الطلبات</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold">{stats.preparing}</p>
            <p className="text-gray-600">جاري التجهيز</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold">{stats.onTheWay}</p>
            <p className="text-gray-600">في الطريق</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold">{stats.delivered}</p>
            <p className="text-gray-600">تم التوصيل</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <p className="text-3xl font-bold">{stats.revenue} EGP</p>
            <p className="text-gray-600">الإيرادات</p>
          </div>
        </div>

        {/* جدول الطلبات */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-orange-600 text-white text-center">
            <h2 className="text-2xl font-bold">
              طلبات مطعمك فقط (ID: {user.restaurant_id})
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <p className="text-2xl font-bold">لا توجد طلبات حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4">رقم الطلب</th>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">التوصيل بواسطة</th>
                    <th className="px-6 py-4">المبلغ</th>
                    <th className="px-6 py-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">#{order.id}</td>
                      <td className="px-6 py-4">{order.customer.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "on_the_way"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {order.status === "preparing" && "جاري التجهيز"}
                          {order.status === "on_the_way" && "في الطريق"}
                          {order.status === "delivered" && "تم التوصيل"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.deliveryGuyName || "لم يُسند"}
                      </td>
                      <td className="px-6 py-4 font-bold text-orange-600">
                        {(order.netPrice || order.totalPrice || 0).toFixed(2)}{" "}
                        ج.م
                      </td>
                      <td className="px-6 py-4 text-sm">{order.createdAt}</td>
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
