const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sql, poolPromise } = require('./config/database');

// Import routes
const machinesRouter = require('./routes/machines');
const maintenanceActionsRouter = require('./routes/maintenanceActions');
const nonConformitiesRouter = require('./routes/nonConformities');
const ncCommentsRouter = require('./routes/ncComments');
const sparePartsRouter = require('./routes/spareParts');
const operatorsRouter = require('./routes/operators');
const listOptionsRouter = require('./routes/listOptions');
const dashboardRouter = require('./routes/dashboard');
const authMatrixRouter = require('./routes/authMatrix');
const adminRouter = require('./routes/admin');
const dashboardsRouter = require('./routes/dashboards');
const documentsRouter = require('./routes/documents');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8082',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (console)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Request logger middleware (database)
app.use(requestLogger);

// Routes
app.use('/api/machines', machinesRouter);
app.use('/api/maintenance-actions', maintenanceActionsRouter);
app.use('/api/non-conformities', nonConformitiesRouter);
app.use('/api/nc-comments', ncCommentsRouter);
app.use('/api/spare-parts', sparePartsRouter);
app.use('/api/operators', operatorsRouter);
app.use('/api/list-options', listOptionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/auth-matrix', authMatrixRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboards', dashboardsRouter);
app.use('/api/documents', documentsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Future Fibres Maintenance API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Future Fibres Maintenance Portal API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            machines: '/api/machines',
            maintenanceActions: '/api/maintenance-actions',
            nonConformities: '/api/non-conformities',
            ncComments: '/api/nc-comments',
            spareParts: '/api/spare-parts',
            operators: '/api/operators',
            listOptions: '/api/list-options',
            dashboard: '/api/dashboard',
            authMatrix: '/api/auth-matrix',
            admin: '/api/admin',
            dashboards: '/api/dashboards'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const statusCode = err.status || 500;

    // Log error to database asynchronously
    (async () => {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('Path', sql.NVarChar(500), req.originalUrl || req.path)
                .input('Method', sql.NVarChar(10), req.method)
                .input('ErrorMessage', sql.NVarChar(sql.MAX), err.message || 'Internal server error')
                .input('StackTrace', sql.NVarChar(sql.MAX), err.stack || null)
                .input('StatusCode', sql.Int, statusCode)
                .query(`
                    INSERT INTO ErrorLogs (Path, Method, ErrorMessage, StackTrace, StatusCode, CreatedDate)
                    VALUES (@Path, @Method, @ErrorMessage, @StackTrace, @StatusCode, GETUTCDATE())
                `);
        } catch (logErr) {
            console.error('Error logging to database:', logErr.message);
        }
    })();

    res.status(statusCode).json({
        error: {
            message: err.message || 'Internal server error',
            status: statusCode
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Route not found',
            status: 404
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('Future Fibres Maintenance Portal API Server');
    console.log('='.repeat(50));
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ API available at http://localhost:${PORT}`);
    console.log(`✓ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:8082'}`);
    console.log('='.repeat(50));
});

// One-time migration: shift existing log timestamps from server-local to UTC
async function migrateLogsToUTC() {
    try {
        const pool = await poolPromise;

        // Create migrations tracking table if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_Migrations' AND schema_id = SCHEMA_ID('dbo'))
            CREATE TABLE dbo._Migrations (
                Name NVARCHAR(200) PRIMARY KEY,
                ExecutedDate DATETIME DEFAULT GETUTCDATE()
            )
        `);

        // Check if this migration has already run
        const check = await pool.request()
            .input('Name', sql.NVarChar(200), 'ConvertLogsToUTC')
            .query('SELECT 1 FROM dbo._Migrations WHERE Name = @Name');

        if (check.recordset.length > 0) return; // Already migrated

        // Get server's UTC offset in minutes
        const offsetResult = await pool.request().query(
            'SELECT DATEPART(TZOFFSET, SYSDATETIMEOFFSET()) AS offsetMinutes'
        );
        const offsetMinutes = offsetResult.recordset[0].offsetMinutes;

        if (offsetMinutes !== 0) {
            await pool.request()
                .input('Offset', sql.Int, offsetMinutes)
                .query(`
                    UPDATE ApiRequestLogs SET CreatedDate = DATEADD(MINUTE, -@Offset, CreatedDate);
                    UPDATE ErrorLogs SET CreatedDate = DATEADD(MINUTE, -@Offset, CreatedDate);
                `);
            console.log(`[Migration] Shifted log timestamps by -${offsetMinutes} minutes to UTC`);
        } else {
            console.log('[Migration] Server is already in UTC, no shift needed');
        }

        // Mark migration as complete
        await pool.request()
            .input('Name', sql.NVarChar(200), 'ConvertLogsToUTC')
            .query('INSERT INTO dbo._Migrations (Name) VALUES (@Name)');
    } catch (err) {
        console.error('[Migration] Failed:', err.message);
    }
}

// Auto-cleanup: delete logs older than 60 days
async function cleanupOldLogs() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            DELETE FROM ApiRequestLogs WHERE CreatedDate < DATEADD(DAY, -60, GETUTCDATE());
            DELETE FROM ErrorLogs WHERE CreatedDate < DATEADD(DAY, -60, GETUTCDATE());
        `);
        console.log('[Cleanup] Old logs (>60 days) deleted');
    } catch (err) {
        console.error('[Cleanup] Failed:', err.message);
    }
}

// Run migrations and cleanup on startup
migrateLogsToUTC();
cleanupOldLogs();
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    const pool = await poolPromise;
    await pool.close();
    process.exit(0);
});
