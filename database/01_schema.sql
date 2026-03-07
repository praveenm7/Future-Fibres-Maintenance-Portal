-- =============================================
-- Future Fibres Maintenance Portal
-- SQL Server Database Schema (Current State)
-- =============================================
-- Database: FutureFibresMaintenance
-- Multi-entity: FFSL (Sri Lanka), FFVL (Valencia)
-- =============================================
-- IMPORTANT: Run 00_create_database.sql first!
-- =============================================

USE FutureFibresMaintenance;
GO

-- =============================================
-- Table: Entities
-- Description: Factory entities sharing one database
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Entities]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Entities] (
        [EntityID]    INT           NOT NULL,
        [EntityCode]  NVARCHAR(10)  NOT NULL,
        [EntityName]  NVARCHAR(100) NOT NULL,
        [Country]     NVARCHAR(100) NOT NULL,
        CONSTRAINT [PK_Entities] PRIMARY KEY CLUSTERED ([EntityID] ASC),
        CONSTRAINT [UQ_Entities_Code] UNIQUE ([EntityCode])
    );
    PRINT 'Table Entities created successfully.';
END
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
        [Role] NVARCHAR(20) NOT NULL DEFAULT 'USER',
        [DefaultShiftID] INT NULL,
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Operators] PRIMARY KEY CLUSTERED ([OperatorID] ASC),
        CONSTRAINT [UQ_Operators_Email] UNIQUE ([Email]),
        CONSTRAINT [CK_Operators_Role] CHECK ([Role] IN ('ADMIN', 'USER', 'VIEWER')),
        CONSTRAINT [FK_Operators_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID])
    );
    PRINT 'Table Operators created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_Operators_Name] ON [dbo].[Operators] ([OperatorName] ASC);
CREATE NONCLUSTERED INDEX [IX_Operators_Role] ON [dbo].[Operators] ([Role] ASC);
CREATE NONCLUSTERED INDEX [IX_Operators_EntityID] ON [dbo].[Operators] ([EntityID]);
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
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Machines] PRIMARY KEY CLUSTERED ([MachineID] ASC),
        CONSTRAINT [UQ_Machines_FinalCode] UNIQUE ([FinalCode]),
        CONSTRAINT [FK_Machines_Operators] FOREIGN KEY ([PersonInChargeID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL,
        CONSTRAINT [FK_Machines_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID]),
        CONSTRAINT [CK_Machines_Type] CHECK ([Type] IN ('MACHINE', 'TOOLING'))
    );
    PRINT 'Table Machines created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_Machines_Type] ON [dbo].[Machines] ([Type] ASC);
CREATE NONCLUSTERED INDEX [IX_Machines_Area] ON [dbo].[Machines] ([Area] ASC);
CREATE NONCLUSTERED INDEX [IX_Machines_PersonInCharge] ON [dbo].[Machines] ([PersonInChargeID] ASC);
CREATE NONCLUSTERED INDEX [IX_Machines_EntityID] ON [dbo].[Machines] ([EntityID]);
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
        [IntervalMultiplier] INT NOT NULL DEFAULT 1,
        [DayOfWeek] INT NULL,
        [WeekOfMonth] INT NULL,
        [QuarterMonth] INT NULL,
        [DayOfMonth] INT NULL,
        [TimeNeeded] INT NULL,
        [MaintenanceInCharge] BIT NOT NULL DEFAULT 0,
        [Status] NVARCHAR(50) NOT NULL,
        [Month] NVARCHAR(50) NULL,
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_MaintenanceActions] PRIMARY KEY CLUSTERED ([ActionID] ASC),
        CONSTRAINT [FK_MaintenanceActions_Machines] FOREIGN KEY ([MachineID])
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [FK_MaintenanceActions_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID]),
        CONSTRAINT [CK_MaintenanceActions_Periodicity] CHECK ([Periodicity] IN
            ('BEFORE EACH USE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
        CONSTRAINT [CK_MaintenanceActions_Status] CHECK ([Status] IN ('IDEAL', 'MANDATORY')),
        CONSTRAINT [CK_MaintenanceActions_IntervalMultiplier] CHECK ([IntervalMultiplier] >= 1),
        CONSTRAINT [CK_MaintenanceActions_DayOfWeek] CHECK ([DayOfWeek] IS NULL OR ([DayOfWeek] >= 0 AND [DayOfWeek] <= 6)),
        CONSTRAINT [CK_MaintenanceActions_WeekOfMonth] CHECK ([WeekOfMonth] IS NULL OR ([WeekOfMonth] >= 1 AND [WeekOfMonth] <= 4)),
        CONSTRAINT [CK_MaintenanceActions_QuarterMonth] CHECK ([QuarterMonth] IS NULL OR ([QuarterMonth] >= 1 AND [QuarterMonth] <= 3)),
        CONSTRAINT [CK_MaintenanceActions_DayOfMonth] CHECK ([DayOfMonth] IS NULL OR ([DayOfMonth] >= 1 AND [DayOfMonth] <= 28))
    );
    PRINT 'Table MaintenanceActions created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_MaintenanceActions_MachineID] ON [dbo].[MaintenanceActions] ([MachineID] ASC);
CREATE NONCLUSTERED INDEX [IX_MaintenanceActions_Periodicity] ON [dbo].[MaintenanceActions] ([Periodicity] ASC);
CREATE NONCLUSTERED INDEX [IX_MaintenanceActions_EntityID] ON [dbo].[MaintenanceActions] ([EntityID]);
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
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_SpareParts] PRIMARY KEY CLUSTERED ([SparePartID] ASC),
        CONSTRAINT [FK_SpareParts_Machines] FOREIGN KEY ([MachineID])
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [FK_SpareParts_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID]),
        CONSTRAINT [CK_SpareParts_Quantity] CHECK ([Quantity] >= 0)
    );
    PRINT 'Table SpareParts created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_SpareParts_MachineID] ON [dbo].[SpareParts] ([MachineID] ASC);
CREATE NONCLUSTERED INDEX [IX_SpareParts_Reference] ON [dbo].[SpareParts] ([Reference] ASC);
CREATE NONCLUSTERED INDEX [IX_SpareParts_EntityID] ON [dbo].[SpareParts] ([EntityID]);
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
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [LastUpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_AuthorizationMatrix] PRIMARY KEY CLUSTERED ([AuthMatrixID] ASC),
        CONSTRAINT [UQ_AuthorizationMatrix_OperatorID] UNIQUE ([OperatorID]),
        CONSTRAINT [FK_AuthorizationMatrix_Operators] FOREIGN KEY ([OperatorID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE CASCADE,
        CONSTRAINT [FK_AuthorizationMatrix_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID])
    );
    PRINT 'Table AuthorizationMatrix created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_AuthorizationMatrix_EntityID] ON [dbo].[AuthorizationMatrix] ([EntityID]);
GO

-- =============================================
-- Table: ListOptions
-- Description: Configurable dropdown values (shared across entities)
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

CREATE NONCLUSTERED INDEX [IX_ListOptions_Type] ON [dbo].[ListOptions] ([ListType] ASC);
CREATE NONCLUSTERED INDEX [IX_ListOptions_Type_Sort] ON [dbo].[ListOptions] ([ListType] ASC, [SortOrder] ASC);
GO

-- =============================================
-- Table: MachineDocuments
-- Description: Uploaded documents and manuals for machines
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MachineDocuments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MachineDocuments] (
        [DocumentID] INT IDENTITY(1,1) NOT NULL,
        [MachineID] INT NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [StoredName] NVARCHAR(255) NOT NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [FileSize] INT NULL,
        [MimeType] NVARCHAR(100) NULL,
        [Category] NVARCHAR(50) NOT NULL DEFAULT 'DOCUMENT',
        [UploadedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_MachineDocuments] PRIMARY KEY CLUSTERED ([DocumentID] ASC),
        CONSTRAINT [FK_MachineDocuments_Machines] FOREIGN KEY ([MachineID])
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [CK_MachineDocuments_Category] CHECK ([Category] IN ('DOCUMENT', 'MANUAL'))
    );
    PRINT 'Table MachineDocuments created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_MachineDocuments_MachineID] ON [dbo].[MachineDocuments] ([MachineID] ASC);
CREATE NONCLUSTERED INDEX [IX_MachineDocuments_Category] ON [dbo].[MachineDocuments] ([Category] ASC);
GO

-- =============================================
-- Table: MaintenanceExecutions
-- Description: Track completion of scheduled maintenance actions
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MaintenanceExecutions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MaintenanceExecutions] (
        [ExecutionID] INT IDENTITY(1,1) NOT NULL,
        [ActionID] INT NOT NULL,
        [MachineID] INT NOT NULL,
        [ScheduledDate] DATE NOT NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        [ActualTime] INT NULL,
        [CompletedByID] INT NULL,
        [CompletedDate] DATETIME NULL,
        [Notes] NVARCHAR(1000) NULL,
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_MaintenanceExecutions] PRIMARY KEY CLUSTERED ([ExecutionID] ASC),
        CONSTRAINT [FK_Executions_Actions] FOREIGN KEY ([ActionID])
            REFERENCES [dbo].[MaintenanceActions]([ActionID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Executions_Machines] FOREIGN KEY ([MachineID])
            REFERENCES [dbo].[Machines]([MachineID]),
        CONSTRAINT [FK_Executions_Operators] FOREIGN KEY ([CompletedByID])
            REFERENCES [dbo].[Operators]([OperatorID]),
        CONSTRAINT [FK_MaintenanceExecutions_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID]),
        CONSTRAINT [CK_Executions_Status] CHECK ([Status] IN ('PENDING', 'COMPLETED', 'SKIPPED')),
        CONSTRAINT [UQ_Executions_ActionDate] UNIQUE ([ActionID], [ScheduledDate])
    );
    PRINT 'Table MaintenanceExecutions created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_Executions_DateRange] ON [dbo].[MaintenanceExecutions] ([ScheduledDate], [ActionID]);
CREATE NONCLUSTERED INDEX [IX_Executions_MachineID] ON [dbo].[MaintenanceExecutions] ([MachineID]);
CREATE NONCLUSTERED INDEX [IX_MaintenanceExecutions_EntityID] ON [dbo].[MaintenanceExecutions] ([EntityID]);
GO

-- =============================================
-- Table: Shifts
-- Description: Defines shift patterns
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Shifts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Shifts] (
        [ShiftID] INT IDENTITY(1,1) NOT NULL,
        [ShiftName] NVARCHAR(50) NOT NULL,
        [StartTime] NVARCHAR(5) NOT NULL,
        [EndTime] NVARCHAR(5) NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Shifts] PRIMARY KEY CLUSTERED ([ShiftID] ASC),
        CONSTRAINT [FK_Shifts_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID])
    );
    PRINT 'Table Shifts created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_Shifts_EntityID] ON [dbo].[Shifts] ([EntityID]);
GO

-- Add FK from Operators to Shifts (deferred due to creation order)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Operators_DefaultShift')
BEGIN
    ALTER TABLE [dbo].[Operators]
        ADD CONSTRAINT [FK_Operators_DefaultShift]
        FOREIGN KEY ([DefaultShiftID]) REFERENCES [dbo].[Shifts]([ShiftID]);
END
GO

-- =============================================
-- Table: OperatorShiftOverrides
-- Description: Per-date shift overrides (NULL ShiftID = day off)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OperatorShiftOverrides]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[OperatorShiftOverrides] (
        [OverrideID] INT IDENTITY(1,1) NOT NULL,
        [OperatorID] INT NOT NULL,
        [ShiftDate] DATE NOT NULL,
        [ShiftID] INT NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_OperatorShiftOverrides] PRIMARY KEY CLUSTERED ([OverrideID] ASC),
        CONSTRAINT [FK_Override_Operator] FOREIGN KEY ([OperatorID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Override_Shift] FOREIGN KEY ([ShiftID])
            REFERENCES [dbo].[Shifts]([ShiftID]),
        CONSTRAINT [UQ_Override_OpDate] UNIQUE ([OperatorID], [ShiftDate])
    );
    PRINT 'Table OperatorShiftOverrides created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_Override_ShiftDate] ON [dbo].[OperatorShiftOverrides] ([ShiftDate]);
GO

-- =============================================
-- Table: SupportTickets
-- Description: Maintenance support tickets linked to machines
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupportTickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SupportTickets] (
        [TicketID] INT IDENTITY(1,1) NOT NULL,
        [TicketCode] NVARCHAR(50) NOT NULL,
        [MachineID] INT NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [Category] NVARCHAR(100) NOT NULL,
        [Priority] NVARCHAR(20) NOT NULL,
        [Status] NVARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
        [SubmittedByID] INT NULL,
        [AssignedToID] INT NULL,
        [ApprovedByID] INT NULL,
        [DueDate] DATE NULL,
        [ResolvedDate] DATETIME NULL,
        [ClosedDate] DATETIME NULL,
        [ResolutionNotes] NVARCHAR(MAX) NULL,
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_SupportTickets] PRIMARY KEY CLUSTERED ([TicketID] ASC),
        CONSTRAINT [UQ_SupportTickets_Code] UNIQUE ([TicketCode]),
        CONSTRAINT [FK_SupportTickets_Machine] FOREIGN KEY ([MachineID])
            REFERENCES [dbo].[Machines]([MachineID]) ON DELETE CASCADE,
        CONSTRAINT [FK_SupportTickets_SubmittedBy] FOREIGN KEY ([SubmittedByID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL,
        CONSTRAINT [FK_SupportTickets_AssignedTo] FOREIGN KEY ([AssignedToID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SupportTickets_ApprovedBy] FOREIGN KEY ([ApprovedByID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SupportTickets_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID]),
        CONSTRAINT [CK_SupportTickets_Priority] CHECK ([Priority] IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        CONSTRAINT [CK_SupportTickets_Status] CHECK ([Status] IN
            ('SUBMITTED', 'APPROVED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'))
    );
    PRINT 'Table SupportTickets created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_SupportTickets_MachineID] ON [dbo].[SupportTickets] ([MachineID]);
CREATE NONCLUSTERED INDEX [IX_SupportTickets_Status] ON [dbo].[SupportTickets] ([Status]);
CREATE NONCLUSTERED INDEX [IX_SupportTickets_Priority] ON [dbo].[SupportTickets] ([Priority]);
CREATE NONCLUSTERED INDEX [IX_SupportTickets_AssignedTo] ON [dbo].[SupportTickets] ([AssignedToID]);
CREATE NONCLUSTERED INDEX [IX_SupportTickets_DueDate] ON [dbo].[SupportTickets] ([DueDate]);
CREATE NONCLUSTERED INDEX [IX_SupportTickets_SubmittedBy] ON [dbo].[SupportTickets] ([SubmittedByID]);
CREATE NONCLUSTERED INDEX [IX_SupportTickets_EntityID] ON [dbo].[SupportTickets] ([EntityID]);
GO

-- =============================================
-- Table: TicketComments
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TicketComments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TicketComments] (
        [CommentID] INT IDENTITY(1,1) NOT NULL,
        [TicketID] INT NOT NULL,
        [CommentDate] DATETIME NOT NULL DEFAULT GETDATE(),
        [Comment] NVARCHAR(2000) NOT NULL,
        [OperatorID] INT NULL,
        [IsStatusChange] BIT NOT NULL DEFAULT 0,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_TicketComments] PRIMARY KEY CLUSTERED ([CommentID] ASC),
        CONSTRAINT [FK_TicketComments_Ticket] FOREIGN KEY ([TicketID])
            REFERENCES [dbo].[SupportTickets]([TicketID]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketComments_Operator] FOREIGN KEY ([OperatorID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL
    );
    PRINT 'Table TicketComments created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_TicketComments_TicketID] ON [dbo].[TicketComments] ([TicketID]);
CREATE NONCLUSTERED INDEX [IX_TicketComments_Date] ON [dbo].[TicketComments] ([CommentDate]);
GO

-- =============================================
-- Table: TicketAttachments
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TicketAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TicketAttachments] (
        [AttachmentID] INT IDENTITY(1,1) NOT NULL,
        [TicketID] INT NOT NULL,
        [FileName] NVARCHAR(255) NOT NULL,
        [StoredName] NVARCHAR(255) NOT NULL,
        [FilePath] NVARCHAR(500) NOT NULL,
        [FileSize] INT NULL,
        [MimeType] NVARCHAR(100) NULL,
        [UploadedByID] INT NULL,
        [UploadedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_TicketAttachments] PRIMARY KEY CLUSTERED ([AttachmentID] ASC),
        CONSTRAINT [FK_TicketAttachments_Ticket] FOREIGN KEY ([TicketID])
            REFERENCES [dbo].[SupportTickets]([TicketID]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketAttachments_Operator] FOREIGN KEY ([UploadedByID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL
    );
    PRINT 'Table TicketAttachments created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_TicketAttachments_TicketID] ON [dbo].[TicketAttachments] ([TicketID]);
GO

-- =============================================
-- Table: TaskOrderOverrides
-- Description: Manual task ordering overrides for scheduling
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TaskOrderOverrides]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TaskOrderOverrides] (
        [OverrideID] INT IDENTITY(1,1) NOT NULL,
        [ScheduleDate] DATE NOT NULL,
        [ActionID] INT NOT NULL,
        [SortPosition] INT NOT NULL DEFAULT 0,
        [EntityID] INT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_TaskOrderOverrides] PRIMARY KEY CLUSTERED ([OverrideID] ASC),
        CONSTRAINT [FK_TaskOrderOverrides_Action] FOREIGN KEY ([ActionID])
            REFERENCES [dbo].[MaintenanceActions]([ActionID]) ON DELETE CASCADE,
        CONSTRAINT [FK_TaskOrderOverrides_Entity] FOREIGN KEY ([EntityID]) REFERENCES [dbo].[Entities]([EntityID]),
        CONSTRAINT [UQ_TaskOrderOverrides_DateAction] UNIQUE ([ScheduleDate], [ActionID])
    );
    PRINT 'Table TaskOrderOverrides created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_TaskOrderOverrides_EntityID] ON [dbo].[TaskOrderOverrides] ([EntityID]);
GO

-- =============================================
-- Table: ApiRequestLogs
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

CREATE NONCLUSTERED INDEX [IX_ApiRequestLogs_CreatedDate] ON [dbo].[ApiRequestLogs] ([CreatedDate] DESC);
CREATE NONCLUSTERED INDEX [IX_ApiRequestLogs_Path] ON [dbo].[ApiRequestLogs] ([Path] ASC);
CREATE NONCLUSTERED INDEX [IX_ApiRequestLogs_Method_Path] ON [dbo].[ApiRequestLogs] ([Method] ASC, [Path] ASC)
    INCLUDE ([ResponseTimeMs], [StatusCode], [CreatedDate]);
GO

-- =============================================
-- Table: ErrorLogs
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

CREATE NONCLUSTERED INDEX [IX_ErrorLogs_CreatedDate] ON [dbo].[ErrorLogs] ([CreatedDate] DESC);
GO

-- =============================================
-- Table: _Migrations
-- Description: Tracks applied database migrations
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_Migrations' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[_Migrations] (
        [Name] NVARCHAR(200) PRIMARY KEY,
        [ExecutedDate] DATETIME DEFAULT GETUTCDATE()
    );
    PRINT 'Table _Migrations created successfully.';
END
GO

-- =============================================
-- Triggers for automatic UpdatedDate
-- =============================================

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Operators_UpdateDate')
    DROP TRIGGER [dbo].[TR_Operators_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_Operators_UpdateDate] ON [dbo].[Operators] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE o SET [UpdatedDate] = GETDATE() FROM [dbo].[Operators] o INNER JOIN inserted i ON o.[OperatorID] = i.[OperatorID]; END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Machines_UpdateDate')
    DROP TRIGGER [dbo].[TR_Machines_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_Machines_UpdateDate] ON [dbo].[Machines] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE m SET [UpdatedDate] = GETDATE() FROM [dbo].[Machines] m INNER JOIN inserted i ON m.[MachineID] = i.[MachineID]; END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_MaintenanceActions_UpdateDate')
    DROP TRIGGER [dbo].[TR_MaintenanceActions_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_MaintenanceActions_UpdateDate] ON [dbo].[MaintenanceActions] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE ma SET [UpdatedDate] = GETDATE() FROM [dbo].[MaintenanceActions] ma INNER JOIN inserted i ON ma.[ActionID] = i.[ActionID]; END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_SpareParts_UpdateDate')
    DROP TRIGGER [dbo].[TR_SpareParts_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_SpareParts_UpdateDate] ON [dbo].[SpareParts] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE sp SET [UpdatedDate] = GETDATE() FROM [dbo].[SpareParts] sp INNER JOIN inserted i ON sp.[SparePartID] = i.[SparePartID]; END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_AuthorizationMatrix_UpdateDate')
    DROP TRIGGER [dbo].[TR_AuthorizationMatrix_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_AuthorizationMatrix_UpdateDate] ON [dbo].[AuthorizationMatrix] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE am SET [LastUpdatedDate] = GETDATE() FROM [dbo].[AuthorizationMatrix] am INNER JOIN inserted i ON am.[AuthMatrixID] = i.[AuthMatrixID]; END
GO

IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_SupportTickets_UpdateDate')
    DROP TRIGGER [dbo].[TR_SupportTickets_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_SupportTickets_UpdateDate] ON [dbo].[SupportTickets] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE t SET [UpdatedDate] = GETDATE() FROM [dbo].[SupportTickets] t INNER JOIN inserted i ON t.[TicketID] = i.[TicketID]; END
GO

PRINT '=============================================';
PRINT 'Database schema created successfully!';
PRINT 'Tables: 17 (including _Migrations)';
PRINT 'Triggers: 6';
PRINT '=============================================';
GO
