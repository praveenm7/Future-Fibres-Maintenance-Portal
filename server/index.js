const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { poolPromise } = require('./config/database');

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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8082',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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
            authMatrix: '/api/auth-matrix'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            status: err.status || 500
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

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    const pool = await poolPromise;
    await pool.close();
    process.exit(0);
});
