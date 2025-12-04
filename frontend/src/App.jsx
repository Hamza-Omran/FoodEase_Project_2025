import "./App.css";
console.log('📱 [App.jsx] Module loading...');

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Restaurants from './pages/Restaurants';
import RestaurantMenu from './pages/RestaurantMenu';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import RestaurantManagement from './pages/RestaurantManagement';
import OrderTracking from './pages/OrderTracking';

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/restaurants" element={<Restaurants />} />
                  <Route path="/restaurant/:id" element={<RestaurantMenu />} />

                  {/* Customer-only routes */}
                  <Route path="/cart" element={
                    <RequireRole roles={['customer']}>
                      <CartPage />
                    </RequireRole>
                  } />
                  <Route path="/checkout" element={
                    <RequireRole roles={['customer']}>
                      <CheckoutPage />
                    </RequireRole>
                  } />
                  <Route path="/my-orders" element={
                    <RequireRole roles={['customer']}>
                      <MyOrders />
                    </RequireRole>
                  } />
                  <Route path="/orders/:id/track" element={
                    <RequireRole roles={['customer']}>
                      <OrderTrackingPage />
                    </RequireRole>
                  } />
                  <Route path="/profile" element={
                    <RequireRole roles={['customer']}>
                      <Profile />
                    </RequireRole>
                  } />

                  {/* Restaurant owner routes */}
                  <Route path="/admin" element={
                    <RequireRole roles={['restaurant_owner']}>
                      <AdminDashboard />
                    </RequireRole>
                  } />
                  <Route path="/admin/restaurant" element={
                    <RequireRole roles={['restaurant_owner']}>
                      <RestaurantManagement />
                    </RequireRole>
                  } />

                  {/* Driver routes */}
                  <Route path="/delivery" element={
                    <RequireRole roles={['driver']}>
                      <DeliveryDashboard />
                    </RequireRole>
                  } />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
