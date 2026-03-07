/**
 * Write-protection middleware — blocks POST/PUT/PATCH/DELETE
 * when the user is viewing a non-home entity (read-only mode).
 *
 * Usage: router.post('/', requireWriteAccess, handler)
 */

function requireWriteAccess(req, res, next) {
    if (req.isReadOnly) {
        return res.status(403).json({
            error: { message: 'Read-only access: you cannot modify data for a non-home entity', status: 403 }
        });
    }
    next();
}

module.exports = requireWriteAccess;
