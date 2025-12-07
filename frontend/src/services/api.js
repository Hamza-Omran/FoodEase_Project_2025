import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// Base Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {

    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const authAPI = {
  register: ({ name, email, phone, password, role = "customer" }) =>
    api.post("/auth/register", { name, email, phone, password, role }),
  login: ({ email, password }) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

// ========== RESTAURANTS ==========
export const restaurantAPI = {
  getAll: () => api.get("/restaurants"),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post("/restaurants", data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  getMy: () => api.get("/restaurants/my"),
};

// ========== MENU (explicit, for RestaurantMenu.jsx expecting menuAPI) ==========
export const menuAPI = {
  getCategories: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/categories`),
  createCategory: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/categories`, data),
  getMenuItems: (restaurantId) => api.get(`/restaurants/${restaurantId}/menu`),
  addMenuItem: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/menu`, data),
  updateMenuItem: (restaurantId, itemId, data) =>
    api.put(`/restaurants/${restaurantId}/menu/${itemId}`, data),
  deleteMenuItem: (restaurantId, itemId) =>
    api.delete(`/restaurants/${restaurantId}/menu/${itemId}`),
};

// ========== CUSTOMERS ==========
export const customerAPI = {
  getProfile: (id) => api.get(`/customers/${id}`),
  updateProfile: (id, data) => api.put(`/customers/${id}`, data),
  getAddresses: (id) => api.get(`/customers/${id}/addresses`),
  addAddress: (id, data) => api.post(`/customers/${id}/addresses`, data),
  updateAddress: (id, addressId, data) =>
    api.put(`/customers/${id}/addresses/${addressId}`, data),
  deleteAddress: (id, addressId) =>
    api.delete(`/customers/${id}/addresses/${addressId}`),
};

// ========== CART ==========
export const cartAPI = {
  get: () => api.get("/cart"),
  add: ({ menu_item_id, quantity, notes }) =>
    api.post("/cart/add", { menu_item_id, quantity, special_requests: notes }),
  update: (cartItemId, body) => api.put(`/cart/${cartItemId}`, body),
  remove: (cartItemId) => api.delete(`/cart/${cartItemId}`),
  clear: () => api.delete("/cart"),
};

// ========== ORDERS ==========
export const orderAPI = {
  create: (data) => api.post("/orders", data),
  getMy: () => api.get("/orders"),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/status/${id}`, data),
};

// Used in CheckoutPage
export const createOrder = async (payload) => {
  const res = await orderAPI.create(payload);
  return res.data; // this is the order row from backend
};

// Used in OrderTrackingPage
export const getOrder = async (orderId) => {
  try {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  } catch (err) {

    throw err;
  }
};

// Driver API
export const driverAPI = {
  getProfile: (userId) => api.get(`/delivery/drivers/${userId}`),
  getMe: () => api.get('/delivery/drivers/me'),
  updateLocation: (driverId, data) => api.put(`/delivery/drivers/${driverId}/location`, data),
  toggleAvailability: (driverId, data) => api.put(`/delivery/drivers/${driverId}/availability`, data)
};

// Delivery API - Enhanced
export const deliveryAPI = {
  // Driver endpoints
  getAvailableOrders: () => api.get('/delivery/available-orders'),
  getMyAssignments: () => api.get('/delivery/my-assignments'),
  acceptOrder: (orderId) => api.post(`/delivery/accept/${orderId}`),
  updateStatus: (assignmentId, data) => api.put(`/delivery/status/${assignmentId}`, data),
  getStats: () => api.get('/delivery/stats'),

  // Restaurant owner/admin endpoints
  assignDriver: (data) => api.post('/delivery/assign', data),
  getAvailableDrivers: (restaurantId) => api.get(`/delivery/available-drivers/${restaurantId}`)
};

// Review API
export const reviewAPI = {
  add: (data) => api.post('/reviews', data),
  getRestaurantReviews: (restaurantId, params) => api.get(`/reviews/restaurant/${restaurantId}`, { params }),
  respond: (reviewId, data) => api.post(`/reviews/${reviewId}/respond`, data),
  markHelpful: (reviewId) => api.post(`/reviews/${reviewId}/helpful`)
};

// Coupon API
export const couponAPI = {
  create: (data) => api.post('/coupons', data),
  validate: (code, data) => api.post(`/coupons/validate/${code}`, data),
  list: (params) => api.get('/coupons/list', { params }),
  update: (couponId, data) => api.put(`/coupons/${couponId}`, data),
  delete: (couponId) => api.delete(`/coupons/${couponId}`)
};

// Favorite API
export const favoriteAPI = {
  add: (data) => api.post('/favorites', data),
  remove: (restaurantId) => api.delete(`/favorites/${restaurantId}`),
  list: () => api.get('/favorites'),
  check: (restaurantId) => api.get(`/favorites/${restaurantId}/check`)
};

// Search API
export const searchAPI = {
  restaurants: (params) => api.get('/search/restaurants', { params }),
  menuItems: (params) => api.get('/search/menu-items', { params }),
  filters: () => api.get('/search/filters')
};

// Notification API
export const notificationAPI = {
  get: (params) => api.get('/notifications', { params }),
  markRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`)
};

// Upload API
export const uploadAPI = {
  image: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  images: (formData) => api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Admin API
export const adminAPI = {
  overview: () => api.get('/admin/overview'),
  restaurants: () => api.get('/admin/restaurants'),
  updateRestaurantStatus: (id, data) => api.patch(`/admin/restaurants/${id}/status`, data),
  deleteRestaurant: (id) => api.delete(`/admin/restaurants/${id}`),
  users: (params) => api.get('/admin/users', { params }),
  toggleUser: (id, data) => api.patch(`/admin/users/${id}/activate`, data),
  activityLogs: (params) => api.get('/admin/activity-logs', { params })
};

export default api;
