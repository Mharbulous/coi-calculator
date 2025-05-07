# Payment Insertion Implementation Proposal

This document provides specific implementation details for refactoring the `payment-insertion.js` file to align with the desired flow in `insert_pay_example.md`.

## Core Algorithm Changes

The primary focus is simplifying the `insertPaymentRecord` function and its supporting methods to follow the more linear approach outlined in the desired flow.

### Proposed `insertPaymentRecord` Implementation

```javascript
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

    // Determine which table to insert the payment into (Desired Flow Step 1)
    const { dateOfJudgment } = state.inputs;
    const judgmentDate = typeof dateOfJudgment === 'string'
        ? parseDateInput(dateOfJudgment)
        : dateOfJudgment;
    
    const targetTable = paymentDate <= judgmentDate ? 'prejudgment' : 'postjudgment';
    console.log(`Inserting payment of ${payment.amount} on ${formatDateForDisplay(paymentDate)} into ${targetTable} table`);
    
    // Create a deep copy of the state to avoid direct mutations
    const newState = JSON.parse(JSON.stringify(state));
    
    // Get the interest table to modify
    const interestTable = targetTable === 'prejudgment' 
        ? newState.results.prejudgmentResult.details
        : newState.results.postjudgmentResult.details;
    
    // SIMPLIFIED: Check if payment date matches an end date (Desired Flow Step 2)
    const matchesEndDate = checkPaymentDateMatchesEndDate(interestTable, paymentDate);
    
    let insertAtIndex;
    let containingRow;
    let firstSegment;
    
    if (matchesEndDate.isMatch) {
        // Payment date matches an end date - no need to split the row
        containingRow = matchesEndDate.row;
        insertAtIndex = matchesEndDate.index + 1;
        firstSegment = containingRow;
    } else {
        // Find the calculation row containing the payment date (Desired Flow Step 3a)
        const rowInfo = findCalculationRowContainingDate(interestTable, paymentDate);
        
        if (!rowInfo.containingRow) {
            console.error('Could not find a calculation row for payment date:', paymentDate);
            return state;
        }
        
        containingRow = rowInfo.containingRow;
        
        // Split the calculation row at the payment date (Desired Flow Step 3b)
        const splitRows = splitCalculationRowAtPaymentDate(
            containingRow, 
            paymentDate, 
            state.inputs.jurisdiction, 
            ratesData, 
            targetTable
        );
        
        // Replace the original row with the split rows
        interestTable.splice(rowInfo.rowIndex, 1, ...splitRows);
        
        // Insert payment after the first split segment
        insertAtIndex = rowInfo.rowIndex + 1;
        firstSegment = splitRows[0];
    }
    
    // Calculate interest up to the payment date (Desired Flow Step 4)
    const accumulatedInterest = firstSegment.interest;
    console.log(`Accumulated interest up to payment date: ${accumulatedInterest}`);
    
    // Apply payment to interest first, then principal (Desired Flow Step 5)
    const interestApplied = Math.min(payment.amount, accumulatedInterest);
    const principalApplied = payment.amount - interestApplied;
    console.log(`Payment of ${formatCurrencyForInput(payment.amount)} applied: ${formatCurrencyForInput(interestApplied)} to interest, ${formatCurrencyForInput(principalApplied)} to principal`);
    
    // Calculate new principal amount
    const originalPrincipal = firstSegment.principal;
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
    
    // Update principal for all subsequent periods (Desired Flow Step 6)
    updateSubsequentPeriods(interestTable, insertAtIndex + 1, newPrincipal);
    
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
        segmentIndex: insertAtIndex - 1
    };
    
    newState.results.payments = newState.results.payments || [];
    newState.results.payments.push(processedPayment);
    
    return newState;
}
```

### New Helper Functions

To support the simplified flow, we'll need two new helper functions:

```javascript
/**
 * Check if payment date matches the end date of any calculation row.
 * 
 * @param {Array} interestTable - Interest calculation table
 * @param {Date} paymentDate - Payment date
 * @returns {Object} Result with isMatch flag, matching row and index
 */
function checkPaymentDateMatchesEndDate(interestTable, paymentDate) {
    const normalizedPaymentDate = normalizeDate(paymentDate);
    
    for (let i = 0; i < interestTable.length; i++) {
        const row = interestTable[i];
        
        // Skip payment rows
        if (row.isPayment) continue;
        
        // Check if payment date matches row end date
        const rowEndDate = typeof row.end === 'string' 
            ? normalizeDate(parseDateInput(row.end)) 
            : normalizeDate(row.end);
        
        if (datesEqual(normalizedPaymentDate, rowEndDate)) {
            return { 
                isMatch: true, 
                row: row, 
                index: i 
            };
        }
    }
    
    return { isMatch: false };
}

/**
 * Find the calculation row containing the payment date.
 * 
 * @param {Array} interestTable - Interest calculation table
 * @param {Date} paymentDate - Payment date
 * @returns {Object} The containing row and its index
 */
function findCalculationRowContainingDate(interestTable, paymentDate) {
    const normalizedPaymentDate = normalizeDate(paymentDate);
    
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
            return { 
                containingRow: row, 
                rowIndex: i 
            };
        }
    }
    
    return { containingRow: null, rowIndex: -1 };
}
```

### Modified `updateSubsequentPeriods` Function

```javascript
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
        
        // Update principal (allow negative values for refund cases)
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
        
        // Calculate interest based on principal (handle negative principal)
        // If principal is negative, interest should be zero or potentially negative
        // depending on business requirements
        row.interest = (newPrincipal > 0) 
            ? (newPrincipal * (row.rate / 100) * days) / daysInThisYear 
            : 0; // Zero interest on negative principal
        
        console.log(`Updated row ${i}: ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`);
        console.log(`  Principal: $${oldPrincipal} → $${newPrincipal}`);
        console.log(`  Interest: $${oldInterest.toFixed(2)} → $${row.interest.toFixed(2)}`);
        
        updatedRowCount++;
    }
    
    console.log(`Updated ${updatedRowCount} rows with new principal value.`);
}
```

## Changes to Supporting Functions

### Simplified `splitCalculationRowAtPaymentDate`

```javascript
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
    
    // First segment: from row start to payment date (exclusive)
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
    
    return [firstSegment, secondSegment];
}
```

## Testing Considerations

The implementation should be tested with the following scenarios:

1. **Exact End Date Scenario**:
   - Test that a payment on the exact end date of a row is handled correctly
   - Verify that the row is not split in this case

2. **Mid-Period Scenario**:
   - Test that a payment in the middle of a period splits the row correctly
   - Verify that the interest calculations are correct for both segments

3. **Principal Updates**:
   - Test that the principal is updated correctly for all subsequent periods
   - Verify handling of potential negative principal values

4. **Integration with UI**:
   - Test that the payment rows are displayed correctly in the UI
   - Verify that the payment information is correctly saved and restored

This implementation proposal focuses on simplifying the algorithm while maintaining the core functionality, aligning with the desired flow in `insert_pay_example.md`.
