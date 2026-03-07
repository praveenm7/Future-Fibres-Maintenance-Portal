const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');
const requireWriteAccess = require('../middleware/writeProtection');

// Helper to map maintenance action database record to frontend model
const mapMaintenanceAction = (record) => ({
    id: record.ActionID.toString(),
    machineId: record.MachineID ? record.MachineID.toString() : null,
    action: record.Action,
    periodicity: record.Periodicity,
    intervalMultiplier: record.IntervalMultiplier ?? 1,
    dayOfWeek: record.DayOfWeek ?? null,
    weekOfMonth: record.WeekOfMonth ?? null,
    quarterMonth: record.QuarterMonth ?? null,
    dayOfMonth: record.DayOfMonth ?? null,
    timeNeeded: record.TimeNeeded,
    maintenanceInCharge: record.MaintenanceInCharge,
    status: record.Status,
    month: record.Month,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate
});

// GET all maintenance actions
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { machineId } = req.query;

        let result;
        if (machineId) {
            result = await pool.request()
                .input('MachineID', sql.Int, machineId)
                .input('EntityID', sql.Int, req.entityId)
                .execute('sp_GetMaintenanceActionsByMachine');
        } else {
            result = await pool.request()
                .input('EntityID', sql.Int, req.entityId)
                .query('SELECT ma.* FROM MaintenanceActions ma INNER JOIN Machines m ON ma.MachineID = m.MachineID WHERE m.EntityID = @EntityID ORDER BY ma.MachineID, ma.ActionID');
        }

        res.json(result.recordset.map(mapMaintenanceAction));
    } catch (err) {
        console.error('Error fetching maintenance actions:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET maintenance action by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT ma.* FROM MaintenanceActions ma INNER JOIN Machines m ON ma.MachineID = m.MachineID WHERE ma.ActionID = @ActionID AND m.EntityID = @EntityID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Maintenance action not found' });
        }

        res.json(mapMaintenanceAction(result.recordset[0]));
    } catch (err) {
        console.error('Error fetching maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new maintenance action
router.post('/', requireWriteAccess, validate(schemas.createMaintenanceAction), async (req, res) => {
    try {
        const {
            machineId, action, periodicity, intervalMultiplier,
            dayOfWeek, weekOfMonth, quarterMonth, dayOfMonth,
            timeNeeded, maintenanceInCharge, status, month
        } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('Action', sql.NVarChar(500), action)
            .input('Periodicity', sql.NVarChar(50), periodicity)
            .input('IntervalMultiplier', sql.Int, intervalMultiplier || 1)
            .input('DayOfWeek', sql.Int, dayOfWeek ?? null)
            .input('WeekOfMonth', sql.Int, weekOfMonth ?? null)
            .input('QuarterMonth', sql.Int, quarterMonth ?? null)
            .input('DayOfMonth', sql.Int, dayOfMonth ?? null)
            .input('TimeNeeded', sql.Int, timeNeeded)
            .input('MaintenanceInCharge', sql.Bit, maintenanceInCharge)
            .input('Status', sql.NVarChar(50), status)
            .input('Month', sql.NVarChar(50), month)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
        INSERT INTO MaintenanceActions (
          MachineID, Action, Periodicity, IntervalMultiplier,
          DayOfWeek, WeekOfMonth, QuarterMonth, DayOfMonth,
          TimeNeeded, MaintenanceInCharge, Status, Month, EntityID
        )
        VALUES (
          @MachineID, @Action, @Periodicity, @IntervalMultiplier,
          @DayOfWeek, @WeekOfMonth, @QuarterMonth, @DayOfMonth,
          @TimeNeeded, @MaintenanceInCharge, @Status, @Month, @EntityID
        );
        SELECT SCOPE_IDENTITY() AS ActionID;
      `);

        const newActionId = result.recordset[0].ActionID;

        const newAction = await pool.request()
            .input('ActionID', sql.Int, newActionId)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM MaintenanceActions WHERE ActionID = @ActionID AND EntityID = @EntityID');

        res.status(201).json(mapMaintenanceAction(newAction.recordset[0]));
    } catch (err) {
        console.error('Error creating maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update maintenance action
router.put('/:id', requireWriteAccess, validate(schemas.updateMaintenanceAction), async (req, res) => {
    try {
        const {
            machineId, action, periodicity, intervalMultiplier,
            dayOfWeek, weekOfMonth, quarterMonth, dayOfMonth,
            timeNeeded, maintenanceInCharge, status, month
        } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .input('MachineID', sql.Int, machineId)
            .input('Action', sql.NVarChar(500), action)
            .input('Periodicity', sql.NVarChar(50), periodicity)
            .input('IntervalMultiplier', sql.Int, intervalMultiplier || 1)
            .input('DayOfWeek', sql.Int, dayOfWeek ?? null)
            .input('WeekOfMonth', sql.Int, weekOfMonth ?? null)
            .input('QuarterMonth', sql.Int, quarterMonth ?? null)
            .input('DayOfMonth', sql.Int, dayOfMonth ?? null)
            .input('TimeNeeded', sql.Int, timeNeeded)
            .input('MaintenanceInCharge', sql.Bit, maintenanceInCharge)
            .input('Status', sql.NVarChar(50), status)
            .input('Month', sql.NVarChar(50), month)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
        UPDATE MaintenanceActions SET
          MachineID = @MachineID,
          Action = @Action,
          Periodicity = @Periodicity,
          IntervalMultiplier = @IntervalMultiplier,
          DayOfWeek = @DayOfWeek,
          WeekOfMonth = @WeekOfMonth,
          QuarterMonth = @QuarterMonth,
          DayOfMonth = @DayOfMonth,
          TimeNeeded = @TimeNeeded,
          MaintenanceInCharge = @MaintenanceInCharge,
          Status = @Status,
          Month = @Month
        WHERE ActionID = @ActionID AND EntityID = @EntityID
      `);

        const updated = await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM MaintenanceActions WHERE ActionID = @ActionID AND EntityID = @EntityID');

        res.json(mapMaintenanceAction(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE maintenance action
router.delete('/:id', requireWriteAccess, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('DELETE FROM MaintenanceActions WHERE ActionID = @ActionID AND EntityID = @EntityID');

        res.json({ message: 'Maintenance action deleted successfully' });
    } catch (err) {
        console.error('Error deleting maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
