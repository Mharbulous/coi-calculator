/**
 * Payment Insertion Algorithm
 * 
 * This module implements the algorithm for inserting payment records into 
 * interest calculation tables.
 */

import { daysBetween, daysInYear, formatDateForDisplay, parseDateInput, normalizeDate, datesEqual } from './utils.date.js';
import { getInterestRateForDate } from './calculations.js';
import { formatCurrencyForInput } from './utils.currency.js';

/**
 * Insert a payment record into the appropriate interest table.
 * 
 * @param {Object} state - Application state
 * @param {Object} payment - Payment object with date and amount
 * @param {Object} ratesData - Interest rates data
 * @returns {Object} Updated state with payment inserted
 */
export function insertPaymentRecord(state, payment, ratesData) {
    // Import logger for debugging
    return import('./util.logger.js').then(logger => {
        try {
            logger.debug("Starting insertPaymentRecord with payment:", payment);
            
            // Validate payment data
            if (!validatePayment(payment)) {
                logger.error('Invalid payment data:', payment);
                return state;
            }

            // Normalize the payment date to ensure consistent format
            const paymentDate = typeof payment.date === 'string' 
                ? parseDateInput(payment.date) 
                : payment.date;

            // Get judgment date to determine which table to use
            const { dateOfJudgment } = state.inputs;
            const judgmentDate = typeof dateOfJudgment === 'string'
                ? parseDateInput(dateOfJudgment)
                : dateOfJudgment;

            // Determine which table to insert the payment into
            const targetTable = paymentDate <= judgmentDate ? 'prejudgment' : 'postjudgment';
            logger.info(`Inserting payment of ${payment.amount} on ${formatDateForDisplay(paymentDate)} into ${targetTable} table`);
            
            // Create a deep copy of the state to avoid direct mutations
            const newState = JSON.parse(JSON.stringify(state));
            
            // Get the interest table to modify
            const interestTable = targetTable === 'prejudgment' 
                ? newState.results.prejudgmentResult.details
                : newState.results.postjudgmentResult.details;
            
            // Log interest table before modification
            logger.debug(`Interest table before payment insertion has ${interestTable.length} rows`);
            logger.debug("Existing payment rows:", interestTable.filter(row => row.isPayment).length);
            
            // Find the calculation row containing the payment date or determine if payment date is an end date
            const { containingRow, rowIndex, isExactEndDate } = findCalculationRowForPayment(interestTable, paymentDate);
            
            if (!containingRow) {
                logger.error('Could not find a calculation row for payment date:', paymentDate);
                return state;
            }
            
            logger.debug(`Found containing row at index ${rowIndex}, isExactEndDate: ${isExactEndDate}`);
            logger.debug("Containing row:", containingRow);
            
            // Create payment record row with placeholder values for interest/principal applied
            const paymentRowData = createPaymentRow(
                paymentDate,
                payment.amount,
                0, // interestApplied placeholder
                0  // principalApplied placeholder
            );
            
            logger.debug("Created payment row data:", paymentRowData);

            // Create a deep copy of the containingRow (target row)
            const duplicatedRow = JSON.parse(JSON.stringify(containingRow));
            // Optionally, mark the duplicated row for debugging
            duplicatedRow._isDuplicated = true;
            
            logger.debug("Duplicated row created");

            // Insert the paymentRowData and then the duplicatedRow directly after the containingRow
            // The containingRow (at rowIndex) remains in place.
            logger.debug(`Inserting payment row at index ${rowIndex + 1}`);
            interestTable.splice(rowIndex + 1, 0, paymentRowData, duplicatedRow);
            
            // Log the table after insertion
            logger.debug(`Interest table after payment insertion has ${interestTable.length} rows`);
            logger.debug("Payment rows after insertion:", interestTable.filter(row => row.isPayment).length);

            // Add a simplified processed payment to the payments list
            const processedPayment = {
                date: paymentDate,
                dateStr: formatDateForDisplay(paymentDate),
                amount: payment.amount,
                segmentIndex: rowIndex
            };
            
            newState.results.payments = newState.results.payments || [];
            
            // Check if this payment already exists to avoid duplicates
            const paymentExists = newState.results.payments.some(p => 
                p.dateStr === processedPayment.dateStr && 
                Math.abs(p.amount - processedPayment.amount) < 0.001
            );
            
            if (!paymentExists) {
                logger.debug("Adding payment to state.results.payments:", processedPayment);
                newState.results.payments.push(processedPayment);
            } else {
                logger.warning("Payment already exists in state, not adding a duplicate");
            }
            
            logger.debug("Final payments array length:", newState.results.payments.length);
            logger.debug("insertPaymentRecord completed successfully");
            
            return newState;
        } catch (error) {
            console.error("Error in insertPaymentRecord:", error);
            return state;
        }
    }).catch(error => {
        console.error("Failed to import logger in insertPaymentRecord:", error);
        
        // Fallback to non-instrumented version if logger fails
        // Validate payment data
        if (!validatePayment(payment)) {
            console.error('Invalid payment data:', payment);
            return state;
        }

        const paymentDate = typeof payment.date === 'string' 
            ? parseDateInput(payment.date) 
            : payment.date;

        const { dateOfJudgment } = state.inputs;
        const judgmentDate = typeof dateOfJudgment === 'string'
            ? parseDateInput(dateOfJudgment)
            : dateOfJudgment;

        const targetTable = paymentDate <= judgmentDate ? 'prejudgment' : 'postjudgment';
        console.log(`Inserting payment of ${payment.amount} on ${formatDateForDisplay(paymentDate)} into ${targetTable} table`);
        
        const newState = JSON.parse(JSON.stringify(state));
        
        const interestTable = targetTable === 'prejudgment' 
            ? newState.results.prejudgmentResult.details
            : newState.results.postjudgmentResult.details;
        
        const { containingRow, rowIndex, isExactEndDate } = findCalculationRowForPayment(interestTable, paymentDate);
        
        if (!containingRow) {
            console.error('Could not find a calculation row for payment date:', paymentDate);
            return state;
        }
        
        const paymentRowData = createPaymentRow(
            paymentDate,
            payment.amount,
            0,
            0
        );

        const duplicatedRow = JSON.parse(JSON.stringify(containingRow));
        
        interestTable.splice(rowIndex + 1, 0, paymentRowData, duplicatedRow);

        const processedPayment = {
            date: paymentDate,
            dateStr: formatDateForDisplay(paymentDate),
            amount: payment.amount,
            segmentIndex: rowIndex
        };
        
        newState.results.payments = newState.results.payments || [];
        newState.results.payments.push(processedPayment);
        
        return newState;
    });
}

/**
 * Validate that the payment object has all required fields and valid values.
 * 
 * @param {Object} payment - Payment object to validate
 * @returns {boolean} True if payment is valid, false otherwise
 */
function validatePayment(payment) {
    if (!payment) return false;
    
    // Check that payment has date and amount
    if (!payment.date || !payment.amount) return false;
    
    // Check that amount is a number greater than or equal to zero
    if (isNaN(payment.amount) || payment.amount < 0) return false;
    
    // Check that date is valid
    const paymentDate = typeof payment.date === 'string' 
        ? parseDateInput(payment.date) 
        : payment.date;
    
    if (!paymentDate || isNaN(paymentDate.getTime())) return false;
    
    return true;
}

/**
 * Find the calculation row containing the payment date, or determine if the payment date
 * is an end date of a row.
 * 
 * @param {Array} interestTable - Interest calculation table
 * @param {Date} paymentDate - Payment date
 * @returns {Object} The containing row, its index, and whether it's an exact end date
 */
function findCalculationRowForPayment(interestTable, paymentDate) {
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
 * Create a payment row to insert into the interest table.
 * 
 * @param {Date} paymentDate - Date of payment
 * @param {number} amount - Total payment amount
 * @param {number} interestApplied - Amount applied to interest
 * @param {number} principalApplied - Amount applied to principal
 * @returns {Object} Payment row object
 */
function createPaymentRow(paymentDate, amount, interestApplied, principalApplied) {
    return {
        start: formatDateForDisplay(paymentDate),
        description: `Payment received: ${formatCurrencyForInput(amount)}`,
        principal: -principalApplied, // Will be 0 for now as per task scope
        interest: -interestApplied,   // Will be 0 for now as per task scope
        isPayment: true,
        paymentAmount: amount,
        interestApplied: interestApplied, // Will be 0 for now
        principalApplied: principalApplied  // Will be 0 for now
    };
}

/**
 * Update principal values for all periods after a payment, allowing negative principal.
 * (This function is currently not called by the modified insertPaymentRecord for this task)
 * 
 * @param {Array} interestTable - Interest calculation table
 * @param {number} startIndex - Index to start updating from
 * @param {number} newPrincipal - New principal value to apply
 */
function updateSubsequentPeriods(interestTable, startIndex, newPrincipal) {
    console.log(`Updating principal for all subsequent periods starting at index ${startIndex} to $${newPrincipal}`);
    
    let updatedRowCount = 0;
    
    for (let i = startIndex; i < interestTable.length; i++) {
        const row = interestTable[i];
        
        // Skip payment rows
        if (row.isPayment) continue;
        
        const oldPrincipal = row.principal;
        
        // Update principal - allowing negative values for overpayments
        row.principal = newPrincipal;
        
        // Recalculate interest based on new principal
        const startDate = typeof row.start === 'string' 
            ? parseDateInput(row.start) 
            : row.start;
            
        const endDate = typeof row.end === 'string' 
            ? parseDateInput(row.end) 
            : row.end;
            
        const days = daysBetween(startDate, endDate);
        const year = startDate.getUTCFullYear();
        const daysInThisYear = daysInYear(year);
        
        const oldInterest = row.interest;
        row.interest = (newPrincipal * (row.rate / 100) * days) / daysInThisYear;
        
        console.log(`Updated row ${i}: Principal: $${oldPrincipal} → $${newPrincipal}, Interest: $${oldInterest.toFixed(2)} → $${row.interest.toFixed(2)}`);
        
        updatedRowCount++;
    }
    
    console.log(`Updated ${updatedRowCount} rows with new principal value.`);
}

/**
 * Recalculate total interest for a table after modifications.
 * (This function is currently not called by the modified insertPaymentRecord for this task)
 * 
 * @param {Object} state - Application state
 * @param {string} tableType - 'prejudgment' or 'postjudgment'
 */
function recalculateTotals(state, tableType) {
    const interestTable = tableType === 'prejudgment' 
        ? state.results.prejudgmentResult.details 
        : state.results.postjudgmentResult.details;
    
    let totalInterest = 0;
    let finalPrincipal = null;
    
    // Find the initial principal (from the first non-payment row)
    for (const row of interestTable) {
        if (!row.isPayment) {
            finalPrincipal = row.principal;
            break;
        }
    }
    
    // Calculate total interest by adding interest from all rows
    for (const row of interestTable) {
        if (row.isPayment) {
            // For payment rows, subtract the interest applied (which is stored as negative)
            totalInterest += row.interest;
        } else {
            // For regular rows, add the interest
            totalInterest += row.interest;
        }
    }
    
    // Find the final principal (from the last non-payment row)
    for (let i = interestTable.length - 1; i >= 0; i--) {
        if (!interestTable[i].isPayment) {
            finalPrincipal = interestTable[i].principal;
            break;
        }
    }
    
    // Update the state with totals
    if (tableType === 'prejudgment') {
        state.results.prejudgmentResult.total = totalInterest;
        state.results.prejudgmentResult.principal = finalPrincipal;
    } else {
        state.results.postjudgmentResult.total = totalInterest;
        state.results.postjudgmentResult.principal = finalPrincipal;
    }
}

/**
 * Process multiple payments in chronological order.
 * 
 * @param {Object} state - Application state
 * @param {Array} payments - Array of payment objects
 * @param {Object} ratesData - Interest rates data
 * @returns {Object} Updated state with all payments processed
 */
export function processMultiplePayments(state, payments, ratesData) {
    if (!payments || payments.length === 0) return state;
    
    // Sort payments by date
    const sortedPayments = [...payments].sort((a, b) => {
        const dateA = typeof a.date === 'string' ? parseDateInput(a.date) : a.date;
        const dateB = typeof b.date === 'string' ? parseDateInput(b.date) : b.date;
        return dateA - dateB;
    });
    
    // Process each payment in order
    let currentState = JSON.parse(JSON.stringify(state));
    
    for (const payment of sortedPayments) {
        currentState = insertPaymentRecord(currentState, payment, ratesData);
    }
    
    return currentState;
}
