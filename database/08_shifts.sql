-- ============================================================
-- Migration: Create Shifts and OperatorShiftOverrides Tables
-- Purpose: Per-operator shift assignments for scheduling
-- ============================================================

USE [FutureFibresMaintenance];
GO

-- =============================================
-- Table: Shifts
-- Description: Defines shift patterns (e.g., Morning, Day, Afternoon, Night)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Shifts')
BEGIN
    CREATE TABLE [dbo].[Shifts] (
        [ShiftID]    INT IDENTITY(1,1) NOT NULL,
        [ShiftName]  NVARCHAR(50) NOT NULL,
        [StartTime]  NVARCHAR(5) NOT NULL,       -- "06:00"
        [EndTime]    NVARCHAR(5) NOT NULL,        -- "14:00"
        [IsActive]   BIT NOT NULL DEFAULT 1,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_Shifts] PRIMARY KEY CLUSTERED ([ShiftID] ASC)
    );

    -- Seed the 4 standard shift presets
    INSERT INTO [dbo].[Shifts] ([ShiftName], [StartTime], [EndTime]) VALUES
        ('Morning',   '06:00', '14:00'),
        ('Day',       '06:00', '18:00'),
        ('Afternoon', '14:00', '22:00'),
        ('Night',     '18:00', '06:00');

    PRINT '✓ Shifts table created and seeded with 4 presets';
END
ELSE
BEGIN
    PRINT '⚠ Shifts table already exists - skipping';
END
GO

-- =============================================
-- Add DefaultShiftID to Operators table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Operators') AND name = 'DefaultShiftID')
BEGIN
    ALTER TABLE [dbo].[Operators]
        ADD [DefaultShiftID] INT NULL;

    ALTER TABLE [dbo].[Operators]
        ADD CONSTRAINT [FK_Operators_DefaultShift]
        FOREIGN KEY ([DefaultShiftID]) REFERENCES [dbo].[Shifts]([ShiftID]);

    PRINT '✓ DefaultShiftID column added to Operators table';
END
ELSE
BEGIN
    PRINT '⚠ DefaultShiftID column already exists on Operators - skipping';
END
GO

-- =============================================
-- Table: OperatorShiftOverrides
-- Description: Per-date shift overrides for operators
-- ShiftID NULL means "day off"
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OperatorShiftOverrides')
BEGIN
    CREATE TABLE [dbo].[OperatorShiftOverrides] (
        [OverrideID]  INT IDENTITY(1,1) NOT NULL,
        [OperatorID]  INT NOT NULL,
        [ShiftDate]   DATE NOT NULL,
        [ShiftID]     INT NULL,                   -- NULL = day off
        [CreatedDate] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_OperatorShiftOverrides] PRIMARY KEY CLUSTERED ([OverrideID] ASC),
        CONSTRAINT [FK_Override_Operator] FOREIGN KEY ([OperatorID])
            REFERENCES [dbo].[Operators]([OperatorID]) ON DELETE CASCADE,
        CONSTRAINT [FK_Override_Shift] FOREIGN KEY ([ShiftID])
            REFERENCES [dbo].[Shifts]([ShiftID]),
        CONSTRAINT [UQ_Override_OpDate] UNIQUE ([OperatorID], [ShiftDate])
    );

    CREATE INDEX [IX_Override_ShiftDate] ON [dbo].[OperatorShiftOverrides] ([ShiftDate]);

    PRINT '✓ OperatorShiftOverrides table created';
END
ELSE
BEGIN
    PRINT '⚠ OperatorShiftOverrides table already exists - skipping';
END
GO
