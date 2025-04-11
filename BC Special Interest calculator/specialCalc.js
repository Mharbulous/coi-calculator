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

    // Prepare single damages
    const sortedSingleDamages = (singleDamages || [])
        .map(d => ({ ...d, date: parseDateUTC(d.date), amount: Number(d.amount) || 0 }))
        .filter(d => d.date && d.amount > 0 && d.date >= causeOfActionDate && d.date <= judgmentDate) // Filter valid dates within range
        .sort((a, b) => a.date - b.date);

    // Prepare recurring rules
    const processedRecurringRules = (recurringRules || [])
        .map(rule => ({
            ...rule,
            startDate: parseDateUTC(rule.startDate),
            endDate: parseDateUTC(rule.endDate),
            amount: Number(rule.amount) || 0
        }))
        .filter(rule => rule.startDate && rule.endDate && rule.amount > 0 && rule.endDate >= rule.startDate);

    if (sortedSingleDamages.length === 0 && processedRecurringRules.length === 0) {
         // If filtering removed all damages/rules
         return { periodData: [], summary: { totalSpecials: 0, interestOnSpecials: 0, total: 0 } };
    }

    let periodData = [];
    let currentBalance = 0;
    let cumulativeInterest = 0;
    let totalSpecials = 0;

    // Determine the overall start date for calculations
    const firstSingleDamageDate = sortedSingleDamages.length > 0 ? sortedSingleDamages[0].date : null;
    const firstRuleStartDate = processedRecurringRules.length > 0 ? processedRecurringRules.reduce((min, rule) => (rule.startDate < min ? rule.startDate : min), processedRecurringRules[0].startDate) : null;

    let earliestDate = null;
    if (firstSingleDamageDate && firstRuleStartDate) {
        earliestDate = firstSingleDamageDate < firstRuleStartDate ? firstSingleDamageDate : firstRuleStartDate;
    } else {
        earliestDate = firstSingleDamageDate || firstRuleStartDate;
    }

    // Ensure calculation starts no earlier than the cause of action date
    const calculationStartDate = earliestDate && earliestDate > causeOfActionDate ? earliestDate : causeOfActionDate;

    let periodStartDate = getPeriodStartDate(calculationStartDate);
    let singleDamageIndex = 0;

    while (periodStartDate <= judgmentDate) { // Use <= to include judgment date period
        let periodCalendarEndDate = getPeriodEndDate(periodStartDate);
        // Ensure the period end does not go past the judgment date
        let effectivePeriodEndDate = (periodCalendarEndDate > judgmentDate) ? judgmentDate : periodCalendarEndDate;

        const periodRate = getInterestRate(jurisdiction, periodStartDate); // Rate for the period
        if (periodRate === null) {
             return { error: `Missing rate for period starting ${formatDate(periodStartDate)}`, periodData: [], summary: {} };
        }

        // Days in this specific calculation period (might be shorter than 6 months if it's the last one)
        const daysInCalcPeriod = daysBetween(periodStartDate, effectivePeriodEndDate) + 1; // Inclusive end

        // Calculate interest on the starting balance for the *entire* calculation period
        let interestOnBalance = calculateSimpleInterest(currentBalance, periodRate, daysInCalcPeriod);

        let damagesInPeriodForDisplay = []; // For the output table
        let periodDamagesTotal = 0; // Sum of all damages added in this period
        let interestOnSingleDamagesInFinalPeriod = 0; // Specific interest for COIA s1(3)(b)

        // --- Process Single Damages for this period ---
        while (singleDamageIndex < sortedSingleDamages.length && sortedSingleDamages[singleDamageIndex].date <= effectivePeriodEndDate) {
            const damage = sortedSingleDamages[singleDamageIndex];
            // Ensure damage falls within the current period start/end dates
            if (damage.date >= periodStartDate) {
                const displayDamage = {
                    date: formatDate(damage.date),
                    description: damage.description,
                    amount: damage.amount,
                    interestDetail: null // Initialize
                };

                periodDamagesTotal += damage.amount;
                totalSpecials += damage.amount;

                // Handle final period interest calculation (COIA s. 1(3)(b)) for SINGLE damages
                if (effectivePeriodEndDate.getTime() === judgmentDate.getTime()) {
                    const daysOfInterest = daysBetween(damage.date, judgmentDate) + 1; // Inclusive end
                    const damageInterest = calculateSimpleInterest(damage.amount, periodRate, daysOfInterest);
                    interestOnSingleDamagesInFinalPeriod += damageInterest;
                    // Add detail for mockup display
                    displayDamage.interestDetail = { days: daysOfInterest, interest: damageInterest };
                }
                damagesInPeriodForDisplay.push(displayDamage);
            }
            singleDamageIndex++;
        }

        // --- Process Recurring Rules for this period ---
        processedRecurringRules.forEach(rule => {
            // Determine the intersection of the rule's active dates and the current period's dates
            const ruleEffectiveStart = rule.startDate > periodStartDate ? rule.startDate : periodStartDate;
            const ruleEffectiveEnd = rule.endDate < effectivePeriodEndDate ? rule.endDate : effectivePeriodEndDate;

            if (ruleEffectiveStart <= ruleEffectiveEnd) { // Rule is active during some part of this period
                let periodRuleAmount = 0;
                let isProRated = false;
                let proRatedEndDateStr = '';

                // Calculate occurrences within the intersection [ruleEffectiveStart, ruleEffectiveEnd]
                // This requires a more robust date iteration based on frequency
                // For simplicity here, we'll approximate based on mockup (assuming bi-annual means start of period)
                // A more precise implementation would iterate dates based on frequency.

                // Simplified Logic based on Mockup (Treats recurring as lump sum at period start):
                // Check if the rule *starts* within this period or was active before it
                if (rule.startDate <= effectivePeriodEndDate && rule.endDate >= periodStartDate) {
                    // Mockup implies bi-annual/annual are added at the start of the relevant 6-month period
                    // Let's assume 'bi-annually' means Jan 1 and Jul 1 if the rule is active then.
                    // This simplification avoids complex date iteration for now.
                    let appliesThisPeriod = false;
                    if (rule.frequency === 'bi-annually') {
                        // Applies if rule is active on Jan 1 or Jul 1 within the period dates
                        const periodStartMonth = periodStartDate.getUTCMonth(); // 0 or 6
                        if ((periodStartMonth === 0 || periodStartMonth === 6) && rule.startDate <= periodStartDate && rule.endDate >= periodStartDate) {
                           appliesThisPeriod = true;
                        }
                    } else if (rule.frequency === 'annually') {
                         // Applies if rule is active on Jan 1 within the period dates
                        const periodStartMonth = periodStartDate.getUTCMonth(); // 0
                        if (periodStartMonth === 0 && rule.startDate <= periodStartDate && rule.endDate >= periodStartDate) {
                           appliesThisPeriod = true;
                        }
                    }
                    // TODO: Add logic for daily, weekly, monthly based on actual occurrences within the period intersection

                    if (appliesThisPeriod) {
                        periodRuleAmount = rule.amount; // Base amount for the occurrence

                        // Check for pro-rating: Does the rule END within this specific 6-month calendar period?
                        const ruleEndsInThisCalendarPeriod = rule.endDate >= periodStartDate && rule.endDate <= periodCalendarEndDate;

                        if (ruleEndsInThisCalendarPeriod && rule.endDate < periodCalendarEndDate) {
                            // Pro-rate the amount
                            const daysInFullPeriod = daysBetween(periodStartDate, periodCalendarEndDate) + 1;
                            const daysActiveInPeriod = daysBetween(periodStartDate, rule.endDate) + 1;
                            if (daysInFullPeriod > 0) {
                                periodRuleAmount = (rule.amount * daysActiveInPeriod) / daysInFullPeriod;
                                isProRated = true;
                                proRatedEndDateStr = formatDate(rule.endDate);
                            } else {
                                periodRuleAmount = 0; // Avoid division by zero
                            }
                        }

                        if (periodRuleAmount > 0) {
                             periodDamagesTotal += periodRuleAmount;
                             totalSpecials += periodRuleAmount;
                             damagesInPeriodForDisplay.push({
                                 date: formatDate(periodStartDate), // Add recurring at the start of the period
                                 description: isProRated ? `${rule.description} pro-rated to ${proRatedEndDateStr}` : rule.description,
                                 amount: periodRuleAmount,
                                 interestDetail: null // Recurring damages don't get the s.1(3)(b) treatment in the mockup
                             });
                        }
                    }
                }
            }
        });

        // Sort damages for display within the period (recurring first, then single by date)
        damagesInPeriodForDisplay.sort((a, b) => {
            const dateA = parseDateUTC(a.date);
            const dateB = parseDateUTC(b.date);
            if (dateA.getTime() === dateB.getTime()) {
                // If dates are same (e.g., recurring added at start), maybe keep original order or sort by description?
                return 0;
            }
            return dateA - dateB;
        });


        // Accumulate interest
        // Interest for the period is interest on the starting balance PLUS specific interest on *single* damages incurred in the final period.
        let periodInterestAccrued = interestOnBalance + interestOnSingleDamagesInFinalPeriod;

        cumulativeInterest += periodInterestAccrued;

        // Store period results
        periodData.push({
            periodStartDate: formatDate(periodStartDate),
            periodEndDate: formatDate(effectivePeriodEndDate),
            rate: periodRate * 100, // Store as percentage
            days: daysInCalcPeriod,
            startingBalance: currentBalance,
            interestOnBalance: interestOnBalance, // Interest calculated on the opening balance for the period duration
            damagesInPeriod: damagesInPeriodForDisplay, // Combined & sorted damages for display
            periodDamagesTotal: periodDamagesTotal, // Sum of damages added *in* this period
            interestOnDamagesInFinalPeriod: interestOnSingleDamagesInFinalPeriod, // Only for single damages in final period
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

    // Final Summary
    const summary = {
        totalSpecials: totalSpecials,
        interestOnSpecials: cumulativeInterest,
        total: totalSpecials + cumulativeInterest
    };

    return { periodData, summary };
}
