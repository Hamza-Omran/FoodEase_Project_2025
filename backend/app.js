const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();


app.use(cors({
  origin: true, // Reflects the request origin, easiest for troubleshooting
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));


app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=31536000');

  next();
}, express.static(path.join(__dirname, 'uploads')));



// Route imports
const authRoutes = require('./routes/auth.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const adminRoutes = require('./routes/admin.routes');
const reportsRoutes = require('./routes/reports.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const searchRoutes = require('./routes/search.routes');
const uploadRoutes = require('./routes/upload.routes');
const driversRoutes = require('./routes/drivers.routes');
const reviewRoutes = require('./routes/review.routes');

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/drivers', driversRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

module.exports = app;
