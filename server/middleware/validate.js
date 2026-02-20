const Joi = require('joi');

/**
 * Express middleware factory: validates req.body against a Joi schema.
 * Returns 400 with detailed error messages on failure.
 */
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            const messages = error.details.map(d => d.message);
            return res.status(400).json({
                error: { message: 'Validation failed', details: messages, status: 400 }
            });
        }
        req.body = value; // use sanitized/coerced values
        next();
    };
}

/**
 * Validates req.query against a Joi schema.
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            const messages = error.details.map(d => d.message);
            return res.status(400).json({
                error: { message: 'Validation failed', details: messages, status: 400 }
            });
        }
        req.query = value;
        next();
    };
}

// ─── Schemas ──────────────────────────────────────────────

const schemas = {};

// --- Machines ---
schemas.createMachine = Joi.object({
    type: Joi.string().max(50).required(),
    description: Joi.string().max(255).required(),
    group: Joi.string().max(50),
    machineGroup: Joi.string().max(50),
    purchasingDate: Joi.date().iso().allow(null, ''),
    purchasingCost: Joi.number().precision(2).allow(null, ''),
    poNumber: Joi.string().max(50).allow(null, ''),
    area: Joi.string().max(100).allow(null, ''),
    manufacturer: Joi.string().max(100).allow(null, ''),
    model: Joi.string().max(100).allow(null, ''),
    serialNumber: Joi.string().max(100).allow(null, ''),
    manufacturerYear: Joi.string().max(50).allow(null, ''),
    power: Joi.string().max(50).allow(null, ''),
    permissionRequired: Joi.boolean().default(false),
    authorizationGroup: Joi.string().max(100).allow(null, ''),
    maintenanceNeeded: Joi.boolean().default(false),
    maintenanceOnHold: Joi.boolean().default(false),
    personInChargeID: Joi.number().integer().allow(null),
    imageUrl: Joi.string().max(500).allow(null, ''),
}).or('group', 'machineGroup');

schemas.updateMachine = schemas.createMachine;

// --- Maintenance Actions ---
schemas.createMaintenanceAction = Joi.object({
    machineId: Joi.number().integer().required(),
    action: Joi.string().max(500).required(),
    periodicity: Joi.string().max(50).required(),
    timeNeeded: Joi.number().integer().min(1).required(),
    maintenanceInCharge: Joi.boolean().required(),
    status: Joi.string().max(50).required(),
    month: Joi.string().max(50).required(),
});

schemas.updateMaintenanceAction = schemas.createMaintenanceAction;

// --- Non-Conformities ---
schemas.createNonConformity = Joi.object({
    machineId: Joi.number().integer().required(),
    area: Joi.string().max(100).required(),
    maintenanceOperatorId: Joi.number().integer().required(),
    creationDate: Joi.date().iso().allow(null, ''),
    status: Joi.string().max(50).required(),
    priority: Joi.number().integer().min(1).required(),
    category: Joi.string().max(100).required(),
});

schemas.updateNonConformity = Joi.object({
    machineId: Joi.number().integer().required(),
    area: Joi.string().max(100).required(),
    maintenanceOperatorId: Joi.number().integer().required(),
    creationDate: Joi.date().iso().allow(null, ''),
    initiationDate: Joi.date().iso().allow(null, ''),
    finishDate: Joi.date().iso().allow(null, ''),
    status: Joi.string().max(50).required(),
    priority: Joi.number().integer().min(1).required(),
    category: Joi.string().max(100).required(),
});

// --- NC Comments ---
schemas.createNCComment = Joi.object({
    ncId: Joi.number().integer().required(),
    commentDate: Joi.date().iso().allow(null, ''),
    comment: Joi.string().max(1000).required(),
    operatorId: Joi.number().integer().required(),
});

// --- Spare Parts ---
schemas.createSparePart = Joi.object({
    machineId: Joi.number().integer().required(),
    description: Joi.string().max(255).required(),
    reference: Joi.string().max(100).required(),
    quantity: Joi.number().integer().min(0).default(0),
    link: Joi.string().max(500).allow(null, ''),
});

schemas.updateSparePart = schemas.createSparePart;

// --- Operators ---
schemas.createOperator = Joi.object({
    operatorName: Joi.string().max(100).required(),
    email: Joi.string().email().max(100).required(),
    department: Joi.string().max(50).required(),
    isActive: Joi.boolean().default(true),
});

schemas.updateOperator = schemas.createOperator;

// --- List Options ---
schemas.createListOption = Joi.object({
    listType: Joi.string().max(50).required(),
    optionValue: Joi.string().max(100),
    value: Joi.string().max(100),
    sortOrder: Joi.number().integer().default(0),
    isActive: Joi.boolean().default(true),
}).or('optionValue', 'value');

schemas.updateListOption = schemas.createListOption;

// --- Authorization Matrix ---
schemas.createAuthMatrix = Joi.object({
    operatorName: Joi.string().max(100),
    operatorId: Joi.number().integer(),
    email: Joi.string().email().max(100).allow(null, ''),
    department: Joi.string().max(50).allow(null, ''),
    authorizations: Joi.alternatives().try(Joi.object(), Joi.string()).default('{}'),
    updatedDate: Joi.string().allow(null, ''),
    defaultShiftId: Joi.number().integer().allow(null),
}).or('operatorName', 'operatorId');

schemas.updateAuthMatrix = Joi.object({
    authorizations: Joi.alternatives().try(Joi.object(), Joi.string()),
    updatedDate: Joi.string().allow(null, ''),
    email: Joi.string().email().max(100).allow(null, ''),
    department: Joi.string().max(50).allow(null, ''),
    defaultShiftId: Joi.number().integer().allow(null),
});

// --- Maintenance Executions ---
schemas.createExecution = Joi.object({
    actionId: Joi.number().integer().required(),
    machineId: Joi.number().integer().required(),
    scheduledDate: Joi.date().iso().required(),
    status: Joi.string().max(50).valid('PENDING', 'COMPLETED', 'SKIPPED').default('COMPLETED'),
    actualTime: Joi.number().integer().min(0).allow(null),
    completedById: Joi.number().integer().allow(null),
    notes: Joi.string().max(1000).allow(null, ''),
});

schemas.updateExecution = Joi.object({
    status: Joi.string().max(50).valid('PENDING', 'COMPLETED', 'SKIPPED').required(),
    actualTime: Joi.number().integer().min(0).allow(null),
    completedById: Joi.number().integer().allow(null),
    notes: Joi.string().max(1000).allow(null, ''),
});

// --- Shifts ---
schemas.setDefaultShift = Joi.object({
    shiftId: Joi.number().integer().allow(null),
});

schemas.createShiftOverride = Joi.object({
    operatorId: Joi.number().integer().required(),
    date: Joi.date().iso().required(),
    shiftId: Joi.number().integer().allow(null),
});

module.exports = { validate, validateQuery, schemas };
