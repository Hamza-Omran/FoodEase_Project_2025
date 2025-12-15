const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Get all menu items for a restaurant
exports.getMenuItems = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    const { rows: items } = await pool.query(`
      SELECT 
        mi.*,
        mc.name as category_name
      FROM Menu_Items mi
      LEFT JOIN Menu_Categories mc ON mi.category_id = mc.category_id
      WHERE mi.restaurant_id = $1
      ORDER BY mc.category_id, mi.name
    `, [restaurantId]);

    res.json(items);
  } catch (err) {
    next(err);
  }
};

// Get categories for a restaurant
exports.getCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;

    const { rows: categories } = await pool.query('SELECT * FROM Menu_Categories WHERE restaurant_id = $1 ORDER BY category_id', [restaurantId]
    );

    res.json(categories);
  } catch (err) {
    next(err);
  }
};

// Create category
exports.createCategory = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { name, description } = req.body;

    // Verify restaurant ownership
    const { rows: restaurants } = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = $1', [restaurantId]
    );

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurants[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    const { rows: result } = await pool.query('INSERT INTO Menu_Categories (restaurant_id, name, description) VALUES ($1, $2, $3)', [restaurantId, name, description || null]
    );

    res.status(201).json({
      category_id: result.rows[0].id,
      restaurant_id: restaurantId,
      name,
      description
    });
  } catch (err) {
    next(err);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    // Verify ownership
    const { rows: categories } = await pool.query(`
      SELECT mc.*, r.owner_id
      FROM Menu_Categories mc
      JOIN Restaurants r ON mc.restaurant_id = r.restaurant_id
      WHERE mc.category_id = $1
    `, [categoryId]);

    if (!categories[0]) {
      return next(new AppError('Category not found', 404));
    }

    if (categories[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }


    if (fields.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    values.push(categoryId);

    await pool.query(
      `UPDATE Menu_Categories SET ${fields.join(`, ')} WHERE category_id = ?`,
      values
    );

    res.json({ success: true, category_id: categoryId });
  } catch (err) {
    next(err);
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    // Verify ownership
    const { rows: categories } = await pool.query(`
      SELECT mc.*, r.owner_id
      FROM Menu_Categories mc
      JOIN Restaurants r ON mc.restaurant_id = r.restaurant_id
      WHERE mc.category_id = $1
    `, [categoryId]);

    if (!categories[0]) {
      return next(new AppError('Category not found', 404));
    }

    if (categories[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    // Check if category has items
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM Menu_Items WHERE category_id = $1', [categoryId]
    );

    if (count > 0) {
      return next(new AppError('Cannot delete category with items. Move items to another category first.', 400));
    }

    await pool.query('DELETE FROM Menu_Categories WHERE category_id = $1', [categoryId]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Add menu item
exports.addMenuItem = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { name, description, price, category_id, image_url, preparation_time, is_available } = req.body;

    // Verify restaurant ownership
    const { rows: restaurants } = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = $1', [restaurantId]
    );

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurants[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }



    const { rows: result } = await pool.query(`
      INSERT INTO Menu_Items 
      (restaurant_id, category_id, name, description, price, image_url, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      restaurantId,
      category_id || null,
      name,
      description || null,
      price,
      image_url || null,
      is_available !== undefined ? is_available : true
    ]);

    res.status(201).json({
      menu_item_id: result.rows[0].id,
      restaurant_id: restaurantId,
      name,
      price,
      category_id
    });
  } catch (err) {
    next(err);
  }
};

// Update menu item
exports.updateMenuItem = async (req, res, next) => {
  try {
    const { restaurantId, itemId } = req.params;
    const updates = req.body;

    // Verify restaurant ownership
    const { rows: restaurants } = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = $1', [restaurantId]
    );

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurants[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    // Verify menu item belongs to restaurant
    const { rows: items } = await pool.query('SELECT * FROM Menu_Items WHERE menu_item_id = $1 AND restaurant_id = $2', [itemId, restaurantId]
    );

    if (!items[0]) {
      return next(new AppError('Menu item not found', 404));
    }

    // Build update query
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.price !== undefined) {
      fields.push('price = ?');
      values.push(updates.price);
    }


    if (updates.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(updates.category_id);
    }
    if (updates.is_available !== undefined) {
      fields.push('is_available = ?');
      values.push(updates.is_available);
    }
    if (updates.image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(updates.image_url);
    }

    if (fields.length === 0) {
      return next(new AppError('No fields to update', 400));
    }

    values.push(itemId);

    await pool.query(
      `UPDATE Menu_Items SET ${fields.join(`, ')} WHERE menu_item_id = ?`,
      values
    );

    // Get updated item
    const { rows: updatedItem } = await pool.query('SELECT * FROM Menu_Items WHERE menu_item_id = $1', [itemId]
    );

    res.json(updatedItem[0]);
  } catch (err) {
    next(err);
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res, next) => {
  try {
    const { restaurantId, itemId } = req.params;

    // Verify restaurant ownership
    const { rows: restaurants } = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = $1', [restaurantId]
    );

    if (!restaurants[0]) {
      return next(new AppError('Restaurant not found', 404));
    }

    if (restaurants[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    const { rows: result } = await pool.query('DELETE FROM Menu_Items WHERE menu_item_id = $1 AND restaurant_id = $2', [itemId, restaurantId]
    );

    if (result.affectedRows === 0) {
      return next(new AppError('Menu item not found', 404));
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Update inventory
exports.updateInventory = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { stock_quantity, low_stock_threshold } = req.body;

    // Verify ownership through menu item
    const { rows: items } = await pool.query(`
      SELECT mi.*, r.owner_id
      FROM Menu_Items mi
      JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
      WHERE mi.menu_item_id = $1
    `, [itemId]);

    if (!items[0]) {
      return next(new AppError('Menu item not found', 404));
    }

    if (items[0].owner_id !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }

    // Update or insert inventory
    await pool.query(`
      INSERT INTO Menu_Item_Inventory (menu_item_id, stock_quantity, low_stock_threshold, last_restocked_at, last_restocked_quantity)
      VALUES ($1, $2, $3, NOW(), $4)
      ON DUPLICATE KEY UPDATE
        stock_quantity = VALUES(stock_quantity),
        low_stock_threshold = VALUES(low_stock_threshold),
        last_restocked_at = NOW(),
        last_restocked_quantity = VALUES(last_restocked_quantity)
    `, [itemId, stock_quantity, low_stock_threshold || 10, stock_quantity]);

    res.json({ success: true, stock_quantity });
  } catch (err) {
    next(err);
  }
};

