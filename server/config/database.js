const sql = require('mssql');
require('dotenv').config();

// SQL Server configuration
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'FutureFibresMaintenance',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false, // Set to true if using Azure
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

// Use Windows Authentication or SQL Server Authentication
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
    config.options.trustedConnection = true;
} else {
    config.user = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
}

// Create connection pool
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✓ Connected to SQL Server database');
        return pool;
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};
