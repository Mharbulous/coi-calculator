import { daysBetween, daysInYear, formatDateForDisplay, parseDateInput, normalizeDate, dateOnOrAfter, dateOnOrBefore, datesEqual } from './utils.date.js';
import { parseCurrency } from './utils.currency.js'; // Added import
import { calculateInterestPeriods, getInterestRateForDate } from './calculations.js';
// REMOVED: import { splitInterestPeriodsWithPayments } from './interestPeriodSplitter.js';
import { 
    calculateInterestToDate, 
    calculateInterestAllocation, 
    determineSegmentIndex, 
    getPriorPayments 
} from './calculations.core.js';

/**
 * Processes a payment, applying it first to accumulated interest and then to principal.
 * Updated to allow negative principal for overpayments.
 * 
 * @param {Object} state - The application state object
 * @param {Object} payment - The payment object {date, amount}
 * @param {Object} ratesData - The interest rates data
 * @param {Array|null} explicitPriorPayments - Optional array of already processed prior payments
 * @returns {Object} The processed payment with allocation details
 */
export function processPayment(state, payment, ratesData, explicitPriorPayments = null) {
    // Validate payment
    if (!payment || !payment.date || (typeof payment.amount === 'number' && isNaN(payment.amount)) || (typeof payment.amount !== 'number' && !parseCurrency(payment.amount))) {
        // Allow zero amount payments, but not invalid or negative
        if (payment.amount !== 0 && (payment.amount < 0 || (typeof payment.amount === 'number' && isNaN(payment.amount)))) {
        console.error('Invalid payment data:', payment);
        return null;
        }
    }
    const paymentAmount = typeof payment.amount === 'number' ? payment.amount : parseCurrency(payment.amount);
    if (paymentAmount < 0) {
        console.error('Invalid payment amount (negative):', payment.amount);
        return null;
    }


    const paymentDate = typeof payment.date === 'string' 
        ? parseDateInput(payment.date) 
        : payment.date;

    if (!paymentDate || isNaN(paymentDate.getTime())) {
        console.error('Invalid payment date:', payment.date);
        return null;
    }

    // Get principal and all existing payments
    const { inputs } = state;
    const { prejudgmentStartDate } = inputs;

    // Use explicitly passed prior payments if available, otherwise fetch them
    const priorPaymentsToUse = explicitPriorPayments !== null ? explicitPriorPayments : getPriorPayments(state, paymentDate);

    // Calculate interest allocation using the core calculation module
    const { interestApplied, principalApplied, remainingPrincipal } = calculateInterestAllocation(
        state, 
        paymentDate, 
        paymentAmount, 
        priorPaymentsToUse, 
        ratesData
    );

    // Determine which segment this payment falls into
    const segmentIndex = determineSegmentIndex(paymentDate, prejudgmentStartDate, ratesData, state);

    // Create the processed payment object
    const processedPayment = {
        date: paymentDate,
        dateStr: formatDateForDisplay(paymentDate),
        amount: payment.amount,
        interestApplied,
        principalApplied,
        remainingPrincipal, // Allow negative principal
        segmentIndex
    };

    return processedPayment;
}

// Export the core calculation function for use by other modules
export { calculateInterestToDate } from './calculations.core.js';

// The recalculateWithPayments function appears to be unused and is therefore removed.
// If it were to be used, it would need refactoring similar to calculator.core.js
// to use the new timeline-based interest segment generation instead of splitInterestPeriodsWithPayments.

/**
 * Formats a number as currency for display.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    // This helper seems local and might be duplicated if not used by exported functions.
    // For now, keeping it as it doesn't harm.
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
