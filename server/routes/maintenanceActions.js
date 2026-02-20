const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map maintenance action database record to frontend model
const mapMaintenanceAction = (record) => ({
    id: record.ActionID.toString(),
    machineId: record.MachineID ? record.MachineID.toString() : null,
    action: record.Action,
    periodicity: record.Periodicity,
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
                .execute('sp_GetMaintenanceActionsByMachine');
        } else {
            result = await pool.request()
                .query('SELECT * FROM MaintenanceActions ORDER BY MachineID, ActionID');
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
            .query('SELECT * FROM MaintenanceActions WHERE ActionID = @ActionID');

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
router.post('/', validate(schemas.createMaintenanceAction), async (req, res) => {
    try {
        const {
            machineId, action, periodicity, timeNeeded,
            maintenanceInCharge, status, month
        } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('Action', sql.NVarChar(500), action)
            .input('Periodicity', sql.NVarChar(50), periodicity)
            .input('TimeNeeded', sql.Int, timeNeeded)
            .input('MaintenanceInCharge', sql.Bit, maintenanceInCharge)
            .input('Status', sql.NVarChar(50), status)
            .input('Month', sql.NVarChar(50), month)
            .query(`
        INSERT INTO MaintenanceActions (
          MachineID, Action, Periodicity, TimeNeeded,
          MaintenanceInCharge, Status, Month
        )
        VALUES (
          @MachineID, @Action, @Periodicity, @TimeNeeded,
          @MaintenanceInCharge, @Status, @Month
        );
        SELECT SCOPE_IDENTITY() AS ActionID;
      `);

        const newActionId = result.recordset[0].ActionID;

        const newAction = await pool.request()
            .input('ActionID', sql.Int, newActionId)
            .query('SELECT * FROM MaintenanceActions WHERE ActionID = @ActionID');

        res.status(201).json(mapMaintenanceAction(newAction.recordset[0]));
    } catch (err) {
        console.error('Error creating maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update maintenance action
router.put('/:id', validate(schemas.updateMaintenanceAction), async (req, res) => {
    try {
        const {
            machineId, action, periodicity, timeNeeded,
            maintenanceInCharge, status, month
        } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .input('MachineID', sql.Int, machineId)
            .input('Action', sql.NVarChar(500), action)
            .input('Periodicity', sql.NVarChar(50), periodicity)
            .input('TimeNeeded', sql.Int, timeNeeded)
            .input('MaintenanceInCharge', sql.Bit, maintenanceInCharge)
            .input('Status', sql.NVarChar(50), status)
            .input('Month', sql.NVarChar(50), month)
            .query(`
        UPDATE MaintenanceActions SET
          MachineID = @MachineID,
          Action = @Action,
          Periodicity = @Periodicity,
          TimeNeeded = @TimeNeeded,
          MaintenanceInCharge = @MaintenanceInCharge,
          Status = @Status,
          Month = @Month
        WHERE ActionID = @ActionID
      `);

        const updated = await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .query('SELECT * FROM MaintenanceActions WHERE ActionID = @ActionID');

        res.json(mapMaintenanceAction(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE maintenance action
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ActionID', sql.Int, req.params.id)
            .query('DELETE FROM MaintenanceActions WHERE ActionID = @ActionID');

        res.json({ message: 'Maintenance action deleted successfully' });
    } catch (err) {
        console.error('Error deleting maintenance action:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
