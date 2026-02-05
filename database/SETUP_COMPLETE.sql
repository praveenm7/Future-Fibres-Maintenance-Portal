-- =============================================
-- Future Fibres Maintenance Portal
-- COMPLETE DATABASE SETUP (All-in-One)
-- =============================================
-- Run this ENTIRE script in SSMS as Administrator
-- Make sure to run SSMS as Administrator!
-- =============================================

-- Step 1: Create the database
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'FutureFibresMaintenance')
BEGIN
    ALTER DATABASE FutureFibresMaintenance SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE FutureFibresMaintenance;
    PRINT 'Existing database dropped.';
END
GO

CREATE DATABASE FutureFibresMaintenance;
GO

PRINT 'Database FutureFibresMaintenance created successfully.';
PRINT 'Switching to new database...';
GO

-- Step 2: Switch to the new database
USE FutureFibresMaintenance;
GO

PRINT 'Now in FutureFibresMaintenance database. Creating tables...';
GO

-- Step 3: Create all tables (rest of the schema from 01_schema.sql will go here)
-- Copy the entire content from 01_schema.sql starting from the Operators table creation
GO

-- =============================================
-- Table: Operators
-- Description: Personnel who operate and maintain machines
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Operators]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Operators] (
        [OperatorID] INT IDENTITY(1,1) NOT NULL,
        [OperatorName] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(100) NULL,
        [Department] NVARCHAR(50) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Operators] PRIMARY KEY CLUSTERED ([OperatorID] ASC),
        CONSTRAINT [UQ_Operators_Email] UNIQUE ([Email])
    );
    PRINT 'Table Operators created successfully.';
END
GO

-- Index on OperatorName for faster searches
CREATE NONCLUSTERED INDEX [IX_Operators_Name] ON [dbo].[Operators] ([OperatorName] ASC);
GO

-- =============================================
-- Table: Machines
-- Description: Central table for all machinery and tooling
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Machines]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Machines] (
        [MachineID] INT IDENTITY(1,1) NOT NULL,
        [FinalCode] NVARCHAR(50) NOT NULL,
        [Type] NVARCHAR(50) NOT NULL,
        [MachineGroup] NVARCHAR(50) NULL,
        [Description] NVARCHAR(255) NOT NULL,
        [PurchasingDate] DATE NULL,
        [PurchasingCost] DECIMAL(18,2) NULL,
        [PONumber] NVARCHAR(50) NULL,
        [Area] NVARCHAR(100) NULL,
        [Manufacturer] NVARCHAR(100) NULL,
        [Model] NVARCHAR(100) NULL,
        [SerialNumber] NVARCHAR(100) NULL,
        [ManufacturerYear] NVARCHAR(50) NULL,
        [Power] NVARCHAR(50) NULL,
        [PermissionRequired] BIT NOT NULL DEFAULT 0,
        [AuthorizationGroup] NVARCHAR(100) NULL,
        [MaintenanceNeeded] BIT NOT NULL DEFAULT 0,
        [MaintenanceOnHold] BIT NOT NULL DEFAULT 0,
        [PersonInChargeID] INT NULL,
        [ImageUrl] NVARCHAR(500) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Machines] PRIMARY KEY CLUSTERED ([MachineID] ASC),
        CONSTRAINT [UQ_Machines_FinalCode] UNIQUE ([FinalCode]),
        CONSTRAINT [FK_Machines_Operators] FOREIGN KEY ([PersonInChargeID]) 
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL,
        CONSTRAINT [CK_Machines_Type] CHECK ([Type] IN ('MACHINE', 'TOOLING'))
    );
    PRINT 'Table Machines created successfully.';
END
GO

-- Indexes for Machines table
CREATE NONCLUSTERED INDEX [IX_Machines_Type] ON [dbo].[Machines] ([Type] ASC);
CREATE NONCLUSTERED INDEX [IX_Machines_Area] ON [dbo].[Machines] ([Area] ASC);
CREATE NONCLUSTERED INDEX [IX_Machines_PersonInCharge] ON [dbo].[Machines] ([PersonInChargeID] ASC);
GO

-- =============================================
-- Table: MaintenanceActions
-- Description: Scheduled maintenance tasks for machines
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MaintenanceActions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MaintenanceActions] (
        [ActionID] INT IDENTITY(1,1) NOT NULL,
        [MachineID] INT NOT NULL,
        [Action] NVARCHAR(500) NOT NULL,
        [Periodicity] NVARCHAR(50) NOT NULL,
        [TimeNeeded] INT NULL,
        [MaintenanceInCharge] BIT NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL,
        [Month] NVARCHAR(50) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_MaintenanceActions] PRIMARY KEY CLUSTERED ([ActionID] ASC),
        CONSTRAINT [FK_MaintenanceActions_Machines] FOREIGN KEY ([MachineID]) 
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [CK_MaintenanceActions_Periodicity] CHECK ([Periodicity] IN 
            ('BEFORE EACH USE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
        CONSTRAINT [CK_MaintenanceActions_Status] CHECK ([Status] IN ('IDEAL', 'MANDATORY'))
    );
    PRINT 'Table MaintenanceActions created successfully.';
END
GO

-- Indexes for MaintenanceActions table
CREATE NONCLUSTERED INDEX [IX_MaintenanceActions_MachineID] ON [dbo].[MaintenanceActions] ([MachineID] ASC);
CREATE NONCLUSTERED INDEX [IX_MaintenanceActions_Periodicity] ON [dbo].[MaintenanceActions] ([Periodicity] ASC);
GO

-- =============================================
-- Table: NonConformities
-- Description: Issues, failures, and preventive maintenance records
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NonConformities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NonConformities] (
        [NCID] INT IDENTITY(1,1) NOT NULL,
        [NCCode] NVARCHAR(50) NOT NULL,
        [MachineID] INT NOT NULL,
        [Area] NVARCHAR(100) NULL,
        [MaintenanceOperatorID] INT NULL,
        [CreationDate] DATE NOT NULL,
        [InitiationDate] DATE NULL,
        [FinishDate] DATE NULL,
        [Status] NVARCHAR(50) NOT NULL,
        [Priority] INT NOT NULL,
        [Category] NVARCHAR(100) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_NonConformities] PRIMARY KEY CLUSTERED ([NCID] ASC),
        CONSTRAINT [UQ_NonConformities_NCCode] UNIQUE ([NCCode]),
        CONSTRAINT [FK_NonConformities_Machines] FOREIGN KEY ([MachineID]) 
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [FK_NonConformities_Operators] FOREIGN KEY ([MaintenanceOperatorID]) 
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL,
        CONSTRAINT [CK_NonConformities_Status] CHECK ([Status] IN 
            ('PENDING', 'IN PROGRESS', 'COMPLETED', 'CANCELLED')),
        CONSTRAINT [CK_NonConformities_Priority] CHECK ([Priority] BETWEEN 1 AND 10)
    );
    PRINT 'Table NonConformities created successfully.';
END
GO

-- Indexes for NonConformities table
CREATE NONCLUSTERED INDEX [IX_NonConformities_MachineID] ON [dbo].[NonConformities] ([MachineID] ASC);
CREATE NONCLUSTERED INDEX [IX_NonConformities_OperatorID] ON [dbo].[NonConformities] ([MaintenanceOperatorID] ASC);
CREATE NONCLUSTERED INDEX [IX_NonConformities_Status] ON [dbo].[NonConformities] ([Status] ASC);
CREATE NONCLUSTERED INDEX [IX_NonConformities_Priority] ON [dbo].[NonConformities] ([Priority] ASC);
GO

-- =============================================
-- Table: NCComments
-- Description: Comments and updates on non-conformities
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NCComments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[NCComments] (
        [CommentID] INT IDENTITY(1,1) NOT NULL,
        [NCID] INT NOT NULL,
        [CommentDate] DATE NOT NULL,
        [Comment] NVARCHAR(1000) NOT NULL,
        [OperatorID] INT NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_NCComments] PRIMARY KEY CLUSTERED ([CommentID] ASC),
        CONSTRAINT [FK_NCComments_NonConformities] FOREIGN KEY ([NCID]) 
            REFERENCES [dbo].[NonConformities]([NCID]) ON DELETE CASCADE,
        CONSTRAINT [FK_NCComments_Operators] FOREIGN KEY ([OperatorID]) 
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL
    );
    PRINT 'Table NCComments created successfully.';
END
GO

-- Indexes for NCComments table
CREATE NONCLUSTERED INDEX [IX_NCComments_NCID] ON [dbo].[NCComments] ([NCID] ASC);
CREATE NONCLUSTERED INDEX [IX_NCComments_Date] ON [dbo].[NCComments] ([CommentDate] ASC);
GO

-- =============================================
-- Table: SpareParts
-- Description: Spare parts inventory for machines
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SpareParts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SpareParts] (
        [SparePartID] INT IDENTITY(1,1) NOT NULL,
        [MachineID] INT NOT NULL,
        [Description] NVARCHAR(255) NOT NULL,
        [Reference] NVARCHAR(100) NULL,
        [Quantity] INT NOT NULL DEFAULT 0,
        [Link] NVARCHAR(500) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_SpareParts] PRIMARY KEY CLUSTERED ([SparePartID] ASC),
        CONSTRAINT [FK_SpareParts_Machines] FOREIGN KEY ([MachineID]) 
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [CK_SpareParts_Quantity] CHECK ([Quantity] >= 0)
    );
    PRINT 'Table SpareParts created successfully.';
END
GO

-- Indexes for SpareParts table
CREATE NONCLUSTERED INDEX [IX_SpareParts_MachineID] ON [dbo].[SpareParts] ([MachineID] ASC);
CREATE NONCLUSTERED INDEX [IX_SpareParts_Reference] ON [dbo].[SpareParts] ([Reference] ASC);
GO

-- =============================================
-- Table: AuthorizationMatrix
-- Description: Operator authorizations for equipment groups
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[AuthorizationMatrix]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[AuthorizationMatrix] (
        [AuthMatrixID] INT IDENTITY(1,1) NOT NULL,
        [OperatorID] INT NOT NULL,
        [UpdatedDate] DATE NOT NULL,
        [Authorizations] NVARCHAR(MAX) NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [LastUpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_AuthorizationMatrix] PRIMARY KEY CLUSTERED ([AuthMatrixID] ASC),
        CONSTRAINT [UQ_AuthorizationMatrix_OperatorID] UNIQUE ([OperatorID]),
        CONSTRAINT [FK_AuthorizationMatrix_Operators] FOREIGN KEY ([OperatorID]) 
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE CASCADE
    );
    PRINT 'Table AuthorizationMatrix created successfully.';
END
GO

-- =============================================
-- Table: ListOptions
-- Description: Configurable dropdown values for the application
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ListOptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ListOptions] (
        [ListOptionID] INT IDENTITY(1,1) NOT NULL,
        [ListType] NVARCHAR(50) NOT NULL,
        [OptionValue] NVARCHAR(100) NOT NULL,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ListOptions] PRIMARY KEY CLUSTERED ([ListOptionID] ASC)
    );
    PRINT 'Table ListOptions created successfully.';
END
GO

-- Indexes for ListOptions table
CREATE NONCLUSTERED INDEX [IX_ListOptions_Type] ON [dbo].[ListOptions] ([ListType] ASC);
CREATE NONCLUSTERED INDEX [IX_ListOptions_Type_Sort] ON [dbo].[ListOptions] ([ListType] ASC, [SortOrder] ASC);
GO

-- =============================================
-- Triggers for automatic UpdatedDate
-- =============================================

-- Trigger for Operators
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Operators_UpdateDate')
    DROP TRIGGER [dbo].[TR_Operators_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_Operators_UpdateDate]
ON [dbo].[Operators]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Operators]
    SET [UpdatedDate] = GETDATE()
    FROM [dbo].[Operators] o
    INNER JOIN inserted i ON o.[OperatorID] = i.[OperatorID];
END
GO

-- Trigger for Machines
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Machines_UpdateDate')
    DROP TRIGGER [dbo].[TR_Machines_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_Machines_UpdateDate]
ON [dbo].[Machines]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Machines]
    SET [UpdatedDate] = GETDATE()
    FROM [dbo].[Machines] m
    INNER JOIN inserted i ON m.[MachineID] = i.[MachineID];
END
GO

-- Trigger for MaintenanceActions
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_MaintenanceActions_UpdateDate')
    DROP TRIGGER [dbo].[TR_MaintenanceActions_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_MaintenanceActions_UpdateDate]
ON [dbo].[MaintenanceActions]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[MaintenanceActions]
    SET [UpdatedDate] = GETDATE()
    FROM [dbo].[MaintenanceActions] ma
    INNER JOIN inserted i ON ma.[ActionID] = i.[ActionID];
END
GO

-- Trigger for NonConformities
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_NonConformities_UpdateDate')
    DROP TRIGGER [dbo].[TR_NonConformities_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_NonConformities_UpdateDate]
ON [dbo].[NonConformities]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[NonConformities]
    SET [UpdatedDate] = GETDATE()
    FROM [dbo].[NonConformities] nc
    INNER JOIN inserted i ON nc.[NCID] = i.[NCID];
END
GO

-- Trigger for SpareParts
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_SpareParts_UpdateDate')
    DROP TRIGGER [dbo].[TR_SpareParts_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_SpareParts_UpdateDate]
ON [dbo].[SpareParts]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[SpareParts]
    SET [UpdatedDate] = GETDATE()
    FROM [dbo].[SpareParts] sp
    INNER JOIN inserted i ON sp.[SparePartID] = i.[SparePartID];
END
GO

-- Trigger for AuthorizationMatrix
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_AuthorizationMatrix_UpdateDate')
    DROP TRIGGER [dbo].[TR_AuthorizationMatrix_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_AuthorizationMatrix_UpdateDate]
ON [dbo].[AuthorizationMatrix]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[AuthorizationMatrix]
    SET [LastUpdatedDate] = GETDATE()
    FROM [dbo].[AuthorizationMatrix] am
    INNER JOIN inserted i ON am.[AuthMatrixID] = i.[AuthMatrixID];
END
GO

PRINT '=============================================';
PRINT 'Database schema created successfully!';
PRINT 'Database: FutureFibresMaintenance';
PRINT 'Tables: 8';
PRINT 'Triggers: 6';
PRINT '=============================================';
GO
