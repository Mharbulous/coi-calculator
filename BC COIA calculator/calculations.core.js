/**
 * Core Calculation Module
 * 
 * This module serves as the single source of truth for all interest and payment calculations.
 * It centralizes calculation logic to ensure consistency across the application.
 */

import { daysBetween, daysInYear, formatDateForDisplay, parseDateInput, normalizeDate, dateOnOrAfter, dateOnOrBefore, datesEqual } from './utils.date.js';
import { calculateInterestPeriods, getInterestRateForDate } from './calculations.js';

/**
 * Calculates the total interest accrued up to a specific date, considering prior payments.
 * 
 * @param {Object} state - The application state
 * @param {Date} calculationDate - The date to calculate interest up to
 * @param {Array} priorPayments - Array of payments made before the calculation date
 * @param {Object} ratesData - The interest rates data
 * @returns {Object} The accrued interest and remaining principal
 */
export function calculateInterestToDate(state, calculationDate, priorPayments, ratesData) {
    const { inputs } = state;
    const { prejudgmentStartDate, dateOfJudgment, judgmentAwarded } = inputs;

    if (!calculationDate || !prejudgmentStartDate) {
        console.error('Invalid dates for interest calculation:', { calculationDate, prejudgmentStartDate });
        return { interestAccrued: 0, remainingPrincipal: judgmentAwarded };
    }

    // 1. Determine effectivePrincipalForInterestCalc: Start with judgmentAwarded and subtract principal parts of ALL prior payments.
    // This is the principal balance on which interest should accrue up to the current calculationDate.
    let effectivePrincipalForInterestCalc = judgmentAwarded;
    priorPayments.forEach(p => {
        if (p.principalApplied !== undefined) { // Ensure principalApplied exists
            effectivePrincipalForInterestCalc -= p.principalApplied;
        }
        // Note: If p.principalApplied is not available for some prior payments, this calculation will be inaccurate.
        // This assumes priorPayments in the store are fully processed with interestApplied and principalApplied.
    });

    const tempState = JSON.parse(JSON.stringify(state)); // For calculateInterestPeriods
    const judgmentDateObj = typeof dateOfJudgment === 'string' ? parseDateInput(dateOfJudgment) : dateOfJudgment;
    
    let totalGrossInterestAccrued = 0;
    // principalAfterInterestCalcs will be the principal balance *after* interest calculation periods,
    // starting from effectivePrincipalForInterestCalc. It includes effects of special damages within those periods.
    let principalAfterInterestCalcs = effectivePrincipalForInterestCalc; 

    // 2. Calculate total gross interest accrued up to calculationDate
    const prejudgmentEndDate = judgmentDateObj && calculationDate > judgmentDateObj 
        ? judgmentDateObj 
        : calculationDate;
    
    if (dateOnOrAfter(prejudgmentEndDate, prejudgmentStartDate)) { // Ensure valid period
        const prejudgmentResult = calculateInterestPeriods(
            tempState, 
            'prejudgment', 
            prejudgmentStartDate, 
            prejudgmentEndDate,
            effectivePrincipalForInterestCalc, // Base principal for this calculation
            ratesData
        );
        totalGrossInterestAccrued += prejudgmentResult.total;
        principalAfterInterestCalcs = prejudgmentResult.principal; // Update principal (includes special damages effect)
    }

    if (judgmentDateObj && calculationDate > judgmentDateObj) {
        if (dateOnOrAfter(calculationDate, judgmentDateObj)) { // Ensure valid period
            const postjudgmentResult = calculateInterestPeriods(
                tempState, 
                'postjudgment', 
                judgmentDateObj, 
                calculationDate,
                principalAfterInterestCalcs, // Base principal is after prejudgment period (and its special damages)
                ratesData
            );
            totalGrossInterestAccrued += postjudgmentResult.total;
            principalAfterInterestCalcs = postjudgmentResult.principal; // Update principal
        }
    }

    // 3. Determine how much of this totalGrossInterestAccrued has already been paid by priorPayments
    let interestPaidByPriorPayments = 0;
    priorPayments.forEach(p => {
        if (p.interestApplied !== undefined) { // Ensure interestApplied exists
            interestPaidByPriorPayments += p.interestApplied;
        }
    });

    // 4. Calculate net interestAccrued available for the *current* payment
    const netInterestForCurrentPayment = Math.max(0, totalGrossInterestAccrued - interestPaidByPriorPayments);

    // 5. The remainingPrincipal (to be returned) is the principal balance *before* the current payment is applied.
    // This is principalAfterInterestCalcs, which started as (judgmentAwarded - prior principal payments)
    // and was then adjusted by special damages within the calculateInterestPeriods calls.
    
    // console.log(`[DEBUG] calculateInterestToDate for ${formatDateForDisplay(calculationDate)}: EffectiveBasePrincipal: ${effectivePrincipalForInterestCalc}, GrossInterestAccrued: ${totalGrossInterestAccrued}, InterestPaidByPrior: ${interestPaidByPriorPayments}, NetInterestForCurrent: ${netInterestForCurrentPayment}, PrincipalBeforeCurrentPayment: ${principalAfterInterestCalcs}`);

    return {
        interestAccrued: netInterestForCurrentPayment,
        remainingPrincipal: principalAfterInterestCalcs
    };
}

/**
 * Calculates how a payment should be allocated between interest and principal.
 * 
 * @param {Object} state - The application state
 * @param {Date} paymentDate - The date of the payment
 * @param {number} paymentAmount - The amount of the payment
 * @param {Array} priorPayments - Array of payments made before this payment
 * @param {Object} ratesData - The interest rates data
 * @returns {Object} The allocation details including interestApplied, principalApplied, and remainingPrincipal
 */
export function calculateInterestAllocation(state, paymentDate, paymentAmount, priorPayments, ratesData) {
    // Calculate interest up to payment date
    const { interestAccrued, remainingPrincipal } = calculateInterestToDate(
        state, 
        paymentDate, 
        priorPayments, 
        ratesData
    );

    // Apply payment to interest first, then principal
    let interestApplied = Math.min(paymentAmount, interestAccrued);
    let principalApplied = paymentAmount - interestApplied;
    
    // Calculate the remaining principal after payment - allow negative principal for overpayments
    const newRemainingPrincipal = remainingPrincipal - principalApplied;

    // console.log(`[DEBUG] calculateInterestAllocation: Payment of ${paymentAmount} applied: interestApplied=${interestApplied}, principalApplied=${principalApplied}, remainingPrincipal=${newRemainingPrincipal}`);

    return {
        interestApplied,
        principalApplied,
        remainingPrincipal: newRemainingPrincipal
    };
}

/**
 * Finds the calculation row containing the payment date, or determines if the payment date
 * is an end date of a row.
 * 
 * @param {Array} interestTable - Interest calculation table
 * @param {Date} paymentDate - Payment date
 * @returns {Object} The containing row, its index, and whether it's an exact end date
 */
export function findCalculationRowForPayment(interestTable, paymentDate) {
    const normalizedPaymentDate = normalizeDate(paymentDate);
    const paymentDateStr = formatDateForDisplay(paymentDate);
    // console.log(`Finding calculation row for payment date: ${paymentDateStr}`);
    
    // First, check if the payment date is an exact end date of a row
    for (let i = 0; i < interestTable.length; i++) {
        const row = interestTable[i];
        
        // Skip payment rows
        if (row.isPayment) continue;
        
        // Check if payment date falls on row end date
        const rowEndDate = typeof row.end === 'string' 
            ? normalizeDate(parseDateInput(row.end)) 
            : normalizeDate(row.end);
            
        if (datesEqual(normalizedPaymentDate, rowEndDate)) {
            // console.log(`Found row with payment date ${paymentDateStr} as END date`);
            
            return { 
                containingRow: row, 
                rowIndex: i, 
                isExactEndDate: true
            };
        }
    }
    
    // Then check for a row that contains the payment date
    for (let i = 0; i < interestTable.length; i++) {
        const row = interestTable[i];
        
        // Skip payment rows
        if (row.isPayment) continue;
        
        const rowStartDate = typeof row.start === 'string' 
            ? normalizeDate(parseDateInput(row.start)) 
            : normalizeDate(row.start);
            
        const rowEndDate = typeof row.end === 'string' 
            ? normalizeDate(parseDateInput(row.end)) 
            : normalizeDate(row.end);
            
        // Check if payment date falls within this row's period
        if (normalizedPaymentDate >= rowStartDate && normalizedPaymentDate < rowEndDate) {
            // console.log(`Found row CONTAINING payment date ${paymentDateStr}`);
            
            return { 
                containingRow: row, 
                rowIndex: i, 
                isExactEndDate: false
            };
        }
    }
    
    console.error(`Could not find appropriate row for payment date: ${paymentDateStr}`);
    return { containingRow: null, rowIndex: -1, isExactEndDate: false };
}

/**
 * Split an interest period when a payment falls within it.
 * 
 * @param {Object} period - The original interest period to split
 * @param {Date} paymentDate - The date of the payment
 * @param {number} originalPrincipal - The principal amount before payment
 * @param {number} reducedPrincipal - The principal amount after payment
 * @param {string} jurisdiction - The jurisdiction code
 * @param {Object} ratesData - The interest rates data
 * @param {'prejudgment' | 'postjudgment'} interestType - The type of interest
 * @returns {Array<Object>} Array of split segments (one or two segments depending on the split)
 */
export function splitInterestPeriod(period, paymentDate, originalPrincipal, reducedPrincipal, jurisdiction, ratesData, interestType) {
    // Handle edge cases first
    
    // 1. If payment is on the first day of the period, no split needed
    if (datesEqual(normalizeDate(paymentDate), normalizeDate(period.start))) {
        // Return modified period with reduced principal - no splitting
        return [{
            ...period,
            principal: reducedPrincipal,
            isModifiedByPayment: true
        }];
    }
    
    // 2. If payment is on the last day of the period, no split needed
    // The payment will be placed after this period
    if (datesEqual(normalizeDate(paymentDate), normalizeDate(period.end))) {
        // Return original period unchanged
        return [period];
    }
    
    // 3. If payment is not within the period, return original period
    const normalizedPaymentDate = normalizeDate(paymentDate);
    const normalizedStartDate = normalizeDate(period.start);
    const normalizedEndDate = normalizeDate(period.end);
    
    if (normalizedPaymentDate < normalizedStartDate || normalizedPaymentDate > normalizedEndDate) {
        return [period];
    }
    
    // 4. Calculate split for payment in the middle of the period
    
    // First segment: from period start to payment date
    // The paymentDate itself is the end of this segment.
    // daysBetween(start, end) typically calculates for [start, end), so interest is for days up to paymentDate.
    const daysInFirstSegment = daysBetween(period.start, paymentDate);
    const firstSegmentYear = period.start.getUTCFullYear();
    const daysInFirstYear = daysInYear(firstSegmentYear);
    
    const firstSegmentInterest = (originalPrincipal * (period.rate / 100) * daysInFirstSegment) / daysInFirstYear;
    
    const firstSegment = {
        start: new Date(period.start),
        end: new Date(paymentDate), // End date is the payment date
        rate: period.rate,
        principal: originalPrincipal,
        interest: firstSegmentInterest,
        isFinalSegment: false,
        isSplitSegment: true,
        _days: daysInFirstSegment,
        _endDate: formatDateForDisplay(paymentDate), // Display end date is payment date
        description: `${daysInFirstSegment} days (from ${formatDateForDisplay(period.start)} to ${formatDateForDisplay(paymentDate)})` // Description reflects payment date
    };
    
    // Second segment: from payment date to period end
    const daysInSecondSegment = daysBetween(paymentDate, period.end);
    const secondSegmentYear = paymentDate.getUTCFullYear();
    const daysInSecondYear = daysInYear(secondSegmentYear);
    
    const secondSegmentInterest = (reducedPrincipal * (period.rate / 100) * daysInSecondSegment) / daysInSecondYear;
    
    const secondSegment = {
        start: new Date(paymentDate),
        end: new Date(period.end),
        rate: period.rate,
        principal: reducedPrincipal,
        interest: secondSegmentInterest,
        isFinalSegment: period.isFinalSegment,
        isSplitSegment: true,
        _days: daysInSecondSegment,
        _endDate: formatDateForDisplay(period.end),
        description: `${daysInSecondSegment} days (from ${formatDateForDisplay(paymentDate)} to ${formatDateForDisplay(period.end)})`
    };
    
    return [firstSegment, secondSegment];
}

/**
 * Creates a payment row object for display in the interest table.
 * 
 * @param {Date} paymentDate - Date of payment
 * @param {number} amount - Total payment amount
 * @param {number} interestApplied - Amount applied to interest
 * @param {number} principalApplied - Amount applied to principal
 * @returns {Object} Payment row object
 */
export function createPaymentRow(paymentDate, amount, interestApplied, principalApplied) {
    return {
        start: new Date(paymentDate), // Keep as Date object for test compatibility
        description: `Payment received: ${formatCurrencyForInput(amount)}`,
        principal: -principalApplied,
        interest: -interestApplied,
        isPayment: true,
        paymentAmount: amount,
        interestApplied: interestApplied,
        principalApplied: principalApplied
    };
}

/**
 * Determines which interest rate segment a payment date falls into.
 * 
 * @param {Date} paymentDate - The date of the payment
 * @param {Date} startDate - The start date of interest calculation
 * @param {Object} ratesData - The interest rates data
 * @param {Object} state - The application state
 * @returns {number} The segment index
 */
export function determineSegmentIndex(paymentDate, startDate, ratesData, state) {
    const { jurisdiction, dateOfJudgment } = state.inputs;
    
    if (!paymentDate || !startDate || !ratesData[jurisdiction]) {
        return -1;
    }
    
    const jurisdictionRates = ratesData[jurisdiction];
    
    // Parse judgment date
    const judgmentDate = typeof dateOfJudgment === 'string' 
        ? parseDateInput(dateOfJudgment) 
        : dateOfJudgment;
    
    // Determine if this is a prejudgment or postjudgment payment
    const isPostjudgment = judgmentDate && paymentDate > judgmentDate;
    const interestType = isPostjudgment ? 'postjudgment' : 'prejudgment';
    
    // If postjudgment, use judgment date as the start date
    const effectiveStartDate = isPostjudgment ? judgmentDate : startDate;
    
    // Find which segment this payment belongs to
    let currentDate = new Date(effectiveStartDate);
    let segmentIndex = 0;
    
    while (currentDate < paymentDate && segmentIndex < 100) { // Limit to prevent infinite loops
        const rate = getInterestRateForDate(currentDate, interestType, jurisdiction, ratesData);
        
        // Find the next rate period based on interest type
        const nextRatePeriod = jurisdictionRates.find(period => 
            period.start > currentDate && 
            (isPostjudgment ? period.postjudgment !== undefined : period.prejudgment !== undefined)
        );
        
        if (!nextRatePeriod || nextRatePeriod.start >= paymentDate) {
            break;
        }
        
        currentDate = new Date(nextRatePeriod.start);
        segmentIndex++;
    }
    
    // For postjudgment payments, add the number of prejudgment segments to the index
    if (isPostjudgment) {
        // Count prejudgment segments
        let prejudgmentSegments = 0;
        let tempDate = new Date(startDate);
        
        while (tempDate < judgmentDate && prejudgmentSegments < 100) {
            const rate = getInterestRateForDate(tempDate, 'prejudgment', jurisdiction, ratesData);
            const nextRatePeriod = jurisdictionRates.find(period => 
                period.start > tempDate && period.prejudgment !== undefined
            );
            
            if (!nextRatePeriod || nextRatePeriod.start >= judgmentDate) {
                break;
            }
            
            tempDate = new Date(nextRatePeriod.start);
            prejudgmentSegments++;
        }
        
        segmentIndex += prejudgmentSegments + 1; // Add 1 for the transition to postjudgment
    }
    
    return segmentIndex;
}

/**
 * Gets all payments that occurred before a specific date.
 * 
 * @param {Object} state - The application state
 * @param {Date} beforeDate - The date to filter payments by
 * @returns {Array} Array of payments made before the specified date
 */
export function getPriorPayments(state, beforeDate) {
    const { results } = state;
    const { payments = [] } = results;
    
    return [...payments].filter(p => {
        const existingPaymentDate = typeof p.date === 'string' 
            ? parseDateInput(p.date) 
            : p.date;
        return existingPaymentDate < beforeDate;
    }).sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });
}

/**
 * Formats a number as currency for display.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrencyForInput(amount) {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
