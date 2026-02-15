const express = require('express');
const router = express.Router();
const os = require('os');
const { sql, poolPromise } = require('../config/database');

// Server start time for uptime calculation
const serverStartTime = Date.now();

// =============================================
// HELPER: Validate table name against actual DB tables
// =============================================
async function getValidTableNames(pool) {
    const result = await pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = DB_NAME()
        ORDER BY TABLE_NAME
    `);
    return result.recordset.map(r => r.TABLE_NAME);
}

async function isValidTable(pool, tableName) {
    const validTables = await getValidTableNames(pool);
    return validTables.includes(tableName);
}

// Helper: get primary key column for a table
async function getPrimaryKeyColumn(pool, tableName) {
    const result = await pool.request()
        .input('TableName', sql.NVarChar(128), tableName)
        .query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1
            AND TABLE_NAME = @TableName
            ORDER BY ORDINAL_POSITION
        `);
    return result.recordset.length > 0 ? result.recordset[0].COLUMN_NAME : null;
}

// Helper: get column info for a table
async function getColumnInfo(pool, tableName) {
    const result = await pool.request()
        .input('TableName', sql.NVarChar(128), tableName)
        .query(`
            SELECT
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT,
                CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY,
                COLUMNPROPERTY(OBJECT_ID(@TableName), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY
            FROM INFORMATION_SCHEMA.COLUMNS c
            LEFT JOIN (
                SELECT ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                WHERE OBJECTPROPERTY(OBJECT_ID(ku.CONSTRAINT_SCHEMA + '.' + QUOTENAME(ku.CONSTRAINT_NAME)), 'IsPrimaryKey') = 1
                AND ku.TABLE_NAME = @TableName
            ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
            WHERE c.TABLE_NAME = @TableName
            ORDER BY c.ORDINAL_POSITION
        `);
    return result.recordset;
}

// =============================================
// DATABASE EXPLORER ENDPOINTS
// =============================================

// GET /db/tables — List all tables with row counts
router.get('/db/tables', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                t.TABLE_NAME AS name,
                p.rows AS [rowCount]
            FROM INFORMATION_SCHEMA.TABLES t
            INNER JOIN sys.partitions p ON p.object_id = OBJECT_ID(t.TABLE_SCHEMA + '.' + t.TABLE_NAME)
            WHERE t.TABLE_TYPE = 'BASE TABLE'
            AND t.TABLE_CATALOG = DB_NAME()
            AND p.index_id IN (0, 1)
            ORDER BY t.TABLE_NAME
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching tables:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /db/tables/:name/schema — Get column definitions for a table
router.get('/db/tables/:name/schema', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = req.params.name;

        if (!(await isValidTable(pool, tableName))) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const columns = await getColumnInfo(pool, tableName);

        // Get constraints
        const constraints = await pool.request()
            .input('TableName', sql.NVarChar(128), tableName)
            .query(`
                SELECT
                    tc.CONSTRAINT_NAME,
                    tc.CONSTRAINT_TYPE,
                    ku.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                WHERE tc.TABLE_NAME = @TableName
                ORDER BY tc.CONSTRAINT_TYPE, tc.CONSTRAINT_NAME
            `);

        // Get indexes
        const indexes = await pool.request()
            .input('TableName', sql.NVarChar(128), tableName)
            .query(`
                SELECT
                    i.name AS INDEX_NAME,
                    i.type_desc AS INDEX_TYPE,
                    i.is_unique AS IS_UNIQUE,
                    STRING_AGG(c.name, ', ') AS COLUMNS
                FROM sys.indexes i
                INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                WHERE i.object_id = OBJECT_ID(@TableName)
                AND i.name IS NOT NULL
                GROUP BY i.name, i.type_desc, i.is_unique
                ORDER BY i.name
            `);

        res.json({
            tableName,
            columns: columns.map(c => ({
                name: c.COLUMN_NAME,
                dataType: c.DATA_TYPE,
                maxLength: c.CHARACTER_MAXIMUM_LENGTH,
                isNullable: c.IS_NULLABLE === 'YES',
                defaultValue: c.COLUMN_DEFAULT,
                isPrimaryKey: c.IS_PRIMARY_KEY === 1,
                isIdentity: c.IS_IDENTITY === 1
            })),
            constraints: constraints.recordset.map(c => ({
                name: c.CONSTRAINT_NAME,
                type: c.CONSTRAINT_TYPE,
                column: c.COLUMN_NAME
            })),
            indexes: indexes.recordset.map(i => ({
                name: i.INDEX_NAME,
                type: i.INDEX_TYPE,
                isUnique: i.IS_UNIQUE,
                columns: i.COLUMNS
            }))
        });
    } catch (err) {
        console.error('Error fetching table schema:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /db/tables/:name/data — Paginated table data with search
router.get('/db/tables/:name/data', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = req.params.name;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
        const search = req.query.search || '';

        if (!(await isValidTable(pool, tableName))) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const pkColumn = await getPrimaryKeyColumn(pool, tableName);
        const columns = await getColumnInfo(pool, tableName);
        const columnNames = columns.map(c => c.COLUMN_NAME);
        const offset = (page - 1) * pageSize;

        // Build search clause if search term provided
        let whereClause = '';
        if (search) {
            const searchableColumns = columns
                .filter(c => ['nvarchar', 'varchar', 'nchar', 'char', 'ntext', 'text'].includes(c.DATA_TYPE))
                .map(c => `[${c.COLUMN_NAME}]`);

            if (searchableColumns.length > 0) {
                whereClause = `WHERE ${searchableColumns.map(col => `${col} LIKE @Search`).join(' OR ')}`;
            }
        }

        const orderBy = pkColumn ? `[${pkColumn}]` : `[${columnNames[0]}]`;

        // Get total count
        const countRequest = pool.request();
        if (search) {
            countRequest.input('Search', sql.NVarChar(500), `%${search}%`);
        }
        const countResult = await countRequest.query(
            `SELECT COUNT(*) AS total FROM [${tableName}] ${whereClause}`
        );
        const totalRows = countResult.recordset[0].total;

        // Get data page
        const dataRequest = pool.request()
            .input('Offset', sql.Int, offset)
            .input('PageSize', sql.Int, pageSize);
        if (search) {
            dataRequest.input('Search', sql.NVarChar(500), `%${search}%`);
        }
        const dataResult = await dataRequest.query(`
            SELECT * FROM [${tableName}] ${whereClause}
            ORDER BY ${orderBy}
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
        `);

        res.json({
            tableName,
            columns: columnNames,
            data: dataResult.recordset,
            pagination: {
                page,
                pageSize,
                totalRows,
                totalPages: Math.ceil(totalRows / pageSize)
            }
        });
    } catch (err) {
        console.error('Error fetching table data:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /db/tables/:name/rows/:id — Update a row
router.put('/db/tables/:name/rows/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = req.params.name;
        const rowId = req.params.id;
        const updates = req.body;

        if (!(await isValidTable(pool, tableName))) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const pkColumn = await getPrimaryKeyColumn(pool, tableName);
        if (!pkColumn) {
            return res.status(400).json({ error: 'Table has no primary key' });
        }

        const columns = await getColumnInfo(pool, tableName);
        const columnMap = {};
        columns.forEach(c => { columnMap[c.COLUMN_NAME] = c; });

        // Build SET clause from provided fields, skipping PK and identity columns
        const setClauses = [];
        const request = pool.request();
        request.input('PkValue', sql.NVarChar(100), rowId);

        let paramIndex = 0;
        for (const [key, value] of Object.entries(updates)) {
            const col = columnMap[key];
            if (!col || col.IS_PRIMARY_KEY === 1 || col.IS_IDENTITY === 1) continue;

            const paramName = `p${paramIndex++}`;
            setClauses.push(`[${key}] = @${paramName}`);

            // Map SQL types
            if (value === null) {
                request.input(paramName, sql.NVarChar(sql.MAX), null);
            } else if (['int', 'bigint', 'smallint', 'tinyint'].includes(col.DATA_TYPE)) {
                request.input(paramName, sql.Int, value);
            } else if (['decimal', 'numeric', 'money'].includes(col.DATA_TYPE)) {
                request.input(paramName, sql.Decimal(18, 2), value);
            } else if (['bit'].includes(col.DATA_TYPE)) {
                request.input(paramName, sql.Bit, value);
            } else if (['datetime', 'datetime2', 'date'].includes(col.DATA_TYPE)) {
                request.input(paramName, sql.DateTime, value ? new Date(value) : null);
            } else {
                request.input(paramName, sql.NVarChar(sql.MAX), String(value));
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        await request.query(`
            UPDATE [${tableName}] SET ${setClauses.join(', ')}
            WHERE [${pkColumn}] = @PkValue
        `);

        res.json({ message: 'Row updated successfully' });
    } catch (err) {
        console.error('Error updating row:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /db/tables/:name/rows/:id — Delete a row
router.delete('/db/tables/:name/rows/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = req.params.name;
        const rowId = req.params.id;

        if (!(await isValidTable(pool, tableName))) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const pkColumn = await getPrimaryKeyColumn(pool, tableName);
        if (!pkColumn) {
            return res.status(400).json({ error: 'Table has no primary key' });
        }

        const result = await pool.request()
            .input('PkValue', sql.NVarChar(100), rowId)
            .query(`DELETE FROM [${tableName}] WHERE [${pkColumn}] = @PkValue`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Row not found' });
        }

        res.json({ message: 'Row deleted successfully' });
    } catch (err) {
        console.error('Error deleting row:', err);
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// MONITORING ENDPOINTS
// =============================================

// GET /metrics/overview — Admin dashboard overview stats
router.get('/metrics/overview', async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Operators WHERE IsActive = 1) AS totalUsers,
                (SELECT COUNT(*) FROM Machines) AS totalMachines,
                (SELECT COUNT(*) FROM NonConformities) AS totalNCs,
                (SELECT COUNT(*) FROM MaintenanceActions) AS totalActions,
                (SELECT COUNT(*) FROM SpareParts) AS totalSpareParts,
                (SELECT COUNT(*) FROM ApiRequestLogs WHERE CreatedDate >= CAST(GETDATE() AS DATE)) AS requestsToday,
                (SELECT COUNT(*) FROM ErrorLogs WHERE CreatedDate >= CAST(GETDATE() AS DATE)) AS errorsToday
        `);

        const stats = result.recordset[0];
        const uptimeMs = Date.now() - serverStartTime;

        res.json({
            ...stats,
            totalRecords: stats.totalMachines + stats.totalNCs + stats.totalActions + stats.totalSpareParts,
            serverUptime: uptimeMs,
            serverUptimeFormatted: formatUptime(uptimeMs)
        });
    } catch (err) {
        console.error('Error fetching admin overview:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /metrics/api-activity — API request counts grouped by endpoint
router.get('/metrics/api-activity', async (req, res) => {
    try {
        const pool = await poolPromise;
        const hours = Math.min(168, Math.max(1, parseInt(req.query.hours) || 24));

        const result = await pool.request()
            .input('Hours', sql.Int, hours)
            .query(`
                SELECT
                    Method,
                    Path,
                    COUNT(*) AS requestCount,
                    AVG(ResponseTimeMs) AS avgResponseTime,
                    MAX(ResponseTimeMs) AS maxResponseTime,
                    MIN(ResponseTimeMs) AS minResponseTime
                FROM ApiRequestLogs
                WHERE CreatedDate >= DATEADD(HOUR, -@Hours, GETDATE())
                GROUP BY Method, Path
                ORDER BY requestCount DESC
            `);

        res.json(result.recordset.map(r => ({
            method: r.Method,
            path: r.Path,
            requestCount: r.requestCount,
            avgResponseTime: Math.round(r.avgResponseTime),
            maxResponseTime: r.maxResponseTime,
            minResponseTime: r.minResponseTime
        })));
    } catch (err) {
        console.error('Error fetching API activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /metrics/api-timeline — Request counts per hour for charts
router.get('/metrics/api-timeline', async (req, res) => {
    try {
        const pool = await poolPromise;
        const hours = Math.min(168, Math.max(1, parseInt(req.query.hours) || 24));

        const result = await pool.request()
            .input('Hours', sql.Int, hours)
            .query(`
                SELECT
                    DATEADD(HOUR, DATEDIFF(HOUR, 0, CreatedDate), 0) AS hour,
                    COUNT(*) AS requestCount,
                    AVG(ResponseTimeMs) AS avgResponseTime,
                    SUM(CASE WHEN StatusCode >= 400 THEN 1 ELSE 0 END) AS errorCount
                FROM ApiRequestLogs
                WHERE CreatedDate >= DATEADD(HOUR, -@Hours, GETDATE())
                GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, CreatedDate), 0)
                ORDER BY hour
            `);

        res.json(result.recordset.map(r => ({
            hour: r.hour,
            requestCount: r.requestCount,
            avgResponseTime: Math.round(r.avgResponseTime),
            errorCount: r.errorCount
        })));
    } catch (err) {
        console.error('Error fetching API timeline:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /metrics/system-health — Server & DB health metrics
router.get('/metrics/system-health', async (req, res) => {
    try {
        const pool = await poolPromise;
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();

        // Get DB pool stats
        let dbPoolStats = { size: 0, available: 0, pending: 0, borrowed: 0 };
        if (pool.pool) {
            dbPoolStats = {
                size: pool.pool.size || 0,
                available: pool.pool.available || 0,
                pending: pool.pool.pending || 0,
                borrowed: pool.pool.borrowed || 0
            };
        }

        res.json({
            server: {
                uptime: Date.now() - serverStartTime,
                uptimeFormatted: formatUptime(Date.now() - serverStartTime),
                nodeVersion: process.version,
                platform: process.platform,
                pid: process.pid
            },
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
                heapUsedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
                rssMB: Math.round(memUsage.rss / 1024 / 1024),
                heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024)
            },
            os: {
                totalMemory: totalMem,
                freeMemory: freeMem,
                usedMemoryPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
                cpus: os.cpus().length,
                loadAvg: os.loadavg()
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            database: dbPoolStats
        });
    } catch (err) {
        console.error('Error fetching system health:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /metrics/errors — Paginated error log
router.get('/metrics/errors', async (req, res) => {
    try {
        const pool = await poolPromise;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
        const offset = (page - 1) * pageSize;

        const countResult = await pool.request().query('SELECT COUNT(*) AS total FROM ErrorLogs');
        const totalRows = countResult.recordset[0].total;

        const result = await pool.request()
            .input('Offset', sql.Int, offset)
            .input('PageSize', sql.Int, pageSize)
            .query(`
                SELECT * FROM ErrorLogs
                ORDER BY CreatedDate DESC
                OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
            `);

        res.json({
            data: result.recordset.map(r => ({
                id: r.ErrorID,
                path: r.Path,
                method: r.Method,
                errorMessage: r.ErrorMessage,
                stackTrace: r.StackTrace,
                statusCode: r.StatusCode,
                createdDate: r.CreatedDate
            })),
            pagination: { page, pageSize, totalRows, totalPages: Math.ceil(totalRows / pageSize) }
        });
    } catch (err) {
        console.error('Error fetching error logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /metrics/activity-log — Recent API request log
router.get('/metrics/activity-log', async (req, res) => {
    try {
        const pool = await poolPromise;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 50));
        const method = req.query.method || null;
        const offset = (page - 1) * pageSize;

        let whereClause = '';
        const request = pool.request()
            .input('Offset', sql.Int, offset)
            .input('PageSize', sql.Int, pageSize);

        if (method) {
            whereClause = 'WHERE Method = @Method';
            request.input('Method', sql.NVarChar(10), method);
        }

        const countRequest = pool.request();
        if (method) {
            countRequest.input('Method', sql.NVarChar(10), method);
        }
        const countResult = await countRequest.query(`SELECT COUNT(*) AS total FROM ApiRequestLogs ${whereClause}`);
        const totalRows = countResult.recordset[0].total;

        const result = await request.query(`
            SELECT * FROM ApiRequestLogs ${whereClause}
            ORDER BY CreatedDate DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
        `);

        res.json({
            data: result.recordset.map(r => ({
                id: r.LogID,
                method: r.Method,
                path: r.Path,
                statusCode: r.StatusCode,
                responseTimeMs: r.ResponseTimeMs,
                ipAddress: r.IpAddress,
                createdDate: r.CreatedDate
            })),
            pagination: { page, pageSize, totalRows, totalPages: Math.ceil(totalRows / pageSize) }
        });
    } catch (err) {
        console.error('Error fetching activity log:', err);
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// USER MANAGEMENT ENDPOINTS
// =============================================

// GET /users — All operators with their roles
router.get('/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT OperatorID, OperatorName, Email, Department, Role, IsActive, CreatedDate, UpdatedDate
            FROM Operators
            ORDER BY OperatorName
        `);

        res.json(result.recordset.map(r => ({
            id: r.OperatorID,
            name: r.OperatorName,
            email: r.Email,
            department: r.Department,
            role: r.Role,
            isActive: r.IsActive,
            createdDate: r.CreatedDate,
            updatedDate: r.UpdatedDate
        })));
    } catch (err) {
        console.error('Error fetching admin users:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /users/:id/role — Update an operator's role
router.put('/users/:id/role', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { role } = req.body;
        const operatorId = req.params.id;

        const validRoles = ['ADMIN', 'USER', 'VIEWER'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        const result = await pool.request()
            .input('OperatorID', sql.Int, operatorId)
            .input('Role', sql.NVarChar(20), role)
            .query('UPDATE Operators SET Role = @Role WHERE OperatorID = @OperatorID');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Operator not found' });
        }

        res.json({ message: 'Role updated successfully' });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// HELPERS
// =============================================

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
}

module.exports = router;
