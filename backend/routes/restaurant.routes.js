const express = require('express');
const router = express.Router();

const restaurantController = require('../controllers/restaurant.controller');

// Public restaurant endpoints
router.get('/', restaurantController.listRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/:id/menu', restaurantController.getRestaurantMenu);
router.get('/:id/categories', restaurantController.getRestaurantCategories);

module.exports = router;