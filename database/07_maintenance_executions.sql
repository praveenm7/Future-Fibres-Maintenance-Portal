-- ============================================================
-- Migration: Create MaintenanceExecutions Table
-- Purpose: Track completion of scheduled maintenance actions
-- ============================================================

USE [FutureFibresMaintenance];
GO

-- Only create if table doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MaintenanceExecutions')
BEGIN
    CREATE TABLE [dbo].[MaintenanceExecutions] (
        [ExecutionID]      INT IDENTITY(1,1) NOT NULL,
        [ActionID]         INT NOT NULL,
        [MachineID]        INT NOT NULL,
        [ScheduledDate]    DATE NOT NULL,
        [Status]           NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        [ActualTime]       INT NULL,
        [CompletedByID]    INT NULL,
        [CompletedDate]    DATETIME NULL,
        [Notes]            NVARCHAR(1000) NULL,
        [CreatedDate]      DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedDate]      DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT [PK_MaintenanceExecutions] PRIMARY KEY CLUSTERED ([ExecutionID] ASC),
        CONSTRAINT [FK_Executions_Actions] FOREIGN KEY ([ActionID])
            REFERENCES [dbo].[MaintenanceActions]([ActionID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Executions_Machines] FOREIGN KEY ([MachineID])
            REFERENCES [dbo].[Machines]([MachineID]),
        CONSTRAINT [FK_Executions_Operators] FOREIGN KEY ([CompletedByID])
            REFERENCES [dbo].[Operators]([OperatorID]),
        CONSTRAINT [CK_Executions_Status] CHECK ([Status] IN ('PENDING', 'COMPLETED', 'SKIPPED')),
        CONSTRAINT [UQ_Executions_ActionDate] UNIQUE ([ActionID], [ScheduledDate])
    );

    CREATE INDEX [IX_Executions_DateRange] ON [dbo].[MaintenanceExecutions] ([ScheduledDate], [ActionID]);
    CREATE INDEX [IX_Executions_MachineID] ON [dbo].[MaintenanceExecutions] ([MachineID]);

    PRINT '✓ MaintenanceExecutions table created successfully';
END
ELSE
BEGIN
    PRINT '⚠ MaintenanceExecutions table already exists - skipping';
END
GO
