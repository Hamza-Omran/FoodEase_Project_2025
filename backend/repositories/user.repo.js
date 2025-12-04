const pool = require('../config/db');

module.exports = {
  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM Users WHERE user_id = ?', [id]);
    return rows[0];
  },

  create: async ({ email, password_hash, role, phone, full_name }) => {
    const [result] = await pool.query(
      'INSERT INTO Users (email, password_hash, role, phone, full_name) VALUES (?, ?, ?, ?, ?)',
      [email, password_hash, role, phone, full_name]
    );
    return {
      user_id: result.insertId,
      email,
      password_hash,
      role,
      phone,
      full_name,
    };
  },

  update: async (id, data) => {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setSql = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await pool.query(`UPDATE Users SET ${setSql} WHERE user_id = ?`, values);
  },
};