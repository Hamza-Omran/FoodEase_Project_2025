import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ShoppingCart, MapPin, User, LogOut, Package } from "lucide-react";

export default function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-orange-600 text-3xl font-bold">Foodie</div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-orange-600 font-medium"
            >
              Home
            </Link>
            <Link
              to="/restaurants"
              className="text-gray-700 hover:text-orange-600 font-medium"
            >
              Restaurants
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <button className="flex items-center text-gray-700">
              <MapPin className="w-5 h-5 ml-1" />
              <span className="hidden sm:inline">EG</span>
            </button>

            <Link to="/cart" className="relative">
              <ShoppingCart className="w-7 h-7 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-gray-700 font-medium">
                  Welcome, {user.name}
                </span>

                {user.role === "customer" && (
                  <Link
                    to="/my-orders"
                    className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 transition"
                  >
                    <Package className="w-5 h-5" />
                    <span className="hidden sm:inline">My Orders</span>
                  </Link>
                )}
                {user?.role === "customer" && (
                  <Link
                    to="/profile"
                    className="text-orange-600 font-bold text-lg hover:underline"
                  >
                    Profile
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 transition"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hover:text-orange-600 transition">
                <User className="w-6 h-6 text-gray-700" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
