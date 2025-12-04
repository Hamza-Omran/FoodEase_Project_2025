const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const upload = require('../middlewares/upload');
const fs = require('fs');
const path = require('path');

// POST /api/v1/restaurants/:restaurantId/menu - create menu item with image
router.post('/restaurants/:restaurantId/menu', 
  auth, 
  upload.single('image'), 
  asyncHandler(async (req, res) => {
    console.log('📝 POST /restaurants/:restaurantId/menu');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { restaurantId } = req.params;
    const { name, description, price, category_id, preparation_time, is_vegetarian, is_available } = req.body;

    // Verify ownership
    const [[rest]] = await pool.query('SELECT owner_id FROM Restaurants WHERE restaurant_id = ?', [restaurantId]);
    if (!rest || rest.owner_id !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const image_url = req.file ? `/uploads/menu-items/${req.file.filename}` : null;

    console.log('💾 Saving menu item with image_url:', image_url);

    const [result] = await pool.query(
      `INSERT INTO Menu_Items 
       (restaurant_id, category_id, name, slug, description, price, image_url, preparation_time, is_vegetarian, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [restaurantId, category_id, name, slug, description, price, image_url, preparation_time || 15, is_vegetarian || 0, is_available !== false ? 1 : 0]
    );

    console.log('✅ Menu item created with ID:', result.insertId);

    res.status(201).json({ 
      menu_item_id: result.insertId, 
      name, 
      price,
      image_url 
    });
  })
);

// PUT /api/v1/menu-items/:id
router.put('/menu-items/:id', 
  auth, 
  upload.single('image'), 
  asyncHandler(async (req, res) => {
    console.log('📝 PUT /menu-items/:id');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { id } = req.params;
    const { name, description, price, is_available } = req.body;

    // Verify ownership
    const [[item]] = await pool.query(
      `SELECT mi.menu_item_id, mi.image_url, r.owner_id
       FROM Menu_Items mi
       JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
       WHERE mi.menu_item_id = ?`,
      [id]
    );
    
    if (!item || item.owner_id !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }

    let image_url = item.image_url;

    // If new image uploaded, delete old and use new
    if (req.file) {
      console.log('🖼️ New image uploaded, deleting old:', item.image_url);
      if (item.image_url && item.image_url.startsWith('/uploads')) {
        const oldPath = path.join(__dirname, '..', item.image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          console.log('🗑️ Deleted old image:', oldPath);
        }
      }
      image_url = `/uploads/menu-items/${req.file.filename}`;
      console.log('💾 New image URL:', image_url);
    }

    await pool.query(
      'UPDATE Menu_Items SET name = ?, description = ?, price = ?, is_available = ?, image_url = ? WHERE menu_item_id = ?',
      [name, description, price, is_available !== false ? 1 : 0, image_url, id]
    );

    console.log('✅ Menu item updated');

    res.json({ success: true, menu_item_id: id, image_url });
  })
);

// DELETE /api/v1/menu-items/:id
router.delete('/menu-items/:id', auth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [[item]] = await pool.query(
    `SELECT mi.menu_item_id, mi.image_url, r.owner_id
     FROM Menu_Items mi
     JOIN Restaurants r ON mi.restaurant_id = r.restaurant_id
     WHERE mi.menu_item_id = ?`,
    [id]
  );
  
  if (!item || item.owner_id !== req.user.id) {
    throw new AppError('Forbidden', 403);
  }

  // Delete image file
  if (item.image_url && item.image_url.startsWith('/uploads')) {
    const imagePath = path.join(__dirname, '..', item.image_url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted image:', imagePath);
    }
  }

  await pool.query('UPDATE Menu_Items SET is_available = 0 WHERE menu_item_id = ?', [id]);
  
  console.log('✅ Menu item soft-deleted');
  
  res.json({ success: true });
}));

module.exports = router;

