const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { uploadDocument } = require('../config/upload');

// GET /api/documents?machineId=123&category=DOCUMENT
router.get('/', async (req, res) => {
    try {
        const { machineId, category } = req.query;
        const pool = await poolPromise;
        const request = pool.request();

        let query = 'SELECT * FROM MachineDocuments WHERE 1=1';

        if (machineId) {
            query += ' AND MachineID = @MachineID';
            request.input('MachineID', sql.Int, machineId);
        }
        if (category) {
            query += ' AND Category = @Category';
            request.input('Category', sql.NVarChar(50), category);
        }
        query += ' ORDER BY UploadedDate DESC';

        const result = await request.query(query);

        res.json(result.recordset.map(record => ({
            id: record.DocumentID.toString(),
            machineId: record.MachineID.toString(),
            fileName: record.FileName,
            storedName: record.StoredName,
            filePath: record.FilePath,
            fileSize: record.FileSize,
            mimeType: record.MimeType,
            category: record.Category,
            uploadedDate: record.UploadedDate,
        })));
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/documents (multipart: file + machineId + category)
router.post('/', uploadDocument.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const { machineId, category } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('FileName', sql.NVarChar(255), req.file.originalname)
            .input('StoredName', sql.NVarChar(255), req.file.filename)
            .input('FilePath', sql.NVarChar(500), `/uploads/documents/${req.file.filename}`)
            .input('FileSize', sql.Int, req.file.size)
            .input('MimeType', sql.NVarChar(100), req.file.mimetype)
            .input('Category', sql.NVarChar(50), category || 'DOCUMENT')
            .query(`
                INSERT INTO MachineDocuments
                    (MachineID, FileName, StoredName, FilePath, FileSize, MimeType, Category)
                VALUES
                    (@MachineID, @FileName, @StoredName, @FilePath, @FileSize, @MimeType, @Category);
                SELECT SCOPE_IDENTITY() AS DocumentID;
            `);

        res.status(201).json({
            id: result.recordset[0].DocumentID.toString(),
            fileName: req.file.originalname,
            filePath: `/uploads/documents/${req.file.filename}`,
            category: category || 'DOCUMENT',
        });
    } catch (err) {
        console.error('Error uploading document:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('DocumentID', sql.Int, req.params.id)
            .query('DELETE FROM MachineDocuments WHERE DocumentID = @DocumentID');

        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
