const orderRepo = require('../repositories/order.repo');
const customerRepo = require('../repositories/customer.repo');
const cartRepo = require('../repositories/cart.repo');
const AppError = require('../utils/AppError'); // FIXED: Capital 'A'
const pool = require('../config/db');

// Create order
exports.createOrder = async (req, res, next) => {
  try {
    const customerId = req.user.customerId;
    const { restaurant_id, address_id, special_instructions, payment_method, coupon_code } = req.body;

    // Call stored procedure
    await pool.query(
      'SELECT * FROM sp_place_order($1, $2, $3, $4, $5, $6)',
      [customerId, restaurant_id, address_id, special_instructions, payment_method, coupon_code]
    );

    // Get the latest order
    const { rows: orders } = await pool.query('SELECT * FROM Orders WHERE customer_id = $1 ORDER BY order_date DESC LIMIT 1', [customerId]
    );

    res.status(201).json(orders[0]);
  } catch (err) {
    next(err);
  }
};

// Get my orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { rows: orders } = await pool.query(`SELECT 
        o.*,
        r.name as restaurant_name,
        r.image_url as restaurant_image,
        CASE WHEN rr.review_id IS NOT NULL THEN TRUE ELSE FALSE END as has_review
      FROM Orders o
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN Restaurant_Reviews rr ON o.order_id = rr.order_id
      WHERE o.customer_id = $1
      ORDER BY o.order_date DESC`, [customer.customer_id]
    );

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// Get single order
exports.getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get order with customer and address info
    const { rows: orders } = await pool.query(`
      SELECT 
        o.*,
        u.full_name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        ca.street_address,
        ca.city,
        CONCAT(ca.street_address, ', ', ca.city) as delivery_address,
        r.name as restaurant_name,
        r.phone as restaurant_phone,
        IF(rr.review_id IS NOT NULL, TRUE, FALSE) as has_review
      FROM Orders o
      JOIN Customers c ON o.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      JOIN Customer_Addresses ca ON o.delivery_address_id = ca.address_id
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      LEFT JOIN Restaurant_Reviews rr ON o.order_id = rr.order_id
      WHERE o.order_id = ?
    `, [id]);

    if (!orders[0]) {
      return next(new AppError('Order not found', 404));
    }

    const order = orders[0];

    // Get order items
    const { rows: items } = await pool.query(`
      SELECT 
        oi.*,
        mi.image_url
      FROM Order_Items oi
      LEFT JOIN Menu_Items mi ON oi.menu_item_id = mi.menu_item_id
      WHERE oi.order_id = $1
    `, [id]);

    order.items = items;

    res.json(order);
  } catch (err) {
    next(err);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;


    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    // Call stored procedure
    await pool.query(`SELECT * FROM sp_update_order_status($1, $2, $3, $4)', [
      id,
      status,
      req.user.id,
      null // cancellation_reason
    ]);

    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);

    if (!customer) {
      return next(new AppError('Customer profile not found', 404));
    }

    const { restaurant_id, address_id, special_instructions, payment_method, coupon_code } = req.body;

    // Get cart items
    const cartItems = await cartRepo.get(customer.customer_id);

    if (cartItems.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }

    // Verify restaurant match
    const cartRestaurant = cartItems[0].restaurant_id;
    if (cartRestaurant !== restaurant_id) {
      return next(new AppError('Cart items are from a different restaurant', 400));
    }

    // Place order
    const order = await orderRepo.placeOrder(
      customer.customer_id,
      restaurant_id,
      address_id,
      special_instructions,
      payment_method,
      coupon_code
    );

    // Ensure response has the correct structure
    const response = {
      order_id: order.order_id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      subtotal: parseFloat(order.subtotal),
      delivery_fee: parseFloat(order.delivery_fee),
      tax: parseFloat(order.tax),
      discount: parseFloat(order.discount || 0),
      total_amount: parseFloat(order.total_amount),
      restaurant_name: order.restaurant_name,
      delivery_address: order.delivery_address,
      city: order.city,
      estimated_delivery_time: order.estimated_delivery_time,
      items: order.items || []
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

exports.listUserOrders = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    const orders = await orderRepo.listByUser(customer.customer_id);
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

// NEW: tracking endpoint, accepts order_id or order_number
exports.trackOrder = async (req, res, next) => {
  try {
    const idOrNumber = req.params.id;

    const order = await orderRepo.getForTracking(idOrNumber);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const deliveryAddress =
      order.street_address ||
      order.city ||
      'Address not available';

    const response = {
      order_id: order.order_id,
      order_number: order.order_number,
      restaurant_name: order.restaurant_name,
      status: order.status,
      payment_status: order.payment_status,
      subtotal: parseFloat(order.subtotal),
      delivery_fee: parseFloat(order.delivery_fee),
      tax: parseFloat(order.tax),
      discount: parseFloat(order.discount || 0),
      total_amount: parseFloat(order.total_amount),
      delivery_address: deliveryAddress,
      address_label: order.address_label || 'Home',
      city: order.city,
      order_date: order.order_date,
      estimated_delivery_time: order.estimated_delivery_time,
      actual_delivery_time: order.actual_delivery_time,
      items: order.items || []
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, cancellation_reason } = req.body;
    const order = await orderRepo.updateStatus(req.params.id, status, req.user.id, cancellation_reason);
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    await orderRepo.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
