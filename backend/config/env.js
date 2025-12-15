require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production_12345',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'NoProblem123!',
  DB_NAME: process.env.DB_NAME || 'food_ordering_platform'
};