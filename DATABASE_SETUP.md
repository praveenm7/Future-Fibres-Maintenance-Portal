# Database Setup Guide

This guide will walk you through setting up the SQL Server database for the Future Fibres Maintenance Portal.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **SQL Server** (Express Edition is free)
   - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Choose "Express" edition for local development

2. **SQL Server Management Studio (SSMS)**
   - Download from: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
   - This is the GUI tool for managing SQL Server

3. **Node.js** (v16 or higher)
   - Already installed (required for the frontend)

---

## Step 1: Install SQL Server

If you haven't installed SQL Server yet:

1. Download **SQL Server 2022 Express** from the link above
2. Run the installer
3. Choose **"Basic"** installation type
4. Accept the license terms
5. Choose an installation location
6. Wait for installation to complete
7. **Important**: Note down the connection string shown at the end (it will look like `localhost\SQLEXPRESS`)

---

## Step 2: Install SQL Server Management Studio (SSMS)

1. Download SSMS from the link above
2. Run the installer
3. Follow the installation wizard
4. Restart your computer if prompted

---

## Step 3: Connect to SQL Server

1. Open **SQL Server Management Studio (SSMS)**
2. In the "Connect to Server" dialog:
   - **Server type**: Database Engine
   - **Server name**: `localhost\SQLEXPRESS` (or just `localhost` if you installed the full version)
   - **Authentication**: Windows Authentication
   - Click **Connect**

---

## Step 4: Create the Database

### Option A: Using SSMS (Recommended)

1. In SSMS, click **File** → **Open** → **File**
2. Navigate to your project folder: `d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal\database\`
3. Open `01_schema.sql`
4. Click **Execute** (or press F5)
5. Wait for the script to complete (you should see success messages in the Messages pane)

6. Repeat for the seed data:
   - Open `02_seed_data.sql`
   - Click **Execute**

7. Repeat for stored procedures:
   - Open `03_stored_procedures.sql`
   - Click **Execute**

### Option B: Using Command Line (sqlcmd)

```powershell
# Navigate to the database folder
cd "d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal\database"

# Execute schema script
sqlcmd -S localhost\SQLEXPRESS -E -i 01_schema.sql

# Execute seed data script
sqlcmd -S localhost\SQLEXPRESS -E -i 02_seed_data.sql

# Execute stored procedures script
sqlcmd -S localhost\SQLEXPRESS -E -i 03_stored_procedures.sql
```

---

## Step 5: Verify Database Creation

In SSMS:

1. Expand **Databases** in the Object Explorer
2. You should see **FutureFibresMaintenance**
3. Expand it → Expand **Tables**
4. You should see 8 tables:
   - Operators
   - Machines
   - MaintenanceActions
   - NonConformities
   - NCComments
   - SpareParts
   - AuthorizationMatrix
   - ListOptions

5. Right-click on **Machines** → **Select Top 1000 Rows**
6. You should see 3 sample machines

---

## Step 6: Configure Backend Server

1. Navigate to the server folder:
   ```powershell
   cd "d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal\server"
   ```

2. Copy the environment template:
   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` in a text editor and update if needed:
   ```env
   # For Windows Authentication (recommended for local development)
   DB_SERVER=localhost\SQLEXPRESS
   DB_DATABASE=FutureFibresMaintenance
   DB_TRUSTED_CONNECTION=true
   DB_PORT=1433
   
   # Server Configuration
   PORT=3001
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:8082
   ```

   > **Note**: If using SQL Server Authentication instead of Windows Authentication:
   > - Set `DB_TRUSTED_CONNECTION=false`
   > - Set `DB_USER=your_username`
   > - Set `DB_PASSWORD=your_password`

4. Install backend dependencies:
   ```powershell
   npm install
   ```

---

## Step 7: Start the Backend Server

```powershell
# Make sure you're in the server directory
cd "d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal\server"

# Start the server
npm start
```

You should see:
```
==================================================
Future Fibres Maintenance Portal API Server
==================================================
✓ Connected to SQL Server database
✓ Server running on port 3001
✓ API available at http://localhost:3001
✓ CORS enabled for: http://localhost:8082
==================================================
```

---

## Step 8: Test the API

Open a new PowerShell window and test the API:

```powershell
# Test health endpoint
curl http://localhost:3001/api/health

# Test machines endpoint
curl http://localhost:3001/api/machines

# Test dashboard stats
curl http://localhost:3001/api/dashboard/stats
```

You should see JSON responses with data from the database.

---

## Step 9: Run Both Frontend and Backend

You have two options:

### Option A: Run in Separate Terminals

**Terminal 1 - Backend:**
```powershell
cd "d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal\server"
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd "d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal"
npm run dev
```

### Option B: Use Concurrently (Coming Soon)

We'll add a script to run both servers with one command.

---

## Troubleshooting

### Issue: Cannot connect to SQL Server

**Solution 1**: Check if SQL Server is running
```powershell
# Open Services
services.msc

# Look for "SQL Server (SQLEXPRESS)" and ensure it's running
# If not, right-click → Start
```

**Solution 2**: Check server name
- Try `localhost` instead of `localhost\SQLEXPRESS`
- Or try `(localdb)\MSSQLLocalDB` if using LocalDB

**Solution 3**: Enable TCP/IP
1. Open **SQL Server Configuration Manager**
2. Expand **SQL Server Network Configuration**
3. Click **Protocols for SQLEXPRESS**
4. Right-click **TCP/IP** → **Enable**
5. Restart SQL Server service

### Issue: Login failed for user

**Solution**: Use Windows Authentication
- Set `DB_TRUSTED_CONNECTION=true` in `.env`
- Remove or comment out `DB_USER` and `DB_PASSWORD`

### Issue: Database already exists

**Solution**: Drop and recreate
```sql
USE master;
GO
DROP DATABASE FutureFibresMaintenance;
GO
```
Then run the schema script again.

### Issue: Port 3001 already in use

**Solution**: Change the port in `server/.env`:
```env
PORT=3002
```
And update `VITE_API_BASE_URL` in frontend `.env.local` accordingly.

---

## Next Steps

Once the database and backend are running:

1. Configure the frontend to use the API (see frontend integration guide)
2. Test all CRUD operations through the UI
3. Verify data persistence in the database

---

## Database Maintenance

### Backup Database

```sql
BACKUP DATABASE FutureFibresMaintenance
TO DISK = 'C:\Backups\FutureFibresMaintenance.bak'
WITH FORMAT;
```

### Restore Database

```sql
USE master;
GO
RESTORE DATABASE FutureFibresMaintenance
FROM DISK = 'C:\Backups\FutureFibresMaintenance.bak'
WITH REPLACE;
```

### View All Tables and Row Counts

```sql
USE FutureFibresMaintenance;
GO

SELECT 
    t.NAME AS TableName,
    p.rows AS RowCounts
FROM 
    sys.tables t
INNER JOIN      
    sys.partitions p ON t.object_id = p.OBJECT_ID
WHERE 
    t.is_ms_shipped = 0
    AND p.index_id IN (0,1)
GROUP BY 
    t.Name, p.Rows
ORDER BY 
    t.Name;
```

---

## Useful SQL Queries

### View all machines with operators
```sql
EXEC sp_GetMachinesWithOperator;
```

### View dashboard statistics
```sql
EXEC sp_GetDashboardStats;
```

### View maintenance report
```sql
EXEC sp_GetMaintenanceReport @Periodicity = 'WEEKLY';
```

### Create a new non-conformity
```sql
DECLARE @NewNCID INT;
EXEC sp_CreateNonConformity
    @MachineID = 1,
    @Area = 'IHM',
    @MaintenanceOperatorID = 1,
    @CreationDate = '2026-02-05',
    @Status = 'PENDING',
    @Priority = 1,
    @Category = 'FAILURE',
    @NewNCID = @NewNCID OUTPUT;
    
SELECT @NewNCID AS NewNCID;
```
