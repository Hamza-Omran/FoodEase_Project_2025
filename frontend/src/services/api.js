import axios from "axios";

// Base Axios instance
const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
});

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  getMenu: (id) => api.get(`/restaurants/${id}/menu`),
  getCategories: (id) => api.get(`/restaurants/${id}/categories`),
};

// ========== MENU (explicit, for RestaurantMenu.jsx expecting menuAPI) ==========
export const menuAPI = {
  getMenuItems: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/menu`),
  // keep this too in case other code uses it
  getRestaurantMenu: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/menu`),
};

// ========== CART ==========
export const cartAPI = {
  get: () => api.get("/cart"),
  add: ({ menu_item_id, quantity, notes }) =>
    api.post("/cart/add", { menu_item_id, quantity, special_requests: notes }),
  update: (cartItemId, body) => api.put(`/cart/${cartItemId}`, body),
  remove: (cartItemId) => api.delete(`/cart/${cartItemId}`),
};

// ========== ORDERS ==========
export const orderAPI = {
  getMy: () => api.get("/orders"),
  create: (data) => api.post("/orders", data),
  updateStatus: (orderId, body) =>
    api.put(`/orders/status/${orderId}`, body),
  getOrder: (orderId) => api.get(`/orders/${orderId}`),
};

// Used in CheckoutPage
export const createOrder = async (payload) => {
  console.log("createOrder payload:", payload);
  const res = await orderAPI.create(payload);
  console.log("createOrder response:", res.data);
  return res.data; // this is the order row from backend
};

// Used in OrderTrackingPage
export const getOrder = async (orderId) => {
  try {
    console.log("getOrder: fetching", orderId);
    const res = await api.get(`/orders/${orderId}`);
    console.log("getOrder: success", res.data);
    return res.data;
  } catch (err) {
    console.error(
      "getOrder error:",
      err.response?.status,
      err.response?.data || err.message
    );
    throw err;
  }
};

// ========== CUSTOMERS ==========
export const customerAPI = {
  getAddresses: (userId) => api.get(`/customers/${userId}/addresses`),
};

// ========== DRIVERS / DELIVERY ==========
export const driverAPI = {
  getByUserId: (userId) => api.get(`/drivers/${userId}`),
  getAssignments: () => api.get("/delivery/assignments"),
  updateAssignment: (assignmentId, body) =>
    api.put(`/delivery/assignments/${assignmentId}`, body),
};

export default api;
