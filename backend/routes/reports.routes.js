const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { protect, restrictTo } = require('../middlewares/auth');

// Reports require admin or restaurant_owner
router.use(protect, restrictTo('admin', 'restaurant_owner'));

router.get('/daily-sales', reportsController.getDailySales);
router.get('/restaurant-performance', reportsController.getRestaurantPerformance);
router.get('/driver-performance', reportsController.getDriverPerformance);
router.get('/popular-items', reportsController.getPopularItems);
router.get('/customer-analytics', reportsController.getCustomerAnalytics);
router.get('/export-sales', reportsController.exportSalesData);

module.exports = router;
