const pool = require('../config/db');
module.exports = {
listByRestaurant: async (restaurantId) => {
    const [rows] = await pool.query(
      `SELECT mi.*, mc.name as category_name 
       FROM Menu_Items mi 
       LEFT JOIN Menu_Categories mc ON mi.category_id = mc.category_id 
       WHERE mi.restaurant_id = ? AND mi.is_available = TRUE 
       ORDER BY mc.display_order, mi.name`,
      [restaurantId]
    );
    return rows;
  },

  get: async (id) => {
    const [rows] = await pool.query(
      'SELECT * FROM Menu_Items WHERE menu_item_id = ?',
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const { restaurant_id, category_id, name, description, price } = data;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    const [result] = await pool.query(
      `INSERT INTO Menu_Items (restaurant_id, category_id, name, slug, description, price) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [restaurant_id, category_id, name, slug, description, price]
    );
    return { menu_item_id: result.insertId, ...data };
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await pool.query(`UPDATE Menu_Items SET ${fields} WHERE menu_item_id = ?`, values);
    return { menu_item_id: id, ...data };
  },

  remove: async (id) => {
    await pool.query('DELETE FROM Menu_Items WHERE menu_item_id = ?', [id]);
  }
};