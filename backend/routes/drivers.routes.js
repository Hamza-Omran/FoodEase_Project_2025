const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// Get available drivers for a restaurant
router.get('/available/:restaurantId', protect, restrictTo('restaurant_owner', 'admin'), deliveryController.getAvailableDrivers);

module.exports = router;
