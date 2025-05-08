# Payment Tracking Code Examples

This document provides implementation examples for key components of the payment tracking feature.

## 1. Store Updates (store.js)

```javascript
// Add to the existing store.js file

// In the initial state, add payments tracking
results: {
  // ... existing properties
  payments: [],
  paymentsTotal: 0
},

// Add new methods for payment management
addPayment: (payment) => set((state) => {
  const payments = [...state.results.payments, payment];
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    results: {
      ...state.results,
      payments,
      paymentsTotal
    }
  };
}),

updatePayment: (index, payment) => set((state) => {
  const payments = [...state.results.payments];
  payments[index] = payment;
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    results: {
      ...state.results,
      payments,
      paymentsTotal
    }
  };
}),

removePayment: (index) => set((state) => {
  const payments = [...state.results.payments];
  payments.splice(index, 1);
  const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    results: {
      ...state.results,
      payments,
      paymentsTotal
    }
  };
}),

// Add to resetStore() method
resetStore: (useDefaults = false) => {
  // ... existing code
  return set({
    // ... existing reset properties
    results: {
      // ... existing results reset
      payments: [],
      paymentsTotal: 0
    }
  });
}
```

## 2. Payment Processing in Calculations (calculations.js)

```javascript
/**
 * Process payments and apply them to interest and principal
 * @param {Array} payments - Array of payment objects
 * @param {Date} startDate - Period start date
 * @param {Date} endDate - Period end date
 * @param {Array} interestDetails - Interest calculation details
 * @param {number} currentPrincipal - Current principal amount
 * @returns {Object} Object containing updated calculations
 */
export function processPaymentsForPeriod(payments, startDate, endDate, interestDetails, currentPrincipal) {
  // Filter payments for this period
  const periodPayments = payments.filter(payment => {
    const paymentDate = parseDateInput(payment.date);
    return paymentDate >= startDate && paymentDate <= endDate;
  }).sort((a, b) => {
    // Sort by date
    const dateA = parseDateInput(a.date);
    const dateB = parseDateInput(b.date);
    return dateA - dateB;
  });
  
  if (periodPayments.length === 0) {
    // No payments in this period, return unchanged values
    return {
      processedPayments: [],
      interestDetails,
      updatedPrincipal: currentPrincipal
    };
  }
  
  // Track interest and principal as we go
  let runningPrincipal = currentPrincipal;
  let accumulatedInterest = 0;
  const updatedInterestDetails = [];
  const processedPayments = [];
  
  // Create a timeline of all dates to process
  const timeline = [
    { date: startDate, type: 'period_start' },
    ...interestDetails.map(detail => ({
      date: parseDateInput(detail.start),
      type: 'interest_date',
      detail
    })),
    ...periodPayments.map(payment => ({
      date: parseDateInput(payment.date),
      type: 'payment_date',
      payment
    })),
    { date: endDate, type: 'period_end' }
  ].sort((a, b) => a.date - b.date);
  
  // Process the timeline events in order
  let lastDate = startDate;
  
  for (let i = 0; i < timeline.length; i++) {
    const event = timeline[i];
    
    // Skip the first event (period_start)
    if (i === 0 && event.type === 'period_start') continue;
    
    if (event.type === 'interest_date') {
      // Regular interest calculation date
      updatedInterestDetails.push(event.detail);
      accumulatedInterest += event.detail.interest;
      lastDate = event.date;
    } else if (event.type === 'payment_date') {
      // Payment date - need to calculate interest up to this point
      const payment = event.payment;
      const paymentDate = event.date;
      
      // Calculate interest from last date to payment date if needed
      if (lastDate < paymentDate) {
        // We need to calculate interest for this sub-period
        const subPeriodDays = daysBetween(lastDate, paymentDate);
        const currentYear = paymentDate.getUTCFullYear();
        const daysInCurrentYear = daysInYear(currentYear);
        
        // Find the applicable interest rate
        const rate = getInterestRateForDate(paymentDate, 'prejudgment', 'BC', ratesData);
        
        // Calculate interest for this sub-period
        const subPeriodInterest = (runningPrincipal * (rate / 100) * subPeriodDays) / daysInCurrentYear;
        
        // Add to accumulated interest
        accumulatedInterest += subPeriodInterest;
        
        // Add a detail record for this sub-period
        const interestDetail = {
          start: formatDateForDisplay(lastDate),
          description: `${subPeriodDays} days (to payment)`,
          rate,
          principal: runningPrincipal,
          interest: subPeriodInterest,
          _days: subPeriodDays
        };
        
        updatedInterestDetails.push(interestDetail);
      }
      
      // Process the payment
      const paymentAmount = payment.amount;
      let interestApplied = 0;
      let principalApplied = 0;
      
      // First apply to interest
      if (accumulatedInterest > 0) {
        interestApplied = Math.min(paymentAmount, accumulatedInterest);
        accumulatedInterest -= interestApplied;
      }
      
      // Then apply remainder to principal
      principalApplied = paymentAmount - interestApplied;
      runningPrincipal -= principalApplied;
      
      // Create processed payment record
      const processedPayment = {
        ...payment,
        date: formatDateForDisplay(paymentDate),
        interestApplied,
        principalApplied,
        remainingPrincipal: runningPrincipal
      };
      
      processedPayments.push(processedPayment);
      
      // Update last date processed
      lastDate = paymentDate;
    }
  }
  
  return {
    processedPayments,
    interestDetails: updatedInterestDetails,
    updatedPrincipal: runningPrincipal
  };
}

// Modify the calculateInterestPeriods function to incorporate payments
export function calculateInterestPeriods(state, interestType, startDate, endDate, initialPrincipal, ratesData) {
  // ... existing code
  
  // Check for payments
  const hasPayments = state.results.payments && state.results.payments.length > 0;
  
  // If no payments, use the existing logic
  if (!hasPayments) {
    // ... existing non-payment calculation code
  } else {
    // Process payments and calculate interest with them
    const { processedPayments, interestDetails, updatedPrincipal } = 
      processPaymentsForPeriod(
        state.results.payments,
        startDate, 
        endDate, 
        segmentResults.details, 
        initialPrincipal
      );
    
    // Update the segment results with the processed interest details
    segmentResults.details = interestDetails;
    segmentResults.totalInterest = interestDetails.reduce((sum, detail) => sum + detail.interest, 0);
    
    // Add payment information to the final result
    const finalResult = compileResults(
      segmentResults, 
      damageResults, 
      initialPrincipal, 
      processedDamages, 
      endDate,
      interestType
    );
    
    // Include processed payments in the result
    finalResult.processedPayments = processedPayments;
    finalResult.principal = updatedPrincipal; // Update to final principal after payments
    
    return finalResult;
  }
}
```

## 3. Table Rendering Updates (tables.interest.js)

```javascript
/**
 * Updates an interest table with payment rows.
 * @param {HTMLTableSectionElement} tableBody - The table body.
 * @param {Array} processedPayments - Array of processed payment objects.
 * @param {Function} rowInsertCallback - Callback when rows are inserted.
 */
function insertPaymentRows(tableBody, processedPayments, rowInsertCallback) {
  if (!processedPayments || processedPayments.length === 0) return;
  
  let totalRowsInserted = 0;
  
  // Process each payment in the array
  processedPayments.forEach(payment => {
    // Find where to insert this payment row
    const paymentDate = parseDateInput(payment.date);
    let insertIndex = -1; // -1 means append to end
    
    // Find the correct position based on date
    for (let i = 0; i < tableBody.rows.length; i++) {
      const currentRow = tableBody.rows[i];
      const dateCell = currentRow.cells[0];
      const dateText = dateCell.textContent.trim();
      const rowDate = parseDateInput(dateText);
      
      // Skip rows that don't have valid dates
      if (!rowDate) continue;
      
      // If payment date is on or before this row's date
      if (paymentDate <= rowDate) {
        insertIndex = i;
        break;
      }
    }
    
    // Insert the payment row and its details
    const rowsInserted = insertPaymentRow(tableBody, insertIndex, payment);
    totalRowsInserted += rowsInserted;
    
    // Call the callback if provided
    if (rowInsertCallback) {
      rowInsertCallback(insertIndex, rowsInserted);
    }
  });
  
  return totalRowsInserted;
}

/**
 * Creates and inserts a payment row in the table
 * @param {HTMLTableSectionElement} tableBody - The table body
 * @param {number} rowIndex - The index to insert the row
 * @param {object} payment - The payment object
 */
function insertPaymentRow(tableBody, rowIndex, payment) {
  // Main payment row
  const paymentRow = tableBody.insertRow(rowIndex);
  paymentRow.className = 'payment-row breakable';
  
  // Date cell
  const dateCell = paymentRow.insertCell();
  dateCell.textContent = payment.date;
  dateCell.classList.add('text-left');
  
  // Description cell
  const descCell = paymentRow.insertCell();
  descCell.textContent = `Payment received (${formatCurrencyForDisplay(payment.amount)})`;
  descCell.classList.add('text-left', 'payment-description');
  
  // Rate cell (empty)
  paymentRow.insertCell().textContent = '';
  
  // Principal cell (empty)
  paymentRow.insertCell().textContent = '';
  
  // Interest cell (empty)
  paymentRow.insertCell().textContent = '';
  
  // Add sub-rows for interest and principal application
  
  // Interest application sub-row
  const interestRow = tableBody.insertRow(rowIndex + 1);
  interestRow.className = 'payment-detail-row';
  
  // Empty date cell
  interestRow.insertCell().textContent = '';
  
  // Description cell
  const interestDescCell = interestRow.insertCell();
  interestDescCell.textContent = '└─ Applied to interest';
  interestDescCell.classList.add('text-left', 'payment-detail-description');
  
  // Empty rate cell
  interestRow.insertCell().textContent = '';
  
  // Empty principal cell
  interestRow.insertCell().textContent = '';
  
  // Interest cell
  const interestAmountCell = interestRow.insertCell();
  interestAmountCell.innerHTML = formatCurrencyForDisplay(-payment.interestApplied);
  interestAmountCell.classList.add('text-right', 'payment-detail-amount');
  
  // Principal application sub-row
  const principalApplicationRow = tableBody.insertRow(rowIndex + 2);
  principalApplicationRow.className = 'payment-detail-row';
  
  // Empty date cell
  principalApplicationRow.insertCell().textContent = '';
  
  // Description cell
  const principalDescCell = principalApplicationRow.insertCell();
  principalDescCell.textContent = '└─ Applied to principal';
  principalDescCell.classList.add('text-left', 'payment-detail-description');
  
  // Empty rate cell
  principalApplicationRow.insertCell().textContent = '';
  
  // Principal cell
  const principalAppCell = principalApplicationRow.insertCell();
  principalAppCell.innerHTML = formatCurrencyForDisplay(-payment.principalApplied);
  principalAppCell.classList.add('text-right', 'payment-detail-amount');
  
  // Empty interest cell
  principalApplicationRow.insertCell().textContent = '';
  
  return 3; // Return the number of rows inserted (3 instead of 4 since we removed the remaining principal row)
}

// Modify the updateInterestTable function to include payment rows
export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter) {
  // ... existing code
  
  // After populating regular rows and special damages rows, add payment rows
  if (resultState.processedPayments && resultState.processedPayments.length > 0) {
    insertPaymentRows(tableBody, resultState.processedPayments, (insertIndex, rowsInserted) => {
      // This callback can be used to update any indices that need adjustment
      // after inserting payment rows
    });
  }
  
  // ... rest of existing code
}
```

## 4. Payment Modal Implementation (modal.js)

```javascript
/**
 * Shows a modal for recording a payment
 * @param {string} defaultDate - Default date to pre-populate (YYYY-MM-DD format)
 * @returns {Promise<{confirmed: boolean, date: string, amount: number}>} 
 */
export function showPaymentModal(defaultDate) {
  return new Promise((resolve) => {
    // Create modal structure
    const modal = document.createElement('div');
    modal.className = 'modal payment-modal';
    
    // Create modal content
    const modalContent = `
      <div class="modal-content">
        <h2>Record Payment</h2>
        <div class="input-group">
          <label for="payment-date">Payment Date:</label>
          <input type="text" id="payment-date" class="payment-date custom-date-input" placeholder="YYYY-MM-DD" value="${defaultDate || ''}">
        </div>
        <div class="input-group">
          <label for="payment-amount">Payment Amount:</label>
          <input type="text" id="payment-amount" class="payment-amount" placeholder="0.00">
        </div>
        <div class="button-group">
          <button id="cancel-payment" class="cancel-button">Cancel</button>
          <button id="confirm-payment" class="action-button">Record Payment</button>
        </div>
      </div>
    `;
    
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Initialize datepicker for payment date
    const dateInput = modal.querySelector('.payment-date');
    initializePaymentDatePicker(dateInput);
    
    // Initialize currency input for payment amount
    const amountInput = modal.querySelector('.payment-amount');
    setupCurrencyInputListeners(amountInput);
    
    // Set focus to amount input
    setTimeout(() => amountInput.focus(), 100);
    
    // Handle cancel button
    const cancelButton = modal.querySelector('#cancel-payment');
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve({ confirmed: false });
    });
    
    // Handle confirm button
    const confirmButton = modal.querySelector('#confirm-payment');
    confirmButton.addEventListener('click', () => {
      const date = dateInput.value;
      const amount = parseCurrency(amountInput.value);
      
      // Validate inputs
      if (!validateDateFormat(date)) {
        // Show validation error for date
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = 'Please enter a valid date (YYYY-MM-DD)';
        
        // Insert error after the input
        dateInput.parentNode.insertBefore(errorElement, dateInput.nextSibling);
        
        // Highlight the input
        dateInput.classList.add('error');
        
        // Focus on the input
        dateInput.focus();
        
        // Remove error after a delay or when input changes
        setTimeout(() => {
          errorElement.remove();
          dateInput.classList.remove('error');
        }, 3000);
        
        return;
      }
      
      if (amount <= 0) {
        // Show validation error for amount
        const errorElement = document.createElement('div');
        errorElement.className = 'validation-error';
        errorElement.textContent = 'Please enter a payment amount greater than zero';
        
        // Insert error after the input
        amountInput.parentNode.insertBefore(errorElement, amountInput.nextSibling);
        
        // Highlight the input
        amountInput.classList.add('error');
        
        // Focus on the input
        amountInput.focus();
        
        // Remove error after a delay or when input changes
        setTimeout(() => {
          errorElement.remove();
          amountInput.classList.remove('error');
        }, 3000);
        
        return;
      }
      
      document.body.removeChild(modal);
      resolve({ confirmed: true, date, amount });
    });
    
    // Show the modal
    setTimeout(() => {
      modal.classList.add('show');
    }, 50);
  });
}

/**
 * Initializes a date picker for payment dates
 * @param {HTMLInputElement} inputElement - The date input element
 */
function initializePaymentDatePicker(inputElement) {
  if (!inputElement) return;
  
  // Get current state for date validation
  const state = useStore.getState();
  const prejudgmentStartDate = state.inputs.prejudgmentStartDate;
  const judgmentDate = state.inputs.dateOfJudgment;
  const postjudgmentEndDate = state.inputs.postjudgmentEndDate;
  
  // Configure flatpickr
  const config = {
    dateFormat: 'Y-m-d',
    allowInput: true,
    
    // Set min/max dates based on the calculation period
    minDate: prejudgmentStartDate || undefined,
    maxDate: postjudgmentEndDate || undefined,
    
    // Handle invalid dates
    onInvalid: function(date, message) {
      // Show validation error message
      const errorElement = document.createElement('div');
      errorElement.className = 'validation-error';
      errorElement.textContent = message || 'Invalid date';
      
      // Insert error after the input
      inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
      
      // Remove error after a delay
      setTimeout(() => {
        errorElement.remove();
      }, 3000);
    }
  };
  
  // Initialize flatpickr
  return flatpickr(inputElement, config);
}
```

## 5. Payment Button Setup (setup.js)

```javascript
/**
 * Sets up the Record Payment button functionality
 */
export function setupoldRecordPaymentButton() {
  const button = elements.oldRecordPaymentButton;
  if (!button) return;
  
  button.textContent = 'Record Payment';
  button.className = 'record-payment-btn action-button';
  
  // Insert after per diem row
  const perDiemRow = document.querySelector('.per-diem-row');
  if (perDiemRow && perDiemRow.parentNode) {
    perDiemRow.parentNode.insertBefore(button, perDiemRow.nextSibling);
  }
  
  // Add click event handler
  button.addEventListener('click', async function(event) {
    event.preventDefault();
    
    // Get current date for default value
    const today = new Date();
    const formattedDate = formatDateForDisplay(today);
    
    // Show payment modal
    const result = await showPaymentModal(formattedDate);
    
    if (result.confirmed) {
      // Create payment object
      const payment = {
        date: result.date,
        amount: result.amount,
        // These fields will be calculated during interest calculation
        interestApplied: 0,
        principalApplied: 0
      };
      
      // Add payment to store
      useStore.getState().addPayment(payment);
      
      // Trigger recalculation
      const event = new CustomEvent('payment-recorded');
      document.dispatchEvent(event);
    }
  });
}

// Add this to the main setup function
export function setupDomElements() {
  // ... existing setup code
  
  // Setup the Record Payment button
  setupoldRecordPaymentButton();
  
  // Add event listener for payment-recorded events
  document.addEventListener('payment-recorded', () => {
    // Recalculate and update the UI
    calculateAndDisplay();
  });
}
```

## 6. CSS Styling (styles/components/payment-tracking.css)

```css
/* Payment button styling */
.record-payment-btn {
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.record-payment-btn:hover {
  background-color: #0069d9;
}

.record-payment-btn:active {
  background-color: #0062cc;
}

/* Payment rows in tables */
.payment-row {
  background-color: #f8f9fa;
}

.payment-description {
  color: #0056b3;
}

.payment-detail-row {
  background-color: #f8f9fa;
  font-size: 0.9em;
}

.payment-detail-description {
  padding-left: 1.5rem;
  color: #6c757d;
}

.payment-detail-amount {
  color: #6c757d;
}

/* Payment modal */
.payment-modal .modal-content {
  max-width: 400px;
}

.payment-modal .input-group {
  margin-bottom: 1rem;
}

.payment-modal label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.payment-modal input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.payment-modal .button-group {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.payment-modal .cancel-button {
  background-color: #ffc107;
  color: #212529;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

.payment-modal .action-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
}

/* Validation errors */
.validation-error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

input.error {
  border-color: #dc3545;
}
```

## 7. Main.CSS Import Update

```css
/* In main.css, add import for payment-tracking.css */
@import 'components/payment-tracking.css';
