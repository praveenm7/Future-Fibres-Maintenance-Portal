const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map operator database record to frontend model
const mapOperator = (record) => ({
    id: record.OperatorID.toString(),
    operatorName: record.OperatorName,
    email: record.Email,
    department: record.Department,
    isActive: record.IsActive,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate
});

// GET all operators
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM Operators WHERE IsActive = 1 ORDER BY OperatorName');

        res.json(result.recordset.map(mapOperator));
    } catch (err) {
        console.error('Error fetching operators:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET operator by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .query('SELECT * FROM Operators WHERE OperatorID = @OperatorID');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Operator not found' });
        }

        res.json(mapOperator(result.recordset[0]));
    } catch (err) {
        console.error('Error fetching operator:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new operator
router.post('/', validate(schemas.createOperator), async (req, res) => {
    try {
        const { operatorName, email, department, isActive } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('OperatorName', sql.NVarChar(100), operatorName)
            .input('Email', sql.NVarChar(100), email)
            .input('Department', sql.NVarChar(50), department)
            .input('IsActive', sql.Bit, isActive !== undefined ? isActive : true)
            .query(`
        INSERT INTO Operators (OperatorName, Email, Department, IsActive)
        VALUES (@OperatorName, @Email, @Department, @IsActive);
        SELECT SCOPE_IDENTITY() AS OperatorID;
      `);

        const newOperatorId = result.recordset[0].OperatorID;

        const newOperator = await pool.request()
            .input('OperatorID', sql.Int, newOperatorId)
            .query('SELECT * FROM Operators WHERE OperatorID = @OperatorID');

        res.status(201).json(mapOperator(newOperator.recordset[0]));
    } catch (err) {
        console.error('Error creating operator:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update operator
router.put('/:id', validate(schemas.updateOperator), async (req, res) => {
    try {
        const { operatorName, email, department, isActive } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .input('OperatorName', sql.NVarChar(100), operatorName)
            .input('Email', sql.NVarChar(100), email)
            .input('Department', sql.NVarChar(50), department)
            .input('IsActive', sql.Bit, isActive)
            .query(`
        UPDATE Operators SET
          OperatorName = @OperatorName,
          Email = @Email,
          Department = @Department,
          IsActive = @IsActive
        WHERE OperatorID = @OperatorID
      `);

        const updated = await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .query('SELECT * FROM Operators WHERE OperatorID = @OperatorID');

        res.json(mapOperator(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating operator:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE operator (soft delete - set IsActive to false)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .query('UPDATE Operators SET IsActive = 0 WHERE OperatorID = @OperatorID');

        res.json({ message: 'Operator deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating operator:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
