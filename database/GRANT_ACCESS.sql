-- =============================================
-- Grant Permissions to User: PraveenM
-- =============================================
-- This script ensures the login exists and has 
-- appropriate roles to manage the database.
-- =============================================

USE master;
GO

-- 1. Create login if it doesn't exist (assuming Windows Authentication)
-- NOTE: If your domain is Different, please adjust 'YOUR-PC-NAME'
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'PraveenM')
BEGIN
    -- This attempts to find the user in the local machine group
    -- If this fails, you may need the full name like 'COMPUTERNAME\PraveenM'
    -- You can find your full name by running 'whoami' in PowerShell
    PRINT 'Login PraveenM doesn''t exist as a literal string. Let''s try current user.';
END
GO

-- 2. Grant Server Roles (This requires being run by an admin ONCE)
-- If the user already reported 1 for sysadmin, they likely already have this.
-- This is just to be absolutely sure.

DECLARE @CurrentLogin NVARCHAR(255) = SUSER_SNAME();
PRINT 'Granting permissions to current connection: ' + @CurrentLogin;

-- Grant dbcreator role if not already present
IF IS_SRVROLEMEMBER('dbcreator', @CurrentLogin) = 0
BEGIN
    EXEC sp_addsrvrolemember @loginame = @CurrentLogin, @rolename = 'dbcreator';
    PRINT 'Granted dbcreator role to ' + @CurrentLogin;
END
ELSE
BEGIN
    PRINT @CurrentLogin + ' already has dbcreator role.';
END

-- 3. Ensure User is Database Owner if DB exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'FutureFibresMaintenance')
BEGIN
    USE FutureFibresMaintenance;
    
    DECLARE @UserLogin NVARCHAR(255) = SUSER_SNAME();
    
    -- Create user for the login in this database
    IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = @UserLogin)
    BEGIN
        DECLARE @Sql NVARCHAR(MAX) = 'CREATE USER [' + @UserLogin + '] FOR LOGIN [' + @UserLogin + ']';
        EXEC sp_executesql @Sql;
        PRINT 'Created database user for ' + @UserLogin;
    END
    
    -- Add to db_owner role
    EXEC sp_addrolemember 'db_owner', @UserLogin;
    PRINT 'Added ' + @UserLogin + ' to db_owner role in FutureFibresMaintenance.';
END
ELSE
BEGIN
    PRINT 'Database FutureFibresMaintenance does not exist yet. Please create it first.';
END
GO
