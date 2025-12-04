import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './cartitem';

export default function Cart() {
  const { cart, totalPrice, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
        <Link to="/restaurants" className="text-orange-600 text-xl hover:underline">
         start ordering now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-10">Shopping Cart</h1>
      
      <div className="bg-white rounded-xl shadow-xl p-8">
        {cart.map(item => (
          <CartItem key={item.id} item={item} />
        ))}

        <div className="mt-10 pt-8 border-t-4 border-gray-200">
          <div className="flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span className="text-orange-600">{totalPrice} EGP</span>
          </div>

          <div className="mt-8 flex gap-4">
            <Link 
              to="/checkout"
              className="flex-1 bg-orange-600 text-white text-xl font-bold py-4 rounded-lg hover:bg-orange-700 transition text-center"
            >
              Checkout
            </Link>
            <button 
              onClick={clearCart}
              className="px-8 bg-gray-200 text-gray-800 font-bold py-4 rounded-lg hover:bg-gray-300 transition"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}