const menuRepo = require('../repositories/menu.repo');
const restaurantRepo = require('../repositories/restaurant.repo');
const AppError = require('../utils/AppError');

// Get menu items for a restaurant
exports.getMenuItems = async (req, res, next) => {
  try {
    const items = await menuRepo.listByRestaurant(req.params.restaurantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Get single menu item
exports.getMenuItem = async (req, res, next) => {
  try {
    const item = await menuRepo.get(req.params.menuItemId);
    if (!item) return next(new AppError('Menu item not found', 404));
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Create menu item
exports.createMenuItem = async (req, res, next) => {
  try {
    const restaurant = await restaurantRepo.get(req.params.restaurantId);
    if (!restaurant) return next(new AppError('Restaurant not found', 404));
    
    if (req.user.role === 'owner' && restaurant.owner_id !== req.user.id) {
      return next(new AppError('Forbidden', 403));
    }
    
    const item = await menuRepo.create({ ...req.body, restaurant_id: req.params.restaurantId });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// Update menu item
exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await menuRepo.update(req.params.itemId, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res, next) => {
  try {
    await menuRepo.remove(req.params.itemId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

