import { daysBetween, daysInYear, formatDateForDisplay, parseDateInput, normalizeDate, dateOnOrAfter, dateOnOrBefore, datesEqual } from './utils.date.js';
import { calculateInterestPeriods, getInterestRateForDate } from './calculations.js';
import { splitInterestPeriodsWithPayments } from './interestPeriodSplitter.js';
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
 * @returns {Object} The processed payment with allocation details
 */
export function processPayment(state, payment, ratesData) {
    // Validate payment
    if (!payment || !payment.date || isNaN(payment.amount) || payment.amount <= 0) {
        console.error('Invalid payment data:', payment);
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

    // Get all existing payments that happened before this payment
    const priorPayments = getPriorPayments(state, paymentDate);

    // Calculate interest allocation using the core calculation module
    const { interestApplied, principalApplied, remainingPrincipal } = calculateInterestAllocation(
        state, 
        paymentDate, 
        payment.amount, 
        priorPayments, 
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

/**
 * Recalculates interest periods with payments applied.
 * Updated to handle potentially negative principal values.
 * 
 * @param {Object} state - The application state
 * @param {Array} payments - Array of processed payments
 * @param {Object} ratesData - The interest rates data
 * @returns {Object} Updated interest calculation results
 */
export function recalculateWithPayments(state, payments, ratesData) {
    if (!payments || payments.length === 0) {
        return state.results; // No change if no payments
    }

    const { inputs, results } = state;
    const { prejudgmentStartDate, dateOfJudgment, postjudgmentEndDate } = inputs;
    const { judgmentAwarded } = inputs;
    const endDate = postjudgmentEndDate || dateOfJudgment;
    
    // Create new results object
    const newResults = {
        ...results,
        prejudgmentResult: {
            details: [],
            total: 0,
            principal: judgmentAwarded,
            finalPeriodDamageInterestDetails: []
        }
    };

    // Calculate the base interest periods without payments
    const tempState = JSON.parse(JSON.stringify(state));
    const baseInterestResult = calculateInterestPeriods(
        tempState,
        'prejudgment',
        prejudgmentStartDate,
        endDate,
        judgmentAwarded,
        ratesData
    );
    
    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });
    
    // Ensure payments have proper Date objects before passing to the splitter
    const processedPayments = sortedPayments.map(payment => {
        return {
            ...payment,
            date: typeof payment.date === 'string' 
                ? parseDateInput(payment.date) 
                : payment.date instanceof Date 
                    ? payment.date 
                    : new Date(payment.date)
        };
    });
    
    // Apply the payments to split the interest periods
    const splitPeriods = splitInterestPeriodsWithPayments(
        baseInterestResult.details,
        processedPayments,
        state,
        ratesData,
        'prejudgment'
    );
    
    // Calculate the total interest and principal after payments
    let totalInterest = 0;
    let finalPrincipal = judgmentAwarded;
    
    // Calculate the total interest from all periods
    splitPeriods.forEach(period => {
        if (!period.isPayment) {
            // Add interest for regular and split interest periods
            totalInterest += period.interest || 0;
        } else {
            // Subtract interest and principal applied by payments
            totalInterest -= period.interest || 0; // Payment interest is stored as negative
        }
    });
    
    // Determine the final principal by applying payments
    // Use the last payment's remaining principal, which can be negative
    if (sortedPayments.length > 0) {
        const lastPayment = sortedPayments[sortedPayments.length - 1];
        finalPrincipal = lastPayment.remainingPrincipal;
    }
    
    // Update the results
    newResults.prejudgmentResult.details = splitPeriods;
    newResults.prejudgmentResult.total = totalInterest;
    newResults.prejudgmentResult.principal = finalPrincipal;
    
    // Handle special damages in final period if needed
    if (baseInterestResult.finalPeriodDamageInterestDetails && 
        baseInterestResult.finalPeriodDamageInterestDetails.length > 0) {
        newResults.prejudgmentResult.finalPeriodDamageInterestDetails = 
            baseInterestResult.finalPeriodDamageInterestDetails;
    }
    
    return newResults;
}


/**
 * Formats a number as currency for display.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
