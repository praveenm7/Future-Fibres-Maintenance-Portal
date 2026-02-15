const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/database');
const { uploadPhoto } = require('../config/upload');

// Helper to map machine database record to frontend model
const mapMachine = (record) => ({
    id: record.MachineID.toString(),
    finalCode: record.FinalCode || '',
    type: record.Type || '',
    group: record.MachineGroup || '',
    description: record.Description || '',
    purchasingDate: record.PurchasingDate
        ? (record.PurchasingDate instanceof Date
            ? record.PurchasingDate.toISOString().split('T')[0]
            : String(record.PurchasingDate))
        : '',
    purchasingCost: record.PurchasingCost != null ? String(record.PurchasingCost) : '',
    poNumber: record.PONumber || '',
    area: record.Area || '',
    manufacturer: record.Manufacturer || '',
    model: record.Model || '',
    serialNumber: record.SerialNumber || '',
    manufacturerYear: record.ManufacturerYear || '',
    power: record.Power || '',
    permissionRequired: !!record.PermissionRequired,
    authorizationGroup: record.AuthorizationGroup || '',
    maintenanceNeeded: !!record.MaintenanceNeeded,
    maintenanceOnHold: !!record.MaintenanceOnHold,
    personInChargeID: record.PersonInChargeID ? record.PersonInChargeID.toString() : null,
    personInCharge: record.PersonInChargeName || '',
    imageUrl: record.ImageUrl || '',
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

// POST create new machine (FinalCode generated server-side)
router.post('/', async (req, res) => {
    try {
        const {
            type, description, purchasingDate,
            purchasingCost, poNumber, area, manufacturer, model,
            serialNumber, manufacturerYear, power, permissionRequired,
            authorizationGroup, maintenanceNeeded, maintenanceOnHold,
            personInChargeID, imageUrl
        } = req.body;

        // Accept both 'group' (frontend) and 'machineGroup' (legacy) field names
        const machineGroup = req.body.machineGroup || req.body.group;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Generate FinalCode server-side
            const codeResult = await transaction.request()
                .input('Type', sql.NVarChar(50), type)
                .input('MachineGroup', sql.NVarChar(50), machineGroup)
                .execute('sp_GenerateNextFinalCode');

            const generatedCode = codeResult.recordset[0].FinalCode;

            // Insert with the generated code
            const result = await transaction.request()
                .input('FinalCode', sql.NVarChar(50), generatedCode)
                .input('Type', sql.NVarChar(50), type)
                .input('MachineGroup', sql.NVarChar(50), machineGroup)
                .input('Description', sql.NVarChar(255), description)
                .input('PurchasingDate', sql.Date, purchasingDate || null)
                .input('PurchasingCost', sql.Decimal(18, 2), purchasingCost || null)
                .input('PONumber', sql.NVarChar(50), poNumber || null)
                .input('Area', sql.NVarChar(100), area || null)
                .input('Manufacturer', sql.NVarChar(100), manufacturer || null)
                .input('Model', sql.NVarChar(100), model || null)
                .input('SerialNumber', sql.NVarChar(100), serialNumber || null)
                .input('ManufacturerYear', sql.NVarChar(50), manufacturerYear || null)
                .input('Power', sql.NVarChar(50), power || null)
                .input('PermissionRequired', sql.Bit, permissionRequired || false)
                .input('AuthorizationGroup', sql.NVarChar(100), authorizationGroup || null)
                .input('MaintenanceNeeded', sql.Bit, maintenanceNeeded || false)
                .input('MaintenanceOnHold', sql.Bit, maintenanceOnHold || false)
                .input('PersonInChargeID', sql.Int, personInChargeID || null)
                .input('ImageUrl', sql.NVarChar(500), imageUrl || null)
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

            await transaction.commit();

            const newMachineId = result.recordset[0].MachineID;

            // Fetch the newly created machine
            const newMachine = await pool.request()
                .input('MachineID', sql.Int, newMachineId)
                .execute('sp_GetMachineById');

            res.status(201).json(mapMachine(newMachine.recordset[0]));
        } catch (innerErr) {
            await transaction.rollback();
            throw innerErr;
        }
    } catch (err) {
        console.error('Error creating machine:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update machine (FinalCode is immutable — assigned at creation only)
router.put('/:id', async (req, res) => {
    try {
        const {
            type, description, purchasingDate,
            purchasingCost, poNumber, area, manufacturer, model,
            serialNumber, manufacturerYear, power, permissionRequired,
            authorizationGroup, maintenanceNeeded, maintenanceOnHold,
            personInChargeID, imageUrl
        } = req.body;

        // Accept both 'group' (frontend) and 'machineGroup' (legacy) field names
        const machineGroup = req.body.machineGroup || req.body.group;

        const pool = await poolPromise;
        await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .input('Type', sql.NVarChar(50), type)
            .input('MachineGroup', sql.NVarChar(50), machineGroup)
            .input('Description', sql.NVarChar(255), description)
            .input('PurchasingDate', sql.Date, purchasingDate || null)
            .input('PurchasingCost', sql.Decimal(18, 2), purchasingCost || null)
            .input('PONumber', sql.NVarChar(50), poNumber || null)
            .input('Area', sql.NVarChar(100), area || null)
            .input('Manufacturer', sql.NVarChar(100), manufacturer || null)
            .input('Model', sql.NVarChar(100), model || null)
            .input('SerialNumber', sql.NVarChar(100), serialNumber || null)
            .input('ManufacturerYear', sql.NVarChar(50), manufacturerYear || null)
            .input('Power', sql.NVarChar(50), power || null)
            .input('PermissionRequired', sql.Bit, permissionRequired)
            .input('AuthorizationGroup', sql.NVarChar(100), authorizationGroup || null)
            .input('MaintenanceNeeded', sql.Bit, maintenanceNeeded)
            .input('MaintenanceOnHold', sql.Bit, maintenanceOnHold)
            .input('PersonInChargeID', sql.Int, personInChargeID || null)
            .input('ImageUrl', sql.NVarChar(500), imageUrl || null)
            .query(`
        UPDATE Machines SET
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

// GET standalone HTML label page for a machine (scanned via QR code)
router.get('/:id/label', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .execute('sp_GetMachineById');

        if (result.recordset.length === 0) {
            return res.status(404).send('<html><body><h1>Machine not found</h1></body></html>');
        }

        const m = result.recordset[0];
        const imageUrl = m.ImageUrl
            ? `${req.protocol}://${req.get('host')}${m.ImageUrl}`
            : null;

        const esc = (val) => {
            if (val == null) return '-';
            return String(val)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        };

        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(m.FinalCode)} - Machine Label</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 20px; }
        .label { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.1); overflow: hidden; }
        .header { background: #1e293b; color: #fff; padding: 20px 24px; text-align: center; }
        .header h1 { font-size: 28px; letter-spacing: 2px; margin-bottom: 4px; }
        .header p { font-size: 13px; opacity: .7; }
        .photo { padding: 16px 24px 0; text-align: center; }
        .photo img { max-width: 100%; max-height: 240px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0; }
        .details { padding: 20px 24px 24px; }
        table { width: 100%; border-collapse: collapse; }
        tr { border-bottom: 1px solid #f1f5f9; }
        tr:last-child { border-bottom: none; }
        td { padding: 10px 0; font-size: 14px; }
        td:first-child { color: #64748b; font-weight: 500; width: 40%; }
        td:last-child { font-weight: 600; text-align: right; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge-yes { background: #dcfce7; color: #166534; }
        .badge-no { background: #f1f5f9; color: #64748b; }
        .footer { text-align: center; padding: 12px 24px 20px; font-size: 11px; color: #94a3b8; }
        @media print {
            body { background: #fff; padding: 0; }
            .label { box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="label">
        <div class="header">
            <h1>${esc(m.FinalCode)}</h1>
            <p>Future Fibres - Machine Label</p>
        </div>
        ${imageUrl ? `<div class="photo"><img src="${esc(imageUrl)}" alt="Machine Photo"></div>` : ''}
        <div class="details">
            <table>
                <tr><td>Description</td><td>${esc(m.Description)}</td></tr>
                <tr><td>Type</td><td>${esc(m.Type)}</td></tr>
                <tr><td>Group</td><td>${esc(m.MachineGroup)}</td></tr>
                <tr><td>Area</td><td>${esc(m.Area)}</td></tr>
                <tr><td>Manufacturer</td><td>${esc(m.Manufacturer)}</td></tr>
                <tr><td>Model</td><td>${esc(m.Model)}</td></tr>
                <tr><td>Serial Number</td><td>${esc(m.SerialNumber)}</td></tr>
                <tr><td>Year</td><td>${esc(m.ManufacturerYear)}</td></tr>
                <tr><td>Power</td><td>${esc(m.Power)}</td></tr>
                <tr><td>Authorization Group</td><td>${esc(m.AuthorizationGroup)}</td></tr>
                <tr><td>Permission Required</td><td><span class="badge ${m.PermissionRequired ? 'badge-yes' : 'badge-no'}">${m.PermissionRequired ? 'YES' : 'NO'}</span></td></tr>
                <tr><td>Maintenance Needed</td><td><span class="badge ${m.MaintenanceNeeded ? 'badge-yes' : 'badge-no'}">${m.MaintenanceNeeded ? 'YES' : 'NO'}</span></td></tr>
                <tr><td>Person in Charge</td><td>${esc(m.PersonInChargeName)}</td></tr>
            </table>
        </div>
        <div class="footer">Generated on ${new Date().toLocaleDateString('en-GB')} &bull; Future Fibres Maintenance Portal</div>
    </div>
</body>
</html>`);
    } catch (err) {
        console.error('Error generating label:', err);
        res.status(500).send('<html><body><h1>Error generating label</h1></body></html>');
    }
});

// POST upload photo for a machine
router.post('/:id/photo', uploadPhoto.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo file provided' });
        }

        const imageUrl = `/uploads/photos/${req.file.filename}`;
        const pool = await poolPromise;

        await pool.request()
            .input('MachineID', sql.Int, req.params.id)
            .input('ImageUrl', sql.NVarChar(500), imageUrl)
            .query('UPDATE Machines SET ImageUrl = @ImageUrl WHERE MachineID = @MachineID');

        res.json({ imageUrl });
    } catch (err) {
        console.error('Error uploading photo:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
