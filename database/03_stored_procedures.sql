-- =============================================
-- Future Fibres Maintenance Portal
-- Stored Procedures
-- =============================================
-- Common database operations and queries
-- =============================================

USE FutureFibresMaintenance;
GO

-- =============================================
-- Dashboard Statistics Procedure
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetDashboardStats]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetDashboardStats];
GO

CREATE PROCEDURE [dbo].[sp_GetDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM [dbo].[Machines]) AS TotalMachines,
        (SELECT COUNT(*) FROM [dbo].[Machines] WHERE [MaintenanceNeeded] = 1) AS MachinesNeedingMaintenance,
        (SELECT COUNT(*) FROM [dbo].[NonConformities] WHERE [Status] = 'PENDING') AS PendingNCs,
        (SELECT COUNT(*) FROM [dbo].[NonConformities] WHERE [Status] = 'IN PROGRESS') AS InProgressNCs,
        (SELECT COUNT(*) FROM [dbo].[MaintenanceActions]) AS TotalMaintenanceActions,
        (SELECT COUNT(*) FROM [dbo].[Operators] WHERE [IsActive] = 1) AS ActiveOperators;
END
GO

-- =============================================
-- Get Machines with Person In Charge Details
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMachinesWithOperator]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMachinesWithOperator];
GO

CREATE PROCEDURE [dbo].[sp_GetMachinesWithOperator]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.*,
        o.[OperatorName] AS PersonInChargeName
    FROM [dbo].[Machines] m
    LEFT JOIN [dbo].[Operators] o ON m.[PersonInChargeID] = o.[OperatorID]
    ORDER BY m.[FinalCode];
END
GO

-- =============================================
-- Get Machine by ID with Details
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMachineById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMachineById];
GO

CREATE PROCEDURE [dbo].[sp_GetMachineById]
    @MachineID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.*,
        o.[OperatorName] AS PersonInChargeName
    FROM [dbo].[Machines] m
    LEFT JOIN [dbo].[Operators] o ON m.[PersonInChargeID] = o.[OperatorID]
    WHERE m.[MachineID] = @MachineID;
END
GO

-- =============================================
-- Get Maintenance Actions by Machine
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMaintenanceActionsByMachine]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMaintenanceActionsByMachine];
GO

CREATE PROCEDURE [dbo].[sp_GetMaintenanceActionsByMachine]
    @MachineID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM [dbo].[MaintenanceActions]
    WHERE [MachineID] = @MachineID
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
-- Get Non-Conformities with Details
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetNonConformitiesWithDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetNonConformitiesWithDetails];
GO

CREATE PROCEDURE [dbo].[sp_GetNonConformitiesWithDetails]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        nc.*,
        m.[FinalCode] AS MachineCode,
        m.[Description] AS MachineDescription,
        o.[OperatorName] AS MaintenanceOperatorName
    FROM [dbo].[NonConformities] nc
    INNER JOIN [dbo].[Machines] m ON nc.[MachineID] = m.[MachineID]
    LEFT JOIN [dbo].[Operators] o ON nc.[MaintenanceOperatorID] = o.[OperatorID]
    ORDER BY nc.[Priority] ASC, nc.[CreationDate] DESC;
END
GO

-- =============================================
-- Get NC Comments by NC ID
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetNCCommentsByNC]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetNCCommentsByNC];
GO

CREATE PROCEDURE [dbo].[sp_GetNCCommentsByNC]
    @NCID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.*,
        o.[OperatorName]
    FROM [dbo].[NCComments] c
    LEFT JOIN [dbo].[Operators] o ON c.[OperatorID] = o.[OperatorID]
    WHERE c.[NCID] = @NCID
    ORDER BY c.[CommentDate] DESC, c.[CreatedDate] DESC;
END
GO

-- =============================================
-- Get Spare Parts by Machine
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSparePartsByMachine]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSparePartsByMachine];
GO

CREATE PROCEDURE [dbo].[sp_GetSparePartsByMachine]
    @MachineID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM [dbo].[SpareParts]
    WHERE [MachineID] = @MachineID
    ORDER BY [Description];
END
GO

-- =============================================
-- Get Authorization Matrix with Operator Details
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetAuthorizationMatrix]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetAuthorizationMatrix];
GO

CREATE PROCEDURE [dbo].[sp_GetAuthorizationMatrix]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        am.*,
        o.[OperatorName],
        o.[Email],
        o.[Department]
    FROM [dbo].[AuthorizationMatrix] am
    INNER JOIN [dbo].[Operators] o ON am.[OperatorID] = o.[OperatorID]
    WHERE o.[IsActive] = 1
    ORDER BY o.[OperatorName];
END
GO

-- =============================================
-- Get List Options by Type
-- =============================================
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

-- =============================================
-- Create New NC with Auto-Generated Code
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateNonConformity]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_CreateNonConformity];
GO

CREATE PROCEDURE [dbo].[sp_CreateNonConformity]
    @MachineID INT,
    @Area NVARCHAR(100),
    @MaintenanceOperatorID INT,
    @CreationDate DATE,
    @Status NVARCHAR(50),
    @Priority INT,
    @Category NVARCHAR(100),
    @NewNCID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Year NVARCHAR(4);
    DECLARE @NextNumber INT;
    DECLARE @NCCode NVARCHAR(50);
    
    -- Get current year
    SET @Year = CAST(YEAR(GETDATE()) AS NVARCHAR(4));
    
    -- Get next NC number for this year
    SELECT @NextNumber = ISNULL(MAX(CAST(RIGHT([NCCode], 4) AS INT)), 0) + 1
    FROM [dbo].[NonConformities]
    WHERE [NCCode] LIKE 'NC' + @Year + '-%';
    
    -- Generate NC Code
    SET @NCCode = 'NC' + @Year + '-' + RIGHT('0000' + CAST(@NextNumber AS NVARCHAR(4)), 4);
    
    -- Insert new NC
    INSERT INTO [dbo].[NonConformities] 
        ([NCCode], [MachineID], [Area], [MaintenanceOperatorID], [CreationDate], [Status], [Priority], [Category])
    VALUES 
        (@NCCode, @MachineID, @Area, @MaintenanceOperatorID, @CreationDate, @Status, @Priority, @Category);
    
    SET @NewNCID = SCOPE_IDENTITY();
    
    SELECT @NewNCID AS NCID, @NCCode AS NCCode;
END
GO

-- =============================================
-- Maintenance Report by Periodicity
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMaintenanceReport]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetMaintenanceReport];
GO

CREATE PROCEDURE [dbo].[sp_GetMaintenanceReport]
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
    WHERE (@Periodicity IS NULL OR ma.[Periodicity] = @Periodicity)
    ORDER BY m.[FinalCode], ma.[Periodicity];
END
GO

-- =============================================
-- Generate Next FinalCode for a Machine
-- Convention: {T}-{GROUP}-{NNNN}
--   T = M (Machine) or T (Tooling)
--   GROUP = EC4, EC5, EC6, EC7
--   NNNN = 4-digit sequence per type+group
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GenerateNextFinalCode]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GenerateNextFinalCode];
GO

CREATE PROCEDURE [dbo].[sp_GenerateNextFinalCode]
    @Type NVARCHAR(50),
    @MachineGroup NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TypePrefix NVARCHAR(1);
    DECLARE @NextSeq INT;
    DECLARE @FinalCode NVARCHAR(50);

    -- Map type to single-letter prefix
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

    -- Get next sequence number for this type+group combination
    SELECT @NextSeq = ISNULL(MAX(
        TRY_CAST(RIGHT([FinalCode], 4) AS INT)
    ), 0) + 1
    FROM [dbo].[Machines]
    WHERE [FinalCode] LIKE @TypePrefix + '-' + @MachineGroup + '-____';

    -- Build the final code
    SET @FinalCode = @TypePrefix + '-' + @MachineGroup + '-' + RIGHT('0000' + CAST(@NextSeq AS NVARCHAR(4)), 4);

    SELECT @FinalCode AS FinalCode;
END
GO

PRINT '=============================================';
PRINT 'Stored Procedures created successfully!';
PRINT 'Total Procedures: 13';
PRINT '=============================================';
GO
