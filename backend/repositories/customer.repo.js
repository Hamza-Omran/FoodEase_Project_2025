const pool = require('../config/db');

module.exports = {
  findByUserId: async (userId) => {


    const { rows } = await pool.query(
      'SELECT * FROM Customers WHERE user_id = $1',
      [userId]
    );

    if (rows[0]) {

    } else {

    }

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
    const fields = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(`, ');
    const values = [...Object.values(data), customerId];
    await pool.query(`UPDATE Customers SET ${fields} WHERE customer_id = $${values.length}`, values);
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
          'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = $1',
          [customerId]
        );
      }

      const { rows: result } = await connection.query(
        `INSERT INTO Customer_Addresses 
         (customer_id, address_label, street_address, city, is_default) 
         VALUES ($1, $2, $3, $4, $5)
         RETURNING address_id`,
        [customerId, address_label, street_address, city, is_default || false]
      );

      await connection.commit();
      return { address_id: result[0].address_id, ...addressData };
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
          'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = $1 AND address_id != $2',
          [customerId, addressId]
        );
      }

      await connection.query(
        `UPDATE Customer_Addresses 
         SET address_label = $1, street_address = $2, city = $3, is_default = $4
         WHERE address_id = $5 AND customer_id = $6`,
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
      'DELETE FROM Customer_Addresses WHERE address_id = $1 AND customer_id = $2',
      [addressId, customerId]
    );
  }
};
