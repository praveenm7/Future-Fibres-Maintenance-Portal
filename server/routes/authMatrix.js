const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

// Helper to map auth matrix database record to frontend model
const mapAuthMatrix = (record) => ({
    id: record.AuthMatrixID.toString(),
    operatorId: record.OperatorID ? record.OperatorID.toString() : null,
    operatorName: record.OperatorName,
    email: record.Email,
    department: record.Department,
    updatedDate: record.UpdatedDate,
    authorizations: record.Authorizations ? JSON.parse(record.Authorizations) : {},
    createdDate: record.CreatedDate,
    lastUpdatedDate: record.LastUpdatedDate
});

// GET all authorizations
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetAuthorizationMatrix');

        res.json(result.recordset.map(mapAuthMatrix));
    } catch (err) {
        console.error('Error fetching auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST/PUT authorization
router.post('/', async (req, res) => {
    try {
        const { operatorName, email, department, authorizations, updatedDate } = req.body;
        let { operatorId } = req.body;
        const pool = await poolPromise;

        const authJson = JSON.stringify(authorizations || {});

        // Resolve OperatorID if not provided
        if (!operatorId && operatorName) {
            const opResult = await pool.request()
                .input('OperatorName', sql.NVarChar(100), operatorName)
                .input('Email', sql.NVarChar(100), email || null)
                .input('Department', sql.NVarChar(50), department || null)
                .query(`
                    DECLARE @OpRefID INT;
                    SELECT @OpRefID = OperatorID FROM Operators WHERE OperatorName = @OperatorName;
                    IF @OpRefID IS NULL
                    BEGIN
                        INSERT INTO Operators (OperatorName, Email, Department, IsActive)
                        VALUES (@OperatorName, @Email, @Department, 1);
                        SET @OpRefID = SCOPE_IDENTITY();
                    END
                    ELSE
                    BEGIN
                        UPDATE Operators 
                        SET Email = ISNULL(@Email, Email),
                            Department = ISNULL(@Department, Department)
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
            .query(`
                IF EXISTS (SELECT 1 FROM AuthorizationMatrix WHERE OperatorID = @OperatorID)
                BEGIN
                    UPDATE AuthorizationMatrix 
                    SET Authorizations = @Authorizations, 
                        UpdatedDate = @UpdatedDate,
                        LastUpdatedDate = GETDATE()
                    WHERE OperatorID = @OperatorID
                END
                ELSE
                BEGIN
                    INSERT INTO AuthorizationMatrix (OperatorID, UpdatedDate, Authorizations)
                    VALUES (@OperatorID, @UpdatedDate, @Authorizations)
                END
            `);

        const result = await pool.request()
            .input('OperatorID', sql.Int, operatorId)
            .query(`
                SELECT am.*, o.OperatorName, o.Email, o.Department
                FROM AuthorizationMatrix am
                INNER JOIN Operators o ON am.OperatorID = o.OperatorID
                WHERE am.OperatorID = @OperatorID
            `);

        res.status(201).json(mapAuthMatrix(result.recordset[0]));
    } catch (err) {
        console.error('Error saving auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update by ID
router.put('/:id', async (req, res) => {
    try {
        const { authorizations, updatedDate, email, department } = req.body;
        const pool = await poolPromise;

        const authJson = JSON.stringify(authorizations || {});

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
            .query(`
                DECLARE @OpID INT;
                SELECT @OpID = OperatorID FROM AuthorizationMatrix WHERE AuthMatrixID = @AuthMatrixID;

                UPDATE Operators 
                SET Email = ISNULL(@Email, Email),
                    Department = ISNULL(@Department, Department)
                WHERE OperatorID = @OpID;

                UPDATE AuthorizationMatrix 
                SET Authorizations = @Authorizations, 
                    UpdatedDate = @UpdatedDate,
                    LastUpdatedDate = GETDATE()
                WHERE AuthMatrixID = @AuthMatrixID
            `);

        const result = await pool.request()
            .input('AuthMatrixID', sql.Int, req.params.id)
            .query(`
                SELECT am.*, o.OperatorName, o.Email, o.Department
                FROM AuthorizationMatrix am
                INNER JOIN Operators o ON am.OperatorID = o.OperatorID
                WHERE am.AuthMatrixID = @AuthMatrixID
            `);

        res.json(mapAuthMatrix(result.recordset[0]));
    } catch (err) {
        console.error('Error updating auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE authorization
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('AuthMatrixID', sql.Int, req.params.id)
            .query('DELETE FROM AuthorizationMatrix WHERE AuthMatrixID = @AuthMatrixID');

        res.json({ message: 'Authorization deleted successfully' });
    } catch (err) {
        console.error('Error deleting auth matrix:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
