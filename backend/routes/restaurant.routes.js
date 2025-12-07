const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const menuController = require('../controllers/menu.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// Public routes
router.get('/search', restaurantController.getForSearch); // Optimized search
router.get('/featured', restaurantController.getForHome); // Optimized for home
router.get('/', restaurantController.getAll);
router.get('/my', protect, restrictTo('restaurant_owner'), restaurantController.getMy); // ✅ Move before /:id
router.get('/:id', restaurantController.getById);

// Protected routes
router.post('/', protect, restrictTo('restaurant_owner'), restaurantController.create);
router.put('/:id', protect, restrictTo('restaurant_owner', 'admin'), restaurantController.update);
router.delete('/:id', protect, restrictTo('admin'), restaurantController.delete);

// ✅ NESTED MENU ROUTES - Categories
router.get('/:restaurantId/categories', menuController.getCategories);
router.post('/:restaurantId/categories', protect, restrictTo('restaurant_owner'), menuController.createCategory);
router.put('/categories/:categoryId', protect, restrictTo('restaurant_owner'), menuController.updateCategory);
router.delete('/categories/:categoryId', protect, restrictTo('restaurant_owner'), menuController.deleteCategory);

// ✅ NESTED MENU ROUTES - Menu Items
router.get('/:restaurantId/menu', menuController.getMenuItems);
router.post('/:restaurantId/menu', protect, restrictTo('restaurant_owner'), menuController.addMenuItem);
router.put('/:restaurantId/menu/:itemId', protect, restrictTo('restaurant_owner'), menuController.updateMenuItem);
router.delete('/:restaurantId/menu/:itemId', protect, restrictTo('restaurant_owner'), menuController.deleteMenuItem);

// ✅ Inventory
router.put('/menu/:itemId/inventory', protect, restrictTo('restaurant_owner'), menuController.updateInventory);

// ✅ Restaurant Orders (for owner dashboard)
router.get('/:id/orders', protect, restrictTo('restaurant_owner', 'admin'), restaurantController.getRestaurantOrders);

module.exports = router;