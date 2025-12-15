const pool = require('../config/db');

module.exports = {
  findByUserId: async (userId) => {
    const { rows } = await pool.query(
      'SELECT * FROM Customers WHERE user_id = $1',
      [userId]
    );
    return rows[0];
  },

  getAddresses: async (customerId) => {
    const { rows } = await pool.query(
      'SELECT * FROM Customer_Addresses WHERE customer_id = $1 ORDER BY is_default DESC, address_id DESC',
      [customerId]
    );
    return rows;
  },

  update: async (customerId, data) => {
    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), customerId];
    await pool.query(`UPDATE Customers SET ${fields} WHERE customer_id = $${values.length}`, values);
    return { customer_id: customerId, ...data };
  },

  addAddress: async (customerId, addressData) => {
    const { address_label, street_address, city, is_default } = addressData;

    // Use pool.connect() for transactions in pg
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If setting as default, unset other defaults
      if (is_default) {
        await client.query(
          'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = $1',
          [customerId]
        );
      }

      const { rows: result } = await client.query(
        `INSERT INTO Customer_Addresses 
         (customer_id, address_label, street_address, city, is_default) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING address_id`,
        [customerId, address_label, street_address, city, is_default || false]
      );

      await client.query('COMMIT');
      return { address_id: result[0].address_id, ...addressData };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  updateAddress: async (customerId, addressId, addressData) => {
    const { address_label, street_address, city, is_default } = addressData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If setting as default, unset other defaults
      if (is_default) {
        await client.query(
          'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = $1 AND address_id != $2',
          [customerId, addressId]
        );
      }

      await client.query(
        `UPDATE Customer_Addresses 
         SET address_label = $1, street_address = $2, city = $3, is_default = $4
         WHERE address_id = $5 AND customer_id = $6`,
        [address_label, street_address, city, is_default || false, addressId, customerId]
      );

      await client.query('COMMIT');
      return { address_id: addressId, ...addressData };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  deleteAddress: async (customerId, addressId) => {
    await pool.query(
      'DELETE FROM Customer_Addresses WHERE address_id = $1 AND customer_id = $2',
      [addressId, customerId]
    );
  }
};
