const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

router.get('/restaurants', searchController.searchRestaurants);
router.get('/menu-items', searchController.searchMenuItems);
router.get('/filters', searchController.getFilterOptions);

module.exports = router;
