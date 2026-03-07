const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');
const requireWriteAccess = require('../middleware/writeProtection');
const { buildQuery, QueryBuilderError } = require('../utils/queryBuilder');

// GET all custom reports for current entity (user's private + shared)
router.get('/', async (req, res) => {
    try {
        const operatorId = parseInt(req.headers['x-operator-id'], 10);
        if (!operatorId) {
            return res.status(400).json({ error: 'X-Operator-ID header is required' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('EntityID', sql.Int, req.entityId)
            .input('OperatorID', sql.Int, operatorId)
            .query(`
                SELECT cr.ReportID, cr.ReportName, cr.[Description], cr.[Definition],
                       cr.OwnerOperatorID, cr.IsShared, cr.EntityID, cr.CreatedDate, cr.UpdatedDate,
                       o.OperatorName AS OwnerName
                FROM CustomReports cr
                LEFT JOIN Operators o ON cr.OwnerOperatorID = o.OperatorID
                WHERE cr.EntityID = @EntityID
                  AND (cr.OwnerOperatorID = @OperatorID OR cr.IsShared = 1)
                ORDER BY cr.UpdatedDate DESC
            `);

        const reports = result.recordset.map(r => ({
            id: r.ReportID,
            reportName: r.ReportName,
            description: r.Description,
            definition: JSON.parse(r.Definition),
            ownerOperatorId: r.OwnerOperatorID,
            ownerName: r.OwnerName || '',
            isShared: !!r.IsShared,
            entityId: r.EntityID,
            createdDate: r.CreatedDate,
            updatedDate: r.UpdatedDate,
        }));

        res.json(reports);
    } catch (err) {
        console.error('Error fetching custom reports:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET single custom report
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ReportID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                SELECT cr.ReportID, cr.ReportName, cr.[Description], cr.[Definition],
                       cr.OwnerOperatorID, cr.IsShared, cr.EntityID, cr.CreatedDate, cr.UpdatedDate,
                       o.OperatorName AS OwnerName
                FROM CustomReports cr
                LEFT JOIN Operators o ON cr.OwnerOperatorID = o.OperatorID
                WHERE cr.ReportID = @ReportID AND cr.EntityID = @EntityID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const r = result.recordset[0];
        res.json({
            id: r.ReportID,
            reportName: r.ReportName,
            description: r.Description,
            definition: JSON.parse(r.Definition),
            ownerOperatorId: r.OwnerOperatorID,
            ownerName: r.OwnerName || '',
            isShared: !!r.IsShared,
            entityId: r.EntityID,
            createdDate: r.CreatedDate,
            updatedDate: r.UpdatedDate,
        });
    } catch (err) {
        console.error('Error fetching custom report:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create a new custom report
router.post('/', requireWriteAccess, validate(schemas.createCustomReport), async (req, res) => {
    try {
        const { reportName, description, definition, ownerOperatorId, isShared } = req.body;

        // Validate the definition can produce a valid query (dry-run)
        buildQuery(definition, req.entityId, 1);

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ReportName', sql.NVarChar(200), reportName)
            .input('Description', sql.NVarChar(1000), description || null)
            .input('Definition', sql.NVarChar(sql.MAX), JSON.stringify(definition))
            .input('OwnerOperatorID', sql.Int, ownerOperatorId)
            .input('IsShared', sql.Bit, isShared ? 1 : 0)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                INSERT INTO CustomReports (ReportName, [Description], [Definition], OwnerOperatorID, IsShared, EntityID)
                OUTPUT INSERTED.ReportID, INSERTED.CreatedDate
                VALUES (@ReportName, @Description, @Definition, @OwnerOperatorID, @IsShared, @EntityID)
            `);

        const row = result.recordset[0];
        res.status(201).json({
            id: row.ReportID,
            reportName,
            description: description || null,
            definition,
            ownerOperatorId,
            isShared: !!isShared,
            entityId: req.entityId,
            createdDate: row.CreatedDate,
        });
    } catch (err) {
        if (err instanceof QueryBuilderError) {
            return res.status(400).json({ error: err.message });
        }
        console.error('Error creating custom report:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update a custom report (owner only)
router.put('/:id', requireWriteAccess, validate(schemas.updateCustomReport), async (req, res) => {
    try {
        const { reportName, description, definition, isShared } = req.body;
        const operatorId = parseInt(req.headers['x-operator-id'], 10);

        // Validate definition if provided
        if (definition) {
            buildQuery(definition, req.entityId, 1);
        }

        const pool = await poolPromise;

        // Check ownership
        const existing = await pool.request()
            .input('ReportID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT OwnerOperatorID FROM CustomReports WHERE ReportID = @ReportID AND EntityID = @EntityID');

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        if (existing.recordset[0].OwnerOperatorID !== operatorId) {
            return res.status(403).json({ error: 'Only the report owner can update this report' });
        }

        // Build dynamic SET clause
        const setParts = [];
        const request = pool.request()
            .input('ReportID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId);

        if (reportName !== undefined) {
            setParts.push('ReportName = @ReportName');
            request.input('ReportName', sql.NVarChar(200), reportName);
        }
        if (description !== undefined) {
            setParts.push('[Description] = @Description');
            request.input('Description', sql.NVarChar(1000), description || null);
        }
        if (definition !== undefined) {
            setParts.push('[Definition] = @Definition');
            request.input('Definition', sql.NVarChar(sql.MAX), JSON.stringify(definition));
        }
        if (isShared !== undefined) {
            setParts.push('IsShared = @IsShared');
            request.input('IsShared', sql.Bit, isShared ? 1 : 0);
        }

        if (setParts.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await request.query(`
            UPDATE CustomReports SET ${setParts.join(', ')}
            WHERE ReportID = @ReportID AND EntityID = @EntityID
        `);

        res.json({ message: 'Report updated successfully' });
    } catch (err) {
        if (err instanceof QueryBuilderError) {
            return res.status(400).json({ error: err.message });
        }
        console.error('Error updating custom report:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE a custom report (owner only)
router.delete('/:id', requireWriteAccess, async (req, res) => {
    try {
        const operatorId = parseInt(req.headers['x-operator-id'], 10);
        if (!operatorId) {
            return res.status(400).json({ error: 'X-Operator-ID header is required' });
        }

        const pool = await poolPromise;

        const existing = await pool.request()
            .input('ReportID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT OwnerOperatorID FROM CustomReports WHERE ReportID = @ReportID AND EntityID = @EntityID');

        if (existing.recordset.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        if (existing.recordset[0].OwnerOperatorID !== operatorId) {
            return res.status(403).json({ error: 'Only the report owner can delete this report' });
        }

        await pool.request()
            .input('ReportID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('DELETE FROM CustomReports WHERE ReportID = @ReportID AND EntityID = @EntityID');

        res.status(204).send();
    } catch (err) {
        console.error('Error deleting custom report:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST execute a saved report
router.post('/:id/execute', async (req, res) => {
    try {
        const requestLimit = req.body.limit;

        const pool = await poolPromise;
        const reportResult = await pool.request()
            .input('ReportID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT [Definition] FROM CustomReports WHERE ReportID = @ReportID AND EntityID = @EntityID');

        if (reportResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const definition = JSON.parse(reportResult.recordset[0].Definition);
        const { sql: query, parameters } = buildQuery(definition, req.entityId, requestLimit);

        const request = pool.request();
        for (const param of parameters) {
            request.input(param.name, sql[param.type], param.value);
        }

        const startTime = Date.now();
        const result = await request.query(query);
        const executionMs = Date.now() - startTime;

        res.json({
            rows: result.recordset,
            rowCount: result.recordset.length,
            executionMs,
        });
    } catch (err) {
        if (err instanceof QueryBuilderError) {
            return res.status(400).json({ error: err.message });
        }
        console.error('Error executing custom report:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST preview an unsaved report definition
router.post('/preview', async (req, res) => {
    try {
        const { definition, limit } = req.body;
        if (!definition) {
            return res.status(400).json({ error: 'definition is required' });
        }

        const { sql: query, parameters } = buildQuery(definition, req.entityId, limit);

        const pool = await poolPromise;
        const request = pool.request();
        for (const param of parameters) {
            request.input(param.name, sql[param.type], param.value);
        }

        const startTime = Date.now();
        const result = await request.query(query);
        const executionMs = Date.now() - startTime;

        res.json({
            rows: result.recordset,
            rowCount: result.recordset.length,
            executionMs,
            generatedSql: process.env.NODE_ENV === 'development' ? query : undefined,
        });
    } catch (err) {
        if (err instanceof QueryBuilderError) {
            return res.status(400).json({ error: err.message });
        }
        console.error('Error previewing custom report:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
