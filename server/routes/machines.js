const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');

// Helper to map machine database record to frontend model
const mapMachine = (record) => ({
    id: record.MachineID.toString(),
    finalCode: record.FinalCode,
    type: record.Type,
    group: record.MachineGroup,
    description: record.Description,
    purchasingDate: record.PurchasingDate,
    purchasingCost: record.PurchasingCost,
    poNumber: record.PONumber,
    area: record.Area,
    manufacturer: record.Manufacturer,
    model: record.Model,
    serialNumber: record.SerialNumber,
    manufacturerYear: record.ManufacturerYear,
    power: record.Power,
    permissionRequired: record.PermissionRequired,
    authorizationGroup: record.AuthorizationGroup,
    maintenanceNeeded: record.MaintenanceNeeded,
    maintenanceOnHold: record.MaintenanceOnHold,
    personInChargeID: record.PersonInChargeID ? record.PersonInChargeID.toString() : null,
    personInCharge: record.PersonInChargeName,
    imageUrl: record.ImageUrl,
    createdDate: record.CreatedDate,
    updatedDate: record.UpdatedDate
});

// GET all machines
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute('sp_GetMachinesWithOperator');

        res.json(result.recordset.map(mapMachine));
    } catch (err) {
        console.error('Error fetching machines:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET machine by ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .execute('sp_GetMachineById');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }

        res.json(mapMachine(result.recordset[0]));
    } catch (err) {
        console.error('Error fetching machine:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST create new machine
router.post('/', async (req, res) => {
    try {
        const {
            finalCode, type, machineGroup, description, purchasingDate,
            purchasingCost, poNumber, area, manufacturer, model,
            serialNumber, manufacturerYear, power, permissionRequired,
            authorizationGroup, maintenanceNeeded, maintenanceOnHold,
            personInChargeID, imageUrl
        } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('FinalCode', sql.NVarChar(50), finalCode)
            .input('Type', sql.NVarChar(50), type)
            .input('MachineGroup', sql.NVarChar(50), machineGroup)
            .input('Description', sql.NVarChar(255), description)
            .input('PurchasingDate', sql.Date, purchasingDate)
            .input('PurchasingCost', sql.Decimal(18, 2), purchasingCost)
            .input('PONumber', sql.NVarChar(50), poNumber)
            .input('Area', sql.NVarChar(100), area)
            .input('Manufacturer', sql.NVarChar(100), manufacturer)
            .input('Model', sql.NVarChar(100), model)
            .input('SerialNumber', sql.NVarChar(100), serialNumber)
            .input('ManufacturerYear', sql.NVarChar(50), manufacturerYear)
            .input('Power', sql.NVarChar(50), power)
            .input('PermissionRequired', sql.Bit, permissionRequired)
            .input('AuthorizationGroup', sql.NVarChar(100), authorizationGroup)
            .input('MaintenanceNeeded', sql.Bit, maintenanceNeeded)
            .input('MaintenanceOnHold', sql.Bit, maintenanceOnHold)
            .input('PersonInChargeID', sql.Int, personInChargeID)
            .input('ImageUrl', sql.NVarChar(500), imageUrl)
            .query(`
        INSERT INTO Machines (
          FinalCode, Type, MachineGroup, Description, PurchasingDate,
          PurchasingCost, PONumber, Area, Manufacturer, Model,
          SerialNumber, ManufacturerYear, Power, PermissionRequired,
          AuthorizationGroup, MaintenanceNeeded, MaintenanceOnHold,
          PersonInChargeID, ImageUrl
        )
        VALUES (
          @FinalCode, @Type, @MachineGroup, @Description, @PurchasingDate,
          @PurchasingCost, @PONumber, @Area, @Manufacturer, @Model,
          @SerialNumber, @ManufacturerYear, @Power, @PermissionRequired,
          @AuthorizationGroup, @MaintenanceNeeded, @MaintenanceOnHold,
          @PersonInChargeID, @ImageUrl
        );
        SELECT SCOPE_IDENTITY() AS MachineID;
      `);

        const newMachineId = result.recordset[0].MachineID;

        // Fetch the newly created machine
        const newMachine = await pool.request()
            .input('MachineID', sql.Int, newMachineId)
            .execute('sp_GetMachineById');

        res.status(201).json(mapMachine(newMachine.recordset[0]));
    } catch (err) {
        console.error('Error creating machine:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update machine
router.put('/:id', async (req, res) => {
    try {
        const {
            finalCode, type, machineGroup, description, purchasingDate,
            purchasingCost, poNumber, area, manufacturer, model,
            serialNumber, manufacturerYear, power, permissionRequired,
            authorizationGroup, maintenanceNeeded, maintenanceOnHold,
            personInChargeID, imageUrl
        } = req.body;

        const pool = await poolPromise;
        await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .input('FinalCode', sql.NVarChar(50), finalCode)
            .input('Type', sql.NVarChar(50), type)
            .input('MachineGroup', sql.NVarChar(50), machineGroup)
            .input('Description', sql.NVarChar(255), description)
            .input('PurchasingDate', sql.Date, purchasingDate)
            .input('PurchasingCost', sql.Decimal(18, 2), purchasingCost)
            .input('PONumber', sql.NVarChar(50), poNumber)
            .input('Area', sql.NVarChar(100), area)
            .input('Manufacturer', sql.NVarChar(100), manufacturer)
            .input('Model', sql.NVarChar(100), model)
            .input('SerialNumber', sql.NVarChar(100), serialNumber)
            .input('ManufacturerYear', sql.NVarChar(50), manufacturerYear)
            .input('Power', sql.NVarChar(50), power)
            .input('PermissionRequired', sql.Bit, permissionRequired)
            .input('AuthorizationGroup', sql.NVarChar(100), authorizationGroup)
            .input('MaintenanceNeeded', sql.Bit, maintenanceNeeded)
            .input('MaintenanceOnHold', sql.Bit, maintenanceOnHold)
            .input('PersonInChargeID', sql.Int, personInChargeID)
            .input('ImageUrl', sql.NVarChar(500), imageUrl)
            .query(`
        UPDATE Machines SET
          FinalCode = @FinalCode,
          Type = @Type,
          MachineGroup = @MachineGroup,
          Description = @Description,
          PurchasingDate = @PurchasingDate,
          PurchasingCost = @PurchasingCost,
          PONumber = @PONumber,
          Area = @Area,
          Manufacturer = @Manufacturer,
          Model = @Model,
          SerialNumber = @SerialNumber,
          ManufacturerYear = @ManufacturerYear,
          Power = @Power,
          PermissionRequired = @PermissionRequired,
          AuthorizationGroup = @AuthorizationGroup,
          MaintenanceNeeded = @MaintenanceNeeded,
          MaintenanceOnHold = @MaintenanceOnHold,
          PersonInChargeID = @PersonInChargeID,
          ImageUrl = @ImageUrl
        WHERE MachineID = @MachineID
      `);

        // Fetch updated machine
        const updated = await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .execute('sp_GetMachineById');

        res.json(mapMachine(updated.recordset[0]));
    } catch (err) {
        console.error('Error updating machine:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE machine
router.delete('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .query('DELETE FROM Machines WHERE MachineID = @MachineID');

        res.json({ message: 'Machine deleted successfully' });
    } catch (err) {
        console.error('Error deleting machine:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
