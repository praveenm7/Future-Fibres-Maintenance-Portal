-- =============================================
-- Future Fibres Maintenance Portal
-- Seed Data Script (Current State)
-- =============================================
-- Populates the database with initial reference
-- data for a fresh setup.
-- =============================================

USE FutureFibresMaintenance;
GO

PRINT 'Starting data seeding...';
GO

-- =============================================
-- Seed Entities
-- =============================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[Entities])
BEGIN
    INSERT INTO [dbo].[Entities] ([EntityID], [EntityCode], [EntityName], [Country]) VALUES
        (1, 'FFSL', 'Future Fibres Sri Lanka', 'Sri Lanka'),
        (2, 'FFVL', 'Future Fibres Valencia', 'Spain');
    PRINT 'Entities seeded successfully.';
END
GO

-- =============================================
-- Seed Operators
-- =============================================
SET IDENTITY_INSERT [dbo].[Operators] ON;
GO

INSERT INTO [dbo].[Operators] ([OperatorID], [OperatorName], [Email], [Department], [IsActive], [Role], [EntityID])
VALUES
    (1, 'FERNANDO', 'fernando@futurefibres.com', 'IHM', 1, 'USER', 1),
    (2, 'OSCAR', 'oscar@futurefibres.com', 'IHM', 1, 'USER', 1),
    (3, 'MIGUEL', 'miguel@futurefibres.com', 'PRODUCTION', 1, 'USER', 1),
    (4, 'ADMIN', 'admin@futurefibres.com', 'MANAGEMENT', 1, 'ADMIN', 1);
GO

SET IDENTITY_INSERT [dbo].[Operators] OFF;
GO

PRINT 'Operators seeded successfully.';
GO

-- =============================================
-- Seed Machines
-- =============================================
SET IDENTITY_INSERT [dbo].[Machines] ON;
GO

INSERT INTO [dbo].[Machines]
    ([MachineID], [FinalCode], [Type], [MachineGroup], [Description], [PurchasingDate],
     [PurchasingCost], [PONumber], [Area], [Manufacturer], [Model], [SerialNumber],
     [ManufacturerYear], [Power], [PermissionRequired], [AuthorizationGroup],
     [MaintenanceNeeded], [MaintenanceOnHold], [PersonInChargeID], [ImageUrl], [EntityID])
VALUES
    (1, 'FFSL-M-EC6-0001', 'MACHINE', 'EC6', 'CNC 3 AXIS MILL', '2025-01-01',
     25000.00, 'PO001111', 'IHM', 'HAAS', 'TM-1P', '20/04/4780',
     '2008', '9600W', 1, 'HAAS',
     1, 0, 1, '/placeholder.svg', 1),

    (2, 'FFSL-M-EC6-0002', 'MACHINE', 'EC6', 'FRESADORA CNC HAAS', '2024-03-15',
     35000.00, 'PO001112', 'IHM', 'HAAS', 'TM-1P', '20/05/5890',
     '2020', '11000W', 1, 'MACHINING CENTER',
     1, 0, 2, '/placeholder.svg', 1),

    (3, 'FFSL-T-EC4-0001', 'TOOLING', 'EC4', 'MAST CUTTING BENCH', '2023-06-20',
     8500.00, 'PO001200', 'PRODUCTION', 'CUSTOM', 'MCB-200', '23/06/1234',
     '2023', '2200W', 1, 'MAST CUTTING',
     1, 0, 3, '/placeholder.svg', 1);
GO

SET IDENTITY_INSERT [dbo].[Machines] OFF;
GO

PRINT 'Machines seeded successfully.';
GO

-- =============================================
-- Seed MaintenanceActions
-- =============================================
SET IDENTITY_INSERT [dbo].[MaintenanceActions] ON;
GO

INSERT INTO [dbo].[MaintenanceActions]
    ([ActionID], [MachineID], [Action], [Periodicity], [TimeNeeded], [MaintenanceInCharge], [Status], [EntityID])
VALUES
    (1, 1, 'SOPLAR Y RETIRAR RESTOS DE VIRUTA', 'BEFORE EACH USE', 5, 0, 'MANDATORY', 1),
    (2, 1, 'SOPLAR TODA LA FRESA Y LIMPIAR RESTOS DE TALADRINA', 'BEFORE EACH USE', 2, 0, 'IDEAL', 1),
    (3, 1, 'ACEITAR CON WD-40 TODAS LAS PARTES METALICAS', 'WEEKLY', 2, 0, 'MANDATORY', 1),
    (4, 1, 'COMPROBAR NIVEL DE TALADRINA. RELLENAR SI ES NECESARIO', 'WEEKLY', 5, 0, 'IDEAL', 1),
    (5, 1, 'VACIAR VIRUTA DEL DEPOSITO', 'WEEKLY', 1, 0, 'MANDATORY', 1),
    (6, 1, 'ENGRASAR LAS GUIAS Y PATINES', 'MONTHLY', 5, 1, 'MANDATORY', 1),
    (7, 1, 'LIMPIAR Y RETIRAR OXIDO DONDE LO HUBIERA', 'MONTHLY', 10, 0, 'IDEAL', 1);
GO

SET IDENTITY_INSERT [dbo].[MaintenanceActions] OFF;
GO

PRINT 'MaintenanceActions seeded successfully.';
GO

-- =============================================
-- Seed SpareParts
-- =============================================
SET IDENTITY_INSERT [dbo].[SpareParts] ON;
GO

INSERT INTO [dbo].[SpareParts]
    ([SparePartID], [MachineID], [Description], [Reference], [Quantity], [Link], [EntityID])
VALUES
    (1, 1, 'ITEM 1', 'REF0001', 10, 'WWW.SPAREPARTS.COM', 1),
    (2, 1, 'ITEM 2', 'REF0002', 11, 'WWW.SPAREPARTS.COM', 1),
    (3, 1, 'ITEM 3', 'REF0003', 12, 'WWW.SPAREPARTS.COM', 1),
    (4, 2, 'ITEM 4', 'REF0004', 13, 'WWW.SPAREPARTS.COM', 1),
    (5, 2, 'ITEM 5', 'REF0005', 14, 'WWW.SPAREPARTS.COM', 1);
GO

SET IDENTITY_INSERT [dbo].[SpareParts] OFF;
GO

PRINT 'SpareParts seeded successfully.';
GO

-- =============================================
-- Seed AuthorizationMatrix
-- =============================================
SET IDENTITY_INSERT [dbo].[AuthorizationMatrix] ON;
GO

INSERT INTO [dbo].[AuthorizationMatrix]
    ([AuthMatrixID], [OperatorID], [UpdatedDate], [Authorizations], [EntityID])
VALUES
    (1, 1, '2025-01-01', '{"HAAS":true,"MACHINING CENTER":true,"MAST CUTTING BENCH":false,"PAINT CABIN":false,"FORKLIFT":true}', 1),
    (2, 2, '2025-01-01', '{"HAAS":true,"MACHINING CENTER":true,"MAST CUTTING BENCH":true,"PAINT CABIN":true,"FORKLIFT":false}', 1),
    (3, 3, '2025-01-01', '{"HAAS":false,"MACHINING CENTER":false,"MAST CUTTING BENCH":true,"PAINT CABIN":false,"FORKLIFT":true}', 1);
GO

SET IDENTITY_INSERT [dbo].[AuthorizationMatrix] OFF;
GO

PRINT 'AuthorizationMatrix seeded successfully.';
GO

-- =============================================
-- Seed Shifts
-- =============================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[Shifts])
BEGIN
    INSERT INTO [dbo].[Shifts] ([ShiftName], [StartTime], [EndTime], [EntityID]) VALUES
        ('Morning',   '06:00', '14:00', 1),
        ('Day',       '06:00', '18:00', 1),
        ('Afternoon', '14:00', '22:00', 1),
        ('Night',     '18:00', '06:00', 1);
    PRINT 'Shifts seeded successfully.';
END
GO

-- =============================================
-- Seed ListOptions
-- =============================================
SET IDENTITY_INSERT [dbo].[ListOptions] ON;
GO

-- Machine Types
INSERT INTO [dbo].[ListOptions] ([ListOptionID], [ListType], [OptionValue], [SortOrder], [IsActive])
VALUES
    (1, 'MACHINE_TYPE', 'MACHINE', 1, 1),
    (2, 'MACHINE_TYPE', 'TOOLING', 2, 1);

-- Machine Groups
INSERT INTO [dbo].[ListOptions] ([ListOptionID], [ListType], [OptionValue], [SortOrder], [IsActive])
VALUES
    (3, 'MACHINE_GROUP', 'EC4', 1, 1),
    (4, 'MACHINE_GROUP', 'EC5', 2, 1),
    (5, 'MACHINE_GROUP', 'EC6', 3, 1),
    (6, 'MACHINE_GROUP', 'EC7', 4, 1);

-- Areas
INSERT INTO [dbo].[ListOptions] ([ListOptionID], [ListType], [OptionValue], [SortOrder], [IsActive])
VALUES
    (7, 'AREA', 'IHM', 1, 1),
    (8, 'AREA', 'PRODUCTION', 2, 1),
    (9, 'AREA', 'ASSEMBLY', 3, 1),
    (10, 'AREA', 'TESTING', 4, 1);

-- Periodicities
INSERT INTO [dbo].[ListOptions] ([ListOptionID], [ListType], [OptionValue], [SortOrder], [IsActive])
VALUES
    (11, 'PERIODICITY', 'BEFORE EACH USE', 1, 1),
    (12, 'PERIODICITY', 'DAILY', 2, 1),
    (13, 'PERIODICITY', 'WEEKLY', 3, 1),
    (14, 'PERIODICITY', 'MONTHLY', 4, 1),
    (15, 'PERIODICITY', 'QUARTERLY', 5, 1),
    (16, 'PERIODICITY', 'YEARLY', 6, 1);

-- Authorization Groups
INSERT INTO [dbo].[ListOptions] ([ListOptionID], [ListType], [OptionValue], [SortOrder], [IsActive])
VALUES
    (22, 'AUTHORIZATION_GROUP', 'MAST CUTTING BENCH', 1, 1),
    (23, 'AUTHORIZATION_GROUP', 'MAST SANDER BENCH', 2, 1),
    (24, 'AUTHORIZATION_GROUP', 'BEND TEST', 3, 1),
    (25, 'AUTHORIZATION_GROUP', 'WINDER', 4, 1),
    (26, 'AUTHORIZATION_GROUP', 'BRAIDING', 5, 1),
    (27, 'AUTHORIZATION_GROUP', 'PAINT CABIN', 6, 1),
    (28, 'AUTHORIZATION_GROUP', 'FORKLIFT', 7, 1),
    (29, 'AUTHORIZATION_GROUP', 'MACHINING CENTER', 8, 1),
    (30, 'AUTHORIZATION_GROUP', 'CONTAINER CLIMATIZATION', 9, 1),
    (31, 'AUTHORIZATION_GROUP', 'OVEN CONTROL', 10, 1),
    (32, 'AUTHORIZATION_GROUP', 'CUTTING PLOTTER', 11, 1),
    (33, 'AUTHORIZATION_GROUP', 'OPTIC FIBER EQUIPMENT', 12, 1),
    (34, 'AUTHORIZATION_GROUP', 'GRINDER/POLISHER', 13, 1),
    (35, 'AUTHORIZATION_GROUP', 'TUBE EXTRACTOR', 14, 1),
    (36, 'AUTHORIZATION_GROUP', 'FILAMENT WINDING', 15, 1),
    (37, 'AUTHORIZATION_GROUP', 'HEAT PRESS', 16, 1),
    (38, 'AUTHORIZATION_GROUP', 'ELECTRIC HANDTOOL', 17, 1),
    (39, 'AUTHORIZATION_GROUP', 'PNEUMATIC HANDTOOL', 18, 1),
    (40, 'AUTHORIZATION_GROUP', '3D PRINTER', 19, 1),
    (41, 'AUTHORIZATION_GROUP', 'DESKTOP SANDER', 20, 1),
    (42, 'AUTHORIZATION_GROUP', 'METER MIX', 21, 1),
    (43, 'AUTHORIZATION_GROUP', 'MOULDING', 22, 1),
    (44, 'AUTHORIZATION_GROUP', 'HP PLOTTER', 23, 1),
    (45, 'AUTHORIZATION_GROUP', 'PRESS', 24, 1),
    (46, 'AUTHORIZATION_GROUP', 'PULTRUSION MACHINE', 25, 1),
    (47, 'AUTHORIZATION_GROUP', 'PROPANE BURNER', 26, 1),
    (48, 'AUTHORIZATION_GROUP', 'BAND SAW', 27, 1),
    (49, 'AUTHORIZATION_GROUP', 'WELDING MACHINE', 28, 1),
    (50, 'AUTHORIZATION_GROUP', 'SPRINGBOARD', 29, 1),
    (51, 'AUTHORIZATION_GROUP', 'TAPING MACHINE', 30, 1),
    (52, 'AUTHORIZATION_GROUP', 'RD TESTBEDS', 31, 1),
    (53, 'AUTHORIZATION_GROUP', 'SERVICE TESTBEDS', 32, 1),
    (54, 'AUTHORIZATION_GROUP', 'HAAS', 33, 1);

-- Ticket Categories
INSERT INTO [dbo].[ListOptions] ([ListOptionID], [ListType], [OptionValue], [SortOrder], [IsActive])
VALUES
    (55, 'TICKET_CATEGORY', 'BREAKDOWN', 1, 1),
    (56, 'TICKET_CATEGORY', 'PREVENTIVE', 2, 1),
    (57, 'TICKET_CATEGORY', 'CORRECTIVE', 3, 1),
    (58, 'TICKET_CATEGORY', 'SAFETY', 4, 1),
    (59, 'TICKET_CATEGORY', 'CALIBRATION', 5, 1),
    (60, 'TICKET_CATEGORY', 'ELECTRICAL', 6, 1),
    (61, 'TICKET_CATEGORY', 'MECHANICAL', 7, 1),
    (62, 'TICKET_CATEGORY', 'OTHER', 8, 1);
GO

SET IDENTITY_INSERT [dbo].[ListOptions] OFF;
GO

PRINT 'ListOptions seeded successfully.';
GO

-- =============================================
-- Verification
-- =============================================
PRINT '';
PRINT '=============================================';
PRINT 'Data Seeding Summary:';
PRINT '=============================================';

SELECT 'Entities' AS TableName, COUNT(*) AS RecordCount FROM [dbo].[Entities]
UNION ALL SELECT 'Operators', COUNT(*) FROM [dbo].[Operators]
UNION ALL SELECT 'Machines', COUNT(*) FROM [dbo].[Machines]
UNION ALL SELECT 'MaintenanceActions', COUNT(*) FROM [dbo].[MaintenanceActions]
UNION ALL SELECT 'SpareParts', COUNT(*) FROM [dbo].[SpareParts]
UNION ALL SELECT 'AuthorizationMatrix', COUNT(*) FROM [dbo].[AuthorizationMatrix]
UNION ALL SELECT 'Shifts', COUNT(*) FROM [dbo].[Shifts]
UNION ALL SELECT 'ListOptions', COUNT(*) FROM [dbo].[ListOptions];

PRINT '';
PRINT 'Data seeding completed successfully!';
PRINT '=============================================';
GO
