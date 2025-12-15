const pool = require('../config/db');

module.exports = {
  list: async () => {
    const { rows: rows } = await pool.query(
      'SELECT * FROM Restaurants WHERE status = "active" ORDER BY is_featured DESC, name ASC'
    );
    return rows;
  },

  get: async (id) => {
    const { rows: rows } = await pool.query('SELECT * FROM Restaurants WHERE restaurant_id = $1', [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const { owner_id, name, description, street_address, city, phone, cuisine_type } = data;

    const { rows: result } = await pool.query(`INSERT INTO Restaurants(owner_id, name, street_address, city, description, phone, cuisine_type)
VALUES($1, $2, $3, $4, $5, $6, $7)`, [owner_id, name, street_address, city, description, phone, cuisine_type]
    );
    return { restaurant_id: result.rows[0].id, ...data };
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(`, ');
    const values = [...Object.values(data), id];
    await pool.query(`UPDATE Restaurants SET ${fields} WHERE restaurant_id = ? `, values);
    return { restaurant_id: id, ...data };
  },

  remove: async (id) => {
    await pool.query('DELETE FROM Restaurants WHERE restaurant_id = $1', [id]);
  }
};
