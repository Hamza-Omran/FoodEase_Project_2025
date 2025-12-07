import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { customerAPI, createOrder } from "../services/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faCreditCard } from '@fortawesome/free-solid-svg-icons';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCartOnOrder } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!cart || cart.length === 0) {
      navigate("/cart");
      return;
    }

    fetchAddresses();
  }, [user, cart, navigate]);

  const fetchAddresses = async () => {
    try {
      const response = await customerAPI.getAddresses(user.id);
      setAddresses(response.data || []);

      // Auto-select default address
      const defaultAddr = response.data.find(addr => addr.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.address_id);
      } else if (response.data.length > 0) {
        setSelectedAddress(response.data[0].address_id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses');
    }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!selectedAddress) {
        setError('Please select a delivery address');
        return;
      }
      if (!paymentMethod) {
        setError('Please select a payment method');
        return;
      }

      const payload = {
        restaurant_id: cart[0].restaurant_id,
        address_id: selectedAddress,
        special_instructions: specialInstructions || '',
        payment_method: paymentMethod,
        coupon_code: null,
      };

      const order = await createOrder(payload);

      // Clear local cart state immediately; DB trigger clears server cart
      clearCartOnOrder();

      // Redirect to home/restaurants
      navigate('/restaurants');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 px-4">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate("/restaurants")}
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryFee = 15.0;
  const tax = (subtotal * 0.14) | 0; // 14% VAT
  const total = subtotal + deliveryFee + tax;
  const restaurantName = cart[0]?.restaurant_name || "Restaurant";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-orange-600">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-600">
          Order Items from {restaurantName}
        </h2>
        {cart.map((item) => (
          <div
            key={item.cart_item_id}
            className="flex justify-between py-2 border-b last:border-0"
          >
            <div>
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-900">
                Quantity: {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-orange-600">
              {(item.price * item.quantity).toFixed(2)} EGP
            </p>
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-600">Delivery Address</h2>

        {addresses.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-900 mb-4">
              No addresses found. Please add one.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.address_id}
              onClick={() => setSelectedAddress(addr.address_id)}
              className={`p-4 border rounded-lg mb-2 cursor-pointer transition-colors ${selectedAddress === addr.address_id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 hover:border-orange-300"
                }`}
            >
              <p className="font-medium text-gray-800">{addr.address_label}</p>
              <p className="text-sm text-gray-900">
                {addr.street_address}, {addr.city}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-600">Payment Method</h2>

        <div className="space-y-2">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              value="cash"
              checked={paymentMethod === "cash"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 text-orange-600 focus:ring-orange-500"
            />
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 mr-2" />
            <span className="text-gray-800">Cash on Delivery</span>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              value="credit_card"
              checked={paymentMethod === "credit_card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 text-orange-600 focus:ring-orange-500"
            />
            <FontAwesomeIcon icon={faCreditCard} className="text-blue-600 mr-2" />
            <span className="text-gray-800">Credit Card</span>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="payment"
              value="debit_card"
              checked={paymentMethod === "debit_card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3 text-orange-600 focus:ring-orange-500"
            />
            <FontAwesomeIcon icon={faCreditCard} className="text-purple-600 mr-2" />
            <span className="text-gray-800">Debit Card</span>
          </label>
        </div>
      </div>

      {/* Special Instructions */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-600">Special Instructions</h2>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any special requests? (optional)"
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800"
          rows="3"
        />
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-orange-600">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-gray-900">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span>Delivery Fee</span>
            <span>{deliveryFee.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span>Tax (14%)</span>
            <span>{tax.toFixed(2)} EGP</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span className="text-gray-800">Total</span>
            <span className="text-orange-600">{total.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading || !selectedAddress || addresses.length === 0}
        className="w-full bg-orange-600 text-white py-4 rounded-lg hover:bg-orange-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? "Placing Order..."
          : `Place Order - ${total.toFixed(2)} EGP`}
      </button>
    </div>
  );
}
