import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { restaurantAPI, menuAPI, cartAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function RestaurantMenu() {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('RestaurantMenu mounted, fetching restaurant:', id);
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      console.log('Fetching restaurant data for ID:', id);
      
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantAPI.getById(id),
        menuAPI.getMenuItems(id)
      ]);
      
      console.log('Restaurant data:', restaurantRes.data);
      console.log('Menu data:', menuRes.data);
      
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
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
      console.error('Add to cart error:', err);
      alert(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-700">Loading restaurant...</div>
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
      <div className="text-center py-8 text-gray-700">Restaurant not found</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        {restaurant.banner_url && (
          <img
            src={restaurant.banner_url}
            alt={restaurant.name}
            className="w-full h-64 object-cover rounded-t-lg"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200';
            }}
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{restaurant.name}</h1>
              <p className="text-gray-600 mt-2">{restaurant.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <span>⭐ {restaurant.rating} ({restaurant.total_reviews} reviews)</span>
                <span>🍽️ {restaurant.cuisine_type}</span>
                <span>⏱️ {restaurant.estimated_delivery_time} min</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>🚚 Delivery: {restaurant.delivery_fee} EGP</span>
                <span>📦 Min Order: {restaurant.minimum_order} EGP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Menu</h2>
        
        {menuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No menu items available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div
                key={item.menu_item_id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                  }}
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                    {item.is_vegetarian && (
                      <span className="text-green-600 text-xs">🌱 Veg</span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-orange-600 font-bold text-lg">
                      {parseFloat(item.price).toFixed(2)} EGP
                    </span>
                    {item.rating > 0 && (
                      <span className="text-sm text-gray-600">
                        ⭐ {item.rating} ({item.total_reviews})
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <span>⏱️ {item.preparation_time} min</span>
                    {item.is_spicy && <span>🌶️ Spicy</span>}
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(item.menu_item_id)}
                    disabled={!item.is_available}
                    className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                      item.is_available
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.is_available ? 'Add to Cart' : 'Not Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}