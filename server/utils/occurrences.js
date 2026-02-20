/**
 * Shared utility for computing maintenance action occurrences.
 * All dates use UTC to avoid timezone issues with SQL Server DATE values.
 */

const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

/**
 * Generate all scheduled occurrence dates for an action within a date range.
 * @param {Object} action - Must have Periodicity and optional Month fields
 * @param {Date} rangeStart - UTC start date
 * @param {Date} rangeEnd - UTC end date
 * @returns {Date[]} Array of UTC dates
 */
function generateOccurrences(action, rangeStart, rangeEnd) {
    const dates = [];

    switch (action.Periodicity) {
        case 'BEFORE EACH USE': {
            let current = new Date(rangeStart);
            while (current <= rangeEnd) {
                dates.push(new Date(current));
                current = new Date(current);
                current.setUTCDate(current.getUTCDate() + 1);
            }
            break;
        }
        case 'WEEKLY': {
            // Anchor at start of year, step by 7 days
            const yearStart = new Date(Date.UTC(rangeStart.getUTCFullYear(), 0, 1));
            let current = new Date(yearStart);
            while (current <= rangeEnd) {
                if (current >= rangeStart) {
                    dates.push(new Date(current));
                }
                current = new Date(current);
                current.setUTCDate(current.getUTCDate() + 7);
            }
            break;
        }
        case 'MONTHLY': {
            const startYear = rangeStart.getUTCFullYear();
            const startMonth = rangeStart.getUTCMonth();
            const endYear = rangeEnd.getUTCFullYear();
            const endMonth = rangeEnd.getUTCMonth();
            for (let y = startYear; y <= endYear; y++) {
                const mStart = (y === startYear) ? startMonth : 0;
                const mEnd = (y === endYear) ? endMonth : 11;
                for (let m = mStart; m <= mEnd; m++) {
                    const date = new Date(Date.UTC(y, m, 1));
                    if (date >= rangeStart && date <= rangeEnd) {
                        dates.push(date);
                    }
                }
            }
            break;
        }
        case 'QUARTERLY': {
            const quarterMonths = [0, 3, 6, 9];
            let year = rangeStart.getUTCFullYear();
            const endYear = rangeEnd.getUTCFullYear();
            while (year <= endYear) {
                for (const m of quarterMonths) {
                    const date = new Date(Date.UTC(year, m, 1));
                    if (date >= rangeStart && date <= rangeEnd) {
                        dates.push(date);
                    }
                }
                year++;
            }
            break;
        }
        case 'YEARLY': {
            const monthIdx = action.Month
                ? MONTH_NAMES.indexOf(action.Month.toUpperCase())
                : 0;
            const targetMonth = monthIdx >= 0 ? monthIdx : 0;
            let year = rangeStart.getUTCFullYear();
            const endYear = rangeEnd.getUTCFullYear();
            while (year <= endYear) {
                const date = new Date(Date.UTC(year, targetMonth, 1));
                if (date >= rangeStart && date <= rangeEnd) {
                    dates.push(date);
                }
                year++;
            }
            break;
        }
    }
    return dates;
}

/**
 * Count total planned occurrences for a set of actions within a date range.
 * @param {Object[]} actions - Array of action objects with Periodicity and Month
 * @param {Date} rangeStart - UTC start date
 * @param {Date} rangeEnd - UTC end date
 * @returns {number} Total planned occurrence count
 */
function countPlannedOccurrences(actions, rangeStart, rangeEnd) {
    let total = 0;
    for (const action of actions) {
        total += generateOccurrences(action, rangeStart, rangeEnd).length;
    }
    return total;
}

/**
 * Format a UTC date as YYYY-MM-DD string.
 */
function formatDateStr(d) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

module.exports = {
    MONTH_NAMES,
    generateOccurrences,
    countPlannedOccurrences,
    formatDateStr,
};
