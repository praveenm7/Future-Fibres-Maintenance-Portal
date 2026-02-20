const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { generateOccurrences } = require('../utils/occurrences');

// Helper to map execution database record to frontend model
const mapExecution = (record) => ({
    id: record.ExecutionID.toString(),
    actionId: record.ActionID.toString(),
    machineId: record.MachineID.toString(),
    scheduledDate: record.ScheduledDate,
    status: record.Status,
    actualTime: record.ActualTime,
    completedById: record.CompletedByID ? record.CompletedByID.toString() : null,
    completedByName: record.OperatorName || null,
    completedDate: record.CompletedDate,
    notes: record.Notes,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate
});

// GET aggregated execution stats per action (for Plan form/report)
router.get('/stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { machineId } = req.query;

        // Start from actions LEFT JOIN executions so actions with 0 records are included
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId || null)
            .query(`
                SELECT
                    ma.ActionID,
                    ma.Periodicity,
                    ma.Month,
                    COUNT(CASE WHEN me.Status = 'COMPLETED' THEN 1 END) AS TotalCompleted,
                    COUNT(CASE WHEN me.Status = 'SKIPPED' THEN 1 END) AS TotalSkipped,
                    COUNT(me.ExecutionID) AS TotalRecords,
                    MAX(CASE WHEN me.Status = 'COMPLETED' THEN me.CompletedDate END) AS LastCompletedDate,
                    AVG(CASE WHEN me.Status = 'COMPLETED' THEN me.ActualTime END) AS AvgActualTime
                FROM MaintenanceActions ma
                LEFT JOIN MaintenanceExecutions me ON ma.ActionID = me.ActionID
                WHERE (@MachineID IS NULL OR ma.MachineID = @MachineID)
                GROUP BY ma.ActionID, ma.Periodicity, ma.Month
            `);

        // Compute planned occurrences from year start to today
        const now = new Date();
        const yearStart = new Date(Date.UTC(now.getFullYear(), 0, 1));
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        res.json(result.recordset.map(r => {
            const totalPlanned = generateOccurrences(
                { Periodicity: r.Periodicity, Month: r.Month },
                yearStart,
                today
            ).length;

            return {
                actionId: r.ActionID.toString(),
                totalCompleted: r.TotalCompleted,
                totalSkipped: r.TotalSkipped,
                totalRecords: r.TotalRecords,
                totalPlanned,
                lastCompletedDate: r.LastCompletedDate,
                avgActualTime: r.AvgActualTime,
                completionRate: totalPlanned > 0
                    ? Math.round((r.TotalCompleted / totalPlanned) * 100)
                    : 0
            };
        }));
    } catch (err) {
        console.error('Error fetching execution stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET executions for a date range
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({ error: 'Both "from" and "to" query parameters are required' });
        }

        const result = await pool.request()
            .input('FromDate', sql.Date, from)
            .input('ToDate', sql.Date, to)
            .query(`
                SELECT me.*, o.OperatorName
                FROM MaintenanceExecutions me
                LEFT JOIN Operators o ON me.CompletedByID = o.OperatorID
                WHERE me.ScheduledDate >= @FromDate AND me.ScheduledDate <= @ToDate
                ORDER BY me.ScheduledDate, me.ActionID
            `);

        res.json(result.recordset.map(mapExecution));
    } catch (err) {
        console.error('Error fetching maintenance executions:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create or upsert execution (mark complete)
router.post('/', async (req, res) => {
    try {
        const { actionId, machineId, scheduledDate, status, actualTime, completedById, notes } = req.body;

        const pool = await poolPromise;

        // Upsert: insert if not exists, update if exists
        const result = await pool.request()
            .input('ActionID', sql.Int, actionId)
            .input('MachineID', sql.Int, machineId)
            .input('ScheduledDate', sql.Date, scheduledDate)
            .input('Status', sql.NVarChar(50), status || 'COMPLETED')
            .input('ActualTime', sql.Int, actualTime || null)
            .input('CompletedByID', sql.Int, completedById || null)
            .input('CompletedDate', sql.DateTime, status === 'COMPLETED' ? new Date() : null)
            .input('Notes', sql.NVarChar(1000), notes || null)
            .query(`
                MERGE MaintenanceExecutions AS target
                USING (SELECT @ActionID AS ActionID, @ScheduledDate AS ScheduledDate) AS source
                ON target.ActionID = source.ActionID AND target.ScheduledDate = source.ScheduledDate
                WHEN MATCHED THEN
                    UPDATE SET
                        Status = @Status,
                        ActualTime = @ActualTime,
                        CompletedByID = @CompletedByID,
                        CompletedDate = @CompletedDate,
                        Notes = @Notes,
                        UpdatedDate = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (ActionID, MachineID, ScheduledDate, Status, ActualTime, CompletedByID, CompletedDate, Notes)
                    VALUES (@ActionID, @MachineID, @ScheduledDate, @Status, @ActualTime, @CompletedByID, @CompletedDate, @Notes)
                OUTPUT inserted.ExecutionID;
            `);

        const executionId = result.recordset[0].ExecutionID;

        // Fetch the full record with operator name
        const execution = await pool.request()
            .input('ExecutionID', sql.Int, executionId)
            .query(`
                SELECT me.*, o.OperatorName
                FROM MaintenanceExecutions me
                LEFT JOIN Operators o ON me.CompletedByID = o.OperatorID
                WHERE me.ExecutionID = @ExecutionID
            `);

        res.status(201).json(mapExecution(execution.recordset[0]));
    } catch (err) {
        console.error('Error upserting maintenance execution:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update execution
router.put('/:id', async (req, res) => {
    try {
        const { status, actualTime, completedById, notes } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('ExecutionID', sql.Int, req.params.id)
            .input('Status', sql.NVarChar(50), status)
            .input('ActualTime', sql.Int, actualTime || null)
            .input('CompletedByID', sql.Int, completedById || null)
            .input('CompletedDate', sql.DateTime, status === 'COMPLETED' ? new Date() : null)
            .input('Notes', sql.NVarChar(1000), notes || null)
            .query(`
                UPDATE MaintenanceExecutions SET
                    Status = @Status,
                    ActualTime = @ActualTime,
                    CompletedByID = @CompletedByID,
                    CompletedDate = @CompletedDate,
                    Notes = @Notes,
                    UpdatedDate = GETDATE()
                WHERE ExecutionID = @ExecutionID
            `);

        const updated = await pool.request()
            .input('ExecutionID', sql.Int, req.params.id)
            .query(`
                SELECT me.*, o.OperatorName
                FROM MaintenanceExecutions me
                LEFT JOIN Operators o ON me.CompletedByID = o.OperatorID
                WHERE me.ExecutionID = @ExecutionID
            `);

        if (updated.recordset.length === 0) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        res.json(mapExecution(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating maintenance execution:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE execution (revert to no record = pending)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ExecutionID', sql.Int, req.params.id)
            .query('DELETE FROM MaintenanceExecutions WHERE ExecutionID = @ExecutionID');

        res.json({ message: 'Execution deleted successfully' });
    } catch (err) {
        console.error('Error deleting maintenance execution:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
