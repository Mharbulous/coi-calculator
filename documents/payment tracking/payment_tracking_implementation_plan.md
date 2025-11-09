# Payment Tracking Implementation Plan

This document outlines the plan for implementing payment tracking functionality in the BC COIA Calculator.

## 1. State Management Updates (store.js)

Add new properties and methods to the Zustand store:

```javascript
// In store.js, add to results object
results: {
  // ... existing properties
  payments: [], // Array of payment objects {date, amount, interestApplied, principalApplied}
  paymentsTotal: 0 // Total amount of all payments
}

// Add new methods
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
})
```

## 2. Payment Modal UI (dom/modal.js)

Create a new modal for payment entry:

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
        showValidationError(dateInput, 'Please enter a valid date (YYYY-MM-DD)');
        return;
      }
      
      if (amount <= 0) {
        showValidationError(amountInput, 'Please enter a payment amount greater than zero');
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
```

## 3. Payment Button UI (dom/elements.js)

Add a "Record Payment" button below the Per Diem row:

```javascript
// In dom/elements.js, add to the elements object
oldRecordPaymentButton: document.createElement('button')

// Then in dom/setup.js, initialize the button
function setupoldRecordPaymentButton() {
  const button = elements.oldRecordPaymentButton;
  button.textContent = 'Record Payment';
  button.className = 'record-payment-btn action-button';
  
  // Insert after perDiemRow
  const perDiemRow = document.querySelector('.per-diem-row');
  if (perDiemRow) {
    perDiemRow.parentNode.insertBefore(button, perDiemRow.nextSibling);
  }
  
  // Add click event
  button.addEventListener('click', async function(event) {
    event.preventDefault();
    
    // Get current date as default
    const today = new Date();
    const formattedDate = formatDateForDisplay(today);
    
    // Show payment modal
    const result = await showPaymentModal(formattedDate);
    
    if (result.confirmed) {
      // Create payment object
      const payment = {
        date: result.date,
        amount: result.amount,
        // These will be calculated during interest calculation
        interestApplied: 0,
        principalApplied: 0
      };
      
      // Add payment to store
      useStore.getState().addPayment(payment);
      
      // Trigger recalculation
      const recalcEvent = new CustomEvent('payment-recorded');
      document.dispatchEvent(recalcEvent);
    }
  });
}
```

## 4. Payment Processing (calculations.js)

Add payment processing to the interest calculation logic:

```javascript
/**
 * Processes payments and applies them to interest and principal
 * @param {Array<object>} payments - Array of payment objects
 * @param {Array<object>} interestDetails - Interest calculation details up to payment date
 * @param {number} currentPrincipal - Current principal amount
 * @returns {object} Updated principal and processed payments
 */
function processPayments(payments, interestDetails, currentPrincipal) {
  let updatedPrincipal = currentPrincipal;
  let outstandingInterest = interestDetails.reduce((sum, detail) => sum + detail.interest, 0);
  
  // Process each payment
  const processedPayments = payments.map(payment => {
    const paymentAmount = payment.amount;
    let interestApplied = 0;
    let principalApplied = 0;
    
    // First apply to interest
    if (outstandingInterest > 0) {
      interestApplied = Math.min(paymentAmount, outstandingInterest);
      outstandingInterest -= interestApplied;
    }
    
    // Then apply to principal
    principalApplied = paymentAmount - interestApplied;
    updatedPrincipal -= principalApplied;
    
    // Return updated payment object
    return {
      ...payment,
      interestApplied,
      principalApplied,
      remainingPrincipal: updatedPrincipal
    };
  });
  
  return {
    updatedPrincipal,
    processedPayments
  };
}
```

## 5. Table Rendering (dom/tables.interest.js)

Update the interest table rendering to include payment rows:

```javascript
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
  
  return 3; // Return the number of rows inserted
}
```

## 6. CSS Styling (styles/components/payment-tracking.css)

Add CSS for payment-related UI elements:

```css
/* Payment button */
.record-payment-btn {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

/* Payment rows in tables */
.payment-row {
  background-color: #f8f9fa;
  font-weight: bold;
}

.payment-description {
  color: #0056b3;
}

.payment-amount {
  color: #dc3545;
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
```

## 7. Implementation Steps

1. Update `store.js` with payment tracking state and methods
2. Create payment modal functionality in `modal.js`
3. Add "Record Payment" button to UI
4. Update calculation logic to process payments
5. Extend interest table rendering to display payment rows
6. Add CSS styling for payment UI components
7. Implement event listeners for payment-related events

## 8. Event Flow

1. User clicks "Record Payment" button
2. Payment modal opens
3. User enters payment date and amount
4. On confirm, payment is added to store
5. Payment-recorded event triggers recalculation
6. Interest calculations are updated with payments applied
7. Tables are re-rendered with payment details

## 9. Testing Plan

1. Test adding payments with various dates and amounts
2. Verify payments are applied correctly (interest first, then principal)
3. Test multiple payments and ensure calculations are correct
4. Test edge cases (payment greater than total owed, payment on first/last day)
5. Verify UI displays payment information clearly
