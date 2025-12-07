import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { restaurantAPI, menuAPI, cartAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

  faUtensils,
  faClock,
  faTruck,
  faBox
} from '@fortawesome/free-solid-svg-icons';

export default function RestaurantMenu() {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);

      const [restaurantRes, menuRes] = await Promise.all([
        restaurantAPI.getById(id),
        menuAPI.getMenuItems(id)
      ]);


      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (err) {
      setError('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (menuItemId) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await cartAPI.add({
        menu_item_id: menuItemId,
        quantity: 1,
        notes: ''
      });

      await fetchCart();
      alert('Item added to cart!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-900">Loading restaurant...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">{error}</div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-8 text-gray-900">Restaurant not found</div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        {/* Restaurant Header */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          {restaurant.banner_url && (
            <img
              src={getImageUrl(restaurant.banner_url)}
              alt={restaurant.name}
              className="w-full h-48 sm:h-64 object-cover"
            />
          )}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                <p className="text-gray-900 mt-2 text-sm sm:text-base">{restaurant.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-900">

                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faUtensils} className="text-gray-400" />
                    {restaurant.cuisine_type}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                    {restaurant.estimated_delivery_time} min
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-900">
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faTruck} className="text-gray-400" />
                    Delivery: {restaurant.delivery_fee} EGP
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faBox} className="text-gray-400" />
                    Min Order: {restaurant.minimum_order} EGP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.menu_item_id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition flex flex-col"
            >
              <img
                src={getImageUrl(item.image_url)}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-gray-900 text-sm mb-4 flex-1">{item.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-xl sm:text-2xl font-bold text-orange-600">
                    {parseFloat(item.price).toFixed(2)} EGP
                  </span>
                  <button
                    onClick={() => handleAddToCart(item.menu_item_id)}
                    className="bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}