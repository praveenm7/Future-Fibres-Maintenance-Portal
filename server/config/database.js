const sql = require('mssql');
require('dotenv').config();

// SQL Server configuration
const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'FutureFibresMaintenance',
    port: parseInt(process.env.DB_PORT) || 1433,
    pool: {
        min: 2,
        max: 20,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: false, // Set to true if using Azure
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 30000,
    }
};

// Use Windows Authentication or SQL Server Authentication
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
    config.options.trustedConnection = true;
} else {
    config.user = process.env.DB_USER;
    config.password = process.env.DB_PASSWORD;
}

// Create connection pool with retry logic
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000]; // exponential backoff

async function connectWithRetry(attempt = 1) {
    try {
        const pool = await new sql.ConnectionPool(config).connect();
        console.log('✓ Connected to SQL Server database');
        return pool;
    } catch (err) {
        console.error(`✗ Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
        if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAYS[attempt - 1];
            console.log(`  Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectWithRetry(attempt + 1);
        }
        console.error('✗ All database connection attempts failed. Exiting.');
        process.exit(1);
    }
}

const poolPromise = connectWithRetry();

module.exports = {
    sql,
    poolPromise
};
