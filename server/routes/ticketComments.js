const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map ticket comment database record to frontend model
const mapTicketComment = (record) => ({
    id: record.CommentID.toString(),
    ticketId: record.TicketID ? record.TicketID.toString() : null,
    comment: record.Comment,
    operatorId: record.OperatorID ? record.OperatorID.toString() : null,
    operatorName: record.OperatorName || null,
    isStatusChange: !!record.IsStatusChange,
    commentDate: record.CommentDate,
    createdDate: record.CreatedDate,
});

// GET ticket comments (by ticketId query param or all)
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { ticketId } = req.query;

        const request = pool.request();
        let query = `
            SELECT c.*, o.OperatorName
            FROM TicketComments c
            LEFT JOIN Operators o ON c.OperatorID = o.OperatorID
        `;

        if (ticketId) {
            query += ' WHERE c.TicketID = @TicketID';
            request.input('TicketID', sql.Int, ticketId);
        }
        query += ' ORDER BY c.CommentDate ASC';

        const result = await request.query(query);
        res.json(result.recordset.map(mapTicketComment));
    } catch (err) {
        console.error('Error fetching ticket comments:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new ticket comment
router.post('/', validate(schemas.createTicketComment), async (req, res) => {
    try {
        const { ticketId, comment, operatorId } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('TicketID', sql.Int, ticketId)
            .input('Comment', sql.NVarChar(2000), comment)
            .input('OperatorID', sql.Int, operatorId)
            .query(`
                INSERT INTO TicketComments (TicketID, Comment, OperatorID)
                VALUES (@TicketID, @Comment, @OperatorID);
                SELECT SCOPE_IDENTITY() AS CommentID;
            `);

        const newCommentId = result.recordset[0].CommentID;

        const newComment = await pool.request()
            .input('CommentID', sql.Int, newCommentId)
            .query(`
                SELECT c.*, o.OperatorName
                FROM TicketComments c
                LEFT JOIN Operators o ON c.OperatorID = o.OperatorID
                WHERE c.CommentID = @CommentID
            `);

        res.status(201).json(mapTicketComment(newComment.recordset[0]));
    } catch (err) {
        console.error('Error creating ticket comment:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE ticket comment
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('CommentID', sql.Int, req.params.id)
            .query('DELETE FROM TicketComments WHERE CommentID = @CommentID');

        res.json({ message: 'Ticket comment deleted successfully' });
    } catch (err) {
        console.error('Error deleting ticket comment:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
