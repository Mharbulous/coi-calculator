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
 * @returns {{details: Array<object>, total: number, principal: number}} An object containing detailed breakdown, total interest, and the principal used.
 */
export function calculateInterestPeriods(principal, startDate, endDate, interestType, jurisdiction, ratesData) {
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

    while (currentCalcDate <= endDate) {
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
                const interestForSegment = (principal * (rate / 100) * daysInSegment) / days_in_year;

                details.push({
                    start: formatDateForDisplay(currentCalcDate), // Matches 'Date' or 'Period Ending' start
                    description: `${daysInSegment} days`, // Matches 'Description' column
                    rate: rate,
                    principal: principal, // Add principal for the period
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

    // Return principal along with details and total
    return { details, total: totalInterest, principal: principal };
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
