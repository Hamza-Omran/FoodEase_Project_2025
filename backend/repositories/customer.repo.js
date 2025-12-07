const pool = require('../config/db');

module.exports = {
  findByUserId: async (userId) => {


    const [rows] = await pool.query(
      'SELECT * FROM Customers WHERE user_id = ?',
      [userId]
    );

    if (rows[0]) {

    } else {

    }

    return rows[0];
  },

  getAddresses: async (customerId) => {


    const [rows] = await pool.query(
      'SELECT * FROM Customer_Addresses WHERE customer_id = ? ORDER BY is_default DESC, address_id DESC',
      [customerId]
    );


    return rows;
  },

  update: async (customerId, data) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), customerId];
    await pool.query(`UPDATE Customers SET ${fields} WHERE customer_id = ?`, values);
    return { customer_id: customerId, ...data };
  },

  addAddress: async (customerId, addressData) => {
    const { address_label, street_address, city, is_default } = addressData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // If setting as default, unset other defaults
      if (is_default) {
        await connection.query(
          'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = ?',
          [customerId]
        );
      }

      const [result] = await connection.query(
        `INSERT INTO Customer_Addresses 
         (customer_id, address_label, street_address, city, is_default) 
         VALUES (?, ?, ?, ?, ?)`,
        [customerId, address_label, street_address, city, is_default || false]
      );

      await connection.commit();
      return { address_id: result.insertId, ...addressData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  updateAddress: async (customerId, addressId, addressData) => {
    const { address_label, street_address, city, is_default } = addressData;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // If setting as default, unset other defaults
      if (is_default) {
        await connection.query(
          'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = ? AND address_id != ?',
          [customerId, addressId]
        );
      }

      await connection.query(
        `UPDATE Customer_Addresses 
         SET address_label = ?, street_address = ?, city = ?, is_default = ?
         WHERE address_id = ? AND customer_id = ?`,
        [address_label, street_address, city, is_default || false, addressId, customerId]
      );

      await connection.commit();
      return { address_id: addressId, ...addressData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  deleteAddress: async (customerId, addressId) => {
    await pool.query(
      'DELETE FROM Customer_Addresses WHERE address_id = ? AND customer_id = ?',
      [addressId, customerId]
    );
  }
};
