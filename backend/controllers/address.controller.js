const customerRepo = require('../repositories/customer.repo');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Get customer addresses
exports.getAddresses = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ensure customer can only access their own addresses
    if (req.user.role === 'customer' && req.user.id !== parseInt(id)) {
      return next(new AppError('Forbidden', 403));
    }

    const customer = await customerRepo.findByUserId(id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const addresses = await customerRepo.getAddresses(customer.customer_id);
    res.json(addresses);
  } catch (err) {
    next(err);
  }
};

// Add new address
exports.addAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ensure customer can only add addresses to their own account
    if (req.user.role === 'customer' && req.user.id !== parseInt(id)) {
      return next(new AppError('Forbidden', 403));
    }

    const customer = await customerRepo.findByUserId(id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { street_address, city, state, is_default } = req.body;

    // If setting as default, unset other default addresses BEFORE insert
    if (is_default) {
      await pool.query(
        'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id = ',
        [customer.customer_id]
      );
    }

    // Now insert the new address
    const { rows: result } = await pool.query(
      `INSERT INTO Customer_Addresses 
       (customer_id, street_address, city, state, is_default) 
       VALUES (, ?, ?, ?, ?)`,
      [customer.customer_id, street_address, city, state, is_default || false]
    );

    res.status(201).json({
      address_id: result.insertId,
      customer_id: customer.customer_id,
      street_address,
      city,
      state,
      is_default: is_default || false
    });
  } catch (err) {
    next(err);
  }
};

// Update address
exports.updateAddress = async (req, res, next) => {
  try {
    const { id, addressId } = req.params;

    // Ensure customer can only update their own addresses
    if (req.user.role === 'customer' && req.user.id !== parseInt(id)) {
      return next(new AppError('Forbidden', 403));
    }

    const customer = await customerRepo.findByUserId(id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { rows: addresses } = await pool.query(
      'SELECT * FROM Customer_Addresses WHERE address_id =  AND customer_id = ?',
      [addressId, customer.customer_id]
    );

    if (!addresses[0]) {
      return next(new AppError('Address not found', 404));
    }

    const { street_address, city, state, is_default } = req.body;

    // If setting as default, unset other default addresses
    if (is_default) {
      await pool.query(
        'UPDATE Customer_Addresses SET is_default = FALSE WHERE customer_id =  AND address_id != ?',
        [customer.customer_id, addressId]
      );
    }

    await pool.query(
      `UPDATE Customer_Addresses 
       SET street_address = , city = ?, state = ?, is_default = ?
       WHERE address_id = ? AND customer_id = ?`,
      [street_address, city, state, is_default || false, addressId, customer.customer_id]
    );

    res.json({ success: true, address_id: addressId });
  } catch (err) {
    next(err);
  }
};

// Delete address
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id, addressId } = req.params;

    // Ensure customer can only delete their own addresses
    if (req.user.role === 'customer' && req.user.id !== parseInt(id)) {
      return next(new AppError('Forbidden', 403));
    }

    const customer = await customerRepo.findByUserId(id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { rows: result } = await pool.query(
      'DELETE FROM Customer_Addresses WHERE address_id =  AND customer_id = ?',
      [addressId, customer.customer_id]
    );

    if (result.affectedRows === 0) {
      return next(new AppError('Address not found', 404));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

