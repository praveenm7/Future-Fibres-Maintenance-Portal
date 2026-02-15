-- =============================================
-- Future Fibres Maintenance Portal
-- Dashboard Analytics Stored Procedures
-- =============================================
-- Aggregation queries for the Dashboards section
-- =============================================

USE FutureFibresMaintenance;
GO

-- =============================================
-- 1. Overview Dashboard
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetOverviewDashboard]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetOverviewDashboard];
GO

CREATE PROCEDURE [dbo].[sp_GetOverviewDashboard]
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Machines]) AS TotalMachines,
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1) AS MachinesNeedingMaintenance,
        (SELECT COUNT(*) FROM [dbo].[NonConformities] WHERE [Status] IN ('PENDING', 'IN PROGRESS')) AS ActiveNCs,
        (SELECT COUNT(*) FROM [dbo].[NonConformities]
         WHERE [Priority] <= 3 AND [Status] IN ('PENDING', 'IN PROGRESS')
         AND DATEDIFF(DAY, [CreationDate], GETDATE()) > 30) AS OverdueNCs,
        (SELECT COUNT(*) FROM [dbo].[SpareParts] WHERE [Quantity] = 0) AS CriticalSpareParts,
        CAST(
            CASE WHEN (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1) = 0 THEN 100.0
            ELSE (SELECT COUNT(DISTINCT ma.[MachineID]) FROM [dbo].[MaintenanceActions] ma
                  INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
                  WHERE m.[MaintenanceNeeded] = 1) * 100.0
                / (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1)
            END AS DECIMAL(5,1)
        ) AS ComplianceRate;

    -- Result set 2: NC Status Distribution
    SELECT [Status], COUNT(*) AS [Count]
    FROM [dbo].[NonConformities]
    GROUP BY [Status];

    -- Result set 3: Machines by Area
    SELECT ISNULL([Area], 'Unassigned') AS [Area], COUNT(*) AS [Count]
    FROM [dbo].[Machines]
    GROUP BY [Area]
    ORDER BY [Count] DESC;

    -- Result set 4: NC Monthly Trend (Last 12 Months)
    SELECT
        FORMAT([CreationDate], 'yyyy-MM') AS [Month],
        COUNT(*) AS [Count]
    FROM [dbo].[NonConformities]
    WHERE [CreationDate] >= DATEADD(MONTH, -12, GETDATE())
    GROUP BY FORMAT([CreationDate], 'yyyy-MM')
    ORDER BY [Month];

    -- Result set 5: Maintenance Actions by Periodicity
    SELECT
        [Periodicity],
        SUM(CASE WHEN [Status] = 'IDEAL' THEN 1 ELSE 0 END) AS IdealCount,
        SUM(CASE WHEN [Status] = 'MANDATORY' THEN 1 ELSE 0 END) AS MandatoryCount
    FROM [dbo].[MaintenanceActions]
    GROUP BY [Periodicity]
    ORDER BY
        CASE [Periodicity]
            WHEN 'BEFORE EACH USE' THEN 1
            WHEN 'WEEKLY' THEN 2
            WHEN 'MONTHLY' THEN 3
            WHEN 'QUARTERLY' THEN 4
            WHEN 'YEARLY' THEN 5
        END;
END
GO

-- =============================================
-- 2. NC Analytics Dashboard
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetNCAnalytics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetNCAnalytics];
GO

CREATE PROCEDURE [dbo].[sp_GetNCAnalytics]
    @Area NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[NonConformities]
         WHERE (@Area IS NULL OR [Area] = @Area)) AS TotalNCs,
        (SELECT COUNT(*) FROM [dbo].[NonConformities]
         WHERE [Status] IN ('PENDING', 'IN PROGRESS')
         AND (@Area IS NULL OR [Area] = @Area)) AS OpenNCs,
        (SELECT AVG(CAST(DATEDIFF(DAY, [CreationDate], [FinishDate]) AS FLOAT))
         FROM [dbo].[NonConformities]
         WHERE [Status] = 'COMPLETED' AND [FinishDate] IS NOT NULL
         AND (@Area IS NULL OR [Area] = @Area)) AS AvgResolutionDays,
        (SELECT COUNT(*) FROM [dbo].[NonConformities]
         WHERE FORMAT([CreationDate], 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')
         AND (@Area IS NULL OR [Area] = @Area)) AS NCsThisMonth,
        (SELECT COUNT(*) FROM [dbo].[NonConformities]
         WHERE [Priority] <= 3 AND [Status] IN ('PENDING', 'IN PROGRESS')
         AND (@Area IS NULL OR [Area] = @Area)) AS HighPriorityOpen,
        CAST(
            CASE WHEN (SELECT COUNT(*) FROM [dbo].[NonConformities] WHERE (@Area IS NULL OR [Area] = @Area)) = 0 THEN 0
            ELSE (SELECT COUNT(*) FROM [dbo].[NonConformities] WHERE [Status] = 'COMPLETED' AND (@Area IS NULL OR [Area] = @Area)) * 100.0
                / (SELECT COUNT(*) FROM [dbo].[NonConformities] WHERE (@Area IS NULL OR [Area] = @Area))
            END AS DECIMAL(5,1)
        ) AS CompletionRate;

    -- Result set 2: NCs by Status
    SELECT [Status], COUNT(*) AS [Count]
    FROM [dbo].[NonConformities]
    WHERE (@Area IS NULL OR [Area] = @Area)
    GROUP BY [Status];

    -- Result set 3: Monthly trend by category (Last 12 Months)
    SELECT
        FORMAT([CreationDate], 'yyyy-MM') AS [Month],
        ISNULL([Category], 'UNKNOWN') AS [Category],
        COUNT(*) AS [Count]
    FROM [dbo].[NonConformities]
    WHERE [CreationDate] >= DATEADD(MONTH, -12, GETDATE())
    AND (@Area IS NULL OR [Area] = @Area)
    GROUP BY FORMAT([CreationDate], 'yyyy-MM'), [Category]
    ORDER BY [Month];

    -- Result set 4: Priority distribution
    SELECT [Priority], COUNT(*) AS [Count]
    FROM [dbo].[NonConformities]
    WHERE (@Area IS NULL OR [Area] = @Area)
    GROUP BY [Priority]
    ORDER BY [Priority];

    -- Result set 5: Avg resolution time by area
    SELECT
        ISNULL([Area], 'Unassigned') AS [Area],
        AVG(CAST(DATEDIFF(DAY, [CreationDate], [FinishDate]) AS FLOAT)) AS AvgDays,
        COUNT(*) AS CompletedCount
    FROM [dbo].[NonConformities]
    WHERE [Status] = 'COMPLETED' AND [FinishDate] IS NOT NULL
    GROUP BY [Area]
    ORDER BY AvgDays DESC;

    -- Result set 6: Top 10 machines by NC count
    SELECT TOP 10
        m.[FinalCode],
        m.[Description],
        COUNT(nc.[NCID]) AS NCCount
    FROM [dbo].[NonConformities] nc
    INNER JOIN [dbo].[Machines] m ON nc.[MachineID] = m.[MachineID]
    WHERE (@Area IS NULL OR nc.[Area] = @Area)
    GROUP BY m.[FinalCode], m.[Description]
    ORDER BY NCCount DESC;
END
GO

-- =============================================
-- 3. Equipment Health Dashboard
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetEquipmentHealth]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetEquipmentHealth];
GO

CREATE PROCEDURE [dbo].[sp_GetEquipmentHealth]
    @Type NVARCHAR(50) = NULL,
    @Area NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Machines]
         WHERE (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)) AS TotalMachines,
        (SELECT COUNT(DISTINCT ma.[MachineID]) FROM [dbo].[MaintenanceActions] ma
         INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
         WHERE (@Type IS NULL OR m.[Type] = @Type) AND (@Area IS NULL OR m.[Area] = @Area)) AS MachinesWithPlans,
        (SELECT COUNT(*) FROM [dbo].[Machines]
         WHERE [MaintenanceOnHold] = 1
         AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)) AS MachinesOnHold,
        (SELECT AVG(CAST(DATEDIFF(YEAR, [PurchasingDate], GETDATE()) AS FLOAT))
         FROM [dbo].[Machines]
         WHERE [PurchasingDate] IS NOT NULL
         AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)) AS AvgMachineAge,
        (SELECT COUNT(*) FROM [dbo].[Machines] m
         WHERE m.[MaintenanceNeeded] = 1
         AND NOT EXISTS (SELECT 1 FROM [dbo].[MaintenanceActions] ma WHERE ma.[MachineID] = m.[MachineID])
         AND (@Type IS NULL OR m.[Type] = @Type) AND (@Area IS NULL OR m.[Area] = @Area)) AS MachinesWithoutPlans;

    -- Result set 2: Machine type distribution
    SELECT [Type], COUNT(*) AS [Count]
    FROM [dbo].[Machines]
    WHERE (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)
    GROUP BY [Type];

    -- Result set 3: Machines by group
    SELECT ISNULL([MachineGroup], 'Unassigned') AS [MachineGroup], COUNT(*) AS [Count]
    FROM [dbo].[Machines]
    WHERE (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)
    GROUP BY [MachineGroup]
    ORDER BY [MachineGroup];

    -- Result set 4: Maintenance actions by periodicity (stacked IDEAL/MANDATORY)
    SELECT
        ma.[Periodicity],
        SUM(CASE WHEN ma.[Status] = 'IDEAL' THEN 1 ELSE 0 END) AS IdealCount,
        SUM(CASE WHEN ma.[Status] = 'MANDATORY' THEN 1 ELSE 0 END) AS MandatoryCount
    FROM [dbo].[MaintenanceActions] ma
    INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
    WHERE (@Type IS NULL OR m.[Type] = @Type) AND (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY ma.[Periodicity]
    ORDER BY
        CASE ma.[Periodicity]
            WHEN 'BEFORE EACH USE' THEN 1
            WHEN 'WEEKLY' THEN 2
            WHEN 'MONTHLY' THEN 3
            WHEN 'QUARTERLY' THEN 4
            WHEN 'YEARLY' THEN 5
        END;

    -- Result set 5: Equipment age distribution
    SELECT AgeBracket, [Count]
    FROM (
        SELECT
            CASE
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 2 THEN '0-2 years'
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 5 THEN '3-5 years'
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 10 THEN '6-10 years'
                ELSE '10+ years'
            END AS AgeBracket,
            CASE
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 2 THEN 1
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 5 THEN 2
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 10 THEN 3
                ELSE 4
            END AS SortOrder,
            COUNT(*) AS [Count]
        FROM [dbo].[Machines]
        WHERE [PurchasingDate] IS NOT NULL
        AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)
        GROUP BY
            CASE
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 2 THEN '0-2 years'
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 5 THEN '3-5 years'
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 10 THEN '6-10 years'
                ELSE '10+ years'
            END,
            CASE
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 2 THEN 1
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 5 THEN 2
                WHEN DATEDIFF(YEAR, [PurchasingDate], GETDATE()) <= 10 THEN 3
                ELSE 4
            END
    ) sub
    ORDER BY SortOrder;
END
GO

-- =============================================
-- 4. Spare Parts Analytics Dashboard
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSparePartsAnalytics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSparePartsAnalytics];
GO

CREATE PROCEDURE [dbo].[sp_GetSparePartsAnalytics]
    @Area NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE (@Area IS NULL OR m.[Area] = @Area)) AS TotalPartTypes,
        (SELECT COUNT(*) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE sp.[Quantity] = 0
         AND (@Area IS NULL OR m.[Area] = @Area)) AS OutOfStock,
        (SELECT COUNT(*) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE sp.[Quantity] BETWEEN 1 AND 2
         AND (@Area IS NULL OR m.[Area] = @Area)) AS LowStock,
        (SELECT ISNULL(SUM(sp.[Quantity]), 0) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE (@Area IS NULL OR m.[Area] = @Area)) AS TotalUnits,
        (SELECT COUNT(DISTINCT sp.[MachineID]) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE (@Area IS NULL OR m.[Area] = @Area)) AS MachinesWithParts;

    -- Result set 2: Stock level distribution
    SELECT
        CASE
            WHEN sp.[Quantity] = 0 THEN 'Out of Stock'
            WHEN sp.[Quantity] <= 2 THEN 'Low (1-2)'
            WHEN sp.[Quantity] <= 5 THEN 'Adequate (3-5)'
            ELSE 'Good (6+)'
        END AS StockLevel,
        COUNT(*) AS [Count]
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY
        CASE
            WHEN sp.[Quantity] = 0 THEN 'Out of Stock'
            WHEN sp.[Quantity] <= 2 THEN 'Low (1-2)'
            WHEN sp.[Quantity] <= 5 THEN 'Adequate (3-5)'
            ELSE 'Good (6+)'
        END;

    -- Result set 3: Top 10 machines by spare parts count
    SELECT TOP 10
        m.[FinalCode],
        m.[Description],
        COUNT(sp.[SparePartID]) AS PartCount
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY m.[FinalCode], m.[Description]
    ORDER BY PartCount DESC;

    -- Result set 4: Spare parts per area
    SELECT
        ISNULL(m.[Area], 'Unassigned') AS [Area],
        ISNULL(SUM(sp.[Quantity]), 0) AS TotalQuantity
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY m.[Area]
    ORDER BY TotalQuantity DESC;

    -- Result set 5: Out-of-stock items
    SELECT
        m.[FinalCode] AS MachineCode,
        m.[Description] AS MachineDescription,
        sp.[Description] AS PartDescription,
        sp.[Reference]
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE sp.[Quantity] = 0
    AND (@Area IS NULL OR m.[Area] = @Area)
    ORDER BY m.[FinalCode], sp.[Description];
END
GO

-- =============================================
-- 5. Workforce Analytics Dashboard
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetWorkforceAnalytics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetWorkforceAnalytics];
GO

CREATE PROCEDURE [dbo].[sp_GetWorkforceAnalytics]
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Operators] WHERE [IsActive] = 1) AS ActiveOperators,
        (SELECT COUNT(DISTINCT am.[OperatorID]) FROM [dbo].[AuthorizationMatrix] am
         INNER JOIN [dbo].[Operators] o ON am.[OperatorID] = o.[OperatorID]
         WHERE o.[IsActive] = 1) AS OperatorsWithAuthorizations,
        (SELECT AVG(CAST(sub.NCCount AS FLOAT)) FROM (
            SELECT o.[OperatorID], COUNT(nc.[NCID]) AS NCCount
            FROM [dbo].[Operators] o
            LEFT JOIN [dbo].[NonConformities] nc ON o.[OperatorID] = nc.[MaintenanceOperatorID]
            WHERE o.[IsActive] = 1
            GROUP BY o.[OperatorID]
        ) sub) AS AvgNCsPerOperator,
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [PersonInChargeID] IS NULL) AS UnassignedMachines,
        (SELECT COUNT(DISTINCT [Department]) FROM [dbo].[Operators] WHERE [IsActive] = 1) AS DepartmentsCount;

    -- Result set 2: NC workload by operator (top 10)
    SELECT TOP 10
        o.[OperatorName],
        COUNT(nc.[NCID]) AS NCCount
    FROM [dbo].[Operators] o
    INNER JOIN [dbo].[NonConformities] nc ON o.[OperatorID] = nc.[MaintenanceOperatorID]
    WHERE o.[IsActive] = 1
    GROUP BY o.[OperatorName]
    ORDER BY NCCount DESC;

    -- Result set 3: Operators by department
    SELECT [Department], COUNT(*) AS [Count]
    FROM [dbo].[Operators]
    WHERE [IsActive] = 1
    GROUP BY [Department]
    ORDER BY [Count] DESC;

    -- Result set 4: Authorization coverage (count of authorized groups per operator)
    SELECT TOP 15
        o.[OperatorName],
        (SELECT COUNT(*) FROM OPENJSON(am.[Authorizations]) WHERE [value] = 'true') AS AuthorizedGroups
    FROM [dbo].[AuthorizationMatrix] am
    INNER JOIN [dbo].[Operators] o ON am.[OperatorID] = o.[OperatorID]
    WHERE o.[IsActive] = 1
    ORDER BY AuthorizedGroups DESC;

    -- Result set 5: Operator NC performance (assigned vs completed)
    SELECT TOP 10
        o.[OperatorName],
        COUNT(nc.[NCID]) AS TotalAssigned,
        SUM(CASE WHEN nc.[Status] = 'COMPLETED' THEN 1 ELSE 0 END) AS Completed
    FROM [dbo].[Operators] o
    INNER JOIN [dbo].[NonConformities] nc ON o.[OperatorID] = nc.[MaintenanceOperatorID]
    WHERE o.[IsActive] = 1
    GROUP BY o.[OperatorName]
    ORDER BY TotalAssigned DESC;
END
GO

PRINT '=============================================';
PRINT 'Dashboard Analytics Stored Procedures created!';
PRINT 'Total Procedures: 5';
PRINT '  - sp_GetOverviewDashboard';
PRINT '  - sp_GetNCAnalytics';
PRINT '  - sp_GetEquipmentHealth';
PRINT '  - sp_GetSparePartsAnalytics';
PRINT '  - sp_GetWorkforceAnalytics';
PRINT '=============================================';
GO
