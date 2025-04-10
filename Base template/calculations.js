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
 * @returns {{details: Array<object>, total: number}} An object containing detailed breakdown and total interest.
 */
export function calculateInterestPeriods(principal, startDate, endDate, interestType, jurisdiction, ratesData) {
    // Basic validation
    if (!principal || principal <= 0 || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate || !ratesData[jurisdiction]) {
        console.warn("Invalid input for calculateInterestPeriods", { principal, startDate, endDate, interestType, jurisdiction, hasRates: !!ratesData[jurisdiction] });
        return { details: [], total: 0 };
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
                    start: formatDateForDisplay(currentCalcDate),
                    end: formatDateForDisplay(segmentEndDate),
                    rate: rate,
                    days: daysInSegment,
                    interest: interestForSegment
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

    return { details, total: totalInterest };
}
