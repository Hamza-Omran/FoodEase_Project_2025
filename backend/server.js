const app = require('./app');
const env = require('./config/env');
const pool = require('./config/db');

const PORT = env.PORT || 3000;

// Test database connection
pool.query('SELECT 1')
  .then(() => {


    app.listen(PORT, () => {
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });