import { daysBetween, daysInYear, formatDateForDisplay, parseDateInput, normalizeDate, dateOnOrAfter, dateOnOrBefore, datesEqual } from './utils.date.js';
import { getInterestRateForDate } from './calculations.js';

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
 * Apply payment splitting logic to a list of interest periods.
 * 
 * @param {Array<Object>} periods - The list of interest periods
 * @param {Array<Object>} payments - The list of payments
 * @param {Object} state - The application state
 * @param {Object} ratesData - The interest rates data
 * @param {'prejudgment' | 'postjudgment'} interestType - The type of interest
 * @returns {Array<Object>} Modified list of periods with splits applied
 */
export function applyPaymentsToInterestPeriods(periods, payments, state, ratesData, interestType) {
    if (!payments || payments.length === 0 || !periods || periods.length === 0) {
        return periods; // No changes if no payments or periods
    }
    
    const { jurisdiction } = state.inputs;
    
    // Start with a copy of the original periods
    let modifiedPeriods = [...periods];
    
    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });
    
    // Process each payment
    sortedPayments.forEach(payment => {
        const paymentDate = typeof payment.date === 'string' ? parseDateInput(payment.date) : payment.date;
        
        // Find the affected period for this payment
        const affectedPeriodIndex = modifiedPeriods.findIndex(period => {
            // Ensure we have proper Date objects
            const periodStart = typeof period.start === 'string' 
                ? parseDateInput(period.start) 
                : period.start;
                
            const periodEnd = typeof period.end === 'string' 
                ? parseDateInput(period.end) 
                : period.end;
                
            const paymentNormalized = normalizeDate(paymentDate);
            
            // Check if payment falls within or on the boundaries of this period
            return (paymentNormalized >= normalizeDate(periodStart) && 
                    paymentNormalized <= normalizeDate(periodEnd));
        });
        
        if (affectedPeriodIndex >= 0) {
            const affectedPeriod = modifiedPeriods[affectedPeriodIndex];
            
            // Determine principals for the split
            const originalPrincipal = affectedPeriod.principal;
            const reducedPrincipal = originalPrincipal - payment.principalApplied;
            
            // Special case: Payment on rate change date
            const isRateChangeDate = affectedPeriodIndex < modifiedPeriods.length - 1 && 
                datesEqual(normalizeDate(paymentDate), normalizeDate(affectedPeriod.end));
            
            if (isRateChangeDate) {
                // For payments on a rate change date, apply payment after the current period
                // but before the next period starts.
                // The current period remains unchanged.
                
                // Update the principal for the next period
                if (affectedPeriodIndex + 1 < modifiedPeriods.length) {
                    const nextPeriod = modifiedPeriods[affectedPeriodIndex + 1];
                    modifiedPeriods[affectedPeriodIndex + 1] = {
                        ...nextPeriod,
                        principal: reducedPrincipal,
                        isModifiedByPayment: true
                    };
                }
            } else {
                // Standard split case
                const splitSegments = splitInterestPeriod(
                    affectedPeriod, 
                    paymentDate, 
                    originalPrincipal,
                    reducedPrincipal,
                    jurisdiction,
                    ratesData,
                    interestType
                );
                
                // Replace the affected period with the split segments
                modifiedPeriods.splice(affectedPeriodIndex, 1, ...splitSegments);
            }
            
            // Update principals for all subsequent periods
            for (let i = affectedPeriodIndex + 1; i < modifiedPeriods.length; i++) {
                modifiedPeriods[i] = {
                    ...modifiedPeriods[i],
                    principal: reducedPrincipal,
                    isModifiedByPayment: true
                };
            }
        }
    });
    
    return modifiedPeriods;
}

/**
 * Splits interest periods recursively when multiple payments occur within the same period.
 * 
 * @param {Array<Object>} originalPeriods - The original interest periods
 * @param {Array<Object>} payments - The list of payments
 * @param {Object} state - The application state
 * @param {Object} ratesData - The interest rates data
 * @param {'prejudgment' | 'postjudgment'} interestType - The type of interest
 * @returns {Array<Object>} Split interest periods with payment rows inserted
 */
export function splitInterestPeriodsWithPayments(originalPeriods, payments, state, ratesData, interestType) {
    if (!payments || payments.length === 0) {
        return originalPeriods; // No changes if no payments
    }
    
    // Apply payment splitting logic
    const splitPeriods = applyPaymentsToInterestPeriods(originalPeriods, payments, state, ratesData, interestType);
    
    // Create final result array with payment rows inserted
    const finalResults = [];
    
    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });
    
    // Iterate through split periods
    let periodIndex = 0;
    let paymentIndex = 0;
    
    while (periodIndex < splitPeriods.length) {
        const currentPeriod = splitPeriods[periodIndex];
        finalResults.push(currentPeriod);
        periodIndex++;
        
        // Check if any payments belong after this period
        while (paymentIndex < sortedPayments.length) {
            const payment = sortedPayments[paymentIndex];
            const paymentDate = typeof payment.date === 'string' ? parseDateInput(payment.date) : payment.date;
            
            // If the payment date equals the end date of the just added period
            // or there's no next period and payment is after current period's end
            const periodEndDate = typeof currentPeriod.end === 'string' 
                ? parseDateInput(currentPeriod.end) 
                : currentPeriod.end;
                
            if (datesEqual(normalizeDate(paymentDate), normalizeDate(periodEndDate)) ||
                (periodIndex >= splitPeriods.length && paymentDate >= periodEndDate)) {
                
                // Add payment row
                finalResults.push(createPaymentRow(payment));
                // Duplicate the preceding interest period (currentPeriod) and add it after the payment
                const duplicatedTargetRow = JSON.parse(JSON.stringify(currentPeriod));
                finalResults.push(duplicatedTargetRow);
                paymentIndex++;
            } else {
                break; // This payment belongs to a later period
            }
        }
    }
    
    // Ensure any remaining payments are added (should only happen for payments after all periods)
    while (paymentIndex < sortedPayments.length) {
        finalResults.push(createPaymentRow(sortedPayments[paymentIndex]));
        paymentIndex++;
    }
    
    return finalResults;
}

/**
 * Creates a payment row object for display in the interest table.
 * 
 * @param {Object} payment - The payment object
 * @returns {Object} Payment row object for the interest table
 */
function createPaymentRow(payment) {
    // As per task instructions, for visual duplication, set applied amounts to 0.
    // Calculations of actual effect are out of scope for this specific change.
    // The 'payment' object here is expected to have 'amount', 'date'.
    // 'principalApplied' and 'interestApplied' might not be on it if coming directly from store's default.
    return {
        start: formatDateForDisplay(payment.date),
        description: `Payment received: ${formatCurrency(payment.amount)}`,
        principal: 0, // Placeholder
        interest: 0,  // Placeholder
        isPayment: true,
        paymentAmount: payment.amount // Store original amount for display
        // principalApplied: 0, // Explicitly setting these if needed by other parts
        // interestApplied: 0
    };
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
