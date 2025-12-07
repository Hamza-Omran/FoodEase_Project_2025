import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export default function AdminSystemDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [overviewRes, restaurantsRes] = await Promise.all([
        adminAPI.overview(),
        adminAPI.restaurants(),
      ]);

      setOverview(overviewRes.data);
      setRestaurants(restaurantsRes.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const updateRestaurantStatus = async (id, status) => {
    try {
      await adminAPI.updateRestaurantStatus(id, { status });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="text-center py-12">Loading dashboard...</div>;


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">




        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-900 mb-2">Total Restaurants</p>
              <p className="text-3xl font-bold text-orange-600">{overview.counts.restaurants}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-900 mb-2">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600">{overview.counts.customers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-900 mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-green-600">{overview.counts.orders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-900 mb-2">Revenue (30d)</p>
              <p className="text-3xl font-bold text-purple-600">
                {parseFloat(overview.revenue?.total_revenue || 0).toFixed(2)} EGP
              </p>
            </div>
          </div>
        )}


        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Restaurants</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-gray-900">Owner</th>
                  <th className="px-4 py-3 text-left text-gray-900">City</th>
                  <th className="px-4 py-3 text-left text-gray-900">Status</th>

                  <th className="px-4 py-3 text-left text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.restaurant_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{restaurant.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{restaurant.owner_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{restaurant.city}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${restaurant.status === 'active' ? 'bg-green-100 text-green-800' :
                        restaurant.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {restaurant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={restaurant.status}
                        onChange={(e) => updateRestaurantStatus(restaurant.restaurant_id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm text-gray-900"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="temporarily_closed">Temporarily Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>



      </div>
    </div>
  );
}
