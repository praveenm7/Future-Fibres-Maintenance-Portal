const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map list option database record to frontend model
const mapListOption = (record) => ({
    id: record.ListOptionID.toString(),
    listType: record.ListType,
    value: record.OptionValue,
    sortOrder: record.SortOrder,
    isActive: record.IsActive
});

// GET list options by type
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { listType } = req.query;

        let result;
        if (listType) {
            result = await pool.request()
                .input('ListType', sql.NVarChar(50), listType)
                .execute('sp_GetListOptionsByType');
        } else {
            result = await pool.request()
                .query('SELECT * FROM ListOptions WHERE IsActive = 1 ORDER BY ListType, SortOrder');
        }

        res.json(result.recordset.map(mapListOption));
    } catch (err) {
        console.error('Error fetching list options:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET all list types
router.get('/types', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT DISTINCT ListType FROM ListOptions WHERE IsActive = 1 ORDER BY ListType');

        res.json(result.recordset.map(r => r.ListType));
    } catch (err) {
        console.error('Error fetching list types:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new list option
router.post('/', validate(schemas.createListOption), async (req, res) => {
    try {
        const { listType, optionValue, value, sortOrder, isActive } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ListType', sql.NVarChar(50), listType)
            .input('OptionValue', sql.NVarChar(100), optionValue || value)
            .input('SortOrder', sql.Int, sortOrder || 0)
            .input('IsActive', sql.Bit, isActive !== undefined ? isActive : true)
            .query(`
        INSERT INTO ListOptions (ListType, OptionValue, SortOrder, IsActive)
        VALUES (@ListType, @OptionValue, @SortOrder, @IsActive);
        SELECT SCOPE_IDENTITY() AS ListOptionID;
      `);

        const newOptionId = result.recordset[0].ListOptionID;

        const newOption = await pool.request()
            .input('ListOptionID', sql.Int, newOptionId)
            .query('SELECT * FROM ListOptions WHERE ListOptionID = @ListOptionID');

        res.status(201).json(mapListOption(newOption.recordset[0]));
    } catch (err) {
        console.error('Error creating list option:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update list option
router.put('/:id', validate(schemas.updateListOption), async (req, res) => {
    try {
        const { listType, optionValue, value, sortOrder, isActive } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('ListOptionID', sql.Int, req.params.id)
            .input('ListType', sql.NVarChar(50), listType)
            .input('OptionValue', sql.NVarChar(100), optionValue || value)
            .input('SortOrder', sql.Int, sortOrder)
            .input('IsActive', sql.Bit, isActive)
            .query(`
        UPDATE ListOptions SET
          ListType = @ListType,
          OptionValue = @OptionValue,
          SortOrder = @SortOrder,
          IsActive = @IsActive
        WHERE ListOptionID = @ListOptionID
      `);

        const updated = await pool.request()
            .input('ListOptionID', sql.Int, req.params.id)
            .query('SELECT * FROM ListOptions WHERE ListOptionID = @ListOptionID');

        res.json(mapListOption(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating list option:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE list option (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('ListOptionID', sql.Int, req.params.id)
            .query('UPDATE ListOptions SET IsActive = 0 WHERE ListOptionID = @ListOptionID');

        res.json({ message: 'List option deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating list option:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
