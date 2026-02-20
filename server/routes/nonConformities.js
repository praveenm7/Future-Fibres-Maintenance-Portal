const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map NC database record to frontend model
const mapNC = (record) => ({
    id: record.NCID.toString(),
    ncCode: record.NCCode,
    machineId: record.MachineID ? record.MachineID.toString() : null,
    area: record.Area,
    maintenanceOperatorId: record.MaintenanceOperatorID ? record.MaintenanceOperatorID.toString() : null,
    maintenanceOperatorName: record.MaintenanceOperatorName,
    creationDate: record.CreationDate,
    initiationDate: record.InitiationDate,
    finishDate: record.FinishDate,
    status: record.Status,
    priority: record.Priority,
    category: record.Category,
    machineCode: record.MachineCode,
    machineDescription: record.MachineDescription,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate
});

// GET all non-conformities
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetNonConformitiesWithDetails');

        res.json(result.recordset.map(mapNC));
    } catch (err) {
        console.error('Error fetching non-conformities:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET non-conformity by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('NCID', sql.Int, req.params.id)
            .query(`
        SELECT nc.*, m.FinalCode AS MachineCode, m.Description AS MachineDescription,
               o.OperatorName AS MaintenanceOperatorName
        FROM NonConformities nc
        INNER JOIN Machines m ON nc.MachineID = m.MachineID
        LEFT JOIN Operators o ON nc.MaintenanceOperatorID = o.OperatorID
        WHERE nc.NCID = @NCID
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Non-conformity not found' });
        }

        res.json(mapNC(result.recordset[0]));
    } catch (err) {
        console.error('Error fetching non-conformity:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new non-conformity
router.post('/', validate(schemas.createNonConformity), async (req, res) => {
    try {
        const {
            machineId, area, maintenanceOperatorId, creationDate,
            status, priority, category
        } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('Area', sql.NVarChar(100), area)
            .input('MaintenanceOperatorID', sql.Int, maintenanceOperatorId)
            .input('CreationDate', sql.Date, creationDate || new Date())
            .input('Status', sql.NVarChar(50), status)
            .input('Priority', sql.Int, priority)
            .input('Category', sql.NVarChar(100), category)
            .execute('sp_CreateNonConformity');

        const newNCID = result.recordset[0].NCID;

        const newNC = await pool.request()
            .input('NCID', sql.Int, newNCID)
            .query(`
        SELECT nc.*, m.FinalCode AS MachineCode, m.Description AS MachineDescription,
               o.OperatorName AS MaintenanceOperatorName
        FROM NonConformities nc
        INNER JOIN Machines m ON nc.MachineID = m.MachineID
        LEFT JOIN Operators o ON nc.MaintenanceOperatorID = o.OperatorID
        WHERE nc.NCID = @NCID
      `);

        res.status(201).json(mapNC(newNC.recordset[0]));
    } catch (err) {
        console.error('Error creating non-conformity:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update non-conformity
router.put('/:id', validate(schemas.updateNonConformity), async (req, res) => {
    try {
        const {
            machineId, area, maintenanceOperatorId, creationDate,
            initiationDate, finishDate, status, priority, category
        } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('NCID', sql.Int, req.params.id)
            .input('MachineID', sql.Int, machineId)
            .input('Area', sql.NVarChar(100), area)
            .input('MaintenanceOperatorID', sql.Int, maintenanceOperatorId)
            .input('CreationDate', sql.Date, creationDate)
            .input('InitiationDate', sql.Date, initiationDate)
            .input('FinishDate', sql.Date, finishDate)
            .input('Status', sql.NVarChar(50), status)
            .input('Priority', sql.Int, priority)
            .input('Category', sql.NVarChar(100), category)
            .query(`
        UPDATE NonConformities SET
          MachineID = @MachineID,
          Area = @Area,
          MaintenanceOperatorID = @MaintenanceOperatorID,
          CreationDate = @CreationDate,
          InitiationDate = @InitiationDate,
          FinishDate = @FinishDate,
          Status = @Status,
          Priority = @Priority,
          Category = @Category
        WHERE NCID = @NCID
      `);

        const updated = await pool.request()
            .input('NCID', sql.Int, req.params.id)
            .query(`
        SELECT nc.*, m.FinalCode AS MachineCode, m.Description AS MachineDescription,
               o.OperatorName AS MaintenanceOperatorName
        FROM NonConformities nc
        INNER JOIN Machines m ON nc.MachineID = m.MachineID
        LEFT JOIN Operators o ON nc.MaintenanceOperatorID = o.OperatorID
        WHERE nc.NCID = @NCID
      `);

        res.json(mapNC(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating non-conformity:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE non-conformity
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('NCID', sql.Int, req.params.id)
            .query('DELETE FROM NonConformities WHERE NCID = @NCID');

        res.json({ message: 'Non-conformity deleted successfully' });
    } catch (err) {
        console.error('Error deleting non-conformity:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
