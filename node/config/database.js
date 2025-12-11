// node/config/database.js
// Database connection pool for Node.js

const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sakaybravo',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Convert pool to use promises
const promisePool = pool.promise();

// Test database connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error(' Database connection failed:', err.message);
        console.error('   Please check:');
        console.error('   - WAMP MySQL is running');
        console.error('   - Database credentials in .env');
        console.error('   - Database "sakaybravo" exists');
        return;
    }
    console.log(' Database connected successfully');
    console.log(`   Database: ${process.env.DB_NAME || 'sakaybravo'}`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

module.exports = promisePool;
module.exports.pool = pool;  // Export the original pool for advanced usage if needed