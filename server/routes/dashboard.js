const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { generateOccurrences, formatDateStr } = require('../utils/occurrences');

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

// --- Helpers for maintenance summary ---

function dateToSlot(date) {
    const month = date.getUTCMonth();              // 0-11
    const day = date.getUTCDate();                 // 1-31
    const weekOfMonth = Math.min(Math.ceil(day / 7), 4); // 1-4
    return month * 4 + (weekOfMonth - 1);          // 0-47
}

function getCurrentSlot() {
    const now = new Date();
    // Create a UTC date for "today" to match slot calculation
    const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    return dateToSlot(todayUtc);
}

// GET maintenance summary heatmap
router.get('/maintenance-summary', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { periodicity, year: yearParam } = req.query;
        const year = parseInt(yearParam) || new Date().getFullYear();
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        const yearStartDate = new Date(Date.UTC(year, 0, 1));
        const yearEndDate = new Date(Date.UTC(year, 11, 31));

        // Query 1: Machines with maintenance needed
        const machinesResult = await pool.request().query(`
            SELECT m.MachineID, m.FinalCode, m.[Description], m.Area
            FROM Machines m
            WHERE m.MaintenanceNeeded = 1
            ORDER BY m.FinalCode
        `);

        // Query 2: Actions (exclude BEFORE EACH USE)
        const actionsReq = pool.request();
        let actionsQuery = `
            SELECT ma.ActionID, ma.MachineID, ma.Periodicity, ma.Status, ma.Month
            FROM MaintenanceActions ma
            WHERE ma.Periodicity != 'BEFORE EACH USE'
        `;
        if (periodicity && periodicity !== 'ALL') {
            actionsReq.input('Periodicity', sql.NVarChar(50), periodicity);
            actionsQuery += ` AND ma.Periodicity = @Periodicity`;
        }
        const actionsResult = await actionsReq.query(actionsQuery);

        // Query 3: Completed executions for the year
        // Return ScheduledDate as pre-formatted string to avoid JS timezone issues
        const execResult = await pool.request()
            .input('YearStart', sql.Date, yearStart)
            .input('YearEnd', sql.Date, yearEnd)
            .query(`
                SELECT me.ActionID, me.MachineID,
                       CONVERT(VARCHAR(10), me.ScheduledDate, 120) AS ScheduledDateStr
                FROM MaintenanceExecutions me
                WHERE me.Status = 'COMPLETED'
                  AND me.ScheduledDate >= @YearStart
                  AND me.ScheduledDate <= @YearEnd
            `);

        // Build completion lookup: "actionId-YYYY-MM-DD" -> true
        const completionSet = new Set();
        for (const exec of execResult.recordset) {
            completionSet.add(`${exec.ActionID}-${exec.ScheduledDateStr}`);
        }

        // Group actions by machineId
        const actionsByMachine = new Map();
        for (const action of actionsResult.recordset) {
            if (!actionsByMachine.has(action.MachineID)) {
                actionsByMachine.set(action.MachineID, []);
            }
            actionsByMachine.get(action.MachineID).push(action);
        }

        const currentSlot = getCurrentSlot();
        const isCurrentYear = year === new Date().getFullYear();
        const isFutureYear = year > new Date().getFullYear();

        // Build per-machine heatmap
        const result = machinesResult.recordset.map(machine => {
            const actions = actionsByMachine.get(machine.MachineID) || [];
            const weeklyData = new Array(48).fill(-1);

            if (actions.length === 0) {
                return {
                    machineId: machine.MachineID.toString(),
                    finalCode: machine.FinalCode,
                    description: machine.Description,
                    area: machine.Area,
                    efficiency: -1,
                    weeklyData,
                };
            }

            // Build slotActions[slot] = { ideal: [...], mandatory: [...] }
            const slotActions = Array.from({ length: 48 }, () => ({
                ideal: [],
                mandatory: [],
            }));

            for (const action of actions) {
                const occurrences = generateOccurrences(action, yearStartDate, yearEndDate);
                for (const date of occurrences) {
                    const slot = dateToSlot(date);
                    if (slot < 0 || slot > 47) continue;
                    const dateStr = formatDateStr(date);
                    const key = `${action.ActionID}-${dateStr}`;
                    const completed = completionSet.has(key);
                    const entry = { actionId: action.ActionID, dateStr, completed };

                    if (action.Status === 'IDEAL') {
                        slotActions[slot].ideal.push(entry);
                    } else {
                        slotActions[slot].mandatory.push(entry);
                    }
                }
            }

            // Score each slot
            let greenWeeks = 0;
            let yellowWeeks = 0;
            let activeWeeks = 0;

            for (let slot = 0; slot < 48; slot++) {
                const sa = slotActions[slot];
                const hasActions = sa.ideal.length > 0 || sa.mandatory.length > 0;

                if (!hasActions) {
                    weeklyData[slot] = -1;
                    continue;
                }

                // Future slots → neutral
                if (isFutureYear || (isCurrentYear && slot > currentSlot)) {
                    weeklyData[slot] = -1;
                    continue;
                }

                activeWeeks++;

                const allIdealDone = sa.ideal.length === 0 || sa.ideal.every(a => a.completed);
                const allMandatoryDone = sa.mandatory.length === 0 || sa.mandatory.every(a => a.completed);

                if (allIdealDone && allMandatoryDone) {
                    weeklyData[slot] = 1; // green — everything done
                    greenWeeks++;
                } else if (allMandatoryDone) {
                    weeklyData[slot] = 2; // yellow — mandatory done, ideal missed
                    yellowWeeks++;
                } else {
                    weeklyData[slot] = 0; // red — mandatory not done
                }
            }

            const efficiency = activeWeeks > 0
                ? Math.round((greenWeeks * 100 + yellowWeeks * 50) / activeWeeks)
                : -1;

            return {
                machineId: machine.MachineID.toString(),
                finalCode: machine.FinalCode,
                description: machine.Description,
                area: machine.Area,
                efficiency,
                weeklyData,
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Error fetching maintenance summary:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
