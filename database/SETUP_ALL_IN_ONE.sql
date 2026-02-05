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
