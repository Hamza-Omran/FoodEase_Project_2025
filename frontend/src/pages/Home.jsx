import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { restaurantAPI } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUtensils,
  faSearch,
  faShoppingCart,
  faTruck,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Home() {
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedRestaurants();
  }, []);

  const fetchFeaturedRestaurants = async () => {
    try {
      const response = await restaurantAPI.getAll();
      // Show featured restaurants, or first 6 if none are featured
      const featured = response.data.filter((r) => r.is_featured);
      setFeaturedRestaurants(
        featured.length > 0 ? featured.slice(0, 6) : response.data.slice(0, 6)
      );
      setLoading(false);
    } catch (error) {
      setFeaturedRestaurants([]);
      setLoading(false);
    }
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    return `${baseUrl}/${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-12 sm:py-16 md:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 lg:mb-8">
            Order Your Favorite Food
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 lg:mb-12">
            Fast delivery from the best restaurants in your area
          </p>
          <button
            onClick={() => navigate("/restaurants")}
            className="inline-block bg-white text-orange-600 px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 rounded-full text-base sm:text-lg md:text-xl lg:text-2xl font-bold hover:bg-gray-100 transition"
          >
            Browse Restaurants
          </button>
        </div>
      </div>

      {/* Featured Restaurants */}
      <div className="max-w-7xl mx-auto px-4 py-12 bg-white">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Featured Restaurants</h2>

        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : featuredRestaurants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FontAwesomeIcon icon={faUtensils} className="text-6xl mb-4 text-gray-300" />
            <h3 className="text-2xl font-bold mb-2 text-gray-900">No Restaurants Yet</h3>
            <p className="text-gray-900 mb-6">
              We're working on adding restaurants to your area.
            </p>
            <p className="text-gray-900">
              Restaurant owners can register to add their restaurants!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
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
                  <p className="text-gray-900 text-sm mb-2 line-clamp-2">
                    {restaurant.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-900">
                    <span className="inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} />
                      {restaurant.estimated_delivery_time || 30} min
                    </span>
                  </div>
                  {restaurant.cuisine_type && (
                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded">
                      {restaurant.cuisine_type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <FontAwesomeIcon icon={faSearch} className="text-5xl mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Browse Restaurants</h3>
              <p className="text-gray-900">Discover amazing local restaurants</p>
            </div>
            <div className="text-center">
              <FontAwesomeIcon icon={faShoppingCart} className="text-5xl mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Add to Cart</h3>
              <p className="text-gray-900">Select your favorite dishes</p>
            </div>
            <div className="text-center">
              <FontAwesomeIcon icon={faTruck} className="text-5xl mb-4 text-orange-600" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Fast Delivery</h3>
              <p className="text-gray-900">Get your food delivered quickly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
