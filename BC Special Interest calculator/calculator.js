import { calculateSpecialDamagesInterest } from './specialCalc.js';
import { defaultCauseOfActionDate, defaultJudgmentDate, defaultDamages } from './defaultValues.js';

// --- DOM Elements ---
const causeOfActionDateInput = document.querySelector('[data-input="causeOfActionDate"]');
const judgmentDateInput = document.querySelector('[data-input="judgmentDate"]');
const jurisdictionSelect = document.querySelector('[data-input="jurisdictionSelect"]');
const fileNoInput = document.querySelector('[data-input="fileNo"]'); // Although not used in calc, keep for UI consistency
const registryInput = document.querySelector('[data-input="registry"]'); // Although not used in calc, keep for UI consistency

const damagesTbody = document.querySelector('[data-display="specialDamagesTbody"]');
const addRowBtn = document.getElementById('addRowBtn');
const calculateBtn = document.getElementById('calculateBtn');
const calculationOutputArea = document.querySelector('[data-display="calculationOutputArea"]');

const summaryTotalSpecialsEl = document.querySelector('[data-display="summaryTotalSpecials"]');
const summaryInterestOnSpecialsEl = document.querySelector('[data-display="summaryInterestOnSpecials"]');
const summaryTotalEl = document.querySelector('[data-display="summaryTotal"]');

// Recurring Damages Modal Elements
const addRecurringRowBtn = document.getElementById('addRecurringRowBtn');
const recurringDamageModal = document.getElementById('recurringDamageModal');
const recurringStartDateInput = document.getElementById('recurringStartDate');
const recurringEndDateInput = document.getElementById('recurringEndDate');
const recurringFrequencySelect = document.getElementById('recurringFrequency');
const recurringAmountInput = document.getElementById('recurringAmount');
const cancelRecurringBtn = document.getElementById('cancelRecurringBtn');
const addRecurringConfirmBtn = document.getElementById('addRecurringConfirmBtn');
const closeModalBtn = recurringDamageModal.querySelector('.close-btn');

// Recurring Rules Display Area
const recurringRulesDisplayArea = document.getElementById('recurringRulesDisplay');

// --- State ---
let recurringRulesList = []; // Array to store recurring rule objects {id, startDate, endDate, frequency, amount}

// --- Utility Functions ---

// Format number as currency string (e.g., $ 1,234.56)
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    // Basic formatting, consider a more robust library for complex needs
    return `$ ${amount.toFixed(2)}`;
}

// Generate a simple unique ID for rules
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// --- Event Listeners ---

addRowBtn.addEventListener('click', addDamageRow);
calculateBtn.addEventListener('click', handleCalculation);
// Add event listener to handle removing rows dynamically
damagesTbody.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-row-btn')) {
        removeDamageRow(event.target);
    }
});

// Recurring Damages Modal Listeners
addRecurringRowBtn.addEventListener('click', openRecurringModal);
closeModalBtn.addEventListener('click', closeRecurringModal);
cancelRecurringBtn.addEventListener('click', closeRecurringModal);
addRecurringConfirmBtn.addEventListener('click', handleAddRecurringRule);

// Add input listeners to modal fields for validation
recurringStartDateInput.addEventListener('input', validateRecurringInputs);
recurringEndDateInput.addEventListener('input', validateRecurringInputs);
recurringFrequencySelect.addEventListener('change', validateRecurringInputs);
recurringAmountInput.addEventListener('input', validateRecurringInputs);

// Listener for removing recurring rules (using event delegation)
recurringRulesDisplayArea.addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-rule-btn')) {
        const ruleId = event.target.dataset.ruleId;
        removeRecurringRule(ruleId);
    }
});


// Add event listener for Tab key navigation enhancements for single damages table
damagesTbody.addEventListener('keydown', (event) => {
    const target = event.target;
    const key = event.key;

    // Case 1: Tab from Amount field adds a new row and focuses its Date field
    if (target.matches('input[name="damageAmount"]') && key === 'Tab') {
        event.preventDefault(); // Prevent default Tab behavior

        addDamageRow(); // Add a new row

        // Find the newly added row (last row in the tbody)
        const newRow = damagesTbody.lastElementChild;
        if (newRow) {
            // Find the date input in the new row and focus it
            const newDateInput = newRow.querySelector('input[name="damageDate"]');
            if (newDateInput) {
                newDateInput.focus();
            }
        }
    }
    // Case 2: Tab from Date field moves focus to Description field in the same row
    else if (target.matches('input[name="damageDate"]') && key === 'Tab') {
        event.preventDefault(); // Prevent default Tab behavior

        const currentRow = target.closest('tr');
        if (currentRow) {
            const descriptionInput = currentRow.querySelector('input[name="damageDescription"]');
            if (descriptionInput) {
                descriptionInput.focus();
            }
        }
    }
});


// --- DOM Manipulation ---

function createDamageRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="date" name="damageDate"></td>
        <td><input type="text" name="damageDescription"></td>
        <td><input type="number" step="0.01" name="damageAmount"></td>
        <td><button type="button" class="remove-row-btn">Remove</button></td>
    `;
    return row;
}

function addDamageRow() {
    damagesTbody.appendChild(createDamageRow());
}

function removeDamageRow(button) {
    const row = button.closest('tr');
    // Prevent removing the last row if desired, or handle accordingly
    if (damagesTbody.querySelectorAll('tr').length > 1) {
        row.remove();
    } else {
        // Optionally clear the inputs of the last row instead of removing it
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
        // alert("Cannot remove the last row.");
    }
}

// --- Calculation Handling ---

function getDamagesInput() {
    const rows = damagesTbody.querySelectorAll('tr');
    const damages = [];
    rows.forEach(row => {
        const dateInput = row.querySelector('input[name="damageDate"]');
        const descriptionInput = row.querySelector('input[name="damageDescription"]');
        const amountInput = row.querySelector('input[name="damageAmount"]');

        if (dateInput.value && amountInput.value) {
            damages.push({
                date: dateInput.value,
                description: descriptionInput.value || '', // Allow empty description
                amount: parseFloat(amountInput.value) || 0
            });
        }
    });
    return damages.filter(d => d.amount > 0); // Only include rows with a positive amount
}

// --- Recurring Damages Modal Logic ---

function openRecurringModal() {
    recurringDamageModal.style.display = 'block';
    // Optionally clear fields when opening
    // recurringStartDateInput.value = '';
    // recurringEndDateInput.value = '';
    // recurringFrequencySelect.value = 'bi-annually'; // Reset to default
    // recurringAmountInput.value = '';
    validateRecurringInputs(); // Ensure button state is correct on open
}

function closeRecurringModal() {
    recurringDamageModal.style.display = 'none';
}

function validateRecurringInputs() {
    const startDate = recurringStartDateInput.value;
    const endDate = recurringEndDateInput.value;
    const amount = recurringAmountInput.value;

    let isValid = true;

    if (!startDate || !endDate || !amount) {
        isValid = false;
    } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
            isValid = false;
        }
        if (parseFloat(amount) <= 0) {
            isValid = false;
        }
    }

    addRecurringConfirmBtn.disabled = !isValid;
    return isValid;
}

function handleAddRecurringRule() {
    if (!validateRecurringInputs()) {
        alert("Please fill in all fields correctly. End date must be after start date, and amount must be positive.");
        return;
    }

    const newRule = {
        id: generateId(), // Assign a unique ID
        startDate: recurringStartDateInput.value,
        endDate: recurringEndDateInput.value,
        frequency: recurringFrequencySelect.value,
        amount: parseFloat(recurringAmountInput.value),
        // Use frequency and amount for a basic description
        description: `${recurringFrequencySelect.options[recurringFrequencySelect.selectedIndex].text} payment of ${formatCurrency(recurringAmountInput.value)}`
    };

    recurringRulesList.push(newRule);
    displayRecurringRules();
    closeRecurringModal();

    // Clear modal fields after adding
    recurringStartDateInput.value = '';
    recurringEndDateInput.value = '';
    recurringFrequencySelect.value = 'bi-annually'; // Reset to default
    recurringAmountInput.value = '';
    addRecurringConfirmBtn.disabled = true; // Reset button state
}

function displayRecurringRules() {
    recurringRulesDisplayArea.innerHTML = ''; // Clear current display

    if (recurringRulesList.length === 0) {
        recurringRulesDisplayArea.style.display = 'none'; // Hide if empty
        return;
    }

    recurringRulesDisplayArea.style.display = 'block'; // Show if not empty
    const list = document.createElement('ul');

    recurringRulesList.forEach(rule => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="rule-details">
                ${rule.description} from ${rule.startDate} to ${rule.endDate}
            </span>
            <button type="button" class="remove-rule-btn" data-rule-id="${rule.id}">Remove</button>
        `;
        list.appendChild(listItem);
    });

    recurringRulesDisplayArea.appendChild(list);
}

function removeRecurringRule(ruleId) {
    recurringRulesList = recurringRulesList.filter(rule => rule.id !== ruleId);
    displayRecurringRules(); // Update the display
}


// --- Calculation Handling ---

function handleCalculation() {
    // 1. Get Inputs
    const causeOfActionDate = causeOfActionDateInput.value;
    const judgmentDate = judgmentDateInput.value;
    const jurisdiction = jurisdictionSelect.value;
    const singleDamages = getDamagesInput(); // Get only damages from the table

    // 2. Basic Validation
    if (!causeOfActionDate || !judgmentDate) {
        alert("Please enter both Cause of Action Date and Judgment Date.");
        return;
    }
    // Allow calculation even if only recurring rules exist
    if (singleDamages.length === 0 && recurringRulesList.length === 0) {
        alert("Please enter at least one single special damage entry or add a recurring damage rule.");
        return;
    }
     // Validate top-level dates are logical
    if (new Date(judgmentDate) < new Date(causeOfActionDate)) {
        alert("Judgment Date cannot be before Cause of Action Date.");
        return;
    }
    // Validate single damage dates (recurring rule dates validated on entry)
    let invalidSingleDamageDate = false;
    singleDamages.forEach(d => {
        const damageDate = new Date(d.date);
        if (damageDate < new Date(causeOfActionDate) || damageDate > new Date(judgmentDate)) {
            invalidSingleDamageDate = true;
        }
    });
    if (invalidSingleDamageDate) {
         alert("One or more single damage dates fall outside the period between Cause of Action and Judgment Date.");
         return;
    }


    // 3. Perform Calculation - Pass both single damages and recurring rules
    const result = calculateSpecialDamagesInterest(
        causeOfActionDate,
        judgmentDate,
        singleDamages,
        recurringRulesList, // Pass the list of rule objects
        jurisdiction
    );

    // 4. Display Results
    displayCalculationResults(result); // Display function likely doesn't need changes
}

// --- Display Logic ---

function displayCalculationResults(result) {
    calculationOutputArea.innerHTML = ''; // Clear previous results

    if (result.error) {
        calculationOutputArea.innerHTML = `<p class="error-message">Calculation Error: ${result.error}</p>`;
        // Clear summary
        summaryTotalSpecialsEl.textContent = formatCurrency(0);
        summaryInterestOnSpecialsEl.textContent = formatCurrency(0);
        summaryTotalEl.textContent = formatCurrency(0);
        return;
    }

    if (!result || !result.periodData || !result.summary) {
         calculationOutputArea.innerHTML = `<p class="error-message">Calculation failed to produce results.</p>`;
         // Clear summary
         summaryTotalSpecialsEl.textContent = formatCurrency(0);
         summaryInterestOnSpecialsEl.textContent = formatCurrency(0);
         summaryTotalEl.textContent = formatCurrency(0);
         return;
    }


    let runningInterestSubtotal = 0;

    result.periodData.forEach(period => {
        const periodDiv = document.createElement('div');
        periodDiv.classList.add('period-calculation');

        // Period Header (e.g., Period ending June 30, 2019) - Now Bold
        const header = document.createElement('div');
        header.classList.add('period-header');
        header.innerHTML = `<strong>Period ending ${period.periodEndDate}</strong>`; // Wrap in <strong>
        periodDiv.appendChild(header);

        // Period Details (Days, Rate) - Now Regular Font, order reversed
        const details = document.createElement('div');
        details.classList.add('period-details');
        // Order reversed, ensure no bold tags (check CSS too)
        details.textContent = `${period.days} days | Allowed Rate: ${period.rate.toFixed(2)}%`;
        periodDiv.appendChild(details);

        // Period Table
        const table = document.createElement('table');
        table.classList.add('output-table');
        table.innerHTML = `
            <thead>
                <tr><th>Date</th><th>Description</th><th>Amount</th><th>Interest</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>${period.periodStartDate}</td>
                    <td>Starting balance</td>
                    <td class="text-right">${formatCurrency(period.startingBalance)}</td>
                    <td class="text-right">${formatCurrency(period.interestOnBalance)}</td>
                </tr>
                ${period.damagesInPeriod.map(damage => `
                    <tr>
                        <td>${damage.date}</td>
                        <td>${damage.description}</td>
                        <td class="text-right">${formatCurrency(damage.amount)}</td>
                        <td></td> <!-- Placeholder for interest column on damage row -->
                    </tr>
                    ${damage.interestDetail ? `
                    <tr class="interest-detail-row">
                        <td></td> <!-- Empty cell under Date -->
                        <td></td> <!-- Empty cell under Description -->
                        <td>${damage.interestDetail.days} days interest*</td> <!-- Text under Amount, no italics -->
                        <td class="text-right">${formatCurrency(damage.interestDetail.interest)}</td> <!-- Interest under Interest, no italics -->
                    </tr>
                    ` : ''}
                `).join('')}
            </tbody>
            <tfoot>
                <tr class="subtotal">
                    <td colspan="2"><strong>Subtotal</strong></td>
                    <td class="text-right"><strong>${formatCurrency(period.periodEndingBalance)}</strong></td>
                    <td class="text-right"><strong>${formatCurrency(period.cumulativeInterestAtPeriodEnd)}</strong></td>
                </tr>
            </tfoot>
        `;
        periodDiv.appendChild(table);

        calculationOutputArea.appendChild(periodDiv);

        runningInterestSubtotal = period.cumulativeInterestAtPeriodEnd; // Keep track for summary
    });

     // Add footnote for final period interest detail if applicable
     const hasInterestDetail = result.periodData.some(p => p.damagesInPeriod.some(d => d.interestDetail));
     if (hasInterestDetail) {
         const footnote = document.createElement('p');
         footnote.style.fontSize = '0.9em';
         footnote.style.marginTop = '1em';
         footnote.innerHTML = `* Special damages incurred in the six month period in which the order was made accrue interest from the date special damages were incurred to the date of the order. See COIA section 1(3)`;
         calculationOutputArea.appendChild(footnote);
     }


    // Update Summary Table
    summaryTotalSpecialsEl.textContent = formatCurrency(result.summary.totalSpecials);
    summaryInterestOnSpecialsEl.textContent = formatCurrency(result.summary.interestOnSpecials);
    summaryTotalEl.textContent = formatCurrency(result.summary.total);
}

// --- Initial Setup ---

// Note: defaultDamages array is now imported from defaultValues.js

function initializeFormWithDefaults() {
    // Set default dates from imported values
    causeOfActionDateInput.value = defaultCauseOfActionDate;
    judgmentDateInput.value = defaultJudgmentDate;

    // Clear any existing single damage rows
    damagesTbody.innerHTML = '';

    // Clear recurring rules and hide display area
    recurringRulesList = [];
    displayRecurringRules();

    // Populate with default single damages
    if (defaultDamages.length === 0) {
        // If no defaults, add one empty row for single damages
        addDamageRow();
    } else {
        defaultDamages.forEach(damage => {
            const row = createDamageRow();
            row.querySelector('input[name="damageDate"]').value = damage.date;
            row.querySelector('input[name="damageDescription"]').value = damage.description;
            row.querySelector('input[name="damageAmount"]').value = damage.amount.toFixed(2);
            damagesTbody.appendChild(row);
        });
    }

    // Ensure calculation output is cleared on init
    calculationOutputArea.innerHTML = '';
    summaryTotalSpecialsEl.textContent = formatCurrency(0);
    summaryInterestOnSpecialsEl.textContent = formatCurrency(0);
    summaryTotalEl.textContent = formatCurrency(0);
}

// Initialize the form when the script loads
initializeFormWithDefaults();
