const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

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
                .execute('sp_GetSparePartsByMachine');
        } else {
            result = await pool.request()
                .query('SELECT * FROM SpareParts ORDER BY MachineID, Description');
        }

        res.json(result.recordset.map(mapSparePart));
    } catch (err) {
        console.error('Error fetching spare parts:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new spare part
router.post('/', async (req, res) => {
    try {
        const { machineId, description, reference, quantity, link } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('Description', sql.NVarChar(255), description)
            .input('Reference', sql.NVarChar(100), reference)
            .input('Quantity', sql.Int, quantity || 0)
            .input('Link', sql.NVarChar(500), link)
            .query(`
        INSERT INTO SpareParts (MachineID, Description, Reference, Quantity, Link)
        VALUES (@MachineID, @Description, @Reference, @Quantity, @Link);
        SELECT SCOPE_IDENTITY() AS SparePartID;
      `);

        const newPartId = result.recordset[0].SparePartID;

        const newPart = await pool.request()
            .input('SparePartID', sql.Int, newPartId)
            .query('SELECT * FROM SpareParts WHERE SparePartID = @SparePartID');

        res.status(201).json(mapSparePart(newPart.recordset[0]));
    } catch (err) {
        console.error('Error creating spare part:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update spare part
router.put('/:id', async (req, res) => {
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
            .query(`
        UPDATE SpareParts SET
          MachineID = @MachineID,
          Description = @Description,
          Reference = @Reference,
          Quantity = @Quantity,
          Link = @Link
        WHERE SparePartID = @SparePartID
      `);

        const updated = await pool.request()
            .input('SparePartID', sql.Int, req.params.id)
            .query('SELECT * FROM SpareParts WHERE SparePartID = @SparePartID');

        res.json(mapSparePart(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating spare part:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE spare part
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('SparePartID', sql.Int, req.params.id)
            .query('DELETE FROM SpareParts WHERE SparePartID = @SparePartID');

        res.json({ message: 'Spare part deleted successfully' });
    } catch (err) {
        console.error('Error deleting spare part:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
