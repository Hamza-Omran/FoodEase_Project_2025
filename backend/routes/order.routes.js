const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// Protect all routes after this middleware
router.use(protect);

// Get my orders
router.get('/', orderController.getMyOrders);

// Get single order
router.get('/:id', orderController.getOrder);

// Create order
router.post('/', orderController.createOrder);

// Update order status
router.put('/status/:id', restrictTo('restaurant_owner', 'admin'), orderController.updateStatus);

module.exports = router;
