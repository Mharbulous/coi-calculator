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
 * @param {Array<object>} [specialDamages=[]] - Optional array of special damage objects { date: Date, description: string, amount: number }.
 * @returns {{details: Array<object>, total: number, principal: number}} An object containing detailed breakdown, total interest, and the final principal (including specials).
 */
export function calculateInterestPeriods(principal, startDate, endDate, interestType, jurisdiction, ratesData, specialDamages = []) {
    // Basic validation
    if (principal < 0 || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate || !ratesData[jurisdiction]) {
        console.warn("Invalid input for calculateInterestPeriods", { principal, startDate, endDate, interestType, jurisdiction, hasRates: !!ratesData[jurisdiction] });
        return { details: [], total: 0, principal: principal };
    }

    // If principal is 0 and there are no special damages, no interest accrues.
    if (principal === 0 && (!specialDamages || specialDamages.length === 0)) {
        return { details: [], total: 0, principal: 0 };
    }

    let currentPrincipal = principal;
    let totalInterest = 0;
    const details = [];
    const jurisdictionRates = ratesData[jurisdiction];

    // --- Create a sorted list of all relevant dates ---
    const eventDates = new Set();
    eventDates.add(startDate.getTime()); // Overall start date
    eventDates.add(endDate.getTime() + 86400000); // Day *after* overall end date for loop termination

    // Add rate period start/end dates within the calculation range
    jurisdictionRates.forEach(rate => {
        if (rate.start >= startDate && rate.start <= endDate) eventDates.add(rate.start.getTime());
        // Add day *after* rate end date if it's within the range
        const rateEndPlusOne = new Date(rate.end);
        rateEndPlusOne.setUTCDate(rateEndPlusOne.getUTCDate() + 1);
        if (rateEndPlusOne > startDate && rateEndPlusOne <= endDate) eventDates.add(rateEndPlusOne.getTime());
    });

    // Add special damage dates if applicable (only for prejudgment)
    let sortedSpecials = [];
    if (interestType === 'prejudgment' && specialDamages && specialDamages.length > 0) {
        sortedSpecials = [...specialDamages].sort((a, b) => a.date - b.date); // Sort specials by date
        sortedSpecials.forEach(special => {
            if (special.date >= startDate && special.date <= endDate) {
                eventDates.add(special.date.getTime());
            }
        });
    }

    const sortedEventTimes = Array.from(eventDates).sort((a, b) => a - b);

    // --- Iterate through date intervals ---
    let loopStartDate = new Date(startDate);
    let finalPrincipal = principal; // Track the principal including specials for the final return value

    for (let i = 0; i < sortedEventTimes.length - 1; i++) {
        const intervalStartTime = sortedEventTimes[i];
        const intervalEndTime = sortedEventTimes[i + 1]; // This is the start of the *next* interval

        // Ensure the interval start is not before the overall start date
        let currentIntervalStart = new Date(Math.max(intervalStartTime, startDate.getTime()));
        // Ensure the interval end is not after the overall end date
        // The interval end date for calculation is the day *before* intervalEndTime
        let currentIntervalEnd = new Date(intervalEndTime);
        currentIntervalEnd.setUTCDate(currentIntervalEnd.getUTCDate() - 1);
        currentIntervalEnd = new Date(Math.min(currentIntervalEnd.getTime(), endDate.getTime()));


        // Skip if interval is invalid or outside the main range
        if (currentIntervalEnd < currentIntervalStart) {
            continue;
        }

        // Find the rate period applicable to the *start* of this interval
        const ratePeriod = jurisdictionRates.find(rate =>
            currentIntervalStart.getTime() >= rate.start.getTime() && currentIntervalStart.getTime() <= rate.end.getTime()
        );

        if (!ratePeriod) {
            console.warn(`No rate period found for interval start: ${formatDateForDisplay(currentIntervalStart)} in ${jurisdiction}. Skipping interval.`);
            continue;
        }

        const rate = ratePeriod[interestType];
        const daysInInterval = daysBetween(currentIntervalStart, currentIntervalEnd);

        if (daysInInterval > 0 && rate !== undefined && currentPrincipal > 0) {
            const year = currentIntervalStart.getUTCFullYear();
            const days_in_year = daysInYear(year);

            if (days_in_year > 0) {
                const interestForInterval = (currentPrincipal * (rate / 100) * daysInInterval) / days_in_year;

                details.push({
                    start: formatDateForDisplay(currentIntervalStart),
                    description: `${daysInInterval} days`,
                    rate: rate,
                    principal: currentPrincipal, // Principal *during* this interval
                    interest: interestForInterval,
                    isSpecial: false // Mark as regular interest row
                });
                totalInterest += interestForInterval;
            } else {
                console.error(`Error: Days in year calculated as zero for year ${year}`);
            }
        } else if (rate === undefined) {
             console.warn(`Interest type '${interestType}' not found for period starting ${formatDateForDisplay(ratePeriod.start)} in ${jurisdiction}`);
        }

        // --- Check for and add special damages occurring *at the end* of this interval ---
        // The end date of the interval is currentIntervalEnd
        if (interestType === 'prejudgment') {
            const specialsOnThisDate = sortedSpecials.filter(special =>
                special.date.getTime() === currentIntervalEnd.getTime()
            );

            specialsOnThisDate.forEach(special => {
                details.push({
                    start: formatDateForDisplay(special.date), // Date of the special
                    description: special.description || 'Special Damages', // Description
                    rate: null, // No rate for special
                    principal: special.amount, // The amount of the special damage itself
                    interest: null, // No interest calculated *on* the special row
                    isSpecial: true // Mark as special row
                });
                currentPrincipal += special.amount; // Add to principal for *next* interval
                finalPrincipal += special.amount; // Add to the final total principal
                console.log(`Added special: ${special.amount} on ${formatDateForDisplay(special.date)}. New principal: ${currentPrincipal}`);
            });
        }
    } // End loop through intervals

    // Return final principal (including specials) along with details and total interest
    return { details, total: totalInterest, principal: finalPrincipal };
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
