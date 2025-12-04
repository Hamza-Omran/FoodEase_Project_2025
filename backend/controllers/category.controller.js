const pool = require('../config/db');
const AppError = require('../utils/AppError');

exports.create = async (req, res, next) => {
  try {
    const { restaurant_id, name, description, display_order } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO Menu_Categories (restaurant_id, name, description, display_order) 
       VALUES (?, ?, ?, ?)`,
      [restaurant_id, name, description, display_order || 0]
    );
    
    res.status(201).json({ 
      category_id: result.insertId, 
      restaurant_id, 
      name, 
      description, 
      display_order 
    });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { restaurant_id } = req.params;
    
    const [rows] = await pool.query(
      'SELECT * FROM Menu_Categories WHERE restaurant_id = ? ORDER BY display_order',
      [restaurant_id]
    );
    
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = Object.keys(req.body).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(req.body), id];
    
    await pool.query(
      `UPDATE Menu_Categories SET ${fields} WHERE category_id = ?`,
      values
    );
    
    res.json({ category_id: id, ...req.body });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Menu_Categories WHERE category_id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
