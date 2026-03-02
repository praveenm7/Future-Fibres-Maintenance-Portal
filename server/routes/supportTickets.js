const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// Helper to map ticket database record to frontend model
const mapTicket = (record) => ({
    id: record.TicketID.toString(),
    ticketCode: record.TicketCode,
    machineId: record.MachineID ? record.MachineID.toString() : null,
    machineCode: record.MachineCode || null,
    machineDescription: record.MachineDescription || null,
    title: record.Title,
    description: record.Description,
    category: record.Category,
    priority: record.Priority,
    status: record.Status,
    submittedById: record.SubmittedByID ? record.SubmittedByID.toString() : null,
    submittedByName: record.SubmittedByName || null,
    assignedToId: record.AssignedToID ? record.AssignedToID.toString() : null,
    assignedToName: record.AssignedToName || null,
    approvedById: record.ApprovedByID ? record.ApprovedByID.toString() : null,
    approvedByName: record.ApprovedByName || null,
    dueDate: record.DueDate,
    resolvedDate: record.ResolvedDate,
    closedDate: record.ClosedDate,
    resolutionNotes: record.ResolutionNotes,
    commentCount: record.CommentCount || 0,
    attachmentCount: record.AttachmentCount || 0,
    isOverdue: record.IsOverdue === 1,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate,
});

// Inline query to fetch a single ticket with all JOINs
const SINGLE_TICKET_QUERY = `
    SELECT
        t.*,
        m.FinalCode AS MachineCode,
        m.Description AS MachineDescription,
        sub.OperatorName AS SubmittedByName,
        asgn.OperatorName AS AssignedToName,
        appr.OperatorName AS ApprovedByName,
        (SELECT COUNT(*) FROM TicketComments tc WHERE tc.TicketID = t.TicketID) AS CommentCount,
        (SELECT COUNT(*) FROM TicketAttachments ta WHERE ta.TicketID = t.TicketID) AS AttachmentCount,
        CASE WHEN t.DueDate IS NOT NULL AND t.DueDate < CAST(GETDATE() AS DATE)
             AND t.Status NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')
             THEN 1 ELSE 0 END AS IsOverdue
    FROM SupportTickets t
    INNER JOIN Machines m ON t.MachineID = m.MachineID
    LEFT JOIN Operators sub ON t.SubmittedByID = sub.OperatorID
    LEFT JOIN Operators asgn ON t.AssignedToID = asgn.OperatorID
    LEFT JOIN Operators appr ON t.ApprovedByID = appr.OperatorID
    WHERE t.TicketID = @TicketID
`;

// GET all support tickets
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetSupportTicketsWithDetails');

        res.json(result.recordset.map(mapTicket));
    } catch (err) {
        console.error('Error fetching support tickets:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET support ticket by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .query(SINGLE_TICKET_QUERY);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Support ticket not found' });
        }

        res.json(mapTicket(result.recordset[0]));
    } catch (err) {
        console.error('Error fetching support ticket:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new support ticket
router.post('/', validate(schemas.createTicket), async (req, res) => {
    try {
        const { machineId, title, description, category, priority, submittedById } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, machineId)
            .input('Title', sql.NVarChar(200), title)
            .input('Description', sql.NVarChar(sql.MAX), description || null)
            .input('Category', sql.NVarChar(100), category)
            .input('Priority', sql.NVarChar(20), priority)
            .input('SubmittedByID', sql.Int, submittedById)
            .execute('sp_CreateSupportTicket');

        const newTicketId = result.recordset[0].TicketID;

        const newTicket = await pool.request()
            .input('TicketID', sql.Int, newTicketId)
            .query(SINGLE_TICKET_QUERY);

        res.status(201).json(mapTicket(newTicket.recordset[0]));
    } catch (err) {
        console.error('Error creating support ticket:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update support ticket
router.put('/:id', validate(schemas.updateTicket), async (req, res) => {
    try {
        const {
            machineId, title, description, category, priority, status,
            assignedToId, approvedById, dueDate, resolutionNotes
        } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .input('MachineID', sql.Int, machineId)
            .input('Title', sql.NVarChar(200), title)
            .input('Description', sql.NVarChar(sql.MAX), description || null)
            .input('Category', sql.NVarChar(100), category)
            .input('Priority', sql.NVarChar(20), priority)
            .input('Status', sql.NVarChar(30), status)
            .input('AssignedToID', sql.Int, assignedToId || null)
            .input('ApprovedByID', sql.Int, approvedById || null)
            .input('DueDate', sql.Date, dueDate || null)
            .input('ResolutionNotes', sql.NVarChar(sql.MAX), resolutionNotes || null)
            .query(`
                UPDATE SupportTickets SET
                    MachineID = @MachineID,
                    Title = @Title,
                    Description = @Description,
                    Category = @Category,
                    Priority = @Priority,
                    Status = @Status,
                    AssignedToID = @AssignedToID,
                    ApprovedByID = @ApprovedByID,
                    DueDate = @DueDate,
                    ResolutionNotes = @ResolutionNotes,
                    ResolvedDate = CASE WHEN @Status = 'RESOLVED' AND ResolvedDate IS NULL THEN GETDATE() ELSE ResolvedDate END,
                    ClosedDate = CASE WHEN @Status = 'CLOSED' AND ClosedDate IS NULL THEN GETDATE() ELSE ClosedDate END
                WHERE TicketID = @TicketID
            `);

        const updated = await pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .query(SINGLE_TICKET_QUERY);

        res.json(mapTicket(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating support ticket:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH update ticket status (workflow transitions)
router.patch('/:id/status', validate(schemas.updateTicketStatus), async (req, res) => {
    try {
        const { status, assignedToId, approvedById, dueDate, resolutionNotes } = req.body;

        const pool = await poolPromise;

        // Get current ticket status for audit comment
        const current = await pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .query('SELECT Status FROM SupportTickets WHERE TicketID = @TicketID');

        if (current.recordset.length === 0) {
            return res.status(404).json({ error: 'Support ticket not found' });
        }

        const oldStatus = current.recordset[0].Status;

        // Build dynamic SET clause
        let setClauses = ['Status = @Status'];
        const request = pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .input('Status', sql.NVarChar(30), status);

        if (assignedToId !== undefined) {
            setClauses.push('AssignedToID = @AssignedToID');
            request.input('AssignedToID', sql.Int, assignedToId || null);
        }
        if (approvedById !== undefined) {
            setClauses.push('ApprovedByID = @ApprovedByID');
            request.input('ApprovedByID', sql.Int, approvedById || null);
        }
        if (dueDate !== undefined) {
            setClauses.push('DueDate = @DueDate');
            request.input('DueDate', sql.Date, dueDate || null);
        }
        if (resolutionNotes !== undefined) {
            setClauses.push('ResolutionNotes = @ResolutionNotes');
            request.input('ResolutionNotes', sql.NVarChar(sql.MAX), resolutionNotes || null);
        }

        // Auto-set resolved/closed dates
        if (status === 'RESOLVED') {
            setClauses.push('ResolvedDate = CASE WHEN ResolvedDate IS NULL THEN GETDATE() ELSE ResolvedDate END');
        }
        if (status === 'CLOSED') {
            setClauses.push('ClosedDate = CASE WHEN ClosedDate IS NULL THEN GETDATE() ELSE ClosedDate END');
        }

        await request.query(`UPDATE SupportTickets SET ${setClauses.join(', ')} WHERE TicketID = @TicketID`);

        // Auto-create system comment for status change
        if (oldStatus !== status) {
            await pool.request()
                .input('TicketID', sql.Int, req.params.id)
                .input('Comment', sql.NVarChar(2000), `Status changed from ${oldStatus} to ${status}`)
                .input('IsStatusChange', sql.Bit, true)
                .query(`
                    INSERT INTO TicketComments (TicketID, Comment, IsStatusChange)
                    VALUES (@TicketID, @Comment, @IsStatusChange)
                `);
        }

        const updated = await pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .query(SINGLE_TICKET_QUERY);

        res.json(mapTicket(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating ticket status:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE support ticket
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('TicketID', sql.Int, req.params.id)
            .query('DELETE FROM SupportTickets WHERE TicketID = @TicketID');

        res.json({ message: 'Support ticket deleted successfully' });
    } catch (err) {
        console.error('Error deleting support ticket:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
