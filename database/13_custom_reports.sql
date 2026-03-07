-- =============================================
-- Migration: Custom Reports
-- Description: Tables for user-defined custom reports
-- =============================================

USE FutureFibresMaintenance;
GO

-- =============================================
-- Table: CustomReports
-- Description: Stores custom report definitions (JSON)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomReports]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CustomReports] (
        [ReportID]        INT IDENTITY(1,1) NOT NULL,
        [ReportName]      NVARCHAR(200) NOT NULL,
        [Description]     NVARCHAR(1000) NULL,
        [Definition]      NVARCHAR(MAX) NOT NULL,
        [OwnerOperatorID] INT NOT NULL,
        [IsShared]        BIT NOT NULL DEFAULT 0,
        [EntityID]        INT NOT NULL,
        [CreatedDate]     DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate]     DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_CustomReports] PRIMARY KEY CLUSTERED ([ReportID] ASC),
        CONSTRAINT [FK_CustomReports_Owner] FOREIGN KEY ([OwnerOperatorID])
            REFERENCES [dbo].[Operators]([OperatorID]),
        CONSTRAINT [FK_CustomReports_Entity] FOREIGN KEY ([EntityID])
            REFERENCES [dbo].[Entities]([EntityID])
    );
    PRINT 'Table CustomReports created successfully.';
END
GO

CREATE NONCLUSTERED INDEX [IX_CustomReports_EntityID] ON [dbo].[CustomReports] ([EntityID]);
CREATE NONCLUSTERED INDEX [IX_CustomReports_Owner] ON [dbo].[CustomReports] ([OwnerOperatorID]);
CREATE NONCLUSTERED INDEX [IX_CustomReports_Shared] ON [dbo].[CustomReports] ([EntityID], [IsShared]) INCLUDE ([ReportName], [OwnerOperatorID]);
GO

-- UpdatedDate trigger (follows existing pattern)
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_CustomReports_UpdateDate')
    DROP TRIGGER [dbo].[TR_CustomReports_UpdateDate];
GO
CREATE TRIGGER [dbo].[TR_CustomReports_UpdateDate] ON [dbo].[CustomReports] AFTER UPDATE AS
BEGIN SET NOCOUNT ON; UPDATE cr SET [UpdatedDate] = GETDATE() FROM [dbo].[CustomReports] cr INNER JOIN inserted i ON cr.[ReportID] = i.[ReportID]; END
GO

-- Track migration
IF NOT EXISTS (SELECT 1 FROM [dbo].[_Migrations] WHERE [Name] = '13_custom_reports')
    INSERT INTO [dbo].[_Migrations] ([Name]) VALUES ('13_custom_reports');
GO

PRINT '=============================================';
PRINT 'Migration 13_custom_reports applied successfully.';
PRINT '=============================================';
GO
