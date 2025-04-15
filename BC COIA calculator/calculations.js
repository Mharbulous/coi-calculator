import { daysBetween, daysInYear, formatDateForDisplay } from './utils.js';

/**
 * Finds the applicable interest rate for a specific date and type within a jurisdiction.
 * @param {Date} date - The date to find the rate for (UTC).
 * @param {'prejudgment' | 'postjudgment'} type - The type of interest rate.
 * @param {string} jurisdiction - The jurisdiction code (e.g., 'BC').
 * @param {object} ratesData - The processed interest rates object.
 * @returns {number} The applicable interest rate percentage, or 0 if not found.
 */
function getInterestRateForDate(date, type, jurisdiction, ratesData) {
    if (!date || isNaN(date.getTime()) || !ratesData[jurisdiction]) {
        console.warn(`Invalid date or missing rates for jurisdiction ${jurisdiction} in getInterestRateForDate`);
        return 0;
    }

    const targetTime = date.getTime();
    const jurisdictionRates = ratesData[jurisdiction];

    // Find the rate period that includes the target date
    const ratePeriod = jurisdictionRates.find(rate =>
        targetTime >= rate.start.getTime() && targetTime <= rate.end.getTime()
    );

    if (ratePeriod && ratePeriod[type] !== undefined) {
        return ratePeriod[type];
    } else {
        console.warn(`No ${type} rate found for ${formatDateForDisplay(date)} in ${jurisdiction}`);
        return 0; // Or handle as an error depending on requirements
    }
}

/**
 * Calculates interest over a period, breaking it down by applicable rate segments.
 * @param {number} principal - The principal amount.
 * @param {Date} startDate - The start date of the calculation period (UTC).
 * @param {Date} endDate - The end date of the calculation period (UTC).
 * @param {'prejudgment' | 'postjudgment'} interestType - The type of interest to calculate.
 * @param {string} jurisdiction - The jurisdiction code (e.g., 'BC').
 * @param {object} ratesData - The processed interest rates object.
 * @param {Array<object>} [specialDamages=[]] - Optional array of special damages { date: string (DD/MM/YYYY), amount: number }.
 * @returns {{details: Array<object>, total: number, principal: number}} An object containing detailed breakdown, total interest, and the *final* principal used.
 */
export function calculateInterestPeriods(principal, startDate, endDate, interestType, jurisdiction, ratesData, specialDamages = []) {
    // Basic validation
    // Allow principal to be 0 for cases where only non-pecuniary/costs exist initially for post-judgment, though interest would be 0.
    if (principal < 0 || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate || !ratesData[jurisdiction]) {
        console.warn("Invalid input for calculateInterestPeriods", { principal, startDate, endDate, interestType, jurisdiction, hasRates: !!ratesData[jurisdiction] });
        return { details: [], total: 0, principal: principal }; // Return principal even if invalid dates
    }
     // If principal is 0, no interest accrues
     if (principal === 0) {
         return { details: [], total: 0, principal: 0 };
     }


    let currentCalcDate = new Date(startDate); // Start from the beginning of the period
    let totalInterest = 0;
    const details = [];
    const jurisdictionRates = ratesData[jurisdiction];

    // --- Special Damages Handling ---
    // 1. Parse and sort special damages by date
    const processedDamages = specialDamages
        .map(d => {
            // Convert DD/MM/YYYY string to Date object (handle potential errors)
            const parts = d.date.split('/');
            if (parts.length !== 3) return null; // Invalid format
            // Note: Months are 0-indexed in JS Date constructor (day, month-1, year)
            const dateObj = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
            if (isNaN(dateObj.getTime())) return null; // Invalid date
            return { ...d, dateObj };
        })
        .filter(d => d !== null) // Remove invalid entries
        .sort((a, b) => a.dateObj - b.dateObj); // Sort chronologically

    let currentPrincipal = principal; // Initialize principal for calculations
    let damageIndex = 0; // Index for iterating through sorted damages
    // --- End Special Damages Handling ---


    while (currentCalcDate <= endDate) {
        // --- Apply Special Damages Occurring On or Before the Start of the Current Day ---
        // This ensures the principal is updated *before* calculating interest for any segment starting today.
        // Effectively, the damage amount applies from the day *after* it occurs onwards.
        while (damageIndex < processedDamages.length && processedDamages[damageIndex].dateObj <= currentCalcDate) {
            // Check if the damage date is strictly *before* the current calculation date.
            // We only add the principal if the damage happened yesterday or earlier relative to currentCalcDate.
            // This prevents adding the damage amount on the *exact* day it occurs, affecting the interest calculation starting that same day.
            // Instead, it affects the principal for calculations starting the *next* day or later.
            // However, the loop structure handles segments. We need to add the principal *before* the segment calculation if the damage occurred *before* the segment start date.
            // Let's revert the comparison logic slightly. The key is when the principal is used vs when it's updated.

            // Corrected Logic: Add damages that occurred *before* the start of this segment.
            // The previous logic `dateObj < currentCalcDate` was actually correct for this.
            // Let's re-verify the user feedback and mockup.
            // Mockup: Damage 2019-06-01, Next Period 2019-07-01 uses increased principal.
            // This implies damages occurring *within* a period affect the principal for the *next* period.
            // My current loop adds damages *before* calculating the segment.
            // If currentCalcDate = 2019-07-01, damages from 2019-06-01 and 2019-06-30 (where dateObj < currentCalcDate) *should* be added.

            // Let's stick to the previous logic which seemed correct based on the mockup.
            // Perhaps the issue was elsewhere or my understanding of the feedback was wrong.
            // Log the comparison dates and timestamps
            const damageDate = processedDamages[damageIndex].dateObj;
            const damageAmount = processedDamages[damageIndex].amount;

            // Normalize dates to UTC midnight for accurate date-only comparison
            const normalizedDamageDate = new Date(Date.UTC(damageDate.getUTCFullYear(), damageDate.getUTCMonth(), damageDate.getUTCDate()));
            const normalizedCurrentCalcDate = new Date(Date.UTC(currentCalcDate.getUTCFullYear(), currentCalcDate.getUTCMonth(), currentCalcDate.getUTCDate()));

            // Compare normalized dates
            if (normalizedDamageDate < normalizedCurrentCalcDate) {
                 currentPrincipal += damageAmount;
                 // console.log(`    --> Applied special damage: +${damageAmount} on ${formatDateForDisplay(damageDate)}. New principal: ${currentPrincipal.toFixed(2)}`); // Removed log
                 damageIndex++;
             } else {
                 // If the normalized damage date is not strictly less (i.e., it's today or later), break the inner loop.
                 // console.log(`    --> Normalized damage date is not strictly before normalized current calc date. Stopping damage check for this segment.`); // Removed log
                 break;
             }
        }
        // --- End Apply Special Damages ---

        const currentCalcTime = currentCalcDate.getTime();

        // Find the rate period applicable to the current calculation date
        const ratePeriod = jurisdictionRates.find(rate =>
            currentCalcTime >= rate.start.getTime() && currentCalcTime <= rate.end.getTime()
        );

        if (!ratePeriod) {
            console.warn(`No rate period found for date: ${formatDateForDisplay(currentCalcDate)} in ${jurisdiction}. Skipping day.`);
            // Move to the next day if no rate period covers the current date
            currentCalcDate.setUTCDate(currentCalcDate.getUTCDate() + 1);
            continue;
        }

        // Determine the end date for this specific rate segment
        // It's the earlier of the rate period's end date or the overall calculation end date
        const segmentEndDate = ratePeriod.end < endDate ? new Date(ratePeriod.end) : new Date(endDate);

        // Calculate the number of days within this segment
        const daysInSegment = daysBetween(currentCalcDate, segmentEndDate);

        // Get the specific interest rate for this period and type
        const rate = ratePeriod[interestType];

        if (daysInSegment > 0 && rate !== undefined) {
            const year = currentCalcDate.getUTCFullYear(); // Year for calculating days in year
            const days_in_year = daysInYear(year);

            if (days_in_year > 0) {
                // console.log(`Calculating interest for segment starting ${formatDateForDisplay(currentCalcDate)}: Principal=${currentPrincipal.toFixed(2)}, Rate=${rate}%, Days=${daysInSegment}`); // Removed log

                // Use the potentially updated currentPrincipal for calculation
                const interestForSegment = (currentPrincipal * (rate / 100) * daysInSegment) / days_in_year;

                details.push({
                    start: formatDateForDisplay(currentCalcDate), // Matches 'Date' or 'Period Ending' start
                    description: `${daysInSegment} days`, // Matches 'Description' column
                    rate: rate,
                    principal: currentPrincipal, // Store the principal used for *this* segment
                    interest: interestForSegment,
                    // Keep original end/days for potential debugging if needed, but not directly used by updateInterestTable
                    _endDate: formatDateForDisplay(segmentEndDate),
                    _days: daysInSegment
                });
                totalInterest += interestForSegment;
            } else {
                 console.error(`Error: Days in year calculated as zero for year ${year}`);
            }
        } else if (rate === undefined) {
            console.warn(`Interest type '${interestType}' not found for period starting ${formatDateForDisplay(ratePeriod.start)} in ${jurisdiction}`);
        }

        // Move the calculation date to the day after the current segment ends
        currentCalcDate = new Date(segmentEndDate);
        currentCalcDate.setUTCDate(currentCalcDate.getUTCDate() + 1);
    }

    // After the loop, apply any remaining damages that occurred exactly on the endDate
    // (These wouldn't affect interest calculations within the loop but contribute to the final principal)
    // After the loop, apply any remaining damages to get the final principal value,
    // even if they occurred on the endDate itself. These don't affect interest calculated *during* the period.
     while (damageIndex < processedDamages.length) {
         // Ensure we only process damages up to the endDate
         if (processedDamages[damageIndex].dateObj <= endDate) {
            currentPrincipal += processedDamages[damageIndex].amount;
            // console.log(`Applied final special damage: +${processedDamages[damageIndex].amount} on ${formatDateForDisplay(processedDamages[damageIndex].dateObj)}. Final principal: ${currentPrincipal}`); // Removed log
         }
         damageIndex++;
     }


    // Return the *final* principal after all damages are applied
    return { details, total: totalInterest, principal: currentPrincipal };
}


/**
 * Calculates the per diem interest rate based on a principal amount and the rate applicable on a specific date.
 * @param {number} principal - The principal amount (usually the total owing).
 * @param {Date} calculationDate - The date for which to find the applicable rate (UTC).
 * @param {string} jurisdiction - The jurisdiction code (e.g., 'BC').
 * @param {object} ratesData - The processed interest rates object.
 * @returns {number} The calculated per diem interest amount, or 0 if calculation is not possible.
 */
export function calculatePerDiem(principal, calculationDate, jurisdiction, ratesData) {
    if (principal <= 0 || !calculationDate || isNaN(calculationDate.getTime())) {
        return 0; // No per diem if principal is zero/negative or date is invalid
    }

    // Per diem is typically based on the postjudgment rate applicable *on* the calculation date
    const rate = getInterestRateForDate(calculationDate, 'postjudgment', jurisdiction, ratesData);

    if (rate === undefined || rate <= 0) {
        console.warn(`Could not find a valid postjudgment rate for per diem calculation on ${formatDateForDisplay(calculationDate)} in ${jurisdiction}`);
        return 0; // No per diem if rate is not found or zero
    }

    const year = calculationDate.getUTCFullYear();
    const days_in_year = daysInYear(year);

    if (days_in_year <= 0) {
        console.error(`Error calculating days in year for per diem: Year ${year}`);
        return 0;
    }

    const perDiemAmount = (principal * (rate / 100)) / days_in_year;
    return perDiemAmount;
}
