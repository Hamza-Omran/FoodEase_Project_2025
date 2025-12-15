const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');

const PORT = env.PORT || 3000;

// Test database connection
console.log('Attempting to connect to database...');
pool.query('SELECT 1')
  .then(() => {
    console.log('Database connection established successfully');

    app.listen(PORT, () => {
      console.log(`Server starting on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });