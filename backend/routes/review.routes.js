const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// All review routes require authentication
// Only customers can leave reviews
router.use(protect);

// Restaurant Review Routes

// Submit a new review for a restaurant
// POST /api/v1/reviews/restaurant
router.post('/restaurant',
    restrictTo('customer'),
    reviewController.createRestaurantReview
);

// Get all reviews for a specific restaurant
// GET /api/v1/reviews/restaurant/:restaurantId
// This route is public (no role restriction) so anyone can read reviews
router.get('/restaurant/:restaurantId',
    reviewController.getRestaurantReviews
);

// Menu Item Review Routes

// Submit a new review for a menu item
// POST /api/v1/reviews/menu-item
router.post('/menu-item',
    restrictTo('customer'),
    reviewController.createMenuItemReview
);

// Get all reviews for a specific menu item
// GET /api/v1/reviews/menu-item/:menuItemId
router.get('/menu-item/:menuItemId',
    reviewController.getMenuItemReviews
);

// Customer Review Management

// Get all reviews submitted by the current customer
// GET /api/v1/reviews/my-reviews
router.get('/my-reviews',
    restrictTo('customer'),
    reviewController.getMyReviews
);

// Update an existing review
// PUT /api/v1/reviews/:reviewId
// Customer can only update their own reviews
router.put('/:reviewId',
    restrictTo('customer'),
    reviewController.updateReview
);

// Delete a review
// DELETE /api/v1/reviews/:reviewId?review_type=restaurant|menu_item
// Customer can only delete their own reviews
router.delete('/:reviewId',
    restrictTo('customer'),
    reviewController.deleteReview
);

module.exports = router;
