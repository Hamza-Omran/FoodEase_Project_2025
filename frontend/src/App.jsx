import "./App.css";


import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import RestaurantMenu from "./pages/RestaurantMenu";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantManagement from "./pages/RestaurantManagement";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryDashboardNew from "./pages/DeliveryDashboardNew";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminSystemDashboard from "./pages/AdminSystemDashboard";
import SearchResults from "./pages/SearchResults";
import AdminReportsPage from "./pages/AdminReportsPage";
import AvailableOrdersPage from "./pages/AvailableOrdersPage";
import MyDeliveriesPage from "./pages/MyDeliveriesPage";
import AdminRestaurantsPage from "./pages/AdminRestaurantsPage";
import AdminDriversPage from "./pages/AdminDriversPage";
import OrderReviewPage from "./pages/OrderReviewPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <Header />
            <div className="min-h-screen">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/restaurant/:id" element={<RestaurantMenu />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer Routes */}
                <Route path="/cart" element={
                  <ProtectedRoute roles={['customer']}>
                    <CartPage />
                  </ProtectedRoute>
                } />
                <Route path="/checkout" element={
                  <ProtectedRoute roles={['customer']}>
                    <CheckoutPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute roles={['customer']}>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/my-orders" element={
                  <ProtectedRoute roles={['customer']}>
                    <MyOrders />
                  </ProtectedRoute>
                } />
                <Route path="/orders/:orderId/track" element={
                  <ProtectedRoute roles={['customer']}>
                    <OrderTrackingPage />
                  </ProtectedRoute>
                } />
                <Route path="/orders/:orderId/review" element={
                  <ProtectedRoute roles={['customer']}>
                    <OrderReviewPage />
                  </ProtectedRoute>
                } />

                {/* Restaurant Owner Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute roles={['restaurant_owner']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/restaurant" element={
                  <ProtectedRoute roles={['restaurant_owner']}>
                    <RestaurantManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/order/:orderId" element={
                  <ProtectedRoute roles={['restaurant_owner']}>
                    <OrderDetailsPage />
                  </ProtectedRoute>
                } />

                {/* Driver Routes - Separate Pages */}
                {/* Driver Routes - Separate Pages */}
                <Route path="/available-orders" element={
                  <ProtectedRoute roles={['driver']}>
                    <AvailableOrdersPage />
                  </ProtectedRoute>
                } />
                <Route path="/my-deliveries" element={
                  <ProtectedRoute roles={['driver']}>
                    <MyDeliveriesPage />
                  </ProtectedRoute>
                } />

                {/* Keep old delivery dashboard for backwards compatibility */}
                <Route path="/delivery" element={<DeliveryDashboard />} />
                <Route path="/delivery-dashboard" element={<DeliveryDashboardNew />} />

                {/* Admin System Dashboard */}
                <Route path="/admin/system" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminSystemDashboard />
                  </ProtectedRoute>
                } />

                {/* Admin Reports Page */}
                <Route path="/admin/reports" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminReportsPage />
                  </ProtectedRoute>
                } />

                {/* Admin Restaurant & Driver Management */}
                <Route path="/admin/restaurants" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminRestaurantsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin/drivers" element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDriversPage />
                  </ProtectedRoute>
                } />

                {/* Search Results */}
                <Route path="/search" element={<SearchResults />} />
              </Routes>
            </div>
            <Footer />
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
