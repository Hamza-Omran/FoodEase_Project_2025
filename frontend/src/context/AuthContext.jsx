// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await authAPI.me();
      setUser(response.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      console.log("Registering user:", userData);
      const response = await authAPI.register(userData);
      console.log("Registration response:", response.data);

      const { user, token } = response.data;

      // Store token and user
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);

      console.log("Registration successful, user:", user);
      return response.data;
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      console.log("Logging in:", email);
      const response = await authAPI.login({ email, password });
      console.log("Login response:", response.data);

      const { user, token } = response.data;

      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);

      console.log("Login successful, user:", user);
      return response.data;
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Export the context itself for compatibility
export { AuthContext };
