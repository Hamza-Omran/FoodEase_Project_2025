const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Controller for managing restaurant and menu item reviews
// Handles creating, retrieving, updating, and deleting customer reviews

// Submit a review for a restaurant
// Customers can rate restaurants after completing an order
exports.createRestaurantReview = async (req, res, next) => {
    try {
        const { restaurant_id, order_id, rating, review_text } = req.body;

        // Get the customer ID from the authenticated user
        // This ensures only logged-in customers can leave reviews
        const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
        );

        if (!customers[0]) {
            return next(new AppError('Customer profile not found', 404));
        }

        const customer_id = customers[0].customer_id;

        // Validate the rating value
        // Must be between 1 and 5 stars
        if (rating < 1 || rating > 5) {
            return next(new AppError('Rating must be between 1 and 5', 400));
        }

        // If order_id is provided, verify the customer actually ordered from this restaurant
        // This prevents fake reviews from people who haven't been customers
        if (order_id) {
            const { rows: orders } = await pool.query('SELECT order_id FROM Orders WHERE order_id = $1 AND customer_id = $2 AND restaurant_id = $3', [order_id, customer_id, restaurant_id]
            );

            if (!orders[0]) {
                return next(new AppError('You can only review restaurants you have ordered from', 403));
            }
        }

        // Insert the review into the database
        // The trigger will automatically update the restaurant's average rating
        const { rows: result } = await pool.query(`INSERT INTO Restaurant_Reviews (customer_id, restaurant_id, order_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)`, [customer_id, restaurant_id, order_id || null, rating, review_text || null]
        );

        // Return the newly created review
        res.status(201).json({
            success: true,
            review_id: result.rows[0].id,
            message: 'Review submitted successfully'
        });
    } catch (err) {
        // Handle duplicate review attempts
        if (err.code === 'ER_DUP_ENTRY') {
            return next(new AppError('You have already reviewed this order', 400));
        }
        next(err);
    }
};

// Get all reviews for a specific restaurant
// Used to display reviews on the restaurant page
exports.getRestaurantReviews = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;

        // Fetch all reviews with customer information
        // Orders by most recent first to show latest feedback
        const { rows: reviews } = await pool.query(`SELECT 
        rr.review_id,
        rr.order_id,
        rr.rating,
        rr.review_text,
        rr.review_date,
        u.full_name as customer_name
      FROM Restaurant_Reviews rr
      JOIN Customers c ON rr.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE rr.restaurant_id = $1
      ORDER BY rr.review_date DESC`, [restaurantId]
        );

        // Also get the restaurant's overall rating statistics
        const { rows: stats } = await pool.query('SELECT rating, review_count FROM Restaurants WHERE restaurant_id = $1', [restaurantId]
        );

        res.json({
            reviews,
            statistics: stats[0] || { rating: 0, review_count: 0 }
        });
    } catch (err) {
        next(err);
    }
};

// Submit a review for a menu item
// Allows customers to rate individual dishes they've ordered
exports.createMenuItemReview = async (req, res, next) => {
    try {
        const { menu_item_id, order_id, rating, review_text } = req.body;

        // Get customer ID from authenticated user
        const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
        );

        if (!customers[0]) {
            return next(new AppError('Customer profile not found', 404));
        }

        const customer_id = customers[0].customer_id;

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return next(new AppError('Rating must be between 1 and 5', 400));
        }

        // Verify the customer ordered this specific item
        // This prevents reviews from people who haven't tried the dish
        if (order_id) {
            const { rows: orderItems } = await pool.query(`SELECT oi.order_item_id 
         FROM Order_Items oi
         JOIN Orders o ON oi.order_id = o.order_id
         WHERE oi.order_id = $1 AND oi.menu_item_id = $2 AND o.customer_id = $3`, [order_id, menu_item_id, customer_id]
            );

            if (!orderItems[0]) {
                return next(new AppError('You can only review items you have ordered', 403));
            }
        }

        // Insert the menu item review
        const { rows: result } = await pool.query(`INSERT INTO Menu_Item_Reviews (customer_id, menu_item_id, order_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)`, [customer_id, menu_item_id, order_id || null, rating, review_text || null]
        );

        res.status(201).json({
            success: true,
            review_id: result.rows[0].id,
            message: 'Review submitted successfully'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return next(new AppError('You have already reviewed this item', 400));
        }
        next(err);
    }
};

// Get all reviews for a specific menu item
// Displays customer feedback on individual dishes
exports.getMenuItemReviews = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;

        // Fetch reviews with customer information
        const { rows: reviews } = await pool.query(`SELECT 
        mir.review_id,
        mir.rating,
        mir.review_text,
        mir.review_date,
        u.full_name as customer_name
      FROM Menu_Item_Reviews mir
      JOIN Customers c ON mir.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE mir.menu_item_id = $1
      ORDER BY mir.review_date DESC`, [menuItemId]
        );

        // Get overall rating statistics for the item
        const { rows: stats } = await pool.query('SELECT rating, review_count FROM Menu_Items WHERE menu_item_id = $1', [menuItemId]
        );

        res.json({
            reviews,
            statistics: stats[0] || { rating: 0, review_count: 0 }
        });
    } catch (err) {
        next(err);
    }
};

// Get all reviews submitted by the current customer
// Shows the customer's review history
exports.getMyReviews = async (req, res, next) => {
    try {
        // Get customer ID
        const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
        );

        if (!customers[0]) {
            return next(new AppError('Customer profile not found', 404));
        }

        const customer_id = customers[0].customer_id;

        // Fetch all restaurant reviews by this customer
        const { rows: restaurantReviews } = await pool.query(
            `SELECT 
        rr.review_id,
        rr.rating,
        rr.review_text,
        rr.review_date,
        r.name as restaurant_name,
        r.restaurant_id,
        'restaurant' as review_type
      FROM Restaurant_Reviews rr
      JOIN Restaurants r ON rr.restaurant_id = r.restaurant_id
      WHERE rr.customer_id = ?
      ORDER BY rr.review_date DESC`,
            [customer_id]
        );

        // Fetch all menu item reviews by this customer
        const { rows: itemReviews } = await pool.query(
            `SELECT 
        mir.review_id,
        mir.rating,
        mir.review_text,
        mir.review_date,
        mi.name as item_name,
        mi.menu_item_id,
        r.name as restaurant_name,
        'menu_item' as review_type
      FROM Menu_Item_Reviews mir
      JOIN Menu_Items mi ON mir.menu_item_id = mi.menu_item_id
      JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
      WHERE mir.customer_id = ?
      ORDER BY mir.review_date DESC`,
            [customer_id]
        );

        // Combine both types of reviews
        res.json({
            restaurant_reviews: restaurantReviews,
            menu_item_reviews: itemReviews
        });
    } catch (err) {
        next(err);
    }
};

// Update an existing review
// Allows customers to modify their feedback
exports.updateReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { rating, review_text, review_type } = req.body;

        // Get customer ID to verify ownership
        const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
        );

        if (!customers[0]) {
            return next(new AppError('Customer profile not found', 404));
        }

        const customer_id = customers[0].customer_id;

        // Validate rating if provided
        if (rating && (rating < 1 || rating > 5)) {
            return next(new AppError('Rating must be between 1 and 5', 400));
        }

        // Determine which table to update based on review type
        const table = review_type === 'menu_item' ? 'Menu_Item_Reviews' : 'Restaurant_Reviews';

        // Update the review but only if it belongs to this customer
        // This prevents users from editing other people's reviews
        const { rows: result } = await pool.query(`UPDATE ${table} 
       SET rating = COALESCE($1, rating), 
           review_text = COALESCE($2, review_text)
       WHERE review_id = $3 AND customer_id = $4`, [rating, review_text, reviewId, customer_id]
        );

        if (result.rowCount === 0) {
            return next(new AppError('Review not found or you do not have permission to update it', 404));
        }

        res.json({
            success: true,
            message: 'Review updated successfully'
        });
    } catch (err) {
        next(err);
    }
};

// Delete a review
// Allows customers to remove their reviews
exports.deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const { review_type } = req.query;

        // Get customer ID
        const { rows: customers } = await pool.query('SELECT customer_id FROM Customers WHERE user_id = $1', [req.user.id]
        );

        if (!customers[0]) {
            return next(new AppError('Customer profile not found', 404));
        }

        const customer_id = customers[0].customer_id;

        // Determine which table to delete from
        const table = review_type === 'menu_item' ? 'Menu_Item_Reviews' : 'Restaurant_Reviews';

        // Delete only if the review belongs to this customer
        const { rows: result } = await pool.query(`DELETE FROM ${table} WHERE review_id = $1 AND customer_id = $2`, [reviewId, customer_id]
        );

        if (result.rowCount === 0) {
            return next(new AppError('Review not found or you do not have permission to delete it', 404));
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

module.exports = exports;
