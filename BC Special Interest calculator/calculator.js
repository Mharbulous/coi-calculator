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

// New Recurring Damages Table Elements
const recurringDamagesTbody = document.querySelector('[data-display="recurringDamagesTbody"]');
const addRecurringTableRowBtn = document.getElementById('addRecurringTableRowBtn');


// --- Utility Functions ---

// Format number as display currency string (e.g., $1,234.56) - Used for output display
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Using USD for $, CAD would show CA$
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return currencyFormatter.format(amount);
}

// Format the value of an input field as currency on blur
function formatInputAsCurrency(inputElement) {
    let value = inputElement.value;
    // Remove existing formatting ($, commas) before parsing
    value = value.replace(/[$,]/g, '');
    const numberValue = parseFloat(value);

    if (!isNaN(numberValue)) {
        inputElement.value = currencyFormatter.format(numberValue);
    } else {
        // Handle cases where input is not a valid number (e.g., clear it or set to $0.00)
        inputElement.value = currencyFormatter.format(0);
    }
}

// Parse a formatted currency string from an input back to a number
function parseCurrencyInput(value) {
    if (!value) return 0;
    // Remove currency symbols and commas
    const cleanedValue = value.replace(/[$,]/g, '');
    return parseFloat(cleanedValue) || 0;
}


// Generate a simple unique ID for rules
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// --- Event Listeners ---

addRowBtn.addEventListener('click', addDamageRow);
calculateBtn.addEventListener('click', handleCalculation);

// Add event listener for clicks within the single damages table body
damagesTbody.addEventListener('click', (event) => {
    // Handle removing rows via the delete icon
    if (event.target.classList.contains('delete-icon')) {
        removeDamageRow(event.target);
    }
    // Handle clicking the date icon to trigger the date picker
    else if (event.target.classList.contains('date-icon')) {
        const dateCell = event.target.closest('.date-cell');
        if (dateCell) {
            const dateInput = dateCell.querySelector('input[name="damageDate"]');
            if (dateInput) {
                try {
                    dateInput.showPicker();
                } catch (error) {
                    console.warn("Browser doesn't support showPicker(), falling back to click().", error);
                    // Fallback for browsers that don't support showPicker()
                    dateInput.click();
                }
            }
        }
    }
});

// Add blur listener for currency formatting on single damages amount
damagesTbody.addEventListener('blur', (event) => {
    // Target the input within the editable span
    if (event.target.matches('.editable > input[name="damageAmount"]')) {
        formatInputAsCurrency(event.target);
    }
}, true); // Use capture phase to format before other potential blur listeners


// New Recurring Damages Table Listeners
addRecurringTableRowBtn.addEventListener('click', addRecurringTableRow);
// Add event listener to handle removing recurring rows dynamically via delete icon
recurringDamagesTbody.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-icon')) { // Target the delete icon
        removeRecurringTableRow(event.target); // Pass the icon element
    }
});

// Add blur listener for currency formatting on recurring damages amount
recurringDamagesTbody.addEventListener('blur', (event) => {
    if (event.target.matches('input[name="recurringAmount"]')) {
        formatInputAsCurrency(event.target);
    }
}, true); // Use capture phase

// Event listener for frequency dropdown changes using event delegation
recurringDamagesTbody.addEventListener('change', (event) => {
    if (event.target && event.target.matches('select[name="recurringFrequency"]')) {
        const dropdown = event.target;
        console.log(`Frequency dropdown width: ${dropdown.offsetWidth}px`);
    }
});


// Add event listener for Tab key navigation enhancements for single damages table
damagesTbody.addEventListener('keydown', (event) => {
    const target = event.target;
    const key = event.key;

    // Case 1: Tab from Amount field - behavior depends on whether it's the last row
    if (target.matches('.editable > input[name="damageAmount"]') && key === 'Tab' && !event.shiftKey) {
        event.preventDefault(); // Prevent default Tab behavior

        // Get the current row and check if it's the last row
        const currentRow = target.closest('tr');
        const isLastRow = currentRow === damagesTbody.lastElementChild;

        if (isLastRow) {
            // If it's the last row, add a new row
            addDamageRow();

            // Find the newly added row (last row in the tbody)
            const newRow = damagesTbody.lastElementChild;
            if (newRow) {
                // Find the date input in the new row and focus it
                const newDateInput = newRow.querySelector('.editable > input[name="damageDate"]');
                if (newDateInput) {
                    newDateInput.focus();
                }
            }
        } else {
            // If it's not the last row, focus the date field in the next row
            const nextRow = currentRow.nextElementSibling;
            if (nextRow) {
                const nextDateInput = nextRow.querySelector('.editable > input[name="damageDate"]');
                if (nextDateInput) {
                    nextDateInput.focus();
                }
            }
        }
    }
    // Case 2: Tab from Date field moves focus to Description field in the same row
    else if (target.matches('.editable > input[name="damageDate"]') && key === 'Tab' && !event.shiftKey) {
        event.preventDefault(); // Prevent default Tab behavior

        const currentRow = target.closest('tr');
        if (currentRow) {
            const descriptionInput = currentRow.querySelector('.editable > input[name="damageDescription"]');
            if (descriptionInput) {
                descriptionInput.focus();
            }
        }
    }
    // Case 3: Tab from Description field moves focus to Amount field in the same row
    else if (target.matches('.editable > input[name="damageDescription"]') && key === 'Tab' && !event.shiftKey) {
        event.preventDefault(); // Prevent default Tab behavior

        const currentRow = target.closest('tr');
        if (currentRow) {
            const amountInput = currentRow.querySelector('.editable > input[name="damageAmount"]');
            if (amountInput) {
                amountInput.focus();
            }
        }
    }
    // Add Shift+Tab handling if needed (optional)
});


// --- DOM Manipulation ---

function createDamageRow() {
    const template = document.getElementById('special-damage-row-template');
    return template.content.cloneNode(true).querySelector('tr');
}

function addDamageRow() {
    const newRow = createDamageRow();
    damagesTbody.appendChild(newRow);
    // Optional: Focus the date input of the newly added row
    const dateInput = newRow.querySelector('.editable > input[name="damageDate"]');
    if (dateInput) {
        // dateInput.focus(); // Focusing might be disruptive, consider if needed
    }
}

function removeDamageRow(deleteIcon) {
    const row = deleteIcon.closest('tr');
    // Prevent removing the last row
    if (damagesTbody.querySelectorAll('tr').length > 1) {
        row.remove();
    } else {
        // Clear the inputs of the last row instead of removing it
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
        // Optionally reset description/amount to default or empty state
        const amountInput = row.querySelector('input[name="damageAmount"]');
        if (amountInput) {
            amountInput.value = formatCurrency(0); // Reset to $0.00
        }
    }
}

// --- Recurring Damages Table Functions ---

function createRecurringDamageRow() {
    const template = document.getElementById('recurring-damage-row-template');
    return template.content.cloneNode(true).querySelector('tr');
}

function addRecurringTableRow() {
    recurringDamagesTbody.appendChild(createRecurringDamageRow());
}

function removeRecurringTableRow(deleteIcon) { // Function now receives the icon
    const row = deleteIcon.closest('tr');
    // Prevent removing the last row
    if (recurringDamagesTbody.querySelectorAll('tr').length > 1) {
        row.remove();
    } else {
        // Optionally clear the inputs of the last row instead of removing it
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'select-one') {
                input.value = 'bi-annually'; // Reset select to default
            } else {
                input.value = '';
            }
        });
    }
}


// --- Calculation Handling ---

function getDamagesInput() {
    const rows = damagesTbody.querySelectorAll('tr');
    const damages = [];
    rows.forEach(row => {
        // Find inputs within the .editable spans
        const dateInput = row.querySelector('.editable > input[name="damageDate"]');
        const descriptionInput = row.querySelector('.editable > input[name="damageDescription"]');
        const amountInput = row.querySelector('.editable > input[name="damageAmount"]');

        // Use parseCurrencyInput to handle formatted values
        const amountValue = parseCurrencyInput(amountInput.value);

        if (dateInput && dateInput.value && amountInput && amountValue > 0) { // Check inputs exist and have valid values
            damages.push({
                date: dateInput.value,
                description: descriptionInput ? descriptionInput.value || '' : '', // Allow empty description
                amount: amountValue
            });
        }
    });
    return damages.filter(d => d.amount > 0); // Only include rows with a positive amount
}

function getRecurringDamagesInput() {
    const rows = recurringDamagesTbody.querySelectorAll('tr');
    const recurringRules = [];
    rows.forEach(row => {
        const startDateInput = row.querySelector('input[name="recurringStartDate"]');
        const endDateInput = row.querySelector('input[name="recurringEndDate"]');
        const frequencySelect = row.querySelector('select[name="recurringFrequency"]');
        const amountInput = row.querySelector('input[name="recurringAmount"]');
        const descriptionInput = row.querySelector('input[name="recurringDescription"]');

        // Use parseCurrencyInput to handle formatted values
        const amountValue = parseCurrencyInput(amountInput.value);

        // Basic validation: require start date, end date, and positive amount
        if (startDateInput.value && endDateInput.value && amountValue > 0) {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            // Additional validation: end date >= start date
            if (new Date(endDate) >= new Date(startDate)) {
                recurringRules.push({
                    startDate: startDate,
                    endDate: endDate,
                    frequency: frequencySelect.value,
                    amount: amountValue, // Use the parsed amount
                    description: descriptionInput.value || '' // Allow empty description
                });
            }
        }
    });
    return recurringRules; // Return rules with valid dates and positive amount
}


// --- Calculation Handling ---

function handleCalculation() {
    // 1. Get Inputs
    const causeOfActionDate = causeOfActionDateInput.value;
    const judgmentDate = judgmentDateInput.value;
    const jurisdiction = jurisdictionSelect.value;
    const singleDamages = getDamagesInput();
    const recurringRules = getRecurringDamagesInput(); // Get recurring rules from the new table

    // 2. Basic Validation
    if (!causeOfActionDate || !judgmentDate) {
        alert("Please enter both Cause of Action Date and Judgment Date.");
        return;
    }
    // Allow calculation even if only recurring rules exist
    if (singleDamages.length === 0 && recurringRules.length === 0) {
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


    // 3. Perform Calculation - Pass both single damages and recurring rules from tables
    const result = calculateSpecialDamagesInterest(
        causeOfActionDate,
        judgmentDate,
        singleDamages,
        recurringRules, // Pass the rules read from the table
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

    // Get templates
    const periodTemplate = document.getElementById('period-calculation-template');
    const carryoverRowTemplate = document.getElementById('period-carryover-row-template');
    const damageRowTemplate = document.getElementById('period-damage-row-template');
    const interestDetailRowTemplate = document.getElementById('period-interest-detail-row-template');

    result.periodData.forEach(period => {
        // Clone the period template
        const periodElement = periodTemplate.content.cloneNode(true);
        
        // Set period header and details
        const periodHeader = periodElement.querySelector('.period-header strong');
        periodHeader.textContent = `Period ending ${period.periodEndDate}`;
        
        const periodDetails = periodElement.querySelector('.period-details');
        periodDetails.textContent = `${period.days} days | Allowed Rate: ${period.rate.toFixed(2)}%`;
        
        // Get the table body to append rows
        const tableBody = periodElement.querySelector('tbody');
        
        // Add carryover row
        const carryoverRow = carryoverRowTemplate.content.cloneNode(true);
        const carryoverCells = carryoverRow.querySelectorAll('td');
        carryoverCells[0].textContent = period.periodStartDate;
        carryoverCells[2].textContent = formatCurrency(period.startingBalance);
        carryoverCells[2].classList.add('text-right');
        carryoverCells[3].textContent = formatCurrency(period.interestOnBalance);
        carryoverCells[3].classList.add('text-right');
        tableBody.appendChild(carryoverRow);
        
        // Add damage rows
        period.damagesInPeriod.forEach(damage => {
            // Add main damage row
            const damageRow = damageRowTemplate.content.cloneNode(true);
            const damageCells = damageRow.querySelectorAll('td');
            damageCells[0].textContent = damage.date;
            
            // Create a container for description and button
            const descriptionContainer = document.createElement('div');
            descriptionContainer.className = 'description-container';
            descriptionContainer.style.display = 'flex';
            descriptionContainer.style.justifyContent = 'space-between';
            descriptionContainer.style.alignItems = 'center';
            
            // Add the description text
            const descriptionText = document.createElement('span');
            descriptionText.textContent = damage.description;
            descriptionContainer.appendChild(descriptionText);
            
            // Add the "add special damages" button only for rows with interest
            if (damage.interestDetail && damage.interestDetail.interest > 0) {
                const addButton = document.createElement('button');
                addButton.textContent = 'add special damages';
                addButton.className = 'add-special-damages-btn';
                addButton.style.backgroundColor = '#4a90e2';
                addButton.style.color = 'white';
                addButton.style.border = 'none';
                addButton.style.borderRadius = '4px';
                addButton.style.padding = '4px 8px';
                addButton.style.fontSize = '0.85em';
                addButton.style.cursor = 'pointer';
                addButton.style.marginLeft = '10px';
                addButton.style.fontWeight = '500';
                addButton.style.transition = 'background-color 0.2s';
                
                // Add hover effect using event listeners
                addButton.addEventListener('mouseover', function() {
                    this.style.backgroundColor = '#3a7bc8';
                });
                addButton.addEventListener('mouseout', function() {
                    this.style.backgroundColor = '#4a90e2';
                });
                
                // Add click event listener (placeholder for now)
                addButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    console.log('Add special damages clicked for:', damage);
                    // Implement the actual functionality here
                });
                
                descriptionContainer.appendChild(addButton);
            }
            
            damageCells[1].appendChild(descriptionContainer);
            damageCells[2].textContent = formatCurrency(damage.amount);
            damageCells[2].classList.add('text-right');
            tableBody.appendChild(damageRow);
            
            // Add interest detail row if applicable
            if (damage.interestDetail) {
                const interestDetailRow = interestDetailRowTemplate.content.cloneNode(true);
                const interestDetailCells = interestDetailRow.querySelectorAll('td');
                interestDetailCells[2].textContent = `${damage.interestDetail.days} days interest*`;
                interestDetailCells[3].textContent = formatCurrency(damage.interestDetail.interest);
                interestDetailCells[3].classList.add('text-right');
                tableBody.appendChild(interestDetailRow);
            }
        });
        
        // Set subtotal values
        const subtotalRow = periodElement.querySelector('tfoot tr.subtotal');
        const subtotalCells = subtotalRow.querySelectorAll('td strong');
        subtotalCells[1].textContent = formatCurrency(period.periodEndingBalance);
        subtotalCells[2].textContent = formatCurrency(period.cumulativeInterestAtPeriodEnd);
        
        // Append the completed period to the output area
        calculationOutputArea.appendChild(periodElement);
        
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
    // Clear any existing recurring damage rows
    recurringDamagesTbody.innerHTML = '';

    // Populate with default single damages
    if (defaultDamages.length === 0) {
        // If no defaults, add one empty row for single damages
        addDamageRow();
    } else {
        defaultDamages.forEach(damage => {
            const row = createDamageRow();
            row.querySelector('input[name="damageDate"]').value = damage.date;
            row.querySelector('input[name="damageDescription"]').value = damage.description;
            // Format the default amount correctly on initialization
            const amountInput = row.querySelector('input[name="damageAmount"]');
            amountInput.value = damage.amount; // Set raw value first
            formatInputAsCurrency(amountInput); // Then format it
            damagesTbody.appendChild(row);
        });
    }

    // Add one empty row for recurring damages (assuming no defaults for recurring)
    addRecurringTableRow();


    // Ensure calculation output is cleared on init
    calculationOutputArea.innerHTML = '';
    summaryTotalSpecialsEl.textContent = formatCurrency(0);
    summaryInterestOnSpecialsEl.textContent = formatCurrency(0);
    summaryTotalEl.textContent = formatCurrency(0);
}

// Initialize the form when the script loads
initializeFormWithDefaults();
