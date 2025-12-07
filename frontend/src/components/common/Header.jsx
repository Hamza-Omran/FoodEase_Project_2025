import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faUser, faSignOutAlt, faBox, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function Header() {
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const NavLink = ({ to, children, onClick }) => (
    <Link
      to={to}
      onClick={() => { onClick?.(); setMobileMenuOpen(false); }}
      className="text-gray-700 hover:text-orange-600 font-medium px-3 py-2 rounded-md transition"
    >
      {children}
    </Link>
  );

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-orange-600 text-2xl sm:text-3xl font-bold">FoodEase</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!user || user.role === 'customer' ? (
              <>
                <NavLink to="/">Home</NavLink>
                <NavLink to="/restaurants">Restaurants</NavLink>
              </>
            ) : user.role === 'restaurant_owner' ? (
              <>
                <NavLink to="/admin">Dashboard</NavLink>
                <NavLink to="/admin/restaurant">My Restaurant</NavLink>
              </>
            ) : user.role === 'driver' ? (
              <>
                <NavLink to="/available-orders">
                  <FontAwesomeIcon icon={faBox} className="mr-2" />
                  Available Orders
                </NavLink>
                <NavLink to="/my-deliveries">
                  <FontAwesomeIcon icon={faBox} className="mr-2" />
                  My Deliveries
                </NavLink>
              </>
            ) : user.role === 'admin' ? (
              <>
                <NavLink to="/admin/system">System Admin</NavLink>
                <NavLink to="/admin/restaurants">Manage Restaurants</NavLink>
                <NavLink to="/admin/drivers">Manage Drivers</NavLink>
                <NavLink to="/admin/reports">Reports</NavLink>
              </>
            ) : null}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Cart (customers only) */}
            {(!user || user.role === 'customer') && (
              <Link to="/cart" className="relative">
                <FontAwesomeIcon icon={faShoppingCart} className="w-6 h-6 text-gray-700" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            )}

            {/* User menu (desktop) */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user.name}
                </span>

                {user.role === "customer" && (
                  <Link to="/my-orders" className="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg font-bold hover:bg-orange-200 text-sm">
                    <FontAwesomeIcon icon={faBox} className="mr-1" />
                    Orders
                  </Link>
                )}

                <button onClick={handleLogout} className="text-red-600 hover:text-red-800" title="Logout">
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block hover:text-orange-600">
                <FontAwesomeIcon icon={faUser} className="w-6 h-6 text-gray-700" />
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-orange-600"
            >
              <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-2">
            <div className="flex flex-col space-y-2 pt-4">
              {!user || user.role === 'customer' ? (
                <>
                  <NavLink to="/">Home</NavLink>
                  <NavLink to="/restaurants">Restaurants</NavLink>
                  {user && (
                    <>
                      <NavLink to="/my-orders">My Orders</NavLink>
                      <NavLink to="/profile">Profile</NavLink>
                    </>
                  )}
                </>
              ) : user.role === 'restaurant_owner' ? (
                <>
                  <NavLink to="/admin">Dashboard</NavLink>
                  <NavLink to="/admin/restaurant">My Restaurant</NavLink>
                </>
              ) : user.role === 'driver' ? (
                <>
                  <NavLink to="/available-orders">Available Orders</NavLink>
                  <NavLink to="/my-deliveries">My Deliveries</NavLink>
                </>
              ) : user.role === 'admin' ? (
                <>
                  <NavLink to="/admin/system">System Admin</NavLink>
                  <NavLink to="/admin/restaurants">Manage Restaurants</NavLink>
                  <NavLink to="/admin/drivers">Manage Drivers</NavLink>
                  <NavLink to="/admin/reports">Reports</NavLink>
                </>
              ) : null}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-left text-red-600 hover:text-red-800 font-medium px-3 py-2"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                  Logout
                </button>
              ) : (
                <NavLink to="/login">
                  <FontAwesomeIcon icon={faUser} className="mr-2" />
                  Login
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
