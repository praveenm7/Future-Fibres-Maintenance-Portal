const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');
const requireWriteAccess = require('../middleware/writeProtection');

// Helper to map auth matrix database record to frontend model
const mapAuthMatrix = (record) => ({
    id: record.AuthMatrixID.toString(),
    operatorId: record.OperatorID ? record.OperatorID.toString() : null,
    operatorName: record.OperatorName,
    email: record.Email,
    department: record.Department,
    updatedDate: record.UpdatedDate,
    authorizations: record.Authorizations ? JSON.parse(record.Authorizations) : {},
    defaultShiftId: record.DefaultShiftID ? record.DefaultShiftID.toString() : null,
    defaultShiftName: record.DefaultShiftName || null,
    createdDate: record.CreatedDate,
    lastUpdatedDate: record.LastUpdatedDate
});

// GET all authorizations
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                SELECT am.*, o.OperatorName, o.Email, o.Department, o.DefaultShiftID,
                       s.ShiftName AS DefaultShiftName
                FROM AuthorizationMatrix am
                INNER JOIN Operators o ON am.OperatorID = o.OperatorID
                LEFT JOIN Shifts s ON o.DefaultShiftID = s.ShiftID
                WHERE o.IsActive = 1 AND am.EntityID = @EntityID
                ORDER BY o.OperatorName
            `);

        res.json(result.recordset.map(mapAuthMatrix));
    } catch (err) {
        console.error('Error fetching auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST/PUT authorization
router.post('/', requireWriteAccess, validate(schemas.createAuthMatrix), async (req, res) => {
    try {
        const { operatorName, email, department, authorizations, updatedDate, defaultShiftId } = req.body;
        let { operatorId } = req.body;
        const pool = await poolPromise;

        const authJson = JSON.stringify(authorizations || {});
        const shiftId = defaultShiftId ? parseInt(defaultShiftId, 10) : null;

        // Resolve OperatorID if not provided
        if (!operatorId && operatorName) {
            const opResult = await pool.request()
                .input('OperatorName', sql.NVarChar(100), operatorName)
                .input('Email', sql.NVarChar(100), email || null)
                .input('Department', sql.NVarChar(50), department || null)
                .input('DefaultShiftID', sql.Int, shiftId)
                .input('EntityID', sql.Int, req.entityId)
                .query(`
                    DECLARE @OpRefID INT;
                    SELECT @OpRefID = OperatorID FROM Operators WHERE OperatorName = @OperatorName AND EntityID = @EntityID;
                    IF @OpRefID IS NULL
                    BEGIN
                        INSERT INTO Operators (OperatorName, Email, Department, IsActive, DefaultShiftID, EntityID)
                        VALUES (@OperatorName, @Email, @Department, 1, @DefaultShiftID, @EntityID);
                        SET @OpRefID = SCOPE_IDENTITY();
                    END
                    ELSE
                    BEGIN
                        UPDATE Operators
                        SET Email = ISNULL(@Email, Email),
                            Department = ISNULL(@Department, Department),
                            DefaultShiftID = @DefaultShiftID
                        WHERE OperatorID = @OpRefID
                    END
                    SELECT @OpRefID AS OperatorID;
                `);
            operatorId = opResult.recordset[0].OperatorID;
        }

        if (!operatorId) {
            return res.status(400).json({ error: 'Operator name or ID is required' });
        }

        // Parse Date robustly (supporting DD/MM/YYYY from frontend)
        let dbDate = new Date();
        if (updatedDate && typeof updatedDate === 'string') {
            const parts = updatedDate.split('/');
            if (parts.length === 3) {
                dbDate = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                dbDate = new Date(updatedDate);
            }
        }

        await pool.request()
            .input('OperatorID', sql.Int, operatorId)
            .input('UpdatedDate', sql.Date, dbDate)
            .input('Authorizations', sql.NVarChar(sql.MAX), authJson)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                IF EXISTS (SELECT 1 FROM AuthorizationMatrix WHERE OperatorID = @OperatorID AND EntityID = @EntityID)
                BEGIN
                    UPDATE AuthorizationMatrix
                    SET Authorizations = @Authorizations,
                        UpdatedDate = @UpdatedDate,
                        LastUpdatedDate = GETDATE()
                    WHERE OperatorID = @OperatorID AND EntityID = @EntityID
                END
                ELSE
                BEGIN
                    INSERT INTO AuthorizationMatrix (OperatorID, UpdatedDate, Authorizations, EntityID)
                    VALUES (@OperatorID, @UpdatedDate, @Authorizations, @EntityID)
                END
            `);

        const result = await pool.request()
            .input('OperatorID', sql.Int, operatorId)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                SELECT am.*, o.OperatorName, o.Email, o.Department, o.DefaultShiftID,
                       s.ShiftName AS DefaultShiftName
                FROM AuthorizationMatrix am
                INNER JOIN Operators o ON am.OperatorID = o.OperatorID
                LEFT JOIN Shifts s ON o.DefaultShiftID = s.ShiftID
                WHERE am.OperatorID = @OperatorID AND am.EntityID = @EntityID
            `);

        res.status(201).json(mapAuthMatrix(result.recordset[0]));
    } catch (err) {
        console.error('Error saving auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update by ID
router.put('/:id', requireWriteAccess, validate(schemas.updateAuthMatrix), async (req, res) => {
    try {
        const { authorizations, updatedDate, email, department, defaultShiftId } = req.body;
        const pool = await poolPromise;

        const authJson = JSON.stringify(authorizations || {});
        const shiftId = defaultShiftId ? parseInt(defaultShiftId, 10) : null;

        // Parse Date robustly
        let dbDate = new Date();
        if (updatedDate && typeof updatedDate === 'string') {
            const parts = updatedDate.split('/');
            if (parts.length === 3) {
                dbDate = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                dbDate = new Date(updatedDate);
            }
        }

        await pool.request()
            .input('AuthMatrixID', sql.Int, req.params.id)
            .input('Authorizations', sql.NVarChar(sql.MAX), authJson)
            .input('UpdatedDate', sql.Date, dbDate)
            .input('Email', sql.NVarChar(100), email || null)
            .input('Department', sql.NVarChar(50), department || null)
            .input('DefaultShiftID', sql.Int, shiftId)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                DECLARE @OpID INT;
                SELECT @OpID = OperatorID FROM AuthorizationMatrix WHERE AuthMatrixID = @AuthMatrixID AND EntityID = @EntityID;

                UPDATE Operators
                SET Email = ISNULL(@Email, Email),
                    Department = ISNULL(@Department, Department),
                    DefaultShiftID = @DefaultShiftID
                WHERE OperatorID = @OpID;

                UPDATE AuthorizationMatrix
                SET Authorizations = @Authorizations,
                    UpdatedDate = @UpdatedDate,
                    LastUpdatedDate = GETDATE()
                WHERE AuthMatrixID = @AuthMatrixID AND EntityID = @EntityID
            `);

        const result = await pool.request()
            .input('AuthMatrixID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query(`
                SELECT am.*, o.OperatorName, o.Email, o.Department, o.DefaultShiftID,
                       s.ShiftName AS DefaultShiftName
                FROM AuthorizationMatrix am
                INNER JOIN Operators o ON am.OperatorID = o.OperatorID
                LEFT JOIN Shifts s ON o.DefaultShiftID = s.ShiftID
                WHERE am.AuthMatrixID = @AuthMatrixID AND am.EntityID = @EntityID
            `);

        res.json(mapAuthMatrix(result.recordset[0]));
    } catch (err) {
        console.error('Error updating auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE authorization
router.delete('/:id', requireWriteAccess, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('AuthMatrixID', sql.Int, req.params.id)
            .input('EntityID', sql.Int, req.entityId)
            .query('DELETE FROM AuthorizationMatrix WHERE AuthMatrixID = @AuthMatrixID AND EntityID = @EntityID');

        res.json({ message: 'Authorization deleted successfully' });
    } catch (err) {
        console.error('Error deleting auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
