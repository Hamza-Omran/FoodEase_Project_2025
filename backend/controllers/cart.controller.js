const pool = require('../config/db');
const customerRepo = require('../repositories/customer.repo');
const AppError = require('../utils/AppError');

// Get cart items
exports.getCart = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { rows: cartItems } = await pool.query(`SELECT 
        ci.cart_item_id,
        ci.quantity,
        mi.menu_item_id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        r.restaurant_id,
        r.name as restaurant_name
      FROM Cart_Items ci
      JOIN Menu_Items mi ON ci.menu_item_id = mi.menu_item_id
      JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
      WHERE ci.customer_id = $1
      ORDER BY ci.added_at DESC`, [customer.customer_id]
    );

    res.json(cartItems);
  } catch (err) {
    next(err);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const { menu_item_id, quantity, notes } = req.body;

    if (!menu_item_id || !quantity) {
      return next(new AppError('Menu item ID and quantity are required', 400));
    }

    const customer = await customerRepo.findByUserId(req.user.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Call stored procedure to add to cart
    await pool.query('SELECT * FROM sp_add_to_cart($1, $2, $3)', [
      customer.customer_id,
      menu_item_id,
      quantity
    ]);

    res.status(201).json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    next(err);
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return next(new AppError('Invalid quantity', 400));
    }

    const customer = await customerRepo.findByUserId(req.user.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Verify cart item belongs to customer
    const { rows: cartItems } = await pool.query(
      'SELECT * FROM Cart_Items WHERE cart_item_id = $1 AND customer_id = $2',
      [cartItemId, customer.customer_id]
    );

    if (!cartItems[0]) {
      return next(new AppError('Cart item not found', 404));
    }

    await pool.query(
      'UPDATE Cart_Items SET quantity = $1 WHERE cart_item_id = $2',
      [quantity, cartItemId]
    );

    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    next(err);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const { cartItemId } = req.params;

    const customer = await customerRepo.findByUserId(req.user.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { rows: result } = await pool.query(
      'DELETE FROM Cart_Items WHERE cart_item_id = $1 AND customer_id = $2',
      [cartItemId, customer.customer_id]
    );

    if (result.affectedRows === 0) {
      return next(new AppError('Cart item not found', 404));
    }

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    next(err);
  }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    await pool.query(
      'DELETE FROM Cart_Items WHERE customer_id = $1',
      [customer.customer_id]
    );

    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
