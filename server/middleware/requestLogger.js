const { sql, poolPromise } = require('../config/database');

// Paths to skip logging (avoid recursive logging of admin metrics)
const SKIP_PATHS = ['/api/admin/metrics', '/api/health'];

function requestLogger(req, res, next) {
    // Skip logging for admin metrics and health checks
    if (SKIP_PATHS.some(p => req.path.startsWith(p))) {
        return next();
    }

    const startTime = Date.now();

    res.on('finish', () => {
        const responseTimeMs = Date.now() - startTime;
        const method = req.method;
        const path = req.originalUrl || req.path;
        const statusCode = res.statusCode;
        const ipAddress = req.ip || req.connection?.remoteAddress || null;

        // Truncate request body for non-GET requests (max 2000 chars)
        let requestBody = null;
        if (method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
            const bodyStr = JSON.stringify(req.body);
            requestBody = bodyStr.length > 2000 ? bodyStr.substring(0, 2000) : bodyStr;
        }

        // Async write — don't block the response
        (async () => {
            try {
                const pool = await poolPromise;
                await pool.request()
                    .input('Method', sql.NVarChar(10), method)
                    .input('Path', sql.NVarChar(500), path.substring(0, 500))
                    .input('StatusCode', sql.Int, statusCode)
                    .input('ResponseTimeMs', sql.Int, responseTimeMs)
                    .input('RequestBody', sql.NVarChar(sql.MAX), requestBody)
                    .input('IpAddress', sql.NVarChar(50), ipAddress)
                    .query(`
                        INSERT INTO ApiRequestLogs (Method, Path, StatusCode, ResponseTimeMs, RequestBody, IpAddress)
                        VALUES (@Method, @Path, @StatusCode, @ResponseTimeMs, @RequestBody, @IpAddress)
                    `);
            } catch (err) {
                // Don't crash the server if logging fails
                console.error('Request logger error:', err.message);
            }
        })();
    });

    next();
}

module.exports = requestLogger;
