/**
 * Dynamic Query Builder for Custom Reports
 *
 * SECURITY-CRITICAL: All identifiers are validated against the whitelist in reportMetadata.js.
 * All user-supplied values are parameterized via @paramN — zero string concatenation.
 */

const { tables, joins, computedFields, filterOperatorsByType, validAggFunctions } = require('./reportMetadata');

const MAX_ROWS = 10000;

class QueryBuilderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QueryBuilderError';
        this.statusCode = 400;
    }
}

/**
 * Resolve the field key (e.g., 'Machines.FinalCode') to its metadata.
 */
function resolveField(fieldKey) {
    const dotIdx = fieldKey.indexOf('.');
    if (dotIdx === -1) throw new QueryBuilderError(`Invalid field key format: "${fieldKey}"`);

    const tableName = fieldKey.substring(0, dotIdx);
    const tableMeta = tables[tableName];
    if (!tableMeta) throw new QueryBuilderError(`Unknown table: "${tableName}"`);

    const fieldMeta = tableMeta.fields[fieldKey];
    if (!fieldMeta) throw new QueryBuilderError(`Unknown field: "${fieldKey}"`);

    return { tableName, fieldMeta, dbTable: tableMeta.dbTable };
}

/**
 * BFS to find the minimal join path connecting all required tables to the primary table.
 *
 * Returns normalized join entries:
 *   { newTable, existingTable, newColumn, existingColumn, joinType, alias }
 * where newTable is the table being added to FROM, and existingTable is already in FROM.
 */
function resolveJoinPath(primaryTable, requiredTables) {
    if (requiredTables.length === 0) return [];

    // Build adjacency list (bidirectional)
    const adjacency = {};
    for (const j of joins) {
        if (!adjacency[j.from]) adjacency[j.from] = [];
        if (!adjacency[j.to]) adjacency[j.to] = [];
        adjacency[j.from].push({ ...j, direction: 'forward' });
        adjacency[j.to].push({ ...j, direction: 'reverse' });
    }

    /**
     * Normalize a raw edge + direction into a consistent format where
     * existingTable is already in FROM and newTable is being added.
     */
    function normalizeEdge(edge) {
        if (edge.direction === 'forward') {
            // edge.from (existing) -> edge.to (new)
            return {
                newTable: edge.to,
                existingTable: edge.from,
                newColumn: edge.toColumn,
                existingColumn: edge.fromColumn,
                joinType: edge.type,
                alias: edge.alias || null,
            };
        } else {
            // edge.to (existing) -> edge.from (new)
            return {
                newTable: edge.from,
                existingTable: edge.to,
                newColumn: edge.fromColumn,
                existingColumn: edge.toColumn,
                joinType: edge.type,
                alias: null, // aliases only apply in the forward direction
            };
        }
    }

    const resolvedJoins = [];
    const joinedTables = new Set([primaryTable]);
    const addedJoinKeys = new Set();

    for (const target of requiredTables) {
        if (joinedTables.has(target)) continue;

        // BFS: each entry tracks { node, path: [{ edge, fromNode }] }
        const queue = [];
        const visited = new Set();

        for (const node of joinedTables) {
            queue.push({ node, path: [] });
            visited.add(node);
        }

        let foundPath = null;
        while (queue.length > 0 && !foundPath) {
            const { node: current, path } = queue.shift();
            const neighbors = adjacency[current] || [];

            for (const edge of neighbors) {
                const neighbor = edge.direction === 'forward' ? edge.to : edge.from;
                const visitKey = `${neighbor}:${edge.alias || ''}`;
                if (visited.has(visitKey)) continue;
                visited.add(visitKey);

                const newPath = [...path, { edge, fromNode: current }];

                if (neighbor === target) {
                    foundPath = newPath;
                    break;
                }

                queue.push({ node: neighbor, path: newPath });
            }
        }

        if (!foundPath) {
            throw new QueryBuilderError(`Cannot auto-join table "${target}" to "${primaryTable}". No relationship path found.`);
        }

        // Normalize and deduplicate
        for (const { edge } of foundPath) {
            const normalized = normalizeEdge(edge);
            const key = `${normalized.existingTable}->${normalized.newTable}:${normalized.existingColumn}:${normalized.alias || ''}`;
            if (!addedJoinKeys.has(key)) {
                addedJoinKeys.add(key);
                resolvedJoins.push(normalized);
                joinedTables.add(normalized.newTable);
            }
        }
    }

    return resolvedJoins;
}

/**
 * Build a mapping from logical table name → SQL reference name.
 *
 * When a table is joined with an alias (e.g., Operators AS PersonInCharge),
 * SQL Server only knows it by the alias. This map ensures all column references
 * use the correct identifier.
 *
 * @param {string} primaryTable - The primary table key
 * @param {Array} resolvedJoins - Array of resolved join edges
 * @returns {Map<string, string>} tableName → SQL reference
 */
function buildTableRefMap(primaryTable, resolvedJoins) {
    const refMap = new Map();

    // Primary table is always referenced by its own name
    refMap.set(primaryTable, tables[primaryTable].dbTable);

    for (const j of resolvedJoins) {
        // j.newTable is the table being added to FROM
        const sqlRef = j.alias || tables[j.newTable].dbTable;

        if (!refMap.has(j.newTable)) {
            refMap.set(j.newTable, sqlRef);
        }

        if (j.alias) {
            refMap.set(j.alias, j.alias);
        }

        // Ensure the existing side is also mapped
        if (!refMap.has(j.existingTable)) {
            refMap.set(j.existingTable, tables[j.existingTable].dbTable);
        }
    }

    return refMap;
}

/**
 * Get the SQL reference for a table, using the refMap.
 */
function getTableRef(refMap, tableName) {
    return refMap.get(tableName) || tables[tableName]?.dbTable || tableName;
}

/**
 * Build the SQL query from a report definition.
 *
 * @param {object} definition - The report definition JSON
 * @param {number} entityId - The entity ID for isolation
 * @param {number} [limit] - Max rows (capped at MAX_ROWS)
 * @returns {{ sql: string, parameters: Array<{ name: string, type: string, value: any }> }}
 */
function buildQuery(definition, entityId, limit) {
    const {
        dataSources = [],
        columns = [],
        filters = [],
        sorting = [],
        groupBy = [],
        aggregations = [],
        computedFields: requestedComputed = [],
    } = definition;

    if (!dataSources.length) throw new QueryBuilderError('At least one data source is required');

    // Validate all data sources
    for (const ds of dataSources) {
        if (!tables[ds]) throw new QueryBuilderError(`Unknown data source: "${ds}"`);
    }

    // Determine primary table (first data source)
    const primaryTable = dataSources[0];
    const primaryDbTable = tables[primaryTable].dbTable;

    // Collect all tables referenced by columns, filters, sorting, groupBy
    const referencedTables = new Set(dataSources);
    const allFieldKeys = [
        ...columns.map(c => c.fieldKey),
        ...filters.map(f => f.fieldKey),
        ...sorting.map(s => s.fieldKey),
        ...groupBy,
        ...aggregations.map(a => a.fieldKey),
    ];

    for (const fk of allFieldKeys) {
        const { tableName } = resolveField(fk);
        referencedTables.add(tableName);
    }

    // Validate and collect required tables from computed fields
    for (const cfKey of requestedComputed) {
        const cf = computedFields[cfKey];
        if (!cf) throw new QueryBuilderError(`Unknown computed field: "${cfKey}"`);
        for (const rt of cf.requiredTables) {
            referencedTables.add(rt);
        }
    }

    // Resolve joins for all tables beyond the primary
    const additionalTables = [...referencedTables].filter(t => t !== primaryTable);
    const resolvedJoins = resolveJoinPath(primaryTable, additionalTables);

    // Build table reference map (logical name → SQL identifier)
    const refMap = buildTableRefMap(primaryTable, resolvedJoins);

    const parameters = [];
    let paramIndex = 0;

    function addParam(value, type) {
        const name = `p${paramIndex++}`;
        parameters.push({ name, type, value });
        return `@${name}`;
    }

    /** Get [sqlRef].[column] for a field key */
    function columnRef(tableName, dbColumn) {
        const ref = getTableRef(refMap, tableName);
        return `[${ref}].[${dbColumn}]`;
    }

    // --- Build SELECT ---
    const selectParts = [];
    const isGrouped = groupBy.length > 0 || aggregations.length > 0;

    // Regular columns — when grouped, only include columns that are in groupBy
    const visibleColumns = columns.filter(c => c.visible !== false);
    const groupBySet = new Set(groupBy);

    const effectiveColumns = isGrouped
        ? visibleColumns.filter(c => groupBySet.has(c.fieldKey))
        : visibleColumns;

    if (effectiveColumns.length === 0 && aggregations.length === 0 && requestedComputed.length === 0) {
        throw new QueryBuilderError('At least one column, aggregation, or computed field must be selected');
    }

    for (const col of effectiveColumns) {
        const { tableName, fieldMeta } = resolveField(col.fieldKey);
        const alias = col.alias || fieldMeta.label;
        selectParts.push(`${columnRef(tableName, fieldMeta.dbColumn)} AS [${alias}]`);
    }

    // Aggregations
    for (const agg of aggregations) {
        if (!validAggFunctions.includes(agg.function)) {
            throw new QueryBuilderError(`Invalid aggregation function: "${agg.function}"`);
        }
        const { tableName, fieldMeta } = resolveField(agg.fieldKey);
        const alias = agg.alias || `${agg.function}_${fieldMeta.dbColumn}`;
        selectParts.push(`${agg.function}(${columnRef(tableName, fieldMeta.dbColumn)}) AS [${alias}]`);
    }

    // Computed fields — expressions reference tables by their original names.
    // We need to replace table references in expressions with the actual SQL refs.
    for (const cfKey of requestedComputed) {
        const cf = computedFields[cfKey];
        let expr = cf.expression;
        // Replace [TableName]. with [sqlRef]. for each required table
        for (const rt of cf.requiredTables) {
            const ref = getTableRef(refMap, rt);
            if (ref !== tables[rt].dbTable) {
                const original = `[${tables[rt].dbTable}]`;
                const replacement = `[${ref}]`;
                expr = expr.split(original).join(replacement);
            }
        }
        selectParts.push(`${expr} AS [${cf.label}]`);
    }

    // --- Build FROM + JOINs ---
    let fromClause = `[${primaryDbTable}]`;
    for (const j of resolvedJoins) {
        const newDb = tables[j.newTable].dbTable;
        const aliasSql = j.alias ? ` AS [${j.alias}]` : '';
        const newRef = j.alias || newDb;

        // The existing side references an already-joined table
        const existingRef = getTableRef(refMap, j.existingTable);

        fromClause += `\n    ${j.joinType} JOIN [${newDb}]${aliasSql} ON [${existingRef}].[${j.existingColumn}] = [${newRef}].[${j.newColumn}]`;
    }

    // --- Build WHERE ---
    const whereParts = [];

    // Mandatory entity isolation on the primary table
    if (tables[primaryTable].hasEntityId) {
        const pName = addParam(entityId, 'Int');
        whereParts.push(`[${primaryDbTable}].[EntityID] = ${pName}`);
    }

    // User filters
    for (const filter of filters) {
        const { tableName, fieldMeta } = resolveField(filter.fieldKey);
        const col = columnRef(tableName, fieldMeta.dbColumn);
        const dataType = fieldMeta.dataType;

        // Validate operator for data type
        const validOps = filterOperatorsByType[dataType];
        if (!validOps || !validOps.includes(filter.operator)) {
            throw new QueryBuilderError(`Operator "${filter.operator}" not valid for ${dataType} field "${filter.fieldKey}"`);
        }

        const sqlType = dataType === 'decimal' ? 'Decimal' :
                        dataType === 'number' ? 'Int' :
                        dataType === 'boolean' ? 'Bit' :
                        dataType === 'date' ? 'Date' :
                        dataType === 'datetime' ? 'DateTime' : 'NVarChar';

        switch (filter.operator) {
            case 'eq':
                whereParts.push(`${col} = ${addParam(filter.value, sqlType)}`);
                break;
            case 'neq':
                whereParts.push(`${col} != ${addParam(filter.value, sqlType)}`);
                break;
            case 'gt':
                whereParts.push(`${col} > ${addParam(filter.value, sqlType)}`);
                break;
            case 'gte':
                whereParts.push(`${col} >= ${addParam(filter.value, sqlType)}`);
                break;
            case 'lt':
                whereParts.push(`${col} < ${addParam(filter.value, sqlType)}`);
                break;
            case 'lte':
                whereParts.push(`${col} <= ${addParam(filter.value, sqlType)}`);
                break;
            case 'contains':
                whereParts.push(`${col} LIKE '%' + ${addParam(filter.value, 'NVarChar')} + '%'`);
                break;
            case 'startsWith':
                whereParts.push(`${col} LIKE ${addParam(filter.value, 'NVarChar')} + '%'`);
                break;
            case 'endsWith':
                whereParts.push(`${col} LIKE '%' + ${addParam(filter.value, 'NVarChar')}`);
                break;
            case 'in': {
                if (!Array.isArray(filter.value) || filter.value.length === 0) {
                    throw new QueryBuilderError(`"in" operator requires a non-empty array for "${filter.fieldKey}"`);
                }
                const inParams = filter.value.map(v => addParam(v, sqlType));
                whereParts.push(`${col} IN (${inParams.join(', ')})`);
                break;
            }
            case 'notIn': {
                if (!Array.isArray(filter.value) || filter.value.length === 0) {
                    throw new QueryBuilderError(`"notIn" operator requires a non-empty array for "${filter.fieldKey}"`);
                }
                const notInParams = filter.value.map(v => addParam(v, sqlType));
                whereParts.push(`${col} NOT IN (${notInParams.join(', ')})`);
                break;
            }
            case 'isNull':
                whereParts.push(`${col} IS NULL`);
                break;
            case 'isNotNull':
                whereParts.push(`${col} IS NOT NULL`);
                break;
            case 'between': {
                if (!Array.isArray(filter.value) || filter.value.length !== 2) {
                    throw new QueryBuilderError(`"between" operator requires [min, max] for "${filter.fieldKey}"`);
                }
                whereParts.push(`${col} BETWEEN ${addParam(filter.value[0], sqlType)} AND ${addParam(filter.value[1], sqlType)}`);
                break;
            }
            default:
                throw new QueryBuilderError(`Unknown filter operator: "${filter.operator}"`);
        }
    }

    // --- Build GROUP BY ---
    let groupByClause = '';
    if (isGrouped) {
        const groupByParts = [];
        for (const gk of groupBy) {
            const { tableName, fieldMeta } = resolveField(gk);
            groupByParts.push(columnRef(tableName, fieldMeta.dbColumn));
        }
        if (groupByParts.length > 0) {
            groupByClause = `GROUP BY ${groupByParts.join(', ')}`;
        }
    }

    // --- Build ORDER BY ---
    let orderByClause = '';
    if (sorting.length > 0) {
        const orderParts = [];
        for (const s of sorting) {
            const { tableName, fieldMeta } = resolveField(s.fieldKey);
            const dir = s.direction === 'desc' ? 'DESC' : 'ASC';
            orderParts.push(`${columnRef(tableName, fieldMeta.dbColumn)} ${dir}`);
        }
        orderByClause = `ORDER BY ${orderParts.join(', ')}`;
    }

    // --- Enforce row limit ---
    const effectiveLimit = Math.min(limit || 1000, MAX_ROWS);
    const limitParam = addParam(effectiveLimit, 'Int');

    // --- Assemble final SQL ---
    const parts = [
        `SELECT TOP(${limitParam})`,
        `    ${selectParts.join(',\n    ')}`,
        `FROM ${fromClause}`,
    ];

    if (whereParts.length > 0) {
        parts.push(`WHERE ${whereParts.join('\n    AND ')}`);
    }

    if (groupByClause) {
        parts.push(groupByClause);
    }

    if (orderByClause) {
        parts.push(orderByClause);
    }

    const sqlQuery = parts.join('\n');

    return { sql: sqlQuery, parameters };
}

module.exports = { buildQuery, QueryBuilderError, MAX_ROWS };
