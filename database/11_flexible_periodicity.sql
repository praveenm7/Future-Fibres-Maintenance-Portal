-- =============================================
-- Migration: Flexible Periodicity System
-- Adds interval multiplier and schedule anchor
-- fields to MaintenanceActions for custom
-- recurrence patterns (e.g. every 2 weeks on Wed)
-- =============================================

USE [FutureFibresMaintenance];
GO

-- ─── 1. Add new columns ─────────────────────────────
-- IntervalMultiplier: every N periods (1 = standard)
-- DayOfWeek: 0=Mon..6=Sun (for WEEKLY, MONTHLY)
-- WeekOfMonth: 1-4 (for MONTHLY nth-weekday)
-- QuarterMonth: 1-3 (month offset within quarter)
-- DayOfMonth: 1-28 (specific day for MONTHLY, QUARTERLY, YEARLY)

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MaintenanceActions') AND name = 'IntervalMultiplier')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD [IntervalMultiplier] INT NOT NULL DEFAULT 1;
    PRINT 'Added IntervalMultiplier column.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MaintenanceActions') AND name = 'DayOfWeek')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD [DayOfWeek] INT NULL;
    PRINT 'Added DayOfWeek column.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MaintenanceActions') AND name = 'WeekOfMonth')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD [WeekOfMonth] INT NULL;
    PRINT 'Added WeekOfMonth column.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MaintenanceActions') AND name = 'QuarterMonth')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD [QuarterMonth] INT NULL;
    PRINT 'Added QuarterMonth column.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MaintenanceActions') AND name = 'DayOfMonth')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD [DayOfMonth] INT NULL;
    PRINT 'Added DayOfMonth column.';
END
GO

-- ─── 2. Update CHECK constraint to include DAILY ────
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MaintenanceActions_Periodicity')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        DROP CONSTRAINT [CK_MaintenanceActions_Periodicity];
    PRINT 'Dropped old periodicity CHECK constraint.';
END
GO

ALTER TABLE [dbo].[MaintenanceActions]
    ADD CONSTRAINT [CK_MaintenanceActions_Periodicity] CHECK (
        [Periodicity] IN ('BEFORE EACH USE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')
    );
PRINT 'Added updated periodicity CHECK constraint (includes DAILY).';
GO

-- ─── 3. Add validation constraints for anchor fields ─
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MaintenanceActions_IntervalMultiplier')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD CONSTRAINT [CK_MaintenanceActions_IntervalMultiplier] CHECK ([IntervalMultiplier] >= 1);
    PRINT 'Added IntervalMultiplier CHECK constraint.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MaintenanceActions_DayOfWeek')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD CONSTRAINT [CK_MaintenanceActions_DayOfWeek] CHECK ([DayOfWeek] IS NULL OR ([DayOfWeek] >= 0 AND [DayOfWeek] <= 6));
    PRINT 'Added DayOfWeek CHECK constraint.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MaintenanceActions_WeekOfMonth')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD CONSTRAINT [CK_MaintenanceActions_WeekOfMonth] CHECK ([WeekOfMonth] IS NULL OR ([WeekOfMonth] >= 1 AND [WeekOfMonth] <= 4));
    PRINT 'Added WeekOfMonth CHECK constraint.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MaintenanceActions_QuarterMonth')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD CONSTRAINT [CK_MaintenanceActions_QuarterMonth] CHECK ([QuarterMonth] IS NULL OR ([QuarterMonth] >= 1 AND [QuarterMonth] <= 3));
    PRINT 'Added QuarterMonth CHECK constraint.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MaintenanceActions_DayOfMonth')
BEGIN
    ALTER TABLE [dbo].[MaintenanceActions]
        ADD CONSTRAINT [CK_MaintenanceActions_DayOfMonth] CHECK ([DayOfMonth] IS NULL OR ([DayOfMonth] >= 1 AND [DayOfMonth] <= 28));
    PRINT 'Added DayOfMonth CHECK constraint.';
END
GO

-- ─── 4. Seed DAILY into ListOptions ─────────────────
IF NOT EXISTS (SELECT 1 FROM [dbo].[ListOptions] WHERE [ListType] = 'PERIODICITY' AND [OptionValue] = 'DAILY')
BEGIN
    -- Shift existing sort orders to make room
    UPDATE [dbo].[ListOptions]
    SET [SortOrder] = [SortOrder] + 1
    WHERE [ListType] = 'PERIODICITY' AND [SortOrder] >= 2;

    INSERT INTO [dbo].[ListOptions] ([ListType], [OptionValue], [SortOrder], [IsActive])
    VALUES ('PERIODICITY', 'DAILY', 2, 1);
    PRINT 'Added DAILY to ListOptions.';
END
GO

-- ─── 5. Update stored procedures ────────────────────

-- sp_GetMaintenanceActionsByMachine: add DAILY to sort order
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
            WHEN 'DAILY' THEN 2
            WHEN 'WEEKLY' THEN 3
            WHEN 'MONTHLY' THEN 4
            WHEN 'QUARTERLY' THEN 5
            WHEN 'YEARLY' THEN 6
            ELSE 7
        END;
END
GO

PRINT 'Updated sp_GetMaintenanceActionsByMachine.';
GO

-- ─── 6. Update dashboard stored procedures ──────────
-- Update any CASE statements in 05_dashboard_stored_procedures.sql
-- that reference periodicity ordering

-- Check if sp_GetMaintenanceDashboard exists and update it
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetMaintenanceDashboard]') AND type in (N'P', N'PC'))
BEGIN
    PRINT 'Note: sp_GetMaintenanceDashboard exists — periodicity CASE statements may need manual review.';
END
GO

PRINT '=== Flexible Periodicity Migration Complete ===';
GO
