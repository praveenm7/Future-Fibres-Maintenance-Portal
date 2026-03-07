const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');
const requireWriteAccess = require('../middleware/writeProtection');

// Helper to map spare part database record to frontend model
const mapSparePart = (record) => ({
    id: record.SparePartID.toString(),
    machineId: record.MachineID ? record.MachineID.toString() : null,
    description: record.Description,
    reference: record.Reference,
    quantity: record.Quantity,
    link: record.Link,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate
});

// GET all spare parts or by machine ID
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { machineId } = req.query;

        let result;
        if (machineId) {
            result = await pool.request()
                .input('MachineID', sql.Int, machineId)
                .input('EntityID', sql.Int, req.entityId)
                .execute('sp_GetSparePartsByMachine');
        } else {
            result = await pool.request()
                .input('EntityID', sql.Int, req.entityId)
                .query('SELECT sp.* FROM SpareParts sp INNER JOIN Machines m ON sp.MachineID = m.MachineID WHERE m.EntityID = @EntityID ORDER BY sp.MachineID, sp.Description');
        }

        res.json(result.recordset.map(mapSparePart));
    } catch (err) {
        console.error('Error fetching spare parts:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new spare part
router.post('/', requireWriteAccess, validate(schemas.createSparePart), async (req, res) => {
    try {
        const { machineId, description, reference, quantity, link } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('Description', sql.NVarChar(255), description)
            .input('Reference', sql.NVarChar(100), reference)
            .input('Quantity', sql.Int, quantity || 0)
            .input('Link', sql.NVarChar(500), link)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
        INSERT INTO SpareParts (MachineID, Description, Reference, Quantity, Link, EntityID)
        VALUES (@MachineID, @Description, @Reference, @Quantity, @Link, @EntityID);
        SELECT SCOPE_IDENTITY() AS SparePartID;
      `);

        const newPartId = result.recordset[0].SparePartID;

        const newPart = await pool.request()
            .input('SparePartID', sql.Int, newPartId)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM SpareParts WHERE SparePartID = @SparePartID AND EntityID = @EntityID');

        res.status(201).json(mapSparePart(newPart.recordset[0]));
    } catch (err) {
        console.error('Error creating spare part:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update spare part
router.put('/:id', requireWriteAccess, validate(schemas.updateSparePart), async (req, res) => {
    try {
        const { machineId, description, reference, quantity, link } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('SparePartID', sql.Int, req.params.id)
            .input('MachineID', sql.Int, machineId)
            .input('Description', sql.NVarChar(255), description)
            .input('Reference', sql.NVarChar(100), reference)
            .input('Quantity', sql.Int, quantity)
            .input('Link', sql.NVarChar(500), link)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
        UPDATE SpareParts SET
          MachineID = @MachineID,
          Description = @Description,
          Reference = @Reference,
          Quantity = @Quantity,
          Link = @Link
        WHERE SparePartID = @SparePartID AND EntityID = @EntityID
      `);

        const updated = await pool.request()
            .input('SparePartID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM SpareParts WHERE SparePartID = @SparePartID AND EntityID = @EntityID');

        res.json(mapSparePart(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating spare part:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE spare part
router.delete('/:id', requireWriteAccess, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('SparePartID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('DELETE FROM SpareParts WHERE SparePartID = @SparePartID AND EntityID = @EntityID');

        res.json({ message: 'Spare part deleted successfully' });
    } catch (err) {
        console.error('Error deleting spare part:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
