const pool = require('../config/db');
const customerRepo = require('../repositories/customer.repo');

exports.add = async (req, res, next) => {
  try {
    const customer = await customerRepo.findByUserId(req.user.id);
    const { order_id, rating, comment, food_rating, delivery_rating } = req.body;
    
    await pool.query(
      'CALL sp_add_review(?, ?, ?, ?, ?)',
      [order_id, rating, comment, food_rating, delivery_rating]
    );
    
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.listByMeal = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name as customer_name 
       FROM Menu_Item_Reviews r
       JOIN Customers c ON r.customer_id = c.customer_id
       JOIN Users u ON c.user_id = u.user_id
       WHERE r.menu_item_id = ? AND r.is_visible = TRUE
       ORDER BY r.created_at DESC`,
      [req.params.mealId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Reviews WHERE review_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
