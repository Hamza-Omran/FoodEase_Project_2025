const pool = require('../config/db');

// Daily sales report
exports.getDailySales = async (req, res, next) => {
  try {
    const { restaurant_id, days = 30 } = req.query;

    let query = 'SELECT * FROM vw_daily_sales WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)';
    const params = [parseInt(days)];

    if (restaurant_id) {
      query += ' AND restaurant_id = ?';
      params.push(restaurant_id);
    }

    query += ' ORDER BY order_date DESC';

    const [sales] = await pool.query(query, params);
    res.json(sales);
  } catch (err) {
    next(err);
  }
};

// Restaurant performance
exports.getRestaurantPerformance = async (req, res, next) => {
  try {
    const [performance] = await pool.query('SELECT * FROM vw_restaurant_performance ORDER BY revenue_30d DESC');
    res.json(performance);
  } catch (err) {
    next(err);
  }
};

// Driver performance
exports.getDriverPerformance = async (req, res, next) => {
  try {
    const [performance] = await pool.query('SELECT * FROM vw_driver_performance ORDER BY completed_deliveries DESC');
    res.json(performance);
  } catch (err) {
    next(err);
  }
};

// Popular menu items
exports.getPopularItems = async (req, res, next) => {
  try {
    const { restaurant_id } = req.query;

    let query = 'SELECT * FROM vw_popular_menu_items';
    const params = [];

    if (restaurant_id) {
      query += ' WHERE restaurant_id = ?';
      params.push(restaurant_id);
    }

    query += ' ORDER BY total_orders DESC LIMIT 50';

    const [items] = await pool.query(query, params);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Customer analytics
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const [analytics] = await pool.query(`
      SELECT 
        c.customer_id,
        u.full_name,
        u.email,
        c.total_orders,
        c.total_spent,
        c.loyalty_points,
        DATE(MAX(o.order_date)) as last_order_date,
        COUNT(DISTINCT o.restaurant_id) as restaurants_ordered_from
      FROM Customers c
      JOIN Users u ON c.user_id = u.user_id
      LEFT JOIN Orders o ON c.customer_id = o.customer_id
      GROUP BY c.customer_id
      ORDER BY c.total_spent DESC
      LIMIT 100
    `);

    res.json(analytics);
  } catch (err) {
    next(err);
  }
};

// Export sales data
exports.exportSalesData = async (req, res, next) => {
  try {
    const { start_date, end_date, restaurant_id } = req.query;

    let query = `
      SELECT 
        o.order_number,
        o.order_date,
        r.name as restaurant_name,
        u.full_name as customer_name,
        o.total_amount,
        o.status,
        o.payment_method,
        o.payment_status
      FROM Orders o
      JOIN Restaurants r ON o.restaurant_id = r.restaurant_id
      JOIN Customers c ON o.customer_id = c.customer_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND o.order_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND o.order_date <= ?';
      params.push(end_date);
    }

    if (restaurant_id) {
      query += ' AND o.restaurant_id = ?';
      params.push(restaurant_id);
    }

    query += ' ORDER BY o.order_date DESC';

    const [data] = await pool.query(query, params);
    
    // Convert to CSV
    if (data.length === 0) {
      return res.json({ success: false, message: 'No data found' });
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_export.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
