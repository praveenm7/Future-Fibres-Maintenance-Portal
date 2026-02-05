-- =============================================
-- Future Fibres Maintenance Portal
-- Database Creation Script (Fixed)
-- =============================================
-- Run this script first to create the database
-- =============================================

-- Check if database exists and create if not
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FutureFibresMaintenance')
BEGIN
    CREATE DATABASE FutureFibresMaintenance;
    PRINT 'Database FutureFibresMaintenance created successfully.';
END
ELSE
BEGIN
    PRINT 'Database FutureFibresMaintenance already exists.';
END
GO

PRINT 'Database creation complete. Now run 01_schema.sql';
GO
