const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { generateOccurrences, formatDateStr } = require('../utils/occurrences');

// --- Helpers ---

function parseTime(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + (m || 0);
}

function minutesToTime(mins) {
    const normalized = ((mins % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const PERIODICITY_WEIGHT = {
    'YEARLY': 0,
    'QUARTERLY': 1,
    'MONTHLY': 2,
    'WEEKLY': 3,
    'BEFORE EACH USE': 4,
};

// Static meal breaks — fixed times of day
const STATIC_BREAKS = [
    { time: 60,   label: 'Midnight' },   // 01:00
    { time: 480,  label: 'Breakfast' },   // 08:00
    { time: 720,  label: 'Lunch' },       // 12:00
    { time: 1200, label: 'Dinner' },      // 20:00
];

/**
 * Compute which static breaks fall within a shift window.
 * Handles overnight shifts where workEnd > 1440 (normalized).
 */
function computeApplicableBreaks(workStart, workEnd, breakDuration) {
    const breaks = [];
    for (const b of STATIC_BREAKS) {
        let t = b.time;
        // For overnight shifts, check the next-day version of the break
        if (t < workStart && workEnd > 1440) {
            t += 1440;
        }
        if (t >= workStart && t + breakDuration <= workEnd) {
            breaks.push({
                label: b.label,
                start: t,
                end: t + breakDuration,
                startDisplay: minutesToTime(t),
                endDisplay: minutesToTime(t + breakDuration),
            });
        }
    }
    return breaks;
}

/**
 * Find the earliest available time slot that doesn't conflict with any busy interval.
 */
function findEarliestSlot(opBusy, machineBusy, duration, workStart, workEnd, breakIntervals, buffer) {
    const allBlocked = [
        ...opBusy.map(s => ({ start: s[0], end: s[1], isBreak: false })),
        ...machineBusy.map(s => ({ start: s[0], end: s[1], isBreak: false })),
        ...breakIntervals.map(b => ({ start: b.start, end: b.end, isBreak: true })),
    ].sort((a, b) => a.start - b.start);

    let candidate = workStart;

    while (candidate + duration <= workEnd) {
        const candidateEnd = candidate + duration;
        let conflict = false;

        for (const block of allBlocked) {
            const effectiveStart = block.isBreak ? block.start : block.start - buffer;
            const effectiveEnd = block.isBreak ? block.end : block.end + buffer;

            if (candidate < effectiveEnd && candidateEnd > effectiveStart) {
                candidate = block.isBreak ? block.end : block.end + buffer;
                conflict = true;
                break;
            }
        }

        if (!conflict) {
            return { start: candidate, end: candidateEnd };
        }
    }

    return null;
}

// GET /api/schedule/daily?date=2026-02-20
router.get('/daily', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: '"date" query parameter is required' });
        }

        const config = {
            breakDuration: parseInt(req.query.breakDuration) || 30,
            bufferMinutes: parseInt(req.query.buffer) || 5,
            prioritizeMandatory: req.query.prioritizeMandatory !== 'false',
            groupByMachine: req.query.groupByMachine !== 'false',
        };

        const buffer = config.bufferMinutes;
        const breakDuration = config.breakDuration;

        const pool = await poolPromise;

        // Parallel queries for all needed data
        const [actionsResult, machinesResult, operatorsResult, authResult, execResult, shiftsResult, overridesResult] =
            await Promise.all([
                pool.request().query('SELECT * FROM MaintenanceActions'),
                pool.request().execute('sp_GetMachinesWithOperator'),
                pool.request().query(`
                    SELECT o.*, s.ShiftName AS DefaultShiftName, s.StartTime AS DefaultStartTime, s.EndTime AS DefaultEndTime
                    FROM Operators o
                    LEFT JOIN Shifts s ON o.DefaultShiftID = s.ShiftID
                    WHERE o.IsActive = 1
                `),
                pool.request().execute('sp_GetAuthorizationMatrix'),
                pool.request()
                    .input('ScheduledDate', sql.Date, date)
                    .query(`
                        SELECT me.*, o.OperatorName
                        FROM MaintenanceExecutions me
                        LEFT JOIN Operators o ON me.CompletedByID = o.OperatorID
                        WHERE me.ScheduledDate = @ScheduledDate
                    `),
                pool.request().query('SELECT * FROM Shifts WHERE IsActive = 1'),
                pool.request()
                    .input('ShiftDate', sql.Date, date)
                    .query(`
                        SELECT oso.*, s.ShiftName, s.StartTime, s.EndTime
                        FROM OperatorShiftOverrides oso
                        LEFT JOIN Shifts s ON oso.ShiftID = s.ShiftID
                        WHERE oso.ShiftDate = @ShiftDate
                    `),
            ]);

        // Build override map: operatorId → override record
        const overrideMap = new Map();
        for (const ov of overridesResult.recordset) {
            overrideMap.set(ov.OperatorID, ov);
        }

        // Build shift definitions map
        const shiftDefMap = new Map();
        for (const s of shiftsResult.recordset) {
            shiftDefMap.set(s.ShiftID, s);
        }

        // Build lookup maps
        const machineMap = new Map();
        for (const m of machinesResult.recordset) {
            if (m.MaintenanceNeeded && !m.MaintenanceOnHold) {
                machineMap.set(m.MachineID, m);
            }
        }

        const executionMap = new Map();
        for (const e of execResult.recordset) {
            executionMap.set(e.ActionID, e);
        }

        // Build authorization map
        const authMap = new Map();
        for (const auth of authResult.recordset) {
            let groups = new Set();
            if (auth.Authorizations) {
                try {
                    const parsed = typeof auth.Authorizations === 'string'
                        ? JSON.parse(auth.Authorizations)
                        : auth.Authorizations;
                    for (const [groupName, isAuthorized] of Object.entries(parsed)) {
                        if (isAuthorized) groups.add(groupName);
                    }
                } catch { /* invalid JSON */ }
            }
            authMap.set(auth.OperatorID, groups);
        }

        // Compute effective shift for each operator and group them
        const operatorsByShift = new Map(); // shiftId → [operator objects]
        const unassignedOperators = [];

        for (const op of operatorsResult.recordset) {
            const override = overrideMap.get(op.OperatorID);
            let effectiveShiftId = null;
            let effectiveShiftName = null;
            let effectiveStartTime = null;
            let effectiveEndTime = null;

            if (override) {
                if (override.ShiftID == null) {
                    // Day off — skip this operator entirely
                    continue;
                }
                effectiveShiftId = override.ShiftID;
                effectiveShiftName = override.ShiftName;
                effectiveStartTime = override.StartTime;
                effectiveEndTime = override.EndTime;
            } else if (op.DefaultShiftID) {
                effectiveShiftId = op.DefaultShiftID;
                effectiveShiftName = op.DefaultShiftName;
                effectiveStartTime = op.DefaultStartTime;
                effectiveEndTime = op.DefaultEndTime;
            } else {
                // No shift assigned
                unassignedOperators.push({
                    operatorId: op.OperatorID,
                    operatorName: op.OperatorName,
                    department: op.Department || '',
                });
                continue;
            }

            if (!operatorsByShift.has(effectiveShiftId)) {
                operatorsByShift.set(effectiveShiftId, {
                    shiftId: effectiveShiftId,
                    shiftName: effectiveShiftName,
                    startTime: effectiveStartTime,
                    endTime: effectiveEndTime,
                    operators: [],
                });
            }
            operatorsByShift.get(effectiveShiftId).operators.push({
                operatorId: op.OperatorID,
                name: op.OperatorName,
                department: op.Department || '',
                authorizedGroups: authMap.get(op.OperatorID) || new Set(),
                busySlots: [],
            });
        }

        // Step 1: Generate tasks due on the target date
        const targetDate = new Date(date + 'T00:00:00Z');
        const taskCandidates = [];

        for (const action of actionsResult.recordset) {
            const machine = machineMap.get(action.MachineID);
            if (!machine) continue;

            const occurrences = generateOccurrences(action, targetDate, targetDate);
            if (occurrences.length === 0) continue;

            const execution = executionMap.get(action.ActionID);

            taskCandidates.push({
                actionId: action.ActionID,
                machineId: action.MachineID,
                machineFinalCode: machine.FinalCode,
                machineArea: machine.Area || '',
                machineAuthGroup: machine.AuthorizationGroup || '',
                actionText: action.Action,
                periodicity: action.Periodicity,
                status: action.Status,
                maintenanceInCharge: !!action.MaintenanceInCharge,
                personInChargeId: machine.PersonInChargeID,
                timeNeeded: action.TimeNeeded || 15,
                execution: execution || null,
            });
        }

        // Step 2: Sort tasks
        taskCandidates.sort((a, b) => {
            if (config.prioritizeMandatory) {
                const prioA = a.status === 'MANDATORY' ? 0 : 1;
                const prioB = b.status === 'MANDATORY' ? 0 : 1;
                if (prioA !== prioB) return prioA - prioB;
            }
            const pWeightA = PERIODICITY_WEIGHT[a.periodicity] ?? 5;
            const pWeightB = PERIODICITY_WEIGHT[b.periodicity] ?? 5;
            if (pWeightA !== pWeightB) return pWeightA - pWeightB;
            if (config.groupByMachine) {
                if (a.machineId !== b.machineId) return a.machineId - b.machineId;
            }
            if (a.maintenanceInCharge !== b.maintenanceInCharge) {
                return a.maintenanceInCharge ? -1 : 1;
            }
            return b.timeNeeded - a.timeNeeded;
        });

        // Step 3: Schedule tasks across all shifts
        // Machine availability is shared across all shifts (same physical machine)
        const machineAvailability = new Map();
        const scheduledTasks = [];
        const unscheduledTasks = [];

        // Precompute per-shift data
        const shiftData = [];
        for (const [shiftId, shiftGroup] of operatorsByShift) {
            const workStart = parseTime(shiftGroup.startTime);
            let workEnd = parseTime(shiftGroup.endTime);
            if (workEnd <= workStart) workEnd += 1440;

            const breaks = computeApplicableBreaks(workStart, workEnd, breakDuration);
            const totalBreakMinutes = breaks.length * breakDuration;
            const availableMinutes = (workEnd - workStart) - totalBreakMinutes;

            shiftData.push({
                shiftId,
                shiftName: shiftGroup.shiftName,
                startTime: shiftGroup.startTime,
                endTime: shiftGroup.endTime,
                workStart,
                workEnd,
                breaks,
                availableMinutes,
                operators: shiftGroup.operators,
                scheduledTasks: [],
                unscheduledTasks: [],
            });
        }

        // For each task, try to schedule it in any shift with an authorized operator
        for (const task of taskCandidates) {
            let scheduled = false;

            // Try each shift
            for (const shift of shiftData) {
                // Find candidate operators in this shift authorized for the machine
                const candidateOps = [];
                for (const op of shift.operators) {
                    if (!task.machineAuthGroup || op.authorizedGroups.has(task.machineAuthGroup)) {
                        candidateOps.push(op);
                    }
                }

                if (candidateOps.length === 0) continue;

                // Prefer PersonInCharge
                if (task.maintenanceInCharge && task.personInChargeId) {
                    const preferredIdx = candidateOps.findIndex(
                        op => op.operatorId === task.personInChargeId
                    );
                    if (preferredIdx > 0) {
                        const [preferred] = candidateOps.splice(preferredIdx, 1);
                        candidateOps.unshift(preferred);
                    }
                }

                // Try each candidate operator in this shift
                for (const op of candidateOps) {
                    const machineBusy = machineAvailability.get(task.machineId) || [];

                    const slot = findEarliestSlot(
                        op.busySlots, machineBusy, task.timeNeeded,
                        shift.workStart, shift.workEnd, shift.breaks, buffer
                    );

                    if (slot) {
                        op.busySlots.push([slot.start, slot.end]);
                        if (!machineAvailability.has(task.machineId)) {
                            machineAvailability.set(task.machineId, []);
                        }
                        machineAvailability.get(task.machineId).push([slot.start, slot.end]);

                        const schedulingNotes = [];
                        if (task.maintenanceInCharge && task.personInChargeId === op.operatorId) {
                            schedulingNotes.push('Assigned to preferred operator (Person in Charge)');
                        }

                        const scheduledTask = {
                            id: `${task.actionId}-${date}`,
                            actionId: task.actionId.toString(),
                            machineId: task.machineId.toString(),
                            machineFinalCode: task.machineFinalCode,
                            machineArea: task.machineArea,
                            actionText: task.actionText,
                            periodicity: task.periodicity,
                            status: task.status,
                            maintenanceInCharge: task.maintenanceInCharge,
                            timeNeeded: task.timeNeeded,
                            assignedOperatorId: op.operatorId.toString(),
                            assignedOperatorName: op.name,
                            startTime: minutesToTime(slot.start),
                            endTime: minutesToTime(slot.end),
                            startMinute: slot.start,
                            endMinute: slot.end,
                            executionStatus: task.execution?.Status || null,
                            executionId: task.execution?.ExecutionID?.toString() || null,
                            completedByName: task.execution?.OperatorName || null,
                            schedulingNotes,
                        };

                        shift.scheduledTasks.push(scheduledTask);
                        scheduledTasks.push(scheduledTask);
                        scheduled = true;
                        break;
                    }
                }

                if (scheduled) break;
            }

            if (!scheduled) {
                const reason = shiftData.length === 0
                    ? 'No operators with shift assignments'
                    : 'No available time slot across all shifts';

                unscheduledTasks.push({
                    actionId: task.actionId.toString(),
                    machineId: task.machineId.toString(),
                    machineFinalCode: task.machineFinalCode,
                    machineArea: task.machineArea,
                    actionText: task.actionText,
                    periodicity: task.periodicity,
                    status: task.status,
                    timeNeeded: task.timeNeeded,
                    reason,
                });
            }
        }

        // Step 4: Build response grouped by shift
        const shiftResults = shiftData.map(shift => {
            // Build operator lanes for this shift
            const laneMap = new Map();
            for (const task of shift.scheduledTasks) {
                if (!laneMap.has(task.assignedOperatorId)) {
                    const op = shift.operators.find(o => o.operatorId.toString() === task.assignedOperatorId);
                    laneMap.set(task.assignedOperatorId, {
                        operatorId: task.assignedOperatorId,
                        operatorName: task.assignedOperatorName,
                        department: op?.department || '',
                        tasks: [],
                        totalMinutes: 0,
                        utilizationPercent: 0,
                    });
                }
                const lane = laneMap.get(task.assignedOperatorId);
                lane.tasks.push(task);
                lane.totalMinutes += task.timeNeeded;
            }

            // Include operators with no tasks too (they're on this shift but idle)
            for (const op of shift.operators) {
                if (!laneMap.has(op.operatorId.toString())) {
                    laneMap.set(op.operatorId.toString(), {
                        operatorId: op.operatorId.toString(),
                        operatorName: op.name,
                        department: op.department,
                        tasks: [],
                        totalMinutes: 0,
                        utilizationPercent: 0,
                    });
                }
            }

            const operatorLanes = Array.from(laneMap.values())
                .map(lane => ({
                    ...lane,
                    utilizationPercent: shift.availableMinutes > 0
                        ? Math.round((lane.totalMinutes / shift.availableMinutes) * 100)
                        : 0,
                    tasks: lane.tasks.sort((a, b) => a.startMinute - b.startMinute),
                }))
                .sort((a, b) => a.operatorName.localeCompare(b.operatorName));

            return {
                shiftId: shift.shiftId.toString(),
                shiftName: shift.shiftName,
                workdayStart: shift.startTime,
                workdayEnd: shift.endTime,
                breaks: shift.breaks.map(b => ({
                    label: b.label,
                    start: b.startDisplay,
                    end: b.endDisplay,
                    startMinute: b.start,
                    endMinute: b.end,
                })),
                operators: operatorLanes,
            };
        });

        const mandatoryCount = taskCandidates.filter(t => t.status === 'MANDATORY').length;
        const idealCount = taskCandidates.filter(t => t.status === 'IDEAL').length;

        res.json({
            date,
            config,
            shifts: shiftResults,
            unassigned: unassignedOperators.map(op => ({
                operatorId: op.operatorId.toString(),
                operatorName: op.operatorName,
                department: op.department,
            })),
            unscheduled: unscheduledTasks,
            summary: {
                totalTasks: taskCandidates.length,
                scheduledTasks: scheduledTasks.length,
                unscheduledTasks: unscheduledTasks.length,
                totalMinutes: scheduledTasks.reduce((sum, t) => sum + t.timeNeeded, 0),
                mandatoryCount,
                idealCount,
                operatorCount: operatorsResult.recordset.length,
                shiftCount: shiftData.length,
            },
        });
    } catch (err) {
        console.error('Error computing daily schedule:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
