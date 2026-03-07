const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');
const requireWriteAccess = require('../middleware/writeProtection');

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
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM Operators WHERE IsActive = 1 AND EntityID = @EntityID ORDER BY OperatorName');

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
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM Operators WHERE OperatorID = @OperatorID AND EntityID = @EntityID');

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
router.post('/', requireWriteAccess, validate(schemas.createOperator), async (req, res) => {
    try {
        const { operatorName, email, department, isActive } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('OperatorName', sql.NVarChar(100), operatorName)
            .input('Email', sql.NVarChar(100), email)
            .input('Department', sql.NVarChar(50), department)
            .input('IsActive', sql.Bit, isActive !== undefined ? isActive : true)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
        INSERT INTO Operators (OperatorName, Email, Department, IsActive, EntityID)
        VALUES (@OperatorName, @Email, @Department, @IsActive, @EntityID);
        SELECT SCOPE_IDENTITY() AS OperatorID;
      `);

        const newOperatorId = result.recordset[0].OperatorID;

        const newOperator = await pool.request()
            .input('OperatorID', sql.Int, newOperatorId)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM Operators WHERE OperatorID = @OperatorID AND EntityID = @EntityID');

        res.status(201).json(mapOperator(newOperator.recordset[0]));
    } catch (err) {
        console.error('Error creating operator:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update operator
router.put('/:id', requireWriteAccess, validate(schemas.updateOperator), async (req, res) => {
    try {
        const { operatorName, email, department, isActive } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .input('OperatorName', sql.NVarChar(100), operatorName)
            .input('Email', sql.NVarChar(100), email)
            .input('Department', sql.NVarChar(50), department)
            .input('IsActive', sql.Bit, isActive)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
        UPDATE Operators SET
          OperatorName = @OperatorName,
          Email = @Email,
          Department = @Department,
          IsActive = @IsActive
        WHERE OperatorID = @OperatorID AND EntityID = @EntityID
      `);

        const updated = await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('SELECT * FROM Operators WHERE OperatorID = @OperatorID AND EntityID = @EntityID');

        res.json(mapOperator(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating operator:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE operator (soft delete - set IsActive to false)
router.delete('/:id', requireWriteAccess, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('UPDATE Operators SET IsActive = 0 WHERE OperatorID = @OperatorID AND EntityID = @EntityID');

        res.json({ message: 'Operator deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating operator:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
