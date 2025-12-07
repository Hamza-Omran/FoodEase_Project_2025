const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// Get menu items for a restaurant (public)
router.get('/:restaurantId', menuController.getMenuItems);

// Get categories for a restaurant (public)
router.get('/:restaurantId/categories', menuController.getCategories);

// Create category (restaurant owner only)
router.post('/:restaurantId/categories', protect, restrictTo('restaurant_owner'), menuController.createCategory);

// Add menu item (restaurant owner only)
router.post('/:restaurantId', protect, restrictTo('restaurant_owner'), menuController.addMenuItem);

// Update menu item
router.put('/:restaurantId/:itemId', protect, restrictTo('restaurant_owner'), menuController.updateMenuItem);

// Delete menu item
router.delete('/:restaurantId/:itemId', protect, restrictTo('restaurant_owner'), menuController.deleteMenuItem);

module.exports = router;

