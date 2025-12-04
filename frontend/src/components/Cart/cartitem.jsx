import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center py-4 border-b">
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 object-cover rounded-lg"
      />

      <div className="flex-1 mx-4">
        <h4 className="font-semibold text-lg">{item.name}</h4>
        <p className="text-gray-600">{item.price} EGP</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="text-red-600"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="font-bold text-xl w-12 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="text-green-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="text-right mx-6">
        <p className="font-bold text-xl">{item.price * item.quantity} EGP</p>
      </div>

      <button
        onClick={() => removeFromCart(item.id)}
        className="text-red-600 hover:text-red-800"
      >
        <Trash2 className="w-6 h-6" />
      </button>
    </div>
  );
}
