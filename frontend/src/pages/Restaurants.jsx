import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { restaurantAPI } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faClock,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import StarRating from '../components/StarRating';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
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
      setRestaurants([]);
      setLoading(false);
    }
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `http://localhost:3000/${cleanPath}`;
  };

  // Get unique cuisines for filter
  const cuisines = ["All", ...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === "All" || restaurant.cuisine_type === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl text-gray-900">Loading restaurants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-900">All Restaurants</h1>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
          />
          <select
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
          >
            {cuisines.map(cuisine => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
        </div>

        {/* Restaurants Grid */}
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FontAwesomeIcon icon={faUtensils} className="text-6xl mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold mb-2 text-gray-900">No Restaurants Found</h3>
            <p className="text-gray-900">
              {searchTerm || selectedCuisine !== "All"
                ? "Try adjusting your search or filters"
                : "No restaurants available yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.restaurant_id}
                onClick={() => navigate(`/restaurant/${restaurant.restaurant_id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
              >
                <div className="h-48 bg-gray-200">
                  <img
                    src={getImageUrl(restaurant.image_url)}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{restaurant.name}</h3>

                  <div className="mb-2">
                    <StarRating
                      rating={restaurant.rating || 0}
                      reviewCount={restaurant.review_count || 0}
                      size="small"
                    />
                  </div>

                  <p className="text-gray-900 text-sm mb-2 line-clamp-2">
                    {restaurant.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-2">

                    <span className="text-gray-900 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} />
                      {restaurant.estimated_delivery_time || 30} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400" />
                      {restaurant.city}
                    </span>
                    <span className="text-orange-600 font-semibold">
                      {parseFloat(restaurant.delivery_fee || 0).toFixed(2)} EGP delivery
                    </span>
                  </div>
                  {restaurant.cuisine_type && (
                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded">
                      {restaurant.cuisine_type}
                    </span>
                  )}
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${restaurant.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {restaurant.status === 'active' ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}