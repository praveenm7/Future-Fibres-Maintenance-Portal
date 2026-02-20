const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map NC comment database record to frontend model
const mapNCComment = (record) => ({
    id: record.CommentID.toString(),
    ncId: record.NCID ? record.NCID.toString() : null,
    date: record.CommentDate,
    comment: record.Comment,
    operatorId: record.OperatorID ? record.OperatorID.toString() : null,
    operator: record.OperatorName,
    createdDate: record.CreatedDate
});

// GET all NC comments or by NC ID
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { ncId } = req.query;

        let result;
        if (ncId) {
            result = await pool.request()
                .input('NCID', sql.Int, ncId)
                .execute('sp_GetNCCommentsByNC');
        } else {
            result = await pool.request()
                .query(`
          SELECT c.*, o.OperatorName
          FROM NCComments c
          LEFT JOIN Operators o ON c.OperatorID = o.OperatorID
          ORDER BY c.NCID, c.CommentDate DESC
        `);
        }

        res.json(result.recordset.map(mapNCComment));
    } catch (err) {
        console.error('Error fetching NC comments:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new NC comment
router.post('/', validate(schemas.createNCComment), async (req, res) => {
    try {
        const { ncId, commentDate, comment, operatorId } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('NCID', sql.Int, ncId)
            .input('CommentDate', sql.Date, commentDate || new Date())
            .input('Comment', sql.NVarChar(1000), comment)
            .input('OperatorID', sql.Int, operatorId)
            .query(`
        INSERT INTO NCComments (NCID, CommentDate, Comment, OperatorID)
        VALUES (@NCID, @CommentDate, @Comment, @OperatorID);
        SELECT SCOPE_IDENTITY() AS CommentID;
      `);

        const newCommentId = result.recordset[0].CommentID;

        const newComment = await pool.request()
            .input('CommentID', sql.Int, newCommentId)
            .query(`
        SELECT c.*, o.OperatorName
        FROM NCComments c
        LEFT JOIN Operators o ON c.OperatorID = o.OperatorID
        WHERE c.CommentID = @CommentID
      `);

        res.status(201).json(mapNCComment(newComment.recordset[0]));
    } catch (err) {
        console.error('Error creating NC comment:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE NC comment
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('CommentID', sql.Int, req.params.id)
            .query('DELETE FROM NCComments WHERE CommentID = @CommentID');

        res.json({ message: 'NC comment deleted successfully' });
    } catch (err) {
        console.error('Error deleting NC comment:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
