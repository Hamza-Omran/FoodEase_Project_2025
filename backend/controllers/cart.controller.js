const cartRepo = require('../repositories/cart.repo');
const customerRepo = require('../repositories/customer.repo');
const AppError = require('../utils/AppError'); // FIXED: Capital 'A'

exports.add = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    
    if (!customer) {
      return next(new AppError('Customer profile not found', 404));
    }
    
    const { menu_item_id, quantity, notes } = req.body;
    
    if (!menu_item_id || !quantity) {
      return next(new AppError('Menu item and quantity are required', 400));
    }
    
    if (quantity <= 0) {
      return next(new AppError('Quantity must be greater than 0', 400));
    }
    
    await cartRepo.add(customer.customer_id, menu_item_id, quantity, notes);
    res.status(201).json({ success: true, message: 'Item added to cart' });
  } catch (err) {
    console.error('Add to cart error:', err);
    next(new AppError(err.message || 'Failed to add item to cart', 500));
  }
};

exports.getCart = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    const items = await cartRepo.get(customer.customer_id);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    console.log('Update cart request:', req.params.id, req.body);
    
    const customer = await customerRepo.findByUserId(req.user.id);
    
    if (!customer) {
      return next(new AppError('Customer profile not found', 404));
    }
    
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return next(new AppError('Valid quantity is required', 400));
    }
    
    await cartRepo.update(customer.customer_id, req.params.id, quantity);
    
    console.log('Cart updated successfully');
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    console.error('Update cart error:', err);
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    await cartRepo.remove(customer.customer_id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
