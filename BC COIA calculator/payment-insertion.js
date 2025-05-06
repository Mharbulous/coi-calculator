/**
 * Payment Insertion Algorithm
 * 
 * This module implements the algorithm for inserting payment records into 
 * interest calculation tables, following the approach outlined in the
 * insert_pay_example documentation.
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
    // Validate payment data
    if (!validatePayment(payment)) {
        console.error('Invalid payment data:', payment);
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
    console.log(`Inserting payment of ${payment.amount} on ${formatDateForDisplay(paymentDate)} into ${targetTable} table`);
    
    // Create a deep copy of the state to avoid direct mutations
    const newState = JSON.parse(JSON.stringify(state));
    
    // Get the interest table to modify
    const interestTable = targetTable === 'prejudgment' 
        ? newState.results.prejudgmentResult.details
        : newState.results.postjudgmentResult.details;
    
    // Find the calculation row containing the payment date or determine if it falls between rows
    const rowInfo = findCalculationRowForPayment(interestTable, paymentDate);
    const { containingRow, rowIndex, isBetweenRows, isExactStartDate, isExactEndDate } = rowInfo;
    
    if (!containingRow) {
        console.error('Could not find a calculation row for payment date:', paymentDate);
        return state;
    }
    
    // Check if we need to split the row
    let splitRows = [];
    let insertAtIndex = rowIndex;
    
    if (isExactStartDate) {
        console.log(`Payment date is exactly on a row start date - no need to split the row`);
        splitRows = [containingRow];
        // Place payment at this index
        insertAtIndex = rowIndex;
    } else if (isExactEndDate) {
        console.log(`Payment date is exactly on a row end date - no need to split the row`);
        splitRows = [containingRow];
        // Place payment after this row
        insertAtIndex = rowIndex + 1;
    } else {
        // Split the calculation row at the payment date
        console.log(`Splitting row at payment date ${formatDateForDisplay(paymentDate)}`);
        splitRows = splitCalculationRowAtPaymentDate(
            containingRow, 
            paymentDate, 
            state.inputs.jurisdiction, 
            ratesData, 
            targetTable
        );
        
        // Replace the original row with the split rows
        interestTable.splice(rowIndex, 1, ...splitRows);
        
        // Insert payment after the first split segment
        insertAtIndex = rowIndex + 1;
    }
    
    // If we haven't replaced the original row with split rows yet, do it now
    if (!isExactStartDate && !isExactEndDate) {
        // Already done above
    } else {
        interestTable.splice(rowIndex, 1, ...splitRows);
    }
    
    // Calculate interest up to the payment date
    const accumulatedInterest = splitRows[0].interest;
    console.log(`Accumulated interest up to payment date: ${accumulatedInterest}`);
    
    // Apply payment to interest first, then principal
    const interestApplied = Math.min(payment.amount, accumulatedInterest);
    const principalApplied = payment.amount - interestApplied;
    console.log(`Payment of ${formatCurrencyForInput(payment.amount)} applied: ${formatCurrencyForInput(interestApplied)} to interest, ${formatCurrencyForInput(principalApplied)} to principal`);
    
    // Calculate new principal amount
    const originalPrincipal = splitRows[0].principal;
    const newPrincipal = originalPrincipal - principalApplied;
    console.log(`Principal reduced from $${originalPrincipal} to $${newPrincipal}`);
    
    // Create payment record row
    const paymentRow = createPaymentRow(
        paymentDate, 
        payment.amount, 
        interestApplied, 
        principalApplied
    );
    
    // Insert payment row at the appropriate index
    interestTable.splice(insertAtIndex, 0, paymentRow);
    
    // Update principal for all subsequent periods, including the second split segment
    updateSubsequentPeriods(interestTable, rowIndex + 2, newPrincipal);
    
    // Recalculate total interest
    recalculateTotals(newState, targetTable);
    
    // Add the processed payment to the payments list
    const processedPayment = {
        date: paymentDate,
        dateStr: formatDateForDisplay(paymentDate),
        amount: payment.amount,
        interestApplied,
        principalApplied,
        remainingPrincipal: newPrincipal,
        segmentIndex: rowIndex
    };
    
    newState.results.payments = newState.results.payments || [];
    newState.results.payments.push(processedPayment);
    
    return newState;
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
    
    // Check that amount is a number greater than zero
    if (isNaN(payment.amount) || payment.amount <= 0) return false;
    
    // Check that date is valid
    const paymentDate = typeof payment.date === 'string' 
        ? parseDateInput(payment.date) 
        : payment.date;
    
    if (!paymentDate || isNaN(paymentDate.getTime())) return false;
    
    return true;
}

/**
 * Find the calculation row containing the payment date, or determine if it falls between rows.
 * 
 * @param {Array} interestTable - Interest calculation table
 * @param {Date} paymentDate - Payment date
 * @returns {Object} The containing row, its index, and whether it falls between rows,
 *                  and additional details about the exact position
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
            const rowStartStr = formatDateForDisplay(typeof row.start === 'string' ? parseDateInput(row.start) : row.start);
            const rowEndStr = formatDateForDisplay(rowEndDate);
            console.log(`Found row with payment date ${paymentDateStr} as END date: Row starting ${rowStartStr}, ending ${rowEndStr}`);
            
            return { 
                containingRow: row, 
                rowIndex: i, 
                isBetweenRows: false,
                isExactEndDate: true,
                isExactStartDate: false,
                normalizedStartDate: typeof row.start === 'string' ? normalizeDate(parseDateInput(row.start)) : normalizeDate(row.start),
                normalizedEndDate: rowEndDate
            };
        }
    }
    
    // Check if the payment date falls exactly on a row start date
    for (let i = 0; i < interestTable.length; i++) {
        const row = interestTable[i];
        
        // Skip payment rows
        if (row.isPayment) continue;
        
        // Check if payment date falls on row start date
        const rowStartDate = typeof row.start === 'string' 
            ? normalizeDate(parseDateInput(row.start)) 
            : normalizeDate(row.start);
            
        if (datesEqual(normalizedPaymentDate, rowStartDate)) {
            const rowStartStr = formatDateForDisplay(rowStartDate);
            const rowEndStr = formatDateForDisplay(typeof row.end === 'string' ? parseDateInput(row.end) : row.end);
            console.log(`Found row with payment date ${paymentDateStr} as START date: Row starting ${rowStartStr}, ending ${rowEndStr}`);
            
            return { 
                containingRow: row, 
                rowIndex: i, 
                isBetweenRows: false,
                isExactStartDate: true,
                isExactEndDate: false,
                normalizedStartDate: rowStartDate,
                normalizedEndDate: typeof row.end === 'string' ? normalizeDate(parseDateInput(row.end)) : normalizeDate(row.end)
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
        if (normalizedPaymentDate > rowStartDate && normalizedPaymentDate < rowEndDate) {
            const rowStartStr = formatDateForDisplay(rowStartDate);
            const rowEndStr = formatDateForDisplay(rowEndDate);
            console.log(`Found row CONTAINING payment date ${paymentDateStr}: Row starting ${rowStartStr}, ending ${rowEndStr}`);
            
            return { 
                containingRow: row, 
                rowIndex: i, 
                isBetweenRows: false,
                isExactStartDate: false,
                isExactEndDate: false,
                normalizedStartDate: rowStartDate,
                normalizedEndDate: rowEndDate
            };
        }
    }
    
    // Check if payment falls between rows
    for (let i = 0; i < interestTable.length - 1; i++) {
        const currentRow = interestTable[i];
        const nextRow = interestTable[i + 1];
        
        // Skip payment rows
        if (currentRow.isPayment || nextRow.isPayment) continue;
        
        const currentRowEndDate = typeof currentRow.end === 'string' 
            ? normalizeDate(parseDateInput(currentRow.end)) 
            : normalizeDate(currentRow.end);
            
        const nextRowStartDate = typeof nextRow.start === 'string' 
            ? normalizeDate(parseDateInput(nextRow.start)) 
            : normalizeDate(nextRow.start);
            
        // Check if payment date falls between rows
        if (normalizedPaymentDate > currentRowEndDate && normalizedPaymentDate < nextRowStartDate) {
            console.log(`Payment date ${paymentDateStr} falls BETWEEN rows (not contained in any row)`);
            return { 
                containingRow: currentRow, 
                rowIndex: i, 
                isBetweenRows: true,
                nextRow: nextRow,
                nextRowIndex: i + 1,
                normalizedStartDate: currentRowEndDate,
                normalizedEndDate: nextRowStartDate
            };
        }
    }
    
    console.error(`Could not find appropriate row for payment date: ${paymentDateStr}`);
    return { containingRow: null, rowIndex: -1, isBetweenRows: false };
}

/**
 * Split a calculation row at the payment date.
 * 
 * @param {Object} row - Calculation row to split
 * @param {Date} paymentDate - Date of payment
 * @param {string} jurisdiction - Jurisdiction code
 * @param {Object} ratesData - Interest rates data
 * @param {string} interestType - 'prejudgment' or 'postjudgment'
 * @returns {Array} Two rows representing the split periods
 */
function splitCalculationRowAtPaymentDate(row, paymentDate, jurisdiction, ratesData, interestType) {
    // Normalize dates
    const rowStartDate = typeof row.start === 'string' 
        ? parseDateInput(row.start) 
        : row.start;
    
    const rowEndDate = typeof row.end === 'string' 
        ? parseDateInput(row.end) 
        : row.end;
    
    // Normalize payment date and row dates for consistent comparison
    const normalizedPaymentDate = normalizeDate(paymentDate);
    const normalizedRowStartDate = normalizeDate(rowStartDate);
    const normalizedRowEndDate = normalizeDate(rowEndDate);
    
    const paymentDateStr = formatDateForDisplay(paymentDate);
    const rowStartStr = formatDateForDisplay(rowStartDate);
    const rowEndStr = formatDateForDisplay(rowEndDate);
    
    console.log(`Attempting to split row at payment date ${paymentDateStr}: Row period ${rowStartStr} to ${rowEndStr}`);
    
    // If payment is on the start date, no need to split
    if (datesEqual(normalizedPaymentDate, normalizedRowStartDate)) {
        console.log(`Payment date ${paymentDateStr} is exactly on row start date - no splitting needed`);
        return [row];
    }
    
    // If payment is on the end date, no need to split
    if (datesEqual(normalizedPaymentDate, normalizedRowEndDate)) {
        console.log(`Payment date ${paymentDateStr} is exactly on row end date - no splitting needed`);
        return [row];
    }
    
    console.log(`Splitting row at payment date ${paymentDateStr}`);
    
    // First segment: from row start to payment date (inclusive)
    const daysInFirstSegment = daysBetween(rowStartDate, paymentDate);
    const firstSegmentYear = rowStartDate.getUTCFullYear();
    const daysInFirstYear = daysInYear(firstSegmentYear);
    
    // Rate should be the same as the original row
    const rate = row.rate;
    
    // Calculate interest for first segment
    const principal = row.principal;
    const firstSegmentInterest = (principal * (rate / 100) * daysInFirstSegment) / daysInFirstYear;
    
    const firstSegment = {
        start: new Date(rowStartDate),
        end: new Date(paymentDate),
        rate: rate,
        principal: principal,
        interest: firstSegmentInterest,
        isFinalSegment: false,
        isSplitSegment: true,
        _days: daysInFirstSegment,
        _endDate: formatDateForDisplay(paymentDate),
        description: `${daysInFirstSegment} days`
    };
    
    // Second segment: from payment date to row end
    const daysInSecondSegment = daysBetween(paymentDate, rowEndDate);
    const secondSegmentYear = paymentDate.getUTCFullYear();
    const daysInSecondYear = daysInYear(secondSegmentYear);
    
    // Second segment will use the same principal initially, but it will be updated after payment
    const secondSegmentInterest = (principal * (rate / 100) * daysInSecondSegment) / daysInSecondYear;
    
    const secondSegment = {
        start: new Date(paymentDate),
        end: new Date(rowEndDate),
        rate: rate,
        principal: principal, // This will be updated after payment
        interest: secondSegmentInterest, // This will be recalculated after principal update
        isFinalSegment: row.isFinalSegment || false,
        isSplitSegment: true,
        _days: daysInSecondSegment,
        _endDate: formatDateForDisplay(rowEndDate),
        description: `${daysInSecondSegment} days`
    };
    
    // Log the split details
    console.log(`
Original row: ${rowStartStr} to ${rowEndStr} (${row._days || 'unknown'} days)
Split into:
  - ${formatDateForDisplay(firstSegment.start)} to ${formatDateForDisplay(firstSegment.end)} (${firstSegment._days} days)
  - ${formatDateForDisplay(secondSegment.start)} to ${formatDateForDisplay(secondSegment.end)} (${secondSegment._days} days)
`);
    
    return [firstSegment, secondSegment];
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
        description: `Payment received: ${formatCurrencyForInput(amount)}<br>` +
                    `Principal: ${formatCurrencyForInput(-principalApplied)}    ` +
                    `Interest: ${formatCurrencyForInput(-interestApplied)}`,
        principal: -principalApplied,
        interest: -interestApplied,
        isPayment: true,
        paymentAmount: amount,
        interestApplied: interestApplied,
        principalApplied: principalApplied
    };
}

/**
 * Update principal values for all periods after a payment.
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
        
        // Update principal
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
        
        console.log(`Updated row ${i}: ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`);
        console.log(`  Principal: $${oldPrincipal} → $${newPrincipal}`);
        console.log(`  Interest: $${oldInterest.toFixed(2)} → $${row.interest.toFixed(2)}`);
        
        updatedRowCount++;
    }
    
    console.log(`Updated ${updatedRowCount} rows with new principal value.`);
}

/**
 * Recalculate total interest for a table after modifications.
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
