const orderRepo = require('../repositories/order.repo');
const customerRepo = require('../repositories/customer.repo');
const cartRepo = require('../repositories/cart.repo');
const AppError = require('../utils/AppError'); // FIXED: Capital 'A'

exports.placeOrder = async (req, res, next) => {
  try {
    console.log('🛒 Place order request from user:', req.user.id);
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const customer = await customerRepo.findByUserId(req.user.id);
    
    if (!customer) {
      console.error('❌ Customer not found for user:', req.user.id);
      return next(new AppError('Customer profile not found', 404));
    }
    
    console.log('✅ Customer found:', customer.customer_id);
    
    const { restaurant_id, address_id, special_instructions, payment_method, coupon_code } = req.body;
    
    // PRE-FLIGHT CHECK
    console.log('🔍 Pre-flight check: Getting cart items...');
    const cartItems = await cartRepo.get(customer.customer_id);
    console.log(`📋 Cart has ${cartItems.length} items`);
    
    if (cartItems.length === 0) {
      console.error('❌ Cart is empty');
      return next(new AppError('Cart is empty', 400));
    }
    
    // Verify restaurant match
    const cartRestaurant = cartItems[0].restaurant_id;
    if (cartRestaurant !== restaurant_id) {
      console.error('❌ Restaurant mismatch:', {
        requested: restaurant_id,
        cart: cartRestaurant
      });
      return next(new AppError('Cart items are from a different restaurant', 400));
    }
    
    console.log('✅ All pre-flight checks passed');
    
    // Place order
    const order = await orderRepo.placeOrder(
      customer.customer_id,
      restaurant_id,
      address_id,
      special_instructions,
      payment_method,
      coupon_code
    );
    
    console.log('🎉 Order created successfully:', {
      order_id: order.order_id,
      order_number: order.order_number,
      total_amount: order.total_amount,
      items_count: order.items ? order.items.length : 0
    });
    
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
      state: order.state,
      estimated_delivery_time: order.estimated_delivery_time,
      items: order.items || [],
      created_at: order.created_at
    };
    
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    
    res.status(201).json(response);
  } catch (err) {
    console.error('❌ Place order error:', err);
    console.error('Error stack:', err.stack);
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

exports.getOrder = async (req, res, next) => {
  try {
    console.log('Fetching order:', req.params.id);
    const order = await orderRepo.get(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Order not found' 
      });
    }

    const deliveryAddress =
      order.street_address ||
      [order.city, order.state].filter(Boolean).join(', ') ||
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
      state: order.state,
      postal_code: order.postal_code,
      country: order.country,
      order_date: order.order_date,
      estimated_delivery_time: order.estimated_delivery_time,
      actual_delivery_time: order.actual_delivery_time,
      items: order.items || []
    };
    
    console.log('📤 getOrder response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error('Get order error:', err);
    next(err);
  }
};

// NEW: tracking endpoint, accepts order_id or order_number
exports.trackOrder = async (req, res, next) => {
  try {
    const idOrNumber = req.params.id;
    console.log('🚚 trackOrder called with:', idOrNumber);

    const order = await orderRepo.getForTracking(idOrNumber);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const deliveryAddress =
      order.street_address ||
      [order.city, order.state].filter(Boolean).join(', ') ||
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
      state: order.state,
      postal_code: order.postal_code,
      country: order.country,
      order_date: order.order_date,
      estimated_delivery_time: order.estimated_delivery_time,
      actual_delivery_time: order.actual_delivery_time,
      items: order.items || []
    };

    console.log('📤 trackOrder response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    console.error('❌ trackOrder error:', err);
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
