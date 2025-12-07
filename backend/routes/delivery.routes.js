const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// Driver routes
router.use(protect);

// Get available orders (not yet assigned)
router.get('/available-orders', restrictTo('driver'), deliveryController.getAvailableOrders);

// Get driver's current assignments
router.get('/my-assignments', restrictTo('driver'), deliveryController.getDriverAssignments);

// Accept an order
router.post('/accept/:orderId', restrictTo('driver'), deliveryController.acceptOrder);

// Update delivery status
router.put('/status/:assignmentId', restrictTo('driver'), deliveryController.updateDeliveryStatus);

// Get driver statistics
router.get('/stats', restrictTo('driver'), deliveryController.getDriverStats);

// Restaurant owner/admin routes
router.post('/assign', restrictTo('restaurant_owner', 'admin'), deliveryController.assignDriver);
router.get('/available-drivers/:restaurantId', restrictTo('restaurant_owner', 'admin'), deliveryController.getAvailableDrivers);

module.exports = router;
