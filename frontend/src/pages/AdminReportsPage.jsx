import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dailySales, setDailySales] = useState([]);
  const [restaurantPerformance, setRestaurantPerformance] = useState([]);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    try {
      const [salesRes, restaurantRes, driverRes] = await Promise.all([
        api.get('/reports/daily-sales?days=7'),
        api.get('/reports/restaurant-performance'),
        api.get('/reports/driver-performance')
      ]);

      setDailySales(salesRes.data);
      setRestaurantPerformance(restaurantRes.data);
      setDriverPerformance(driverRes.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-900">Loading reports...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Reports & Analytics</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex border-b" style={{ gap: '50px' }}>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-6 py-4 font-bold ${activeTab === 'sales'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-white hover:text-gray-300'
                }`}
            >
              Daily Sales
            </button>
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`px-6 py-4 font-bold ${activeTab === 'restaurants'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-white hover:text-gray-300'
                }`}
            >
              Restaurant Performance
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-6 py-4 font-bold ${activeTab === 'drivers'
                ? 'border-b-2 border-orange-600 text-orange-600'
                : 'text-white hover:text-gray-300'
                }`}
            >
              Driver Performance
            </button>
          </div>

          <div className="p-6">
            {/* Daily Sales Tab */}
            {activeTab === 'sales' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Sales Summary (Last 7 Days)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-900">Restaurant</th>
                        <th className="px-4 py-3 text-left text-gray-900">Orders</th>
                        <th className="px-4 py-3 text-left text-gray-900">Revenue</th>
                        <th className="px-4 py-3 text-left text-gray-900">Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySales.map((sale, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{sale.restaurant_name}</td>
                          <td className="px-4 py-3 text-gray-900">{sale.total_orders}</td>
                          <td className="px-4 py-3 text-orange-600 font-bold">{parseFloat(sale.total_revenue).toFixed(2)} EGP</td>
                          <td className="px-4 py-3 text-gray-900">{parseFloat(sale.avg_order_value).toFixed(2)} EGP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Restaurant Performance Tab */}
            {activeTab === 'restaurants' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Restaurant Performance (30 Days)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-900">Restaurant</th>
                        <th className="px-4 py-3 text-left text-gray-900">Orders</th>
                        <th className="px-4 py-3 text-left text-gray-900">Revenue</th>
                        <th className="px-4 py-3 text-left text-gray-900">Avg Order</th>
                        <th className="px-4 py-3 text-left text-gray-900">Customers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurantPerformance.map((rest) => (
                        <tr key={rest.restaurant_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{rest.name}</td>
                          <td className="px-4 py-3 text-gray-900">{rest.total_orders_30d}</td>
                          <td className="px-4 py-3 text-orange-600 font-bold">{parseFloat(rest.revenue_30d || 0).toFixed(2)} EGP</td>
                          <td className="px-4 py-3 text-gray-900">{parseFloat(rest.avg_order_value_30d || 0).toFixed(2)} EGP</td>
                          <td className="px-4 py-3 text-gray-900">{rest.unique_customers_30d}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Driver Performance Tab */}
            {activeTab === 'drivers' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Driver Performance</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-900">Driver</th>
                        <th className="px-4 py-3 text-left text-gray-900">Vehicle</th>
                        <th className="px-4 py-3 text-left text-gray-900">Completed</th>
                        <th className="px-4 py-3 text-left text-gray-900">Total</th>
                        <th className="px-4 py-3 text-left text-gray-900">Success Rate</th>
                        <th className="px-4 py-3 text-left text-gray-900">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverPerformance.map((driver) => (
                        <tr key={driver.driver_id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{driver.full_name}</td>
                          <td className="px-4 py-3 text-gray-900">{driver.vehicle_type}</td>
                          <td className="px-4 py-3 text-green-600 font-bold">{driver.completed_deliveries}</td>
                          <td className="px-4 py-3 text-gray-900">{driver.total_deliveries}</td>
                          <td className="px-4 py-3 text-gray-900">{parseFloat(driver.completion_rate || 0).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-orange-600 font-bold">{parseFloat(driver.earnings_total).toFixed(2)} EGP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
