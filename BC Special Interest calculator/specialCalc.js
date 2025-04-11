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

// Add days to a UTC date
function addDaysUTC(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

// Add weeks to a UTC date
function addWeeksUTC(date, weeks) {
    return addDaysUTC(date, weeks * 7);
}

// Add months to a UTC date (handles month/year rollover)
function addMonthsUTC(date, months) {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + months);
    return result;
}

// Add years to a UTC date
function addYearsUTC(date, years) {
    const result = new Date(date);
    result.setUTCFullYear(result.getUTCFullYear() + years);
    return result;
}


// --- Recurring Damage Instance Generation ---

/**
 * Generates individual damage instances from a recurring rule.
 * @param {object} rule - The recurring rule object {startDate, endDate, frequency, amount, description, id}
 * @returns {Array<object>} - Array of damage instances {date, description, amount, sourceRuleId}
 */
function generateRecurringInstances(rule) {
    const instances = [];
    const { startDate, endDate, frequency, amount, description, id } = rule;

    if (!startDate || !endDate || !frequency || amount <= 0 || startDate > endDate) {
        return instances; // Invalid rule
    }

    if (frequency === 'Full Term') {
        const totalRuleDays = daysBetween(startDate, endDate) + 1;
        if (totalRuleDays <= 0) return instances; // Avoid division by zero

        const dailyAmount = amount / totalRuleDays;

        let currentPeriodStart = getPeriodStartDate(startDate);

        while (currentPeriodStart <= endDate) {
            const currentPeriodEnd = getPeriodEndDate(currentPeriodStart);

            // Determine the effective start and end dates for the rule *within this period*
            const effectiveStartInPeriod = (startDate > currentPeriodStart) ? startDate : currentPeriodStart;
            const effectiveEndInPeriod = (endDate < currentPeriodEnd) ? endDate : currentPeriodEnd;

            // Ensure the effective dates are logical within the period overlap
            if (effectiveStartInPeriod <= effectiveEndInPeriod) {
                const daysInPeriodIntersection = daysBetween(effectiveStartInPeriod, effectiveEndInPeriod) + 1;
                const periodAmount = dailyAmount * daysInPeriodIntersection;

                if (periodAmount > 0) {
                    instances.push({
                        // Date the damage at the start of the 6-month period it belongs to
                        date: currentPeriodStart,
                        description: `${description} (Full Term distribution)`,
                        amount: periodAmount,
                        sourceRuleId: id
                    });
                }
            }

            // Move to the next 6-month period
            currentPeriodStart = getNextPeriodStartDate(currentPeriodEnd);
        }
        return instances; // Return the distributed amounts
    }

    // --- Logic for Periodic Frequencies ---
    let currentDate = new Date(startDate); // Start iterating from the rule's start date

    while (currentDate <= endDate) {
        // Add instance if the current date is within the rule's range
        instances.push({
            date: new Date(currentDate), // Clone date object
            description: description,
            amount: amount,
            sourceRuleId: id
        });

        // Increment currentDate based on frequency
        switch (frequency) {
            case 'daily':
                currentDate = addDaysUTC(currentDate, 1);
                break;
            case 'weekly':
                currentDate = addWeeksUTC(currentDate, 1);
                break;
            case 'monthly':
                currentDate = addMonthsUTC(currentDate, 1);
                break;
            case 'bi-annually': // Assuming Jan 1 / Jul 1 logic based on mockup, but generating all 6-month steps
                currentDate = addMonthsUTC(currentDate, 6);
                break;
            case 'annually':
                currentDate = addYearsUTC(currentDate, 1);
                break;
            default:
                console.error(`Unknown frequency: ${frequency}`);
                return []; // Stop processing this rule if frequency is unknown
        }
    }

    // Handle pro-rating description for the last instance if endDate doesn't match
    if (instances.length > 0 && frequency !== 'Full Term') {
        const lastInstance = instances[instances.length - 1];
        // Check if the rule's end date is *before* the *next* theoretical payment date
        // This determines if the last generated payment truly represents the end of the rule's term.
        let nextTheoreticalDate;
         switch (frequency) {
            case 'daily': nextTheoreticalDate = addDaysUTC(lastInstance.date, 1); break;
            case 'weekly': nextTheoreticalDate = addWeeksUTC(lastInstance.date, 1); break;
            case 'monthly': nextTheoreticalDate = addMonthsUTC(lastInstance.date, 1); break;
            case 'bi-annually': nextTheoreticalDate = addMonthsUTC(lastInstance.date, 6); break;
            case 'annually': nextTheoreticalDate = addYearsUTC(lastInstance.date, 1); break;
            default: nextTheoreticalDate = new Date(lastInstance.date); // Should not happen
        }

        // If the rule's specified end date is strictly before the next calculated date,
        // it means the last payment didn't fall exactly on the end date.
        if (endDate < nextTheoreticalDate && endDate.getTime() !== lastInstance.date.getTime()) {
             lastInstance.description += ` pro-rated to ${formatDate(endDate)}`;
        }
    }

    return instances;
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
 * @param {Array<{date: string, description: string, amount: number}>} singleDamages - Array of single damage objects
 * @param {Array<{id: string, startDate: string, endDate: string, frequency: string, amount: number, description: string}>} recurringRules - Array of recurring rule parameters
 * @param {string} jurisdiction - e.g., 'BC'
 * @returns {object} - Contains periodData array and summary totals
 */
export function calculateSpecialDamagesInterest(causeOfActionDateStr, judgmentDateStr, singleDamages, recurringRules, jurisdiction) {
    const causeOfActionDate = parseDateUTC(causeOfActionDateStr);
    const judgmentDate = parseDateUTC(judgmentDateStr);

    // Initial validation
    if (!causeOfActionDate || !judgmentDate) {
        return { error: "Invalid Cause of Action or Judgment Date", periodData: [], summary: {} };
    }
    if ((!singleDamages || singleDamages.length === 0) && (!recurringRules || recurringRules.length === 0)) {
         return { error: "No damages provided", periodData: [], summary: { totalSpecials: 0, interestOnSpecials: 0, total: 0 } };
    }

    // --- Step 1: Prepare and Generate All Damage Instances ---

    // Prepare single damages (ensure date objects and numbers)
    const processedSingleDamages = (singleDamages || [])
        .map(d => ({ ...d, date: parseDateUTC(d.date), amount: Number(d.amount) || 0 }))
        .filter(d => d.date && d.amount > 0); // Keep only valid ones initially

    // Prepare recurring rules (ensure date objects and numbers)
    const processedRecurringRules = (recurringRules || [])
        .map(rule => ({
            ...rule,
            startDate: parseDateUTC(rule.startDate),
            endDate: parseDateUTC(rule.endDate),
            amount: Number(rule.amount) || 0
        }))
        .filter(rule => rule.startDate && rule.endDate && rule.amount > 0 && rule.endDate >= rule.startDate);

    // Generate all individual instances from recurring rules
    let allGeneratedRecurringInstances = [];
    processedRecurringRules.forEach(rule => {
        const instances = generateRecurringInstances(rule);
        allGeneratedRecurringInstances = allGeneratedRecurringInstances.concat(instances);
    });

    // Combine single damages and generated recurring instances
    const allDamages = processedSingleDamages.concat(allGeneratedRecurringInstances);

    // Filter all damages to be within the overall calculation range (CoA to Judgment)
    // and sort them strictly by date
    const allSortedDamages = allDamages
        .filter(d => d.date >= causeOfActionDate && d.date <= judgmentDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending

    if (allSortedDamages.length === 0) {
         // If filtering removed all damages
         return { periodData: [], summary: { totalSpecials: 0, interestOnSpecials: 0, total: 0 } };
    }

    // --- Step 2: Iterate Through Calculation Periods ---

    let periodData = [];
    let currentBalance = 0;
    let cumulativeInterest = 0;
    let totalSpecials = 0; // Will be recalculated based on sorted/filtered damages

    // Determine the actual start date for calculations (first damage date or CoA date, whichever is later)
    const firstDamageDate = allSortedDamages[0].date;
    const calculationStartDate = firstDamageDate > causeOfActionDate ? firstDamageDate : causeOfActionDate;

    let periodStartDate = getPeriodStartDate(calculationStartDate);
    let damageIndex = 0; // Index for iterating through allSortedDamages

    while (periodStartDate <= judgmentDate) {
        let periodCalendarEndDate = getPeriodEndDate(periodStartDate);
        // Ensure the period end does not go past the judgment date
        let effectivePeriodEndDate = (periodCalendarEndDate > judgmentDate) ? judgmentDate : periodCalendarEndDate;

        const periodRate = getInterestRate(jurisdiction, periodStartDate); // Rate for the period
        if (periodRate === null) {
             return { error: `Missing rate for period starting ${formatDate(periodStartDate)}`, periodData: [], summary: {} };
        }

        // Days in this specific calculation period
        const daysInCalcPeriod = daysBetween(periodStartDate, effectivePeriodEndDate) + 1; // Inclusive end

        // Calculate interest on the starting balance for the *entire* calculation period
        let interestOnBalance = calculateSimpleInterest(currentBalance, periodRate, daysInCalcPeriod);

        let damagesInPeriodForDisplay = []; // For the output table
        let periodDamagesTotal = 0; // Sum of all damages added *in* this period
        let interestOnDamagesInFinalPeriod = 0; // Specific interest for COIA s1(3)(b) - applies to ALL damages in final period

        // --- Process ALL Damages (Single and Recurring) for this period ---
        while (damageIndex < allSortedDamages.length && allSortedDamages[damageIndex].date <= effectivePeriodEndDate) {
            const damage = allSortedDamages[damageIndex];
            // Ensure damage falls within the current period start/end dates
            // (It should already be sorted, so just check if it's >= periodStartDate)
            if (damage.date >= periodStartDate) {
                const displayDamage = {
                    date: formatDate(damage.date),
                    description: damage.description,
                    amount: damage.amount,
                    interestDetail: null // Initialize
                };

                periodDamagesTotal += damage.amount;
                totalSpecials += damage.amount; // Add to overall total specials

                // Handle final period interest calculation (COIA s. 1(3)(b)) for ALL damages
                // This applies if the *effective* end date of this period is the judgment date
                if (effectivePeriodEndDate.getTime() === judgmentDate.getTime()) {
                    const daysOfInterest = daysBetween(damage.date, judgmentDate) + 1; // Inclusive end
                    const damageInterest = calculateSimpleInterest(damage.amount, periodRate, daysOfInterest);
                    interestOnDamagesInFinalPeriod += damageInterest;
                    // Add detail for mockup display
                    displayDamage.interestDetail = { days: daysOfInterest, interest: damageInterest };
                }
                damagesInPeriodForDisplay.push(displayDamage);
            }
            damageIndex++; // Move to the next damage item
        }

        // Accumulate interest
        // Interest for the period = interest on starting balance + specific interest on damages incurred in the final period.
        let periodInterestAccrued = interestOnBalance + interestOnDamagesInFinalPeriod;
        cumulativeInterest += periodInterestAccrued;

        // Store period results
        periodData.push({
            periodStartDate: formatDate(periodStartDate),
            periodEndDate: formatDate(effectivePeriodEndDate),
            rate: periodRate * 100, // Store as percentage
            days: daysInCalcPeriod,
            startingBalance: currentBalance,
            interestOnBalance: interestOnBalance, // Interest calculated on the opening balance
            damagesInPeriod: damagesInPeriodForDisplay, // Damages added *in* this period
            periodDamagesTotal: periodDamagesTotal, // Sum of damages added *in* this period
            interestOnDamagesInFinalPeriod: interestOnDamagesInFinalPeriod, // Specific interest calculated in final period
            periodInterestTotal: periodInterestAccrued, // Total interest relevant to this period's calculations
            periodEndingBalance: currentBalance + periodDamagesTotal, // Balance before adding next period's interest
            cumulativeInterestAtPeriodEnd: cumulativeInterest // Total interest up to the end of this period
        });

        // Update balance for the next period
        currentBalance += periodDamagesTotal;

        // Move to the next period
        if (effectivePeriodEndDate.getTime() === judgmentDate.getTime()) {
            break; // Calculation finished
        }
        periodStartDate = getNextPeriodStartDate(periodCalendarEndDate); // Get start of next calendar period
    }

    // --- Step 3: Final Summary ---
    const summary = {
        totalSpecials: totalSpecials, // Use the recalculated total based on filtered/sorted damages
        interestOnSpecials: cumulativeInterest,
        total: totalSpecials + cumulativeInterest
    };

    return { periodData, summary };
}
