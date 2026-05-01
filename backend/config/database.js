const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * Sequelize instance connected to PostgreSQL.
 * All configuration is pulled from environment variables (.env).
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,      // maximum number of connections in pool
      min: 0,      // minimum number of connections in pool
      acquire: 30000, // max ms to acquire a connection before throwing error
      idle: 10000,    // ms a connection can be idle before being released
    },
  }
);

module.exports = sequelize;
