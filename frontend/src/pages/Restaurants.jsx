import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../services/api';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantAPI.getAll();
      setRestaurants(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = cuisineFilter === 'all' || restaurant.cuisine_type === cuisineFilter;
    return matchesSearch && matchesCuisine;
  });

  const cuisineTypes = ['all', ...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading restaurants...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">All Restaurants</h1>
      
      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {cuisineTypes.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Cuisines' : type}
            </option>
          ))}
        </select>
      </div>

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map(restaurant => (
          <div
            key={restaurant.restaurant_id}
            onClick={() => navigate(`/restaurant/${restaurant.restaurant_id}`)}
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
          >
            <div className="h-48 bg-gray-200">
              <img
                src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                alt={restaurant.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400';
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>⭐ {parseFloat(restaurant.rating || 0).toFixed(1)}</span>
                <span>🕒 {restaurant.estimated_delivery_time || 30} min</span>
                <span>💵 {parseFloat(restaurant.delivery_fee || 0).toFixed(0)} EGP</span>
              </div>
              {restaurant.cuisine_type && (
                <div className="mt-2">
                  <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                    {restaurant.cuisine_type}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No restaurants found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}