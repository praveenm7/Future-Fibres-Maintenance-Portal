-- =============================================
-- Migration: Task Order Overrides
-- Stores manual task ordering overrides for the schedule algorithm
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TaskOrderOverrides]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TaskOrderOverrides] (
        [OverrideID]    INT IDENTITY(1,1) NOT NULL,
        [ScheduleDate]  DATE          NOT NULL,
        [ActionID]      INT           NOT NULL,
        [SortPosition]  INT           NOT NULL DEFAULT 0,
        [CreatedDate]   DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_TaskOrderOverrides] PRIMARY KEY CLUSTERED ([OverrideID] ASC),
        CONSTRAINT [FK_TaskOrderOverrides_Action] FOREIGN KEY ([ActionID])
            REFERENCES [dbo].[MaintenanceActions]([ActionID]) ON DELETE CASCADE,
        CONSTRAINT [UQ_TaskOrderOverrides_DateAction] UNIQUE ([ScheduleDate], [ActionID])
    );
    PRINT 'Table TaskOrderOverrides created successfully.';
END
GO
