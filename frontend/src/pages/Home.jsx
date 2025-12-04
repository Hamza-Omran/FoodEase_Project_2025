import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { restaurantAPI } from "../services/api";
import RestaurantList from "../components/Home/RestaurantList";

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
      const featured = response.data.filter((r) => r.is_featured).slice(0, 6);
      setFeaturedRestaurants(featured);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Featured Restaurants</h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
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
                    src={
                      restaurant.image_url ||
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400"
                    }
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {restaurant.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>⭐ {parseFloat(restaurant.rating || 0).toFixed(1)}</span>
                    <span>🕒 {restaurant.estimated_delivery_time || 30} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && featuredRestaurants.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            No featured restaurants available at the moment.
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Browse Restaurants</h3>
              <p className="text-gray-600">Discover amazing local restaurants</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2">Add to Cart</h3>
              <p className="text-gray-600">Select your favorite dishes</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Get your food delivered quickly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
