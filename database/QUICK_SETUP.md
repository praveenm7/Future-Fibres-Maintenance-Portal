# Quick Database Setup Guide

## The Issue You Encountered

The script tried to create tables in the `master` database due to a permission issue. Here's the corrected process:

---

## Solution: Run Scripts in Correct Order

### Step 1: Create the Database (Run as Administrator)

1. **Open SSMS as Administrator**
   - Right-click on SSMS icon → "Run as administrator"

2. **Connect to SQL Server**
   - Server name: `localhost\SQLEXPRESS` (or your instance name)
   - Authentication: Windows Authentication
   - Click Connect

3. **Open and run the database creation script**
   - File → Open → File
   - Navigate to: `d:\Maintenance Dashboard App\Future-Fibres-Maintenance-Portal\database\`
   - Open `00_create_database.sql`
   - Click **Execute** (or press F5)
   - You should see: "Database FutureFibresMaintenance created successfully."

### Step 2: Create Tables and Schema

1. **Still in SSMS, open the schema script**
   - File → Open → File
   - Open `01_schema.sql`
   - **IMPORTANT**: Make sure you see "FutureFibresMaintenance" in the database dropdown at the top
   - Click **Execute**
   - Wait for completion (should take 10-20 seconds)

### Step 3: Load Seed Data

1. **Open the seed data script**
   - File → Open → File
   - Open `02_seed_data.sql`
   - Verify database is still "FutureFibresMaintenance"
   - Click **Execute**

### Step 4: Create Stored Procedures

1. **Open the stored procedures script**
   - File → Open → File
   - Open `03_stored_procedures.sql`
   - Click **Execute**

---

## Verify Everything Worked

In SSMS Object Explorer:

1. Expand **Databases**
2. Expand **FutureFibresMaintenance**
3. Expand **Tables** - you should see 8 tables:
   - dbo.AuthorizationMatrix
   - dbo.ListOptions
   - dbo.Machines
   - dbo.MaintenanceActions
   - dbo.NCComments
   - dbo.NonConformities
   - dbo.Operators
   - dbo.SpareParts

4. Right-click on **dbo.Machines** → Select Top 1000 Rows
   - You should see 3 machines

---

## If You Still Have Issues

Try this alternative approach:

1. **Delete the database if it exists**
   ```sql
   USE master;
   GO
   DROP DATABASE IF EXISTS FutureFibresMaintenance;
   GO
   ```

2. **Run the scripts again in order**

---

## Next Step

Once the database is created successfully, let me know and I'll help you:
1. Configure the backend server
2. Start the API
3. Test the connection
