-- =============================================
-- Migration Script: Update FinalCode Convention
-- =============================================
-- Old format: 01-02-0001 (inconsistent numeric codes)
-- New format: M-EC6-0001 (Type prefix - Group - Sequence)
-- =============================================
-- IMPORTANT: Run this ONCE on an existing database.
-- Back up the database before running.
-- =============================================

USE FutureFibresMaintenance;
GO

PRINT 'Starting FinalCode migration...';
PRINT '';
GO

-- Show current state
PRINT 'Current FinalCodes:';
SELECT MachineID, FinalCode, [Type], MachineGroup
FROM [dbo].[Machines]
ORDER BY MachineID;
GO

BEGIN TRANSACTION;
BEGIN TRY

    -- Backfill NULL MachineGroup with dummy group 'EC0'
    -- (caused by group/machineGroup field name bug — now fixed in backend)
    UPDATE [dbo].[Machines]
    SET MachineGroup = 'EC0'
    WHERE MachineGroup IS NULL;

    -- Assign new FinalCodes using a CTE with ROW_NUMBER
    -- Sequence is per Type+MachineGroup, ordered by MachineID (chronological)
    ;WITH NewCodes AS (
        SELECT
            MachineID,
            FinalCode,
            [Type],
            MachineGroup,
            CASE [Type]
                WHEN 'MACHINE' THEN 'M'
                WHEN 'TOOLING' THEN 'T'
            END AS TypePrefix,
            ROW_NUMBER() OVER (
                PARTITION BY [Type], ISNULL(MachineGroup, 'EC0')
                ORDER BY MachineID
            ) AS Seq
        FROM [dbo].[Machines]
    )
    UPDATE NewCodes
    SET FinalCode = TypePrefix + '-' + ISNULL(MachineGroup, 'EC0') + '-' + RIGHT('0000' + CAST(Seq AS NVARCHAR(4)), 4);

    -- Verify no duplicates were created
    IF EXISTS (
        SELECT FinalCode FROM [dbo].[Machines]
        GROUP BY FinalCode HAVING COUNT(*) > 1
    )
    BEGIN
        RAISERROR('Duplicate FinalCodes detected after migration!', 16, 1);
    END

    COMMIT TRANSACTION;

    -- Show results
    PRINT '';
    PRINT 'Migration completed successfully! New FinalCodes:';
    SELECT MachineID, FinalCode, [Type], MachineGroup
    FROM [dbo].[Machines]
    ORDER BY [Type], MachineGroup, MachineID;

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '';
    PRINT 'FinalCode migration FAILED! Transaction rolled back.';
    PRINT ERROR_MESSAGE();
END CATCH
GO
