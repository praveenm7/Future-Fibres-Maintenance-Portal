const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetDashboardStats');

        const stats = result.recordset[0];
        res.json({
            totalMachines: stats.TotalMachines,
            machinesNeedingMaintenance: stats.MachinesNeedingMaintenance,
            pendingNCs: stats.PendingNCs,
            inProgressNCs: stats.InProgressNCs,
            totalMaintenanceActions: stats.TotalMaintenanceActions,
            activeOperators: stats.ActiveOperators
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET maintenance report
router.get('/maintenance-report', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { periodicity } = req.query;

        const result = await pool.request()
            .input('Periodicity', sql.NVarChar(50), periodicity || null)
            .execute('sp_GetMaintenanceReport');

        res.json(result.recordset.map(r => ({
            finalCode: r.FinalCode,
            machineDescription: r.MachineDescription,
            area: r.Area,
            action: r.Action,
            periodicity: r.Periodicity,
            timeNeeded: r.TimeNeeded,
            status: r.Status,
            personInCharge: r.PersonInCharge // This is already a name string
        })));
    } catch (err) {
        console.error('Error fetching maintenance report:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
