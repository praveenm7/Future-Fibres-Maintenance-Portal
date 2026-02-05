# CRITICAL: Database Setup Instructions

## The Problem

You're getting permission errors because:
1. The database `FutureFibresMaintenance` is not being created
2. When the `USE FutureFibresMaintenance` command fails, SQL Server stays in the `master` database
3. You don't have permission to create tables in `master`

## The Solution

### ⚠️ CRITICAL STEP: Run SSMS as Administrator

1. **Close SSMS completely** (if it's open)

2. **Find SQL Server Management Studio** in Start Menu

3. **Right-click on "Microsoft SQL Server Management Studio"**

4. **Click "Run as administrator"**

5. **Click "Yes"** when Windows asks for permission

6. **Connect to your SQL Server** (localhost\SQLEXPRESS)

---

## Once SSMS is Running as Administrator

### Option 1: Manual Step-by-Step (Recommended)

**Step 1: Create the Database**

In a new query window, paste and run this:

```sql
USE master;
GO

-- Drop existing database if it exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'FutureFibresMaintenance')
BEGIN
    ALTER DATABASE FutureFibresMaintenance SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE FutureFibresMaintenance;
END
GO

-- Create new database
CREATE DATABASE FutureFibresMaintenance;
GO

-- Verify it was created
SELECT name FROM sys.databases WHERE name = 'FutureFibresMaintenance';
GO
```

**You should see**: A result showing "FutureFibresMaintenance"

**Step 2: Switch to the New Database**

In the toolbar at the top of SSMS, find the **database dropdown** (it probably says "master")

Click it and select **"FutureFibresMaintenance"**

**Step 3: Run the Schema Script**

- Open `01_schema.sql`
- **VERIFY** the dropdown shows "FutureFibresMaintenance" (NOT "master")
- Click Execute

**Step 4: Run the Seed Data**

- Open `02_seed_data.sql`
- **VERIFY** the dropdown shows "FutureFibresMaintenance"
- Click Execute

**Step 5: Run the Stored Procedures**

- Open `03_stored_procedures.sql`
- **VERIFY** the dropdown shows "FutureFibresMaintenance"
- Click Execute

---

### Option 2: All-in-One Script

I've created `SETUP_COMPLETE.sql` which combines everything.

1. **Make sure SSMS is running as Administrator**
2. Open `SETUP_COMPLETE.sql`
3. Select ALL the text (Ctrl+A)
4. Click Execute (F5)
5. Wait for completion

---

## How to Verify Success

After running the scripts, in Object Explorer:

1. Expand **Databases**
2. You should see **FutureFibresMaintenance**
3. Expand it → Expand **Tables**
4. You should see 8 tables

Run this query to verify:
```sql
USE FutureFibresMaintenance;
GO

SELECT 
    t.NAME AS TableName,
    p.rows AS RowCount
FROM 
    sys.tables t
INNER JOIN      
    sys.partitions p ON t.object_id = p.OBJECT_ID
WHERE 
    p.index_id IN (0,1)
ORDER BY 
    t.Name;
```

Expected output:
- AuthorizationMatrix: 3 rows
- ListOptions: 54 rows
- Machines: 3 rows
- MaintenanceActions: 7 rows
- NCComments: 4 rows
- NonConformities: 3 rows
- Operators: 4 rows
- SpareParts: 5 rows

---

## Still Having Issues?

If you still get permission errors even as Administrator, try this:

1. Check if you're actually connected as Administrator:
   ```sql
   SELECT IS_SRVROLEMEMBER('sysadmin');
   ```
   Should return **1** (yes)

2. If it returns 0, you need to add your Windows user to SQL Server:
   - In SSMS Object Explorer, expand **Security** → **Logins**
   - Right-click **Logins** → **New Login**
   - Click **Search** → **Advanced** → **Find Now**
   - Select your Windows username
   - Click OK
   - In **Server Roles**, check **sysadmin**
   - Click OK

Let me know once the database is created successfully!
