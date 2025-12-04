import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, loading, updateCartItem, removeFromCart, getCartTotal } = useCart();

  const handleQuantityChange = async (item, newQuantity) => {
    console.log('handleQuantityChange called:', item.cart_item_id, newQuantity);
    
    if (newQuantity < 1) {
      console.log('Quantity less than 1, removing item');
      return;
    }
    
    try {
      await updateCartItem(item.cart_item_id, newQuantity);
      console.log('Quantity updated successfully');
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handleRemove = async (cartItemId) => {
    if (!window.confirm('Remove this item from cart?')) return;
    try {
      await removeFromCart(cartItemId);
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading cart...</div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const restaurantName = cart[0]?.restaurant_name || 'Restaurant';
  const subtotal = getCartTotal();
  const deliveryFee = 15.0;
  const total = subtotal + deliveryFee;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Cart</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">From: {restaurantName}</h2>
        
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.cart_item_id} className="flex items-center gap-4 p-4 border-b">
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                alt={item.name}
                className="w-20 h-20 object-cover rounded"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
                }}
              />
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-gray-600">{item.restaurant_name}</p>
                <p className="text-orange-600 font-bold">{parseFloat(item.price).toFixed(2)} EGP</p>
                {item.special_requests && (
                  <p className="text-sm text-gray-500 italic">Note: {item.special_requests}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    console.log('Minus clicked, current quantity:', item.quantity);
                    handleQuantityChange(item, parseInt(item.quantity) - 1);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-orange-600">{item.quantity}</span>
                <button
                  onClick={() => {
                    console.log('Plus clicked, current quantity:', item.quantity);
                    handleQuantityChange(item, parseInt(item.quantity) + 1);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-gray-800">{(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} EGP</p>
                <button
                  onClick={() => handleRemove(item.cart_item_id)}
                  className="text-red-600 text-sm hover:underline mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Delivery Fee</span>
            <span>{deliveryFee.toFixed(2)} EGP</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span className="text-gray-800">Total</span>
            <span className="text-orange-600">{total.toFixed(2)} EGP</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-semibold"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}