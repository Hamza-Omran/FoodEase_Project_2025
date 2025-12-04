import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Truck, CheckCircle, Clock, Bike } from "lucide-react";

export default function DeliveryDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [driver, setDriver] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "driver") {
      fetchDriverData();
    }
  }, [user]);

  const fetchDriverData = async () => {
    try {
      const driverRes = await api.get(`/drivers/${user.id}`);
      setDriver(driverRes.data);

      const assignmentsRes = await api.get("/delivery/assignments");
      setAssignments(assignmentsRes.data);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (assignmentId, status) => {
    try {
      await api.put(`/delivery/assignments/${assignmentId}`, {
        delivery_status: status,
      });
      fetchDriverData();
    } catch (err) {
      alert("Failed to update delivery status");
    }
  };

  if (loading)
    return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-600">
            لوحة تحكم التوصيل
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mt-2">
            مرحبًا, {user.name}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full sm:w-auto bg-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-red-700 transition"
        >
          تسجيل الخروج
        </button>
      </div>

      {driver && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {driver.completed_deliveries}
              </p>
              <p className="text-gray-600">تم التوصيل</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {driver.total_deliveries}
              </p>
              <p className="text-gray-600">الإجمالي</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {parseFloat(driver.earnings_total).toFixed(2)}
              </p>
              <p className="text-gray-600">الأرباح (EGP)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {parseFloat(driver.rating).toFixed(1)} ⭐
              </p>
              <p className="text-gray-600">التقييم</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">عمليات التوصيل النشطة</h2>
        </div>
        <div className="divide-y">
          {assignments.length === 0 ? (
            <p className="p-6 text-center text-gray-600">
              لا توجد عمليات توصيل نشطة
            </p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.assignment_id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold">الطلب #{assignment.order_number}</p>
                    <p className="text-sm text-gray-600">
                      {assignment.restaurant_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {assignment.delivery_address}
                    </p>
                  </div>
                  <p className="text-xl font-bold">
                    {parseFloat(assignment.driver_earnings).toFixed(2)} EGP
                  </p>
                </div>

                <div className="flex gap-2">
                  {assignment.delivery_status === "assigned" && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(assignment.assignment_id, "accepted")
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      قبول
                    </button>
                  )}
                  {assignment.delivery_status === "accepted" && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(assignment.assignment_id, "picked_up")
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      تم الاستلام
                    </button>
                  )}
                  {assignment.delivery_status === "picked_up" && (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(assignment.assignment_id, "delivered")
                      }
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    >
                      تم التوصيل
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
