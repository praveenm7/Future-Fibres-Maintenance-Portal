const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

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

module.exports = router;
