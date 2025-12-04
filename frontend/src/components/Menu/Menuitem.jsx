import { Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function MenuItem({ item }) {
  const { addToCart, cart, updateQuantity } = useCart();

  const cartItem = cart.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
      <img
        src={item.image}
        alt={item.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">{item.name}</h3>
        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-2xl font-bold text-orange-600">
            {item.price} EGP
          </span>

          {quantity === 0 ? (
            <button
              onClick={() => addToCart(item)}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              ADD TO CART
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="text-red-600"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="text-green-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
