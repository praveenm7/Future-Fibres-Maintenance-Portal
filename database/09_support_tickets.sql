-- ============================================================
-- Migration: Create Support Ticket System Tables
-- Purpose: Maintenance support ticket tracking with comments
--          and file attachments
-- ============================================================

USE [FutureFibresMaintenance];
GO

-- =============================================
-- Table: SupportTickets
-- Description: Maintenance support tickets linked to machines
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupportTickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SupportTickets] (
        [TicketID]          INT IDENTITY(1,1) NOT NULL,
        [TicketCode]        NVARCHAR(50)  NOT NULL,
        [MachineID]         INT           NOT NULL,
        [Title]             NVARCHAR(200) NOT NULL,
        [Description]       NVARCHAR(MAX) NULL,
        [Category]          NVARCHAR(100) NOT NULL,
        [Priority]          NVARCHAR(20)  NOT NULL,
        [Status]            NVARCHAR(30)  NOT NULL DEFAULT 'SUBMITTED',
        [SubmittedByID]     INT           NULL,
        [AssignedToID]      INT           NULL,
        [ApprovedByID]      INT           NULL,
        [DueDate]           DATE          NULL,
        [ResolvedDate]      DATETIME      NULL,
        [ClosedDate]        DATETIME      NULL,
        [ResolutionNotes]   NVARCHAR(MAX) NULL,
        [CreatedDate]       DATETIME      NOT NULL DEFAULT GETDATE(),
        [UpdatedDate]       DATETIME      NOT NULL DEFAULT GETDATE(),
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
        CONSTRAINT [CK_SupportTickets_Priority] CHECK ([Priority] IN
            ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
        CONSTRAINT [CK_SupportTickets_Status] CHECK ([Status] IN
            ('SUBMITTED', 'APPROVED', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'))
    );
    PRINT 'Table SupportTickets created successfully.';
END
GO

-- Indexes for SupportTickets
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupportTickets_MachineID')
    CREATE NONCLUSTERED INDEX [IX_SupportTickets_MachineID] ON [dbo].[SupportTickets] ([MachineID]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupportTickets_Status')
    CREATE NONCLUSTERED INDEX [IX_SupportTickets_Status] ON [dbo].[SupportTickets] ([Status]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupportTickets_Priority')
    CREATE NONCLUSTERED INDEX [IX_SupportTickets_Priority] ON [dbo].[SupportTickets] ([Priority]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupportTickets_AssignedTo')
    CREATE NONCLUSTERED INDEX [IX_SupportTickets_AssignedTo] ON [dbo].[SupportTickets] ([AssignedToID]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupportTickets_DueDate')
    CREATE NONCLUSTERED INDEX [IX_SupportTickets_DueDate] ON [dbo].[SupportTickets] ([DueDate]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SupportTickets_SubmittedBy')
    CREATE NONCLUSTERED INDEX [IX_SupportTickets_SubmittedBy] ON [dbo].[SupportTickets] ([SubmittedByID]);
GO

-- =============================================
-- Table: TicketComments
-- Description: Comment thread on support tickets
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TicketComments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TicketComments] (
        [CommentID]      INT IDENTITY(1,1) NOT NULL,
        [TicketID]       INT            NOT NULL,
        [CommentDate]    DATETIME       NOT NULL DEFAULT GETDATE(),
        [Comment]        NVARCHAR(2000) NOT NULL,
        [OperatorID]     INT            NULL,
        [IsStatusChange] BIT            NOT NULL DEFAULT 0,
        [CreatedDate]    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_TicketComments] PRIMARY KEY CLUSTERED ([CommentID] ASC),
        CONSTRAINT [FK_TicketComments_Ticket] FOREIGN KEY ([TicketID])
            REFERENCES [dbo].[SupportTickets]([TicketID]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketComments_Operator] FOREIGN KEY ([OperatorID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL
    );
    PRINT 'Table TicketComments created successfully.';
END
GO

-- Indexes for TicketComments
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TicketComments_TicketID')
    CREATE NONCLUSTERED INDEX [IX_TicketComments_TicketID] ON [dbo].[TicketComments] ([TicketID]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TicketComments_Date')
    CREATE NONCLUSTERED INDEX [IX_TicketComments_Date] ON [dbo].[TicketComments] ([CommentDate]);
GO

-- =============================================
-- Table: TicketAttachments
-- Description: File attachments on support tickets
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TicketAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TicketAttachments] (
        [AttachmentID]  INT IDENTITY(1,1) NOT NULL,
        [TicketID]      INT           NOT NULL,
        [FileName]      NVARCHAR(255) NOT NULL,
        [StoredName]    NVARCHAR(255) NOT NULL,
        [FilePath]      NVARCHAR(500) NOT NULL,
        [FileSize]      INT           NULL,
        [MimeType]      NVARCHAR(100) NULL,
        [UploadedByID]  INT           NULL,
        [UploadedDate]  DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_TicketAttachments] PRIMARY KEY CLUSTERED ([AttachmentID] ASC),
        CONSTRAINT [FK_TicketAttachments_Ticket] FOREIGN KEY ([TicketID])
            REFERENCES [dbo].[SupportTickets]([TicketID]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketAttachments_Operator] FOREIGN KEY ([UploadedByID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE SET NULL
    );
    PRINT 'Table TicketAttachments created successfully.';
END
GO

-- Indexes for TicketAttachments
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TicketAttachments_TicketID')
    CREATE NONCLUSTERED INDEX [IX_TicketAttachments_TicketID] ON [dbo].[TicketAttachments] ([TicketID]);
GO

-- =============================================
-- Trigger: Auto-update UpdatedDate on SupportTickets
-- =============================================
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_SupportTickets_UpdateDate')
    DROP TRIGGER [dbo].[TR_SupportTickets_UpdateDate];
GO

CREATE TRIGGER [dbo].[TR_SupportTickets_UpdateDate]
ON [dbo].[SupportTickets]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[SupportTickets]
    SET [UpdatedDate] = GETDATE()
    FROM [dbo].[SupportTickets] t
    INNER JOIN inserted i ON t.[TicketID] = i.[TicketID];
END
GO

-- =============================================
-- Stored Procedure: Generate Next Ticket Code
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GenerateNextTicketCode]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GenerateNextTicketCode];
GO

CREATE PROCEDURE [dbo].[sp_GenerateNextTicketCode]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextNumber INT;
    DECLARE @TicketCode NVARCHAR(50);

    SELECT @NextNumber = ISNULL(MAX(TRY_CAST(RIGHT([TicketCode], 6) AS INT)), 0) + 1
    FROM [dbo].[SupportTickets]
    WHERE [TicketCode] LIKE 'TKT-%';

    SET @TicketCode = 'TKT-' + RIGHT('000000' + CAST(@NextNumber AS NVARCHAR(6)), 6);

    SELECT @TicketCode AS TicketCode;
END
GO

-- =============================================
-- Stored Procedure: Create Support Ticket
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CreateSupportTicket]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_CreateSupportTicket];
GO

CREATE PROCEDURE [dbo].[sp_CreateSupportTicket]
    @MachineID INT,
    @Title NVARCHAR(200),
    @Description NVARCHAR(MAX),
    @Category NVARCHAR(100),
    @Priority NVARCHAR(20),
    @SubmittedByID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NextNumber INT;
    DECLARE @TicketCode NVARCHAR(50);

    SELECT @NextNumber = ISNULL(MAX(TRY_CAST(RIGHT([TicketCode], 6) AS INT)), 0) + 1
    FROM [dbo].[SupportTickets]
    WHERE [TicketCode] LIKE 'TKT-%';

    SET @TicketCode = 'TKT-' + RIGHT('000000' + CAST(@NextNumber AS NVARCHAR(6)), 6);

    INSERT INTO [dbo].[SupportTickets]
        ([TicketCode], [MachineID], [Title], [Description], [Category], [Priority], [Status], [SubmittedByID])
    VALUES
        (@TicketCode, @MachineID, @Title, @Description, @Category, @Priority, 'SUBMITTED', @SubmittedByID);

    SELECT SCOPE_IDENTITY() AS TicketID, @TicketCode AS TicketCode;
END
GO

-- =============================================
-- Stored Procedure: Get Support Tickets with Details
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSupportTicketsWithDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSupportTicketsWithDetails];
GO

CREATE PROCEDURE [dbo].[sp_GetSupportTicketsWithDetails]
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
    ORDER BY
        CASE t.[Priority]
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
        END,
        t.[CreatedDate] DESC;
END
GO

-- =============================================
-- Stored Procedure: Get Support Dashboard Data
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetSupportDashboard]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [dbo].[sp_GetSupportDashboard];
GO

CREATE PROCEDURE [dbo].[sp_GetSupportDashboard]
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: KPIs
    SELECT
        (SELECT COUNT(*) FROM [dbo].[SupportTickets] WHERE [Status] NOT IN ('CLOSED', 'CANCELLED')) AS OpenTickets,
        (SELECT COUNT(*) FROM [dbo].[SupportTickets]
         WHERE [DueDate] IS NOT NULL AND [DueDate] < CAST(GETDATE() AS DATE)
         AND [Status] NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')) AS OverdueTickets,
        (SELECT AVG(CAST(DATEDIFF(HOUR, [CreatedDate], [ResolvedDate]) AS FLOAT) / 24.0)
         FROM [dbo].[SupportTickets] WHERE [ResolvedDate] IS NOT NULL) AS AvgResolutionDays,
        (SELECT COUNT(*) FROM [dbo].[SupportTickets]
         WHERE [Priority] = 'CRITICAL' AND [Status] NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')) AS CriticalOpen,
        (SELECT COUNT(*) FROM [dbo].[SupportTickets]
         WHERE [CreatedDate] >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)) AS TicketsThisMonth,
        (SELECT CAST(
            CASE WHEN COUNT(*) = 0 THEN 0
            ELSE COUNT(CASE WHEN [Status] IN ('RESOLVED', 'CLOSED') THEN 1 END) * 100.0 / COUNT(*)
            END AS DECIMAL(5,1))
         FROM [dbo].[SupportTickets]) AS ResolutionRate;

    -- Result set 2: Tickets by Status
    SELECT [Status], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets] GROUP BY [Status];

    -- Result set 3: Tickets by Priority
    SELECT [Priority], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets] GROUP BY [Priority];

    -- Result set 4: Tickets by Category
    SELECT [Category], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets] GROUP BY [Category] ORDER BY [Count] DESC;

    -- Result set 5: Top Machines by Ticket Count
    SELECT TOP 10 m.[FinalCode], m.[Description], COUNT(*) AS TicketCount
    FROM [dbo].[SupportTickets] t
    INNER JOIN [dbo].[Machines] m ON t.[MachineID] = m.[MachineID]
    GROUP BY m.[FinalCode], m.[Description]
    ORDER BY TicketCount DESC;

    -- Result set 6: Monthly Trend (Last 12 Months)
    SELECT FORMAT([CreatedDate], 'yyyy-MM') AS [Month], COUNT(*) AS [Count]
    FROM [dbo].[SupportTickets]
    WHERE [CreatedDate] >= DATEADD(MONTH, -12, GETDATE())
    GROUP BY FORMAT([CreatedDate], 'yyyy-MM')
    ORDER BY [Month];
END
GO

-- =============================================
-- Seed Data: Ticket Categories in ListOptions
-- =============================================
IF NOT EXISTS (SELECT * FROM [dbo].[ListOptions] WHERE [ListType] = 'TICKET_CATEGORY')
BEGIN
    INSERT INTO [dbo].[ListOptions] ([ListType], [OptionValue], [SortOrder], [IsActive]) VALUES
        ('TICKET_CATEGORY', 'BREAKDOWN', 1, 1),
        ('TICKET_CATEGORY', 'PREVENTIVE', 2, 1),
        ('TICKET_CATEGORY', 'CORRECTIVE', 3, 1),
        ('TICKET_CATEGORY', 'SAFETY', 4, 1),
        ('TICKET_CATEGORY', 'CALIBRATION', 5, 1),
        ('TICKET_CATEGORY', 'ELECTRICAL', 6, 1),
        ('TICKET_CATEGORY', 'MECHANICAL', 7, 1),
        ('TICKET_CATEGORY', 'OTHER', 8, 1);
    PRINT 'Ticket categories seeded successfully.';
END
GO

PRINT 'Support Tickets migration completed successfully.';
GO
