const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { generateOccurrences, countPlannedOccurrences } = require('../utils/occurrences');

// GET /api/dashboards/overview
router.get('/overview', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetOverviewDashboard');

        const kpis = result.recordsets[0][0];
        const ncStatusDist = result.recordsets[1];
        const machinesByArea = result.recordsets[2];
        const ncMonthlyTrend = result.recordsets[3];
        const maintenanceByPeriodicity = result.recordsets[4];

        res.json({
            kpis: {
                totalMachines: kpis.TotalMachines,
                machinesNeedingMaintenance: kpis.MachinesNeedingMaintenance,
                activeNCs: kpis.ActiveNCs,
                overdueNCs: kpis.OverdueNCs,
                criticalSpareParts: kpis.CriticalSpareParts,
                complianceRate: kpis.ComplianceRate
            },
            ncStatusDistribution: ncStatusDist.map(r => ({
                status: r.Status, count: r.Count
            })),
            machinesByArea: machinesByArea.map(r => ({
                area: r.Area, count: r.Count
            })),
            ncMonthlyTrend: ncMonthlyTrend.map(r => ({
                month: r.Month, count: r.Count
            })),
            maintenanceByPeriodicity: maintenanceByPeriodicity.map(r => ({
                periodicity: r.Periodicity,
                idealCount: r.IdealCount,
                mandatoryCount: r.MandatoryCount
            }))
        });
    } catch (err) {
        console.error('Error fetching overview dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboards/nc-analytics?area=
router.get('/nc-analytics', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { area } = req.query;

        const result = await pool.request()
            .input('Area', sql.NVarChar(100), area || null)
            .execute('sp_GetNCAnalytics');

        const kpis = result.recordsets[0][0];
        const ncsByStatus = result.recordsets[1];
        const monthlyTrend = result.recordsets[2];
        const priorityDist = result.recordsets[3];
        const resolutionByArea = result.recordsets[4];
        const topMachines = result.recordsets[5];

        res.json({
            kpis: {
                totalNCs: kpis.TotalNCs,
                openNCs: kpis.OpenNCs,
                avgResolutionDays: kpis.AvgResolutionDays,
                ncsThisMonth: kpis.NCsThisMonth,
                highPriorityOpen: kpis.HighPriorityOpen,
                completionRate: kpis.CompletionRate
            },
            ncsByStatus: ncsByStatus.map(r => ({
                status: r.Status, count: r.Count
            })),
            monthlyTrendByCategory: monthlyTrend.map(r => ({
                month: r.Month, category: r.Category, count: r.Count
            })),
            priorityDistribution: priorityDist.map(r => ({
                priority: r.Priority, count: r.Count
            })),
            avgResolutionByArea: resolutionByArea.map(r => ({
                area: r.Area, avgDays: r.AvgDays, completedCount: r.CompletedCount
            })),
            topMachinesByNCs: topMachines.map(r => ({
                finalCode: r.FinalCode, description: r.Description, ncCount: r.NCCount
            }))
        });
    } catch (err) {
        console.error('Error fetching NC analytics:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboards/equipment-health?type=&area=
router.get('/equipment-health', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { type, area } = req.query;

        const result = await pool.request()
            .input('Type', sql.NVarChar(50), type || null)
            .input('Area', sql.NVarChar(100), area || null)
            .execute('sp_GetEquipmentHealth');

        const kpis = result.recordsets[0][0];
        const typeDist = result.recordsets[1];
        const byGroup = result.recordsets[2];
        const maintenanceBreakdown = result.recordsets[3];
        const ageDist = result.recordsets[4];

        res.json({
            kpis: {
                totalMachines: kpis.TotalMachines,
                machinesWithPlans: kpis.MachinesWithPlans,
                machinesOnHold: kpis.MachinesOnHold,
                avgMachineAge: kpis.AvgMachineAge,
                machinesWithoutPlans: kpis.MachinesWithoutPlans
            },
            machineTypeDistribution: typeDist.map(r => ({
                type: r.Type, count: r.Count
            })),
            machinesByGroup: byGroup.map(r => ({
                group: r.MachineGroup, count: r.Count
            })),
            maintenanceActionsBreakdown: maintenanceBreakdown.map(r => ({
                periodicity: r.Periodicity,
                idealCount: r.IdealCount,
                mandatoryCount: r.MandatoryCount
            })),
            ageDistribution: ageDist.map(r => ({
                bracket: r.AgeBracket, count: r.Count
            }))
        });
    } catch (err) {
        console.error('Error fetching equipment health:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboards/spare-parts?area=
router.get('/spare-parts', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { area } = req.query;

        const result = await pool.request()
            .input('Area', sql.NVarChar(100), area || null)
            .execute('sp_GetSparePartsAnalytics');

        const kpis = result.recordsets[0][0];
        const stockDist = result.recordsets[1];
        const topMachines = result.recordsets[2];
        const partsPerArea = result.recordsets[3];
        const outOfStock = result.recordsets[4];

        res.json({
            kpis: {
                totalPartTypes: kpis.TotalPartTypes,
                outOfStock: kpis.OutOfStock,
                lowStock: kpis.LowStock,
                totalUnits: kpis.TotalUnits,
                machinesWithParts: kpis.MachinesWithParts
            },
            stockDistribution: stockDist.map(r => ({
                level: r.StockLevel, count: r.Count
            })),
            topMachinesByParts: topMachines.map(r => ({
                finalCode: r.FinalCode, description: r.Description, partCount: r.PartCount
            })),
            partsPerArea: partsPerArea.map(r => ({
                area: r.Area, totalQuantity: r.TotalQuantity
            })),
            outOfStockItems: outOfStock.map(r => ({
                machineCode: r.MachineCode,
                machineDescription: r.MachineDescription,
                partDescription: r.PartDescription,
                reference: r.Reference
            }))
        });
    } catch (err) {
        console.error('Error fetching spare parts analytics:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboards/workforce
router.get('/workforce', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetWorkforceAnalytics');

        const kpis = result.recordsets[0][0];
        const workload = result.recordsets[1];
        const byDepartment = result.recordsets[2];
        const authCoverage = result.recordsets[3];
        const performance = result.recordsets[4];

        res.json({
            kpis: {
                activeOperators: kpis.ActiveOperators,
                operatorsWithAuthorizations: kpis.OperatorsWithAuthorizations,
                avgNCsPerOperator: kpis.AvgNCsPerOperator,
                unassignedMachines: kpis.UnassignedMachines,
                departmentsCount: kpis.DepartmentsCount
            },
            ncWorkloadByOperator: workload.map(r => ({
                operatorName: r.OperatorName, ncCount: r.NCCount
            })),
            operatorsByDepartment: byDepartment.map(r => ({
                department: r.Department, count: r.Count
            })),
            authorizationCoverage: authCoverage.map(r => ({
                operatorName: r.OperatorName, authorizedGroups: r.AuthorizedGroups
            })),
            operatorPerformance: performance.map(r => ({
                operatorName: r.OperatorName,
                totalAssigned: r.TotalAssigned,
                completed: r.Completed
            }))
        });
    } catch (err) {
        console.error('Error fetching workforce analytics:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/dashboards/execution-summary?area=&type=
router.get('/execution-summary', async (req, res) => {
    try {
        const pool = await poolPromise;
        const { area, type } = req.query;

        // Build optional filter clause (reused across queries)
        const filterClause = `
            ${area ? 'AND m.Area = @Area' : ''}
            ${type ? 'AND m.Type = @Type' : ''}
        `;

        // Helper to add filter inputs to a request
        const addFilterInputs = (request) => {
            if (area) request.input('Area', sql.NVarChar(100), area);
            if (type) request.input('Type', sql.NVarChar(50), type);
            return request;
        };

        // KPIs for current month — completed count from executions
        const kpiResult = await addFilterInputs(pool.request()).query(`
            DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
            DECLARE @MonthEnd DATE = EOMONTH(GETDATE());

            SELECT
                COUNT(CASE WHEN me.Status = 'COMPLETED' AND me.ScheduledDate >= @MonthStart AND me.ScheduledDate <= @MonthEnd THEN 1 END) AS CompletedThisMonth,
                COUNT(CASE WHEN me.ScheduledDate >= @MonthStart AND me.ScheduledDate <= @MonthEnd THEN 1 END) AS TotalThisMonth,
                AVG(CASE WHEN me.Status = 'COMPLETED' THEN CAST(me.ActualTime AS FLOAT) - CAST(ma.TimeNeeded AS FLOAT) END) AS AvgTimeVariance
            FROM MaintenanceExecutions me
            INNER JOIN MaintenanceActions ma ON me.ActionID = ma.ActionID
            INNER JOIN Machines m ON me.MachineID = m.MachineID
            WHERE 1=1 ${filterClause}
        `);

        // Fetch actions (filtered by machine type/area) to compute planned occurrences
        const actionsResult = await addFilterInputs(pool.request()).query(`
            SELECT ma.ActionID, ma.Periodicity, ma.Month
            FROM MaintenanceActions ma
            INNER JOIN Machines m ON ma.MachineID = m.MachineID
            WHERE 1=1 ${filterClause}
        `);

        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        const plannedThisMonth = countPlannedOccurrences(
            actionsResult.recordset,
            monthStart,
            today
        );

        const kpi = kpiResult.recordset[0];
        const completedThisMonth = kpi.CompletedThisMonth || 0;
        const completionRate = plannedThisMonth > 0 ? Math.round((completedThisMonth / plannedThisMonth) * 100) : 0;

        // Completion trend: last 6 months with planned counts
        const trendResult = await addFilterInputs(pool.request()).query(`
            SELECT
                FORMAT(me.ScheduledDate, 'yyyy-MM') AS Month,
                COUNT(CASE WHEN me.Status = 'COMPLETED' THEN 1 END) AS Completed,
                COUNT(*) AS Total
            FROM MaintenanceExecutions me
            INNER JOIN Machines m ON me.MachineID = m.MachineID
            WHERE me.ScheduledDate >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                ${filterClause}
            GROUP BY FORMAT(me.ScheduledDate, 'yyyy-MM')
            ORDER BY Month
        `);

        // Compute planned count for each trend month
        const trendData = trendResult.recordset.map(r => {
            const [y, m] = r.Month.split('-').map(Number);
            const trendMonthStart = new Date(Date.UTC(y, m - 1, 1));
            // For current month, use today; for past months, use last day
            const isCurrentMonth = y === now.getFullYear() && (m - 1) === now.getMonth();
            const trendMonthEnd = isCurrentMonth
                ? today
                : new Date(Date.UTC(y, m, 0)); // last day of that month
            const planned = countPlannedOccurrences(actionsResult.recordset, trendMonthStart, trendMonthEnd);
            return {
                month: r.Month,
                completed: r.Completed,
                total: r.Total,
                planned,
            };
        });

        res.json({
            kpis: {
                completedThisMonth,
                plannedThisMonth,
                totalThisMonth: kpi.TotalThisMonth || 0,
                completionRate,
                avgTimeVariance: kpi.AvgTimeVariance != null ? Math.round(kpi.AvgTimeVariance * 10) / 10 : null,
            },
            completionTrend: trendData,
        });
    } catch (err) {
        console.error('Error fetching execution summary:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
