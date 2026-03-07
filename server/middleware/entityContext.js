/**
 * Entity context middleware — extracts X-Entity-ID and X-Home-Entity-ID
 * headers and attaches them to the request object.
 *
 * req.entityId      — the entity being viewed (1=FFSL, 2=FFVL)
 * req.homeEntityId  — the user's home entity
 * req.isReadOnly    — true when viewing a non-home entity
 */

const VALID_ENTITY_IDS = [1, 2];

// Paths that do NOT require an entity header
const EXEMPT_PREFIXES = ['/api/health', '/api/entities'];

function entityContext(req, res, next) {
    // Skip for exempt paths
    if (EXEMPT_PREFIXES.some(p => req.path.startsWith(p)) || req.path === '/') {
        return next();
    }

    const entityId = parseInt(req.headers['x-entity-id'], 10);

    if (!entityId || !VALID_ENTITY_IDS.includes(entityId)) {
        return res.status(400).json({
            error: { message: 'X-Entity-ID header required (1 or 2)', status: 400 }
        });
    }

    req.entityId = entityId;

    const homeEntityId = parseInt(req.headers['x-home-entity-id'], 10);
    req.homeEntityId = VALID_ENTITY_IDS.includes(homeEntityId) ? homeEntityId : entityId;
    req.isReadOnly = req.entityId !== req.homeEntityId;

    next();
}

module.exports = entityContext;
