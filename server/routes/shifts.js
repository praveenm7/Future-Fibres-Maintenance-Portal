const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { validate, schemas } = require('../middleware/validate');

// GET /api/shifts — list all shift definitions
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM Shifts WHERE IsActive = 1 ORDER BY ShiftID');

        res.json(result.recordset.map(s => ({
            shiftId: s.ShiftID.toString(),
            shiftName: s.ShiftName,
            startTime: s.StartTime,
            endTime: s.EndTime,
        })));
    } catch (err) {
        console.error('Error fetching shifts:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/shifts/roster?date=2026-02-20 — effective shift for all active operators on a date
router.get('/roster', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: '"date" query parameter is required' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('ShiftDate', sql.Date, date)
            .query(`
                SELECT
                    o.OperatorID,
                    o.OperatorName,
                    o.Department,
                    o.DefaultShiftID,
                    ds.ShiftName AS DefaultShiftName,
                    ds.StartTime AS DefaultStartTime,
                    ds.EndTime AS DefaultEndTime,
                    oso.OverrideID,
                    oso.ShiftID AS OverrideShiftID,
                    os.ShiftName AS OverrideShiftName,
                    os.StartTime AS OverrideStartTime,
                    os.EndTime AS OverrideEndTime
                FROM Operators o
                LEFT JOIN Shifts ds ON o.DefaultShiftID = ds.ShiftID
                LEFT JOIN OperatorShiftOverrides oso ON o.OperatorID = oso.OperatorID AND oso.ShiftDate = @ShiftDate
                LEFT JOIN Shifts os ON oso.ShiftID = os.ShiftID
                WHERE o.IsActive = 1
                ORDER BY o.OperatorName
            `);

        const roster = result.recordset.map(r => {
            // Override takes priority, then default. Override with NULL ShiftID means day off.
            const hasOverride = r.OverrideID != null;
            const isDayOff = hasOverride && r.OverrideShiftID == null;

            let effectiveShift = null;
            if (isDayOff) {
                effectiveShift = null;
            } else if (hasOverride) {
                effectiveShift = {
                    shiftId: r.OverrideShiftID.toString(),
                    shiftName: r.OverrideShiftName,
                    startTime: r.OverrideStartTime,
                    endTime: r.OverrideEndTime,
                };
            } else if (r.DefaultShiftID) {
                effectiveShift = {
                    shiftId: r.DefaultShiftID.toString(),
                    shiftName: r.DefaultShiftName,
                    startTime: r.DefaultStartTime,
                    endTime: r.DefaultEndTime,
                };
            }

            return {
                operatorId: r.OperatorID.toString(),
                operatorName: r.OperatorName,
                department: r.Department || '',
                defaultShiftId: r.DefaultShiftID?.toString() || null,
                defaultShiftName: r.DefaultShiftName || null,
                effectiveShift,
                hasOverride,
                isDayOff,
                overrideId: r.OverrideID?.toString() || null,
            };
        });

        res.json(roster);
    } catch (err) {
        console.error('Error fetching shift roster:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/shifts/operators/:id/default — set operator's default shift
router.put('/operators/:id/default', validate(schemas.setDefaultShift), async (req, res) => {
    try {
        const { shiftId } = req.body; // null to unset

        const pool = await poolPromise;
        await pool.request()
            .input('OperatorID', sql.Int, req.params.id)
            .input('DefaultShiftID', sql.Int, shiftId || null)
            .query('UPDATE Operators SET DefaultShiftID = @DefaultShiftID WHERE OperatorID = @OperatorID');

        res.json({ message: 'Default shift updated' });
    } catch (err) {
        console.error('Error updating operator default shift:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/shifts/overrides — create/update a shift override for an operator on a date
router.post('/overrides', validate(schemas.createShiftOverride), async (req, res) => {
    try {
        const { operatorId, date, shiftId } = req.body; // shiftId null = day off

        const pool = await poolPromise;

        // Upsert using MERGE
        await pool.request()
            .input('OperatorID', sql.Int, operatorId)
            .input('ShiftDate', sql.Date, date)
            .input('ShiftID', sql.Int, shiftId || null)
            .query(`
                MERGE OperatorShiftOverrides AS target
                USING (SELECT @OperatorID AS OperatorID, @ShiftDate AS ShiftDate) AS source
                ON target.OperatorID = source.OperatorID AND target.ShiftDate = source.ShiftDate
                WHEN MATCHED THEN
                    UPDATE SET ShiftID = @ShiftID
                WHEN NOT MATCHED THEN
                    INSERT (OperatorID, ShiftDate, ShiftID) VALUES (@OperatorID, @ShiftDate, @ShiftID);
            `);

        res.json({ message: 'Shift override saved' });
    } catch (err) {
        console.error('Error saving shift override:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/shifts/overrides — remove a shift override (revert to default)
router.delete('/overrides', async (req, res) => {
    try {
        const { operatorId, date } = req.query;

        const pool = await poolPromise;
        await pool.request()
            .input('OperatorID', sql.Int, operatorId)
            .input('ShiftDate', sql.Date, date)
            .query('DELETE FROM OperatorShiftOverrides WHERE OperatorID = @OperatorID AND ShiftDate = @ShiftDate');

        res.json({ message: 'Shift override removed' });
    } catch (err) {
        console.error('Error removing shift override:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
