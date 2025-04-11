import ratesData from './interestRates.js';

// --- Date Utilities ---

// Helper to parse YYYY-MM-DD string to UTC Date object at the start of the day
function parseDateUTC(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    console.error(`Invalid date string format for UTC parsing: ${dateString}`);
    return null;
}

// Helper to format a Date object back to YYYY-MM-DD
function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Calculate the number of days between two UTC dates (inclusive of start, exclusive of end)
function daysBetween(startDate, endDate) {
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 0;
    }
    // Calculate difference in milliseconds and convert to days
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    // Use Math.round to avoid potential floating point issues with DST transitions if not using UTC
    return Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay));
}

// Get the start date of the calendar half-year period for a given date
function getPeriodStartDate(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-11
    if (month < 6) { // Jan-Jun
        return new Date(Date.UTC(year, 0, 1)); // Jan 1
    } else { // Jul-Dec
        return new Date(Date.UTC(year, 6, 1)); // Jul 1
    }
}

// Get the end date of the calendar half-year period for a given date
function getPeriodEndDate(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-11
    if (month < 6) { // Jan-Jun
        return new Date(Date.UTC(year, 5, 30, 23, 59, 59, 999)); // June 30 end of day
    } else { // Jul-Dec
        return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)); // Dec 31 end of day
    }
}

// Get the next period's start date
function getNextPeriodStartDate(periodEndDate) {
    const nextDay = new Date(periodEndDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    return getPeriodStartDate(nextDay); // Should align with Jan 1 or Jul 1
}

// --- Interest Rate Lookup ---

function getInterestRate(jurisdiction, date) {
    const ratesForJurisdiction = ratesData[jurisdiction];
    if (!ratesForJurisdiction) {
        console.error(`No rates found for jurisdiction: ${jurisdiction}`);
        return null; // Or a default/error rate
    }

    // Find the rate period that includes the given date
    // Assumes ratesData is sorted by start date
    const rateInfo = ratesForJurisdiction.find(rate =>
        date >= rate.start && date <= rate.end
    );

    if (!rateInfo) {
        console.warn(`No rate found for ${jurisdiction} on date ${formatDate(date)}`);
        // Handle cases outside defined ranges (e.g., return last known rate or 0)
        // For now, return null or a specific error indicator
        return null;
    }

    // For special damages, we use the 'prejudgment' rate according to COIA
    return rateInfo.prejudgment / 100; // Return as decimal (e.g., 1.95% -> 0.0195)
}

// --- Core Calculation Logic ---

// Calculate simple interest
function calculateSimpleInterest(principal, annualRate, days) {
    if (days <= 0 || principal <= 0 || annualRate === null || annualRate < 0) {
        return 0;
    }
    const daysInYear = 365; // Assuming non-leap year for simplicity, adjust if precise leap year needed
    // Consider if leap year calculation is strictly required by BC law/practice
    return principal * annualRate * (days / daysInYear);
}

/**
 * Calculates special damages interest based on mockup logic.
 * @param {string} causeOfActionDateStr - YYYY-MM-DD
 * @param {string} judgmentDateStr - YYYY-MM-DD
 * @param {Array<{date: string, description: string, amount: number}>} damages - Array of damage objects
 * @param {string} jurisdiction - e.g., 'BC'
 * @returns {object} - Contains periodData array and summary totals
 */
export function calculateSpecialDamagesInterest(causeOfActionDateStr, judgmentDateStr, damages, jurisdiction) {
    const causeOfActionDate = parseDateUTC(causeOfActionDateStr);
    const judgmentDate = parseDateUTC(judgmentDateStr);

    if (!causeOfActionDate || !judgmentDate || !damages || damages.length === 0) {
        return { periodData: [], summary: { totalSpecials: 0, interestOnSpecials: 0, total: 0 } };
    }

    // Sort damages by date
    const sortedDamages = damages
        .map(d => ({ ...d, date: parseDateUTC(d.date), amount: Number(d.amount) || 0 }))
        .filter(d => d.date && d.amount > 0) // Ensure valid date and positive amount
        .sort((a, b) => a.date - b.date);

    if (sortedDamages.length === 0) {
         return { periodData: [], summary: { totalSpecials: 0, interestOnSpecials: 0, total: 0 } };
    }

    let periodData = [];
    let currentBalance = 0;
    let cumulativeInterest = 0;
    let totalSpecials = 0;

    // Determine the start date for calculations (cannot be before the first damage)
    const firstDamageDate = sortedDamages[0].date;
    let periodStartDate = getPeriodStartDate(firstDamageDate);
    // Ensure period start is not before cause of action? COIA seems to imply periods start relative to CoA,
    // but practice (rates.js) uses calendar. Let's stick to calendar periods containing damages.
    // If first damage is before CoA, that's an input error.

    let damageIndex = 0;

    while (periodStartDate < judgmentDate) {
        let periodEndDate = getPeriodEndDate(periodStartDate);
        // Ensure the period end does not go past the judgment date
        let effectivePeriodEndDate = (periodEndDate > judgmentDate) ? judgmentDate : periodEndDate;

        const periodRate = getInterestRate(jurisdiction, periodStartDate); // Rate for the period
        if (periodRate === null) {
             console.error(`Could not find rate for period starting ${formatDate(periodStartDate)}`);
             // Decide how to handle missing rates - skip period? Use 0? Throw error?
             // For now, let's skip interest calculation for this period if rate is missing.
             // periodRate = 0; // Or handle differently
             return { error: `Missing rate for period starting ${formatDate(periodStartDate)}`, periodData: [], summary: {} };
        }

        const daysInPeriod = daysBetween(periodStartDate, effectivePeriodEndDate) + 1; // Inclusive end for period duration

        // Calculate interest on the starting balance for the *entire* period
        // (COIA s1(2) - interest calculated FROM end of period, applied TO balance at start of NEXT period)
        // The mockup applies interest on the *previous* period's subtotal over the *current* period.
        let interestOnBalance = calculateSimpleInterest(currentBalance, periodRate, daysInPeriod);

        let damagesInPeriod = [];
        let periodSubtotalDamages = 0;
        let interestOnDamagesInFinalPeriod = 0; // Only used for the last period

        // Process damages incurred within this period [periodStartDate, effectivePeriodEndDate]
        while (damageIndex < sortedDamages.length && sortedDamages[damageIndex].date <= effectivePeriodEndDate) {
            const damage = sortedDamages[damageIndex];
            if (damage.date >= periodStartDate) { // Ensure damage is within the current processing window
                damagesInPeriod.push({
                    date: formatDate(damage.date),
                    description: damage.description,
                    amount: damage.amount
                });
                periodSubtotalDamages += damage.amount;
                totalSpecials += damage.amount; // Add to overall total specials

                // Handle final period interest calculation (COIA s. 1(3)(b))
                if (effectivePeriodEndDate === judgmentDate) {
                    const daysOfInterest = daysBetween(damage.date, judgmentDate) + 1; // Inclusive end
                    const damageInterest = calculateSimpleInterest(damage.amount, periodRate, daysOfInterest);
                    interestOnDamagesInFinalPeriod += damageInterest;
                    // Add detail for mockup display
                     damagesInPeriod[damagesInPeriod.length - 1].interestDetail = { days: daysOfInterest, interest: damageInterest };
                }
            }
            damageIndex++;
        }

        // Accumulate interest
        // For the final period, the interest is the sum of interest on the starting balance
        // PLUS the individually calculated interest on damages within that period.
        // For other periods, interest is just calculated on the starting balance.
        let periodInterestAccrued = (effectivePeriodEndDate === judgmentDate)
            ? interestOnBalance + interestOnDamagesInFinalPeriod
            : interestOnBalance;

        cumulativeInterest += periodInterestAccrued;

        // Store period results
        periodData.push({
            periodStartDate: formatDate(periodStartDate),
            periodEndDate: formatDate(effectivePeriodEndDate),
            rate: periodRate * 100, // Store as percentage
            days: daysInPeriod,
            startingBalance: currentBalance,
            interestOnBalance: interestOnBalance, // Interest calculated on the opening balance
            damagesInPeriod: damagesInPeriod,
            periodDamagesTotal: periodSubtotalDamages,
            interestOnDamagesInFinalPeriod: interestOnDamagesInFinalPeriod, // Only non-zero for final period
            periodInterestTotal: periodInterestAccrued, // Total interest relevant to this period's calculations
            periodEndingBalance: currentBalance + periodSubtotalDamages, // Balance before adding next period's interest
            cumulativeInterestAtPeriodEnd: cumulativeInterest // Total interest up to the end of this period
        });

        // Update balance for the next period
        currentBalance += periodSubtotalDamages;

        // Move to the next period
        if (effectivePeriodEndDate === judgmentDate) {
            break; // Calculation finished
        }
        periodStartDate = getNextPeriodStartDate(periodEndDate);
    }

    // Final Summary
    const summary = {
        totalSpecials: totalSpecials,
        interestOnSpecials: cumulativeInterest,
        total: totalSpecials + cumulativeInterest
    };

    return { periodData, summary };
}
