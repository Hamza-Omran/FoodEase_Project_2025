const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { protect, restrictTo } = require('../middlewares/auth');

router.use(protect, restrictTo('customer'));

router.post('/', favoriteController.addFavorite);
router.delete('/:restaurantId', favoriteController.removeFavorite);
router.get('/', favoriteController.getFavorites);
router.get('/:restaurantId/check', favoriteController.isFavorite);

module.exports = router;
