-- =============================================
-- Future Fibres Maintenance Portal
-- Admin Panel Schema Migration
-- =============================================
-- Database: FutureFibresMaintenance
-- Version: 1.1
-- Description: Adds Role column to Operators,
--              creates ApiRequestLogs and ErrorLogs tables
-- =============================================

USE FutureFibresMaintenance;
GO

-- =============================================
-- 1. Add Role column to Operators table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Operators]') AND name = 'Role')
BEGIN
    ALTER TABLE [dbo].[Operators] ADD [Role] NVARCHAR(20) NOT NULL DEFAULT 'USER';
    PRINT 'Column [Role] added to Operators table.';
END
GO

-- Add check constraint for Role values
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Operators_Role')
BEGIN
    ALTER TABLE [dbo].[Operators] ADD CONSTRAINT [CK_Operators_Role] CHECK ([Role] IN ('ADMIN', 'USER', 'VIEWER'));
    PRINT 'Constraint CK_Operators_Role added.';
END
GO

-- Update existing ADMIN operator to have ADMIN role
UPDATE [dbo].[Operators] SET [Role] = 'ADMIN' WHERE [OperatorName] = 'ADMIN';
GO

-- Index on Role for filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Operators_Role')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Operators_Role] ON [dbo].[Operators] ([Role] ASC);
    PRINT 'Index IX_Operators_Role created.';
END
GO

-- =============================================
-- 2. Create ApiRequestLogs table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApiRequestLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ApiRequestLogs] (
        [LogID] INT IDENTITY(1,1) NOT NULL,
        [Method] NVARCHAR(10) NOT NULL,
        [Path] NVARCHAR(500) NOT NULL,
        [StatusCode] INT NULL,
        [ResponseTimeMs] INT NULL,
        [RequestBody] NVARCHAR(MAX) NULL,
        [IpAddress] NVARCHAR(50) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ApiRequestLogs] PRIMARY KEY CLUSTERED ([LogID] ASC)
    );
    PRINT 'Table ApiRequestLogs created successfully.';
END
GO

-- Indexes for ApiRequestLogs
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ApiRequestLogs_CreatedDate')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ApiRequestLogs_CreatedDate] ON [dbo].[ApiRequestLogs] ([CreatedDate] DESC);
    PRINT 'Index IX_ApiRequestLogs_CreatedDate created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ApiRequestLogs_Path')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ApiRequestLogs_Path] ON [dbo].[ApiRequestLogs] ([Path] ASC);
    PRINT 'Index IX_ApiRequestLogs_Path created.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ApiRequestLogs_Method_Path')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ApiRequestLogs_Method_Path] ON [dbo].[ApiRequestLogs] ([Method] ASC, [Path] ASC) INCLUDE ([ResponseTimeMs], [StatusCode], [CreatedDate]);
    PRINT 'Index IX_ApiRequestLogs_Method_Path created.';
END
GO

-- =============================================
-- 3. Create ErrorLogs table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ErrorLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ErrorLogs] (
        [ErrorID] INT IDENTITY(1,1) NOT NULL,
        [Path] NVARCHAR(500) NULL,
        [Method] NVARCHAR(10) NULL,
        [ErrorMessage] NVARCHAR(MAX) NULL,
        [StackTrace] NVARCHAR(MAX) NULL,
        [StatusCode] INT NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ErrorLogs] PRIMARY KEY CLUSTERED ([ErrorID] ASC)
    );
    PRINT 'Table ErrorLogs created successfully.';
END
GO

-- Index for ErrorLogs
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ErrorLogs_CreatedDate')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_ErrorLogs_CreatedDate] ON [dbo].[ErrorLogs] ([CreatedDate] DESC);
    PRINT 'Index IX_ErrorLogs_CreatedDate created.';
END
GO

PRINT '=============================================';
PRINT 'Admin schema migration completed successfully!';
PRINT 'Changes:';
PRINT '  - Added Role column to Operators table';
PRINT '  - Created ApiRequestLogs table';
PRINT '  - Created ErrorLogs table';
PRINT '=============================================';
GO
