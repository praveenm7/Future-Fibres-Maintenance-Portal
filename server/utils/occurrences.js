/**
 * Shared utility for computing maintenance action occurrences.
 * All dates use UTC to avoid timezone issues with SQL Server DATE values.
 *
 * Supports flexible periodicities with:
 *  - IntervalMultiplier: every N periods
 *  - DayOfWeek: 0=Mon..6=Sun
 *  - WeekOfMonth: 1-4 (nth week)
 *  - QuarterMonth: 1-3 (month offset within quarter)
 *  - DayOfMonth: 1-28 (specific day)
 */

const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

// Universal epoch for stable multi-interval alignment (2020-01-06 = Monday)
const EPOCH = new Date(Date.UTC(2020, 0, 6));
const EPOCH_MS = EPOCH.getTime();
const MS_PER_DAY = 86400000;

/** Get day-of-week for a UTC date: 0=Mon..6=Sun */
function getUTCDayOfWeekMon(d) {
    return (d.getUTCDay() + 6) % 7;
}

/** Compute the nth weekday of a given month/year (UTC). */
function nthWeekday(year, month, n, dow) {
    const jsDow = (dow + 1) % 7; // Convert Mon=0 to JS Sun=0
    const first = new Date(Date.UTC(year, month, 1));
    const firstDow = first.getUTCDay();
    const dayOffset = (jsDow - firstDow + 7) % 7;
    const day = 1 + dayOffset + (n - 1) * 7;
    const result = new Date(Date.UTC(year, month, day));
    if (result.getUTCMonth() !== month) return null;
    return result;
}

/** Create a safe day-of-month date, capping at 28. */
function safeDayOfMonth(year, month, day) {
    return new Date(Date.UTC(year, month, Math.min(day, 28)));
}

/**
 * Generate all scheduled occurrence dates for an action within a date range.
 * @param {Object} action - Must have Periodicity and optional schedule fields
 * @param {Date} rangeStart - UTC start date
 * @param {Date} rangeEnd - UTC end date
 * @returns {Date[]} Array of UTC dates
 */
function generateOccurrences(action, rangeStart, rangeEnd) {
    const dates = [];
    const interval = action.IntervalMultiplier || 1;

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

        case 'DAILY': {
            const daysSinceEpoch = Math.floor((rangeStart.getTime() - EPOCH_MS) / MS_PER_DAY);
            const remainder = ((daysSinceEpoch % interval) + interval) % interval;
            const offset = remainder === 0 ? 0 : interval - remainder;
            let current = new Date(rangeStart);
            current.setUTCDate(current.getUTCDate() + offset);
            while (current <= rangeEnd) {
                dates.push(new Date(current));
                current = new Date(current);
                current.setUTCDate(current.getUTCDate() + interval);
            }
            break;
        }

        case 'WEEKLY': {
            const targetDow = (action.DayOfWeek != null) ? action.DayOfWeek : 0;
            const startDow = getUTCDayOfWeekMon(rangeStart);
            const daysToTarget = (targetDow - startDow + 7) % 7;
            let current = new Date(rangeStart);
            current.setUTCDate(current.getUTCDate() + daysToTarget);

            if (interval > 1) {
                const weeksSinceEpoch = Math.floor((current.getTime() - EPOCH_MS) / (MS_PER_DAY * 7));
                const weekRemainder = ((weeksSinceEpoch % interval) + interval) % interval;
                if (weekRemainder !== 0) {
                    current.setUTCDate(current.getUTCDate() + (interval - weekRemainder) * 7);
                }
            }

            while (current <= rangeEnd) {
                if (current >= rangeStart) {
                    dates.push(new Date(current));
                }
                current = new Date(current);
                current.setUTCDate(current.getUTCDate() + interval * 7);
            }
            break;
        }

        case 'MONTHLY': {
            const hasDayOfMonth = action.DayOfMonth != null;
            const hasWeekOfMonth = action.WeekOfMonth != null;
            const dow = (action.DayOfWeek != null) ? action.DayOfWeek : 0;

            const epochMonth = EPOCH.getUTCFullYear() * 12 + EPOCH.getUTCMonth();
            const startMonth = rangeStart.getUTCFullYear() * 12 + rangeStart.getUTCMonth();
            const endMonth = rangeEnd.getUTCFullYear() * 12 + rangeEnd.getUTCMonth();

            let monthOffset = startMonth - epochMonth;
            const remainder = ((monthOffset % interval) + interval) % interval;
            let m = remainder === 0 ? startMonth : startMonth + (interval - remainder);

            while (m <= endMonth) {
                const year = Math.floor(m / 12);
                const month = m % 12;
                let date;

                if (hasDayOfMonth) {
                    date = safeDayOfMonth(year, month, action.DayOfMonth);
                } else if (hasWeekOfMonth) {
                    date = nthWeekday(year, month, action.WeekOfMonth, dow);
                } else {
                    date = new Date(Date.UTC(year, month, 1));
                }

                if (date && date >= rangeStart && date <= rangeEnd) {
                    dates.push(date);
                }
                m += interval;
            }
            break;
        }

        case 'QUARTERLY': {
            const quarterMonthOffset = (action.QuarterMonth || 1) - 1;
            const dayOfMonth = action.DayOfMonth || 1;

            const epochQuarter = Math.floor(EPOCH.getUTCMonth() / 3) + EPOCH.getUTCFullYear() * 4;
            const startQuarter = Math.floor(rangeStart.getUTCMonth() / 3) + rangeStart.getUTCFullYear() * 4;
            const endQuarter = Math.floor(rangeEnd.getUTCMonth() / 3) + rangeEnd.getUTCFullYear() * 4;

            let qOffset = startQuarter - epochQuarter;
            const remainder = ((qOffset % interval) + interval) % interval;
            let q = remainder === 0 ? startQuarter : startQuarter + (interval - remainder);

            while (q <= endQuarter) {
                const year = Math.floor(q / 4);
                const quarterBase = (q % 4) * 3;
                const targetMonth = quarterBase + quarterMonthOffset;

                if (targetMonth <= 11) {
                    const date = safeDayOfMonth(year, targetMonth, dayOfMonth);
                    if (date >= rangeStart && date <= rangeEnd) {
                        dates.push(date);
                    }
                }
                q += interval;
            }
            break;
        }

        case 'YEARLY': {
            const monthIdx = action.Month
                ? MONTH_NAMES.indexOf(action.Month.toUpperCase())
                : 0;
            const targetMonth = monthIdx >= 0 ? monthIdx : 0;
            const dayOfMonth = action.DayOfMonth || 1;

            let year = rangeStart.getUTCFullYear();
            const endYear = rangeEnd.getUTCFullYear();

            const epochYear = EPOCH.getUTCFullYear();
            let yearOffset = year - epochYear;
            const remainder = ((yearOffset % interval) + interval) % interval;
            if (remainder !== 0) {
                year += interval - remainder;
            }

            while (year <= endYear) {
                const date = safeDayOfMonth(year, targetMonth, dayOfMonth);
                if (date >= rangeStart && date <= rangeEnd) {
                    dates.push(date);
                }
                year += interval;
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
