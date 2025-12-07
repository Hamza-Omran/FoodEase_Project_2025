import { createContext, useContext, useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch orders if user is a customer
    if (user && user.role === 'customer') {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getMy();
      setOrders(res.data);
    } catch (err) {

      setOrders([]);
    }
  };

  const placeOrder = async (orderData) => {
    const res = await orderAPI.create(orderData);
    fetchOrders();
    return res.data;
  };

  const assignAndStartDelivery = async (orderId, driverId, driverName) => {
    await orderAPI.updateStatus(orderId, { status: 'out_for_delivery' });
    fetchOrders();
  };

  const completeDelivery = async (orderId) => {
    await orderAPI.updateStatus(orderId, { status: 'delivered' });
    fetchOrders();
  };

  return (
    <OrderContext.Provider value={{
      orders,
      fetchOrders,
      placeOrder,
      assignAndStartDelivery,
      completeDelivery
    }}>
      {children}
    </OrderContext.Provider>
  );
}

// Custom hook
export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
}

export { OrderContext };
