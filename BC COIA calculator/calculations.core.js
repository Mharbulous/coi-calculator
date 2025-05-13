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
    const { inputs, results } = state;
    const { prejudgmentStartDate } = inputs;
    const { judgmentAwarded } = inputs;
    const { specialDamages } = results;

    if (!calculationDate || !prejudgmentStartDate) {
        console.error('Invalid dates for interest calculation:', { calculationDate, prejudgmentStartDate });
        return { interestAccrued: 0, remainingPrincipal: judgmentAwarded };
    }

    // Start with the judgment amount as initial principal
    let currentPrincipal = judgmentAwarded;
    
    // Create state copy for calculation
    const tempState = JSON.parse(JSON.stringify(state));
    
    // Calculate interest from start date to payment date (without including prior payments yet)
    const interestResult = calculateInterestPeriods(
        tempState,
        'prejudgment',
        prejudgmentStartDate,
        calculationDate,
        currentPrincipal,
        ratesData
    );

    // Get the total interest accrued up to the calculation date
    const totalInterestAccrued = interestResult.total;
    
    // Get the remaining principal (includes special damages up to calculation date)
    let remainingPrincipal = interestResult.principal;
    
    // Calculate total interest already paid by prior payments
    let totalInterestPaid = 0;
    
    // Apply prior payments in chronological order to track how much interest has been paid
    priorPayments.forEach(payment => {
        if (payment.interestApplied) {
            // If the payment has interestApplied property, use it
            totalInterestPaid += payment.interestApplied;
            remainingPrincipal -= payment.principalApplied;
        } else {
            // For backward compatibility with payments that don't have interestApplied
            // Calculate how much would have been applied to interest vs principal
            const interestAtTime = Math.max(0, totalInterestAccrued - totalInterestPaid);
            const interestPayment = Math.min(payment.amount, interestAtTime);
            totalInterestPaid += interestPayment;
            
            // Apply remainder to principal
            const principalPayment = payment.amount - interestPayment;
            remainingPrincipal -= principalPayment;
        }
    });
    
    // The interest that should be applied to the current payment is the 
    // total interest accrued minus the total interest already paid
    const interestAccrued = Math.max(0, totalInterestAccrued - totalInterestPaid);
    
    console.log(`[DEBUG] calculateInterestToDate: Total interest accrued: ${totalInterestAccrued}, Total interest paid: ${totalInterestPaid}, Remaining interest to apply: ${interestAccrued}`);

    return {
        interestAccrued: interestAccrued,
        remainingPrincipal: remainingPrincipal
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

    console.log(`[DEBUG] calculateInterestAllocation: Payment of ${paymentAmount} applied: interestApplied=${interestApplied}, principalApplied=${principalApplied}, remainingPrincipal=${newRemainingPrincipal}`);

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
    console.log(`Finding calculation row for payment date: ${paymentDateStr}`);
    
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
            console.log(`Found row with payment date ${paymentDateStr} as END date`);
            
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
            console.log(`Found row CONTAINING payment date ${paymentDateStr}`);
            
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
    const { jurisdiction } = state.inputs;
    
    if (!paymentDate || !startDate || !ratesData[jurisdiction]) {
        return -1;
    }
    
    const jurisdictionRates = ratesData[jurisdiction];
    
    // Find which segment this payment belongs to
    let currentDate = new Date(startDate);
    let segmentIndex = 0;
    
    while (currentDate < paymentDate && segmentIndex < 100) { // Limit to prevent infinite loops
        const rate = getInterestRateForDate(currentDate, 'prejudgment', jurisdiction, ratesData);
        const nextRatePeriod = jurisdictionRates.find(period => 
            period.start > currentDate && period.prejudgment !== undefined
        );
        
        if (!nextRatePeriod || nextRatePeriod.start >= paymentDate) {
            break;
        }
        
        currentDate = new Date(nextRatePeriod.start);
        segmentIndex++;
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
