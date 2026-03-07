const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { uploadTicketAttachment } = require('../config/upload');
const requireWriteAccess = require('../middleware/writeProtection');
const fs = require('fs');
const path = require('path');

// GET /api/ticket-attachments?ticketId=123
router.get('/', async (req, res) => {
    try {
        const { ticketId } = req.query;
        const pool = await poolPromise;
        const request = pool.request();
        request.input('EntityID', sql.Int, req.entityId);

        let query = `
            SELECT a.*, o.OperatorName AS UploadedByName
            FROM TicketAttachments a
            INNER JOIN SupportTickets t ON a.TicketID = t.TicketID
            LEFT JOIN Operators o ON a.UploadedByID = o.OperatorID
            WHERE t.EntityID = @EntityID
        `;

        if (ticketId) {
            query += ' AND a.TicketID = @TicketID';
            request.input('TicketID', sql.Int, ticketId);
        }
        query += ' ORDER BY a.UploadedDate DESC';

        const result = await request.query(query);

        res.json(result.recordset.map(record => ({
            id: record.AttachmentID.toString(),
            ticketId: record.TicketID.toString(),
            fileName: record.FileName,
            storedName: record.StoredName,
            filePath: record.FilePath,
            fileSize: record.FileSize,
            mimeType: record.MimeType,
            uploadedById: record.UploadedByID ? record.UploadedByID.toString() : null,
            uploadedByName: record.UploadedByName || null,
            uploadedDate: record.UploadedDate,
        })));
    } catch (err) {
        console.error('Error fetching ticket attachments:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ticket-attachments (multipart: file + ticketId + uploadedById)
router.post('/', requireWriteAccess, uploadTicketAttachment.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const { ticketId, uploadedById } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('TicketID', sql.Int, ticketId)
            .input('FileName', sql.NVarChar(255), req.file.originalname)
            .input('StoredName', sql.NVarChar(255), req.file.filename)
            .input('FilePath', sql.NVarChar(500), `/uploads/tickets/${req.file.filename}`)
            .input('FileSize', sql.Int, req.file.size)
            .input('MimeType', sql.NVarChar(100), req.file.mimetype)
            .input('UploadedByID', sql.Int, uploadedById || null)
            .query(`
                INSERT INTO TicketAttachments
                    (TicketID, FileName, StoredName, FilePath, FileSize, MimeType, UploadedByID)
                VALUES
                    (@TicketID, @FileName, @StoredName, @FilePath, @FileSize, @MimeType, @UploadedByID);
                SELECT SCOPE_IDENTITY() AS AttachmentID;
            `);

        res.status(201).json({
            id: result.recordset[0].AttachmentID.toString(),
            ticketId: ticketId.toString(),
            fileName: req.file.originalname,
            filePath: `/uploads/tickets/${req.file.filename}`,
        });
    } catch (err) {
        console.error('Error uploading ticket attachment:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/ticket-attachments/:id
router.delete('/:id', requireWriteAccess, async (req, res) => {
    try {
        const pool = await poolPromise;

        // Get file path before deleting record
        const fileResult = await pool.request()
            .input('AttachmentID', sql.Int, req.params.id)
            .query('SELECT StoredName FROM TicketAttachments WHERE AttachmentID = @AttachmentID');

        if (fileResult.recordset.length > 0) {
            const storedName = fileResult.recordset[0].StoredName;
            const filePath = path.join(__dirname, '..', 'uploads', 'tickets', storedName);

            // Delete file from disk (best-effort)
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileErr) {
                console.error('Error deleting attachment file:', fileErr.message);
            }
        }

        await pool.request()
            .input('AttachmentID', sql.Int, req.params.id)
            .query('DELETE FROM TicketAttachments WHERE AttachmentID = @AttachmentID');

        res.json({ message: 'Ticket attachment deleted successfully' });
    } catch (err) {
        console.error('Error deleting ticket attachment:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
