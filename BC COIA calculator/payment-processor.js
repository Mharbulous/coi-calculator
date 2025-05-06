import { daysBetween, daysInYear, formatDateForDisplay, parseDateInput, normalizeDate, dateOnOrAfter, dateOnOrBefore, datesEqual } from './utils.date.js';
import { calculateInterestPeriods, getInterestRateForDate } from './calculations.js';

/**
 * Processes a payment, applying it first to accumulated interest and then to principal.
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
    const { inputs, results } = state;
    const { prejudgmentStartDate } = inputs;
    let { specialDamages, judgmentTotal, payments } = results;

    // Get all existing payments that happened before this payment
    const priorPayments = [...payments].filter(p => {
        const existingPaymentDate = typeof p.date === 'string' 
            ? parseDateInput(p.date) 
            : p.date;
        return existingPaymentDate < paymentDate;
    }).sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });

    // Calculate interest up to payment date
    const { interestAccrued, remainingPrincipal } = calculateInterestToDate(
        state, 
        paymentDate, 
        priorPayments, 
        ratesData
    );

    // Apply payment to interest first, then principal
    let interestApplied = Math.min(payment.amount, interestAccrued);
    let principalApplied = payment.amount - interestApplied;
    
    // Calculate the remaining principal after payment
    const newRemainingPrincipal = remainingPrincipal - principalApplied;

    // Handle overpayment - if payment exceeds total owing
    if (newRemainingPrincipal < 0) {
        // Adjust principal applied to not go below zero
        principalApplied = remainingPrincipal;
        interestApplied = payment.amount - principalApplied;
    }

    // Determine which segment this payment falls into
    const segmentIndex = determineSegmentIndex(paymentDate, prejudgmentStartDate, ratesData, state);

    // Create the processed payment object
    const processedPayment = {
        date: paymentDate,
        dateStr: formatDateForDisplay(paymentDate),
        amount: payment.amount,
        interestApplied,
        principalApplied,
        remainingPrincipal: Math.max(0, newRemainingPrincipal),
        segmentIndex
    };

    return processedPayment;
}

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
    let totalInterestAccrued = 0;

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

    totalInterestAccrued = interestResult.total;
    
    // Apply prior payments in chronological order
    let remainingInterest = totalInterestAccrued;
    let remainingPrincipal = interestResult.principal; // This includes special damages up to calculation date

    priorPayments.forEach(payment => {
        // First apply to interest
        const interestPayment = Math.min(payment.amount, remainingInterest);
        remainingInterest -= interestPayment;
        
        // Then apply to principal
        const principalPayment = payment.amount - interestPayment;
        remainingPrincipal -= principalPayment;
    });

    return {
        interestAccrued: remainingInterest,
        remainingPrincipal: remainingPrincipal
    };
}

/**
 * Recalculates interest periods with payments applied.
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
    
    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });

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

    // Process each payment segment
    let currentDate = new Date(prejudgmentStartDate);
    let currentPrincipal = judgmentAwarded;
    let accumulatedInterest = 0;
    
    // Split the date range into segments defined by payment dates
    const dateSegments = [];
    
    // Add the first segment from prejudgmentStartDate to first payment or end date
    if (sortedPayments.length > 0) {
        const firstPaymentDate = sortedPayments[0].date;
        dateSegments.push({
            start: currentDate,
            end: firstPaymentDate,
            payment: null
        });
        
        // Add segments between payments
        for (let i = 0; i < sortedPayments.length - 1; i++) {
            dateSegments.push({
                start: sortedPayments[i].date,
                end: sortedPayments[i + 1].date,
                payment: sortedPayments[i]
            });
        }
        
        // Add segment from last payment to postjudgmentEndDate
        const lastPayment = sortedPayments[sortedPayments.length - 1];
        dateSegments.push({
            start: lastPayment.date,
            end: postjudgmentEndDate || dateOfJudgment,
            payment: lastPayment
        });
    } else {
        // If no payments, just one segment from start to end
        dateSegments.push({
            start: currentDate,
            end: postjudgmentEndDate || dateOfJudgment,
            payment: null
        });
    }
    
    // Process each segment
    dateSegments.forEach((segment, index) => {
        // Calculate interest for this segment
        const tempState = JSON.parse(JSON.stringify(state));
        
        const segmentResult = calculateInterestPeriods(
            tempState,
            'prejudgment',
            segment.start,
            segment.end,
            currentPrincipal,
            ratesData
        );
        
        // Add segment results to newResults
        if (index === 0) {
            newResults.prejudgmentResult.details = segmentResult.details;
            newResults.prejudgmentResult.finalPeriodDamageInterestDetails = 
                segmentResult.finalPeriodDamageInterestDetails;
        } else {
            newResults.prejudgmentResult.details = 
                newResults.prejudgmentResult.details.concat(segmentResult.details);
            newResults.prejudgmentResult.finalPeriodDamageInterestDetails = 
                newResults.prejudgmentResult.finalPeriodDamageInterestDetails.concat(
                    segmentResult.finalPeriodDamageInterestDetails
                );
        }
        
        // Apply payment at the end of this segment if there is one
        if (segment.payment) {
            // Add payment details to the results
            const paymentDetails = {
                start: formatDateForDisplay(segment.payment.date),
                description: `Payment received: ${formatCurrency(segment.payment.amount)}`,
                principal: -segment.payment.principalApplied,
                interest: -segment.payment.interestApplied,
                isPayment: true
            };
            
            newResults.prejudgmentResult.details.push(paymentDetails);
            
            // Update current principal for the next segment
            currentPrincipal = segment.payment.remainingPrincipal;
        } else {
            // Update current principal based on segment result
            currentPrincipal = segmentResult.principal;
        }
        
        // Accumulate interest
        accumulatedInterest += segmentResult.total;
    });
    
    // Calculate total interest after applying payments
    let totalInterestAfterPayments = accumulatedInterest;
    sortedPayments.forEach(payment => {
        totalInterestAfterPayments -= payment.interestApplied;
    });
    
    // Update final total and principal
    newResults.prejudgmentResult.total = totalInterestAfterPayments;
    newResults.prejudgmentResult.principal = currentPrincipal;
    
    return newResults;
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
function determineSegmentIndex(paymentDate, startDate, ratesData, state) {
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
