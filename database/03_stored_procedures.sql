-- =============================================
-- Future Fibres Maintenance Portal
-- All Stored Procedures (Current State)
-- =============================================
-- Includes: CRUD SPs, Dashboard SPs, Support SPs
-- All entity-scoped with @EntityID parameter
-- =============================================

USE FutureFibresMaintenance;
GO

-- =============================================
-- 1. CRUD Stored Procedures
-- =============================================

-- sp_GetDashboardStats
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetDashboardStats]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetDashboardStats];
GO

CREATE PROCEDURE [dbo].[sp_GetDashboardStats]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE EntityID = @EntityID) AS TotalMachines,
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1 AND EntityID = @EntityID) AS MachinesNeedingMaintenance,
        (SELECT COUNT(*) FROM [dbo].[MaintenanceActions] WHERE EntityID = @EntityID) AS TotalMaintenanceActions,
        (SELECT COUNT(*) FROM [dbo].[Operators] WHERE [IsActive] = 1 AND EntityID = @EntityID) AS ActiveOperators;
END
GO

-- sp_GetMachinesWithOperator
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMachinesWithOperator]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMachinesWithOperator];
GO

CREATE PROCEDURE [dbo].[sp_GetMachinesWithOperator]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.*, o.[OperatorName] AS PersonInChargeName
    FROM [dbo].[Machines] m
    LEFT JOIN [dbo].[Operators] o ON m.[PersonInChargeID] = o.[OperatorID]
    WHERE m.[EntityID] = @EntityID
    ORDER BY m.[FinalCode];
END
GO

-- sp_GetMachineById
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMachineById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMachineById];
GO

CREATE PROCEDURE [dbo].[sp_GetMachineById]
    @MachineID INT,
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT m.*, o.[OperatorName] AS PersonInChargeName
    FROM [dbo].[Machines] m
    LEFT JOIN [dbo].[Operators] o ON m.[PersonInChargeID] = o.[OperatorID]
    WHERE m.[MachineID] = @MachineID AND m.[EntityID] = @EntityID;
END
GO

-- sp_GetMaintenanceActionsByMachine
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMaintenanceActionsByMachine]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMaintenanceActionsByMachine];
GO

CREATE PROCEDURE [dbo].[sp_GetMaintenanceActionsByMachine]
    @MachineID INT,
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT ma.*
    FROM [dbo].[MaintenanceActions] ma
    INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
    WHERE ma.[MachineID] = @MachineID AND m.[EntityID] = @EntityID
    ORDER BY
        CASE ma.[Periodicity]
            WHEN 'BEFORE EACH USE' THEN 1
            WHEN 'DAILY' THEN 2
            WHEN 'WEEKLY' THEN 3
            WHEN 'MONTHLY' THEN 4
            WHEN 'QUARTERLY' THEN 5
            WHEN 'YEARLY' THEN 6
            ELSE 7
        END;
END
GO

-- sp_GetSparePartsByMachine
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSparePartsByMachine]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSparePartsByMachine];
GO

CREATE PROCEDURE [dbo].[sp_GetSparePartsByMachine]
    @MachineID INT,
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT sp.*
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE sp.[MachineID] = @MachineID AND m.[EntityID] = @EntityID
    ORDER BY sp.[Description];
END
GO

-- sp_GetAuthorizationMatrix
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetAuthorizationMatrix]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetAuthorizationMatrix];
GO

CREATE PROCEDURE [dbo].[sp_GetAuthorizationMatrix]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT am.*, o.[OperatorName], o.[Email], o.[Department]
    FROM [dbo].[AuthorizationMatrix] am
    INNER JOIN [dbo].[Operators] o ON am.[OperatorID] = o.[OperatorID]
    WHERE o.[IsActive] = 1 AND am.[EntityID] = @EntityID
    ORDER BY o.[OperatorName];
END
GO

-- sp_GetListOptionsByType (shared across entities)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetListOptionsByType]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetListOptionsByType];
GO

CREATE PROCEDURE [dbo].[sp_GetListOptionsByType]
    @ListType NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM [dbo].[ListOptions]
    WHERE [ListType] = @ListType AND [IsActive] = 1
    ORDER BY [SortOrder], [OptionValue];
END
GO

-- sp_GetMaintenanceReport
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMaintenanceReport]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMaintenanceReport];
GO

CREATE PROCEDURE [dbo].[sp_GetMaintenanceReport]
    @EntityID INT,
    @Periodicity NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        m.[FinalCode],
        m.[Description] AS MachineDescription,
        m.[Area],
        ma.[Action],
        ma.[Periodicity],
        ma.[TimeNeeded],
        ma.[Status],
        o.[OperatorName] AS PersonInCharge
    FROM [dbo].[MaintenanceActions] ma
    INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
    LEFT JOIN [dbo].[Operators] o ON m.[PersonInChargeID] = o.[OperatorID]
    WHERE ma.[EntityID] = @EntityID
      AND (@Periodicity IS NULL OR ma.[Periodicity] = @Periodicity)
    ORDER BY m.[FinalCode], ma.[Periodicity];
END
GO

-- sp_GenerateNextFinalCode
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GenerateNextFinalCode]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GenerateNextFinalCode];
GO

CREATE PROCEDURE [dbo].[sp_GenerateNextFinalCode]
    @EntityID INT,
    @Type NVARCHAR(50),
    @MachineGroup NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EntityCode NVARCHAR(10);
    DECLARE @TypePrefix NVARCHAR(1);
    DECLARE @NextSeq INT;
    DECLARE @FinalCode NVARCHAR(50);

    SELECT @EntityCode = [EntityCode] FROM [dbo].[Entities] WHERE [EntityID] = @EntityID;

    SET @TypePrefix = CASE @Type
        WHEN 'MACHINE' THEN 'M'
        WHEN 'TOOLING' THEN 'T'
        ELSE NULL
    END;

    IF @TypePrefix IS NULL
    BEGIN
        RAISERROR('Invalid Type. Must be MACHINE or TOOLING.', 16, 1);
        RETURN;
    END

    SELECT @NextSeq = ISNULL(MAX(TRY_CAST(RIGHT([FinalCode], 4) AS INT)), 0) + 1
    FROM [dbo].[Machines]
    WHERE [FinalCode] LIKE @EntityCode + '-' + @TypePrefix + '-' + @MachineGroup + '-____';

    SET @FinalCode = @EntityCode + '-' + @TypePrefix + '-' + @MachineGroup + '-' + RIGHT('0000' + CAST(@NextSeq AS NVARCHAR(4)), 4);

    SELECT @FinalCode AS FinalCode;
END
GO

-- =============================================
-- 2. Dashboard Stored Procedures
-- =============================================

-- sp_GetOverviewDashboard
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetOverviewDashboard]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetOverviewDashboard];
GO

CREATE PROCEDURE [dbo].[sp_GetOverviewDashboard]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE EntityID = @EntityID) AS TotalMachines,
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1 AND EntityID = @EntityID) AS MachinesNeedingMaintenance,
        (SELECT COUNT(*) FROM [dbo].[SpareParts] WHERE [Quantity] = 0 AND EntityID = @EntityID) AS CriticalSpareParts,
        CAST(
            CASE WHEN (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1 AND EntityID = @EntityID) = 0 THEN 100.0
            ELSE (SELECT COUNT(DISTINCT ma.[MachineID]) FROM [dbo].[MaintenanceActions] ma
                  INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
                  WHERE m.[MaintenanceNeeded] = 1 AND ma.EntityID = @EntityID) * 100.0
                / (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1 AND EntityID = @EntityID)
            END AS DECIMAL(5,1)
        ) AS ComplianceRate;

    -- Result set 2: (reserved — empty)
    SELECT CAST(NULL AS NVARCHAR(50)) AS [Status], CAST(0 AS INT) AS [Count] WHERE 1 = 0;

    -- Result set 3: Machines by Area
    SELECT ISNULL([Area], 'Unassigned') AS [Area], COUNT(*) AS [Count]
    FROM [dbo].[Machines] WHERE EntityID = @EntityID
    GROUP BY [Area]
    ORDER BY [Count] DESC;

    -- Result set 4: (reserved — empty)
    SELECT CAST(NULL AS NVARCHAR(7)) AS [Month], CAST(0 AS INT) AS [Count] WHERE 1 = 0;

    -- Result set 5: Maintenance Actions by Periodicity
    SELECT
        [Periodicity],
        SUM(CASE WHEN [Status] = 'IDEAL' THEN 1 ELSE 0 END) AS IdealCount,
        SUM(CASE WHEN [Status] = 'MANDATORY' THEN 1 ELSE 0 END) AS MandatoryCount
    FROM [dbo].[MaintenanceActions] WHERE EntityID = @EntityID
    GROUP BY [Periodicity]
    ORDER BY
        CASE [Periodicity]
            WHEN 'BEFORE EACH USE' THEN 1
            WHEN 'DAILY' THEN 2
            WHEN 'WEEKLY' THEN 3
            WHEN 'MONTHLY' THEN 4
            WHEN 'QUARTERLY' THEN 5
            WHEN 'YEARLY' THEN 6
        END;
END
GO

-- sp_GetEquipmentHealth
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetEquipmentHealth]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetEquipmentHealth];
GO

CREATE PROCEDURE [dbo].[sp_GetEquipmentHealth]
    @EntityID INT,
    @Type NVARCHAR(50) = NULL,
    @Area NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Machines]
         WHERE EntityID = @EntityID AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)) AS TotalMachines,
        (SELECT COUNT(DISTINCT ma.[MachineID]) FROM [dbo].[MaintenanceActions] ma
         INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
         WHERE m.EntityID = @EntityID AND (@Type IS NULL OR m.[Type] = @Type) AND (@Area IS NULL OR m.[Area] = @Area)) AS MachinesWithPlans,
        (SELECT COUNT(*) FROM [dbo].[Machines]
         WHERE [MaintenanceOnHold] = 1 AND EntityID = @EntityID
         AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)) AS MachinesOnHold,
        (SELECT AVG(CAST(DATEDIFF(YEAR, [PurchasingDate], GETDATE()) AS FLOAT))
         FROM [dbo].[Machines]
         WHERE [PurchasingDate] IS NOT NULL AND EntityID = @EntityID
         AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)) AS AvgMachineAge,
        (SELECT COUNT(*) FROM [dbo].[Machines] m
         WHERE m.[MaintenanceNeeded] = 1 AND m.EntityID = @EntityID
         AND NOT EXISTS (SELECT 1 FROM [dbo].[MaintenanceActions] ma WHERE ma.[MachineID] = m.[MachineID])
         AND (@Type IS NULL OR m.[Type] = @Type) AND (@Area IS NULL OR m.[Area] = @Area)) AS MachinesWithoutPlans;

    -- Result set 2: Machine type distribution
    SELECT [Type], COUNT(*) AS [Count]
    FROM [dbo].[Machines]
    WHERE EntityID = @EntityID AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)
    GROUP BY [Type];

    -- Result set 3: Machines by group
    SELECT ISNULL([MachineGroup], 'Unassigned') AS [MachineGroup], COUNT(*) AS [Count]
    FROM [dbo].[Machines]
    WHERE EntityID = @EntityID AND (@Type IS NULL OR [Type] = @Type) AND (@Area IS NULL OR [Area] = @Area)
    GROUP BY [MachineGroup]
    ORDER BY [MachineGroup];

    -- Result set 4: Maintenance actions by periodicity
    SELECT
        ma.[Periodicity],
        SUM(CASE WHEN ma.[Status] = 'IDEAL' THEN 1 ELSE 0 END) AS IdealCount,
        SUM(CASE WHEN ma.[Status] = 'MANDATORY' THEN 1 ELSE 0 END) AS MandatoryCount
    FROM [dbo].[MaintenanceActions] ma
    INNER JOIN [dbo].[Machines] m ON ma.[MachineID] = m.[MachineID]
    WHERE m.EntityID = @EntityID AND (@Type IS NULL OR m.[Type] = @Type) AND (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY ma.[Periodicity]
    ORDER BY
        CASE ma.[Periodicity]
            WHEN 'BEFORE EACH USE' THEN 1
            WHEN 'DAILY' THEN 2
            WHEN 'WEEKLY' THEN 3
            WHEN 'MONTHLY' THEN 4
            WHEN 'QUARTERLY' THEN 5
            WHEN 'YEARLY' THEN 6
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
        WHERE [PurchasingDate] IS NOT NULL AND EntityID = @EntityID
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

-- sp_GetSparePartsAnalytics
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSparePartsAnalytics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSparePartsAnalytics];
GO

CREATE PROCEDURE [dbo].[sp_GetSparePartsAnalytics]
    @EntityID INT,
    @Area NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)) AS TotalPartTypes,
        (SELECT COUNT(*) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE sp.[Quantity] = 0 AND m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)) AS OutOfStock,
        (SELECT COUNT(*) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE sp.[Quantity] BETWEEN 1 AND 2 AND m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)) AS LowStock,
        (SELECT ISNULL(SUM(sp.[Quantity]), 0) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)) AS TotalUnits,
        (SELECT COUNT(DISTINCT sp.[MachineID]) FROM [dbo].[SpareParts] sp
         INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
         WHERE m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)) AS MachinesWithParts;

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
    WHERE m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY
        CASE
            WHEN sp.[Quantity] = 0 THEN 'Out of Stock'
            WHEN sp.[Quantity] <= 2 THEN 'Low (1-2)'
            WHEN sp.[Quantity] <= 5 THEN 'Adequate (3-5)'
            ELSE 'Good (6+)'
        END;

    -- Result set 3: Top 10 machines by spare parts count
    SELECT TOP 10
        m.[FinalCode], m.[Description], COUNT(sp.[SparePartID]) AS PartCount
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY m.[FinalCode], m.[Description]
    ORDER BY PartCount DESC;

    -- Result set 4: Spare parts per area
    SELECT ISNULL(m.[Area], 'Unassigned') AS [Area], ISNULL(SUM(sp.[Quantity]), 0) AS TotalQuantity
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)
    GROUP BY m.[Area]
    ORDER BY TotalQuantity DESC;

    -- Result set 5: Out-of-stock items
    SELECT m.[FinalCode] AS MachineCode, m.[Description] AS MachineDescription,
           sp.[Description] AS PartDescription, sp.[Reference]
    FROM [dbo].[SpareParts] sp
    INNER JOIN [dbo].[Machines] m ON sp.[MachineID] = m.[MachineID]
    WHERE sp.[Quantity] = 0 AND m.EntityID = @EntityID AND (@Area IS NULL OR m.[Area] = @Area)
    ORDER BY m.[FinalCode], sp.[Description];
END
GO

-- sp_GetWorkforceAnalytics
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetWorkforceAnalytics]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetWorkforceAnalytics];
GO

CREATE PROCEDURE [dbo].[sp_GetWorkforceAnalytics]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[Operators] WHERE [IsActive] = 1 AND EntityID = @EntityID) AS ActiveOperators,
        (SELECT COUNT(DISTINCT am.[OperatorID]) FROM [dbo].[AuthorizationMatrix] am
         INNER JOIN [dbo].[Operators] o ON am.[OperatorID] = o.[OperatorID]
         WHERE o.[IsActive] = 1 AND o.EntityID = @EntityID) AS OperatorsWithAuthorizations,
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [PersonInChargeID] IS NULL AND EntityID = @EntityID) AS UnassignedMachines,
        (SELECT COUNT(DISTINCT [Department]) FROM [dbo].[Operators] WHERE [IsActive] = 1 AND EntityID = @EntityID) AS DepartmentsCount;

    -- Result set 2: (reserved — empty)
    SELECT CAST(NULL AS NVARCHAR(100)) AS [OperatorName], CAST(0 AS INT) AS NCCount WHERE 1 = 0;

    -- Result set 3: Operators by department
    SELECT [Department], COUNT(*) AS [Count]
    FROM [dbo].[Operators]
    WHERE [IsActive] = 1 AND EntityID = @EntityID
    GROUP BY [Department]
    ORDER BY [Count] DESC;

    -- Result set 4: Authorization coverage
    SELECT TOP 15
        o.[OperatorName],
        (SELECT COUNT(*) FROM OPENJSON(am.[Authorizations]) WHERE [value] = 'true') AS AuthorizedGroups
    FROM [dbo].[AuthorizationMatrix] am
    INNER JOIN [dbo].[Operators] o ON am.[OperatorID] = o.[OperatorID]
    WHERE o.[IsActive] = 1 AND o.EntityID = @EntityID
    ORDER BY AuthorizedGroups DESC;

    -- Result set 5: (reserved — empty)
    SELECT CAST(NULL AS NVARCHAR(100)) AS [OperatorName], CAST(0 AS INT) AS TotalAssigned, CAST(0 AS INT) AS Completed WHERE 1 = 0;

    -- Result set 6: Operator efficiency
    SELECT TOP 15
        o.[OperatorName],
        ROUND(AVG(CAST(ma.[TimeNeeded] AS FLOAT)), 1) AS AvgEstimated,
        ROUND(AVG(CAST(me.[ActualTime] AS FLOAT)), 1) AS AvgActual,
        COUNT(*) AS TaskCount
    FROM [dbo].[MaintenanceExecutions] me
    INNER JOIN [dbo].[MaintenanceActions] ma ON me.[ActionID] = ma.[ActionID]
    INNER JOIN [dbo].[Operators] o ON me.[CompletedByID] = o.[OperatorID]
    WHERE me.[Status] = 'COMPLETED' AND me.[ActualTime] IS NOT NULL
        AND o.[IsActive] = 1 AND o.EntityID = @EntityID
    GROUP BY o.[OperatorName]
    HAVING COUNT(*) >= 3
    ORDER BY TaskCount DESC;

    -- Result set 7: Operator completion rates (last 3 months)
    SELECT TOP 15
        o.[OperatorName],
        COUNT(*) AS TotalTasks,
        SUM(CASE WHEN me.[Status] = 'COMPLETED' THEN 1 ELSE 0 END) AS Completed,
        SUM(CASE WHEN me.[Status] = 'SKIPPED' THEN 1 ELSE 0 END) AS Skipped,
        ROUND(SUM(CASE WHEN me.[Status] = 'COMPLETED' THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 0) AS CompletionRate
    FROM [dbo].[MaintenanceExecutions] me
    INNER JOIN [dbo].[Operators] o ON me.[CompletedByID] = o.[OperatorID]
    WHERE o.[IsActive] = 1 AND o.EntityID = @EntityID
        AND me.[ScheduledDate] >= DATEADD(MONTH, -3, GETDATE())
    GROUP BY o.[OperatorName]
    HAVING COUNT(*) >= 3
    ORDER BY CompletionRate DESC;

    -- Result set 8: Shift coverage
    SELECT o.[OperatorName], o.[Department], s.[ShiftName], s.[StartTime], s.[EndTime]
    FROM [dbo].[Operators] o
    LEFT JOIN [dbo].[Shifts] s ON o.[DefaultShiftID] = s.[ShiftID]
    WHERE o.[IsActive] = 1 AND o.EntityID = @EntityID
    ORDER BY s.[ShiftName], o.[OperatorName];

    -- Result set 9: Maintenance completion trend (last 6 months)
    SELECT
        FORMAT(me.[ScheduledDate], 'yyyy-MM') AS [Month],
        COUNT(CASE WHEN me.[Status] = 'COMPLETED' THEN 1 END) AS Completed,
        COUNT(CASE WHEN me.[Status] = 'SKIPPED' THEN 1 END) AS Skipped,
        COUNT(*) AS Total
    FROM [dbo].[MaintenanceExecutions] me
    WHERE me.EntityID = @EntityID
        AND me.[ScheduledDate] >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
    GROUP BY FORMAT(me.[ScheduledDate], 'yyyy-MM')
    ORDER BY [Month];
END
GO

-- =============================================
-- 3. Support Ticket Stored Procedures
-- =============================================

-- sp_CreateSupportTicket
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateSupportTicket]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_CreateSupportTicket];
GO

CREATE PROCEDURE [dbo].[sp_CreateSupportTicket]
    @EntityID INT,
    @MachineID INT,
    @Title NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(100),
    @Priority NVARCHAR(20),
    @SubmittedByID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EntityCode NVARCHAR(10);
    DECLARE @NextNumber INT;
    DECLARE @TicketCode NVARCHAR(50);

    SELECT @EntityCode = [EntityCode] FROM [dbo].[Entities] WHERE [EntityID] = @EntityID;

    SELECT @NextNumber = ISNULL(MAX(TRY_CAST(RIGHT([TicketCode], 6) AS INT)), 0) + 1
    FROM [dbo].[SupportTickets]
    WHERE [TicketCode] LIKE @EntityCode + '-TKT-%';

    SET @TicketCode = @EntityCode + '-TKT-' + RIGHT('000000' + CAST(@NextNumber AS NVARCHAR(6)), 6);

    INSERT INTO [dbo].[SupportTickets]
        ([TicketCode], [MachineID], [Title], [Description], [Category], [Priority], [Status], [SubmittedByID], [EntityID])
    VALUES
        (@TicketCode, @MachineID, @Title, @Description, @Category, @Priority, 'SUBMITTED', @SubmittedByID, @EntityID);

    SELECT SCOPE_IDENTITY() AS TicketID, @TicketCode AS TicketCode;
END
GO

-- sp_GetSupportTicketsWithDetails
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSupportTicketsWithDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSupportTicketsWithDetails];
GO

CREATE PROCEDURE [dbo].[sp_GetSupportTicketsWithDetails]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.*,
        m.[FinalCode] AS MachineCode,
        m.[Description] AS MachineDescription,
        sub.[OperatorName] AS SubmittedByName,
        asgn.[OperatorName] AS AssignedToName,
        appr.[OperatorName] AS ApprovedByName,
        (SELECT COUNT(*) FROM [dbo].[TicketComments] tc WHERE tc.[TicketID] = t.[TicketID]) AS CommentCount,
        (SELECT COUNT(*) FROM [dbo].[TicketAttachments] ta WHERE ta.[TicketID] = t.[TicketID]) AS AttachmentCount,
        CASE WHEN t.[DueDate] IS NOT NULL AND t.[DueDate] < CAST(GETDATE() AS DATE)
             AND t.[Status] NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')
             THEN 1 ELSE 0 END AS IsOverdue
    FROM [dbo].[SupportTickets] t
    INNER JOIN [dbo].[Machines] m ON t.[MachineID] = m.[MachineID]
    LEFT JOIN [dbo].[Operators] sub ON t.[SubmittedByID] = sub.[OperatorID]
    LEFT JOIN [dbo].[Operators] asgn ON t.[AssignedToID] = asgn.[OperatorID]
    LEFT JOIN [dbo].[Operators] appr ON t.[ApprovedByID] = appr.[OperatorID]
    WHERE t.[EntityID] = @EntityID
    ORDER BY
        CASE t.[Priority] WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 END,
        t.[CreatedDate] DESC;
END
GO

-- sp_GetSupportDashboard
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSupportDashboard]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSupportDashboard];
GO

CREATE PROCEDURE [dbo].[sp_GetSupportDashboard]
    @EntityID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[SupportTickets] WHERE [Status] NOT IN ('CLOSED', 'CANCELLED') AND EntityID = @EntityID) AS OpenTickets,
        (SELECT COUNT(*) FROM [dbo].[SupportTickets]
         WHERE [DueDate] IS NOT NULL AND [DueDate] < CAST(GETDATE() AS DATE)
         AND [Status] NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED') AND EntityID = @EntityID) AS OverdueTickets,
        (SELECT AVG(CAST(DATEDIFF(HOUR, [CreatedDate], [ResolvedDate]) AS FLOAT) / 24.0)
         FROM [dbo].[SupportTickets] WHERE [ResolvedDate] IS NOT NULL AND EntityID = @EntityID) AS AvgResolutionDays,
        (SELECT COUNT(*) FROM [dbo].[SupportTickets]
         WHERE [Priority] = 'CRITICAL' AND [Status] NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED') AND EntityID = @EntityID) AS CriticalOpen,
        (SELECT COUNT(*) FROM [dbo].[SupportTickets]
         WHERE [CreatedDate] >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AND EntityID = @EntityID) AS TicketsThisMonth,
        (SELECT CAST(
            CASE WHEN COUNT(*) = 0 THEN 0
            ELSE COUNT(CASE WHEN [Status] IN ('RESOLVED', 'CLOSED') THEN 1 END) * 100.0 / COUNT(*)
            END AS DECIMAL(5,1))
         FROM [dbo].[SupportTickets] WHERE EntityID = @EntityID) AS ResolutionRate;

    -- Result set 2: Tickets by Status
    SELECT [Status], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets] WHERE EntityID = @EntityID GROUP BY [Status];

    -- Result set 3: Tickets by Priority
    SELECT [Priority], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets] WHERE EntityID = @EntityID GROUP BY [Priority];

    -- Result set 4: Tickets by Category
    SELECT [Category], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets] WHERE EntityID = @EntityID GROUP BY [Category] ORDER BY [Count] DESC;

    -- Result set 5: Top Machines by Ticket Count
    SELECT TOP 10 m.[FinalCode], m.[Description], COUNT(*) AS TicketCount
    FROM [dbo].[SupportTickets] t
    INNER JOIN [dbo].[Machines] m ON t.[MachineID] = m.[MachineID]
    WHERE t.EntityID = @EntityID
    GROUP BY m.[FinalCode], m.[Description]
    ORDER BY TicketCount DESC;

    -- Result set 6: Monthly Trend (Last 12 Months)
    SELECT FORMAT([CreatedDate], 'yyyy-MM') AS [Month], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets]
    WHERE [CreatedDate] >= DATEADD(MONTH, -12, GETDATE()) AND EntityID = @EntityID
    GROUP BY FORMAT([CreatedDate], 'yyyy-MM')
    ORDER BY [Month];
END
GO

PRINT '=============================================';
PRINT 'All Stored Procedures created successfully!';
PRINT 'Total: 14 procedures';
PRINT '  CRUD: sp_GetDashboardStats, sp_GetMachinesWithOperator,';
PRINT '        sp_GetMachineById, sp_GetMaintenanceActionsByMachine,';
PRINT '        sp_GetSparePartsByMachine, sp_GetAuthorizationMatrix,';
PRINT '        sp_GetListOptionsByType, sp_GetMaintenanceReport,';
PRINT '        sp_GenerateNextFinalCode';
PRINT '  Dashboard: sp_GetOverviewDashboard, sp_GetEquipmentHealth,';
PRINT '        sp_GetSparePartsAnalytics, sp_GetWorkforceAnalytics';
PRINT '  Support: sp_CreateSupportTicket,';
PRINT '        sp_GetSupportTicketsWithDetails, sp_GetSupportDashboard';
PRINT '=============================================';
GO
