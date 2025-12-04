import { createContext, useState, useContext, useEffect } from "react";
import { cartAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [user, token]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      setCart(response.data || []);
    } catch (err) {
      console.error("Fetch cart error:", err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (menuItemId, quantity, notes) => {
    try {
      await cartAPI.add({ menu_item_id: menuItemId, quantity, notes });
      await fetchCart();
    } catch (err) {
      console.error("Add to cart error:", err);
      throw err;
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      console.log("Updating cart item:", cartItemId, "to quantity:", quantity);

      if (quantity <= 0) {
        console.log("Quantity is 0 or less, removing item");
        await removeFromCart(cartItemId);
        return;
      }

      await cartAPI.update(cartItemId, { quantity });
      console.log("Update successful, fetching cart");
      await fetchCart();
    } catch (err) {
      console.error("Update cart error:", err);
      throw err;
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await cartAPI.remove(cartItemId);
      await fetchCart();
    } catch (err) {
      console.error("Remove from cart error:", err);
      throw err;
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Call this right after placing order: clear local state now, then next time we reload, DB is already empty
  const clearCartOnOrder = () => {
    console.log("Clearing cart locally after order placement");
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + parseFloat(item.price) * parseInt(item.quantity),
      0
    );
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + parseInt(item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        clearCartOnOrder,
        getCartTotal,
        getCartCount,
        fetchCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
