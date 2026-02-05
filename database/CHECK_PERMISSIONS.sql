-- Check current user and roles
SELECT 
    SUSER_SNAME() AS LoginName,
    IS_SRVROLEMEMBER('sysadmin') AS IsSysAdmin,
    IS_SRVROLEMEMBER('dbcreator') AS IsDbCreator,
    IS_SRVROLEMEMBER('public') AS IsPublic;

-- Check permissions in master
USE master;
SELECT * FROM fn_my_permissions(NULL, 'DATABASE');
