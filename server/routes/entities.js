const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

// GET /api/entities — list all entities
router.get('/', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(
            'SELECT EntityID, EntityCode, EntityName, Country FROM [dbo].[Entities] ORDER BY EntityID'
        );

        const entities = result.recordset.map(row => ({
            id: row.EntityID,
            code: row.EntityCode,
            name: row.EntityName,
            country: row.Country,
        }));

        res.json(entities);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
