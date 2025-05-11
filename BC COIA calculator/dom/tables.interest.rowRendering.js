// BC COIA calculator/dom/tables.interest.rowRendering.js
import { parseDateInput, formatDateForDisplay, normalizeDate, calculateMidpointDate } from '../utils.date.js';
import { formatCurrencyForDisplay } from '../utils.currency.js';
import elements from './elements.js'; // Needed for footer updates
import useStore from '../store.js'; // Potentially for "add special damages" context or footer
import { logger } from '../util.logger.js'; // Import for enhanced debugging

// Note: insertSpecialDamagesRow is imported dynamically in createAndAddSpecialDamagesButton

export function renderInitialInterestRows(tableBody, details, isPrejudgmentTable, principalTotalForPostjudgment) {
    if (!details || !Array.isArray(details)) {
        console.error('Details are missing or not an array in renderInitialInterestRows');
        return;
    }

    details.forEach((item, index) => {
        const row = tableBody.insertRow();

        if (index > 0) {
            row.classList.add('breakable');
        }

        if (item.isPayment) {
            row.classList.add('payment-row', 'editable-item-row', 'breakable');
        }

        // Date cell
        const dateCell = row.insertCell();
        if (item.isPayment) {
            dateCell.textContent = item.start; // Payment date
        } else if (!item.isFinalPeriodDamage) {
            dateCell.innerHTML = `${item.start}<br>${item._endDate}`; // Interest period
        } else {
            dateCell.textContent = item.start; // Special damage in final period
        }

        // Description cell
        const descCell = row.insertCell();
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'description-container';
        const descriptionText = document.createElement('span');

        if (item.isPayment) {
            const paymentAmount = item.paymentAmount || 0;
            descriptionText.innerHTML = `Payment received: ${formatCurrencyForDisplay(paymentAmount)}`;
        } else if (!item.isFinalPeriodDamage) {
            descriptionText.innerHTML = `<br>${item.description}`;
        } else {
            descriptionText.textContent = item.description;
        }
        descriptionContainer.appendChild(descriptionText);

        // "Add..." button for both tables
        if (item.interest > 0 && !item.isFinalPeriodDamage && !item.isPayment) {
            createAndAddSpecialDamagesButton(descriptionContainer, item, tableBody, isPrejudgmentTable);
        }
        descCell.appendChild(descriptionContainer);

        // Principal cell
        const principalCell = row.insertCell();
        if (item.isPayment) {
            principalCell.innerHTML = formatCurrencyForDisplay(item.principal);
            if (item.principal < 0) principalCell.classList.add('negative-value');
        } else if (!isPrejudgmentTable && principalTotalForPostjudgment !== null) {
            principalCell.innerHTML = formatCurrencyForDisplay(principalTotalForPostjudgment);
        } else {
            principalCell.innerHTML = formatCurrencyForDisplay(item.principal);
        }

        // Rate cell
        const rateCell = row.insertCell();
        if (item.isPayment) {
            rateCell.textContent = '';
        } else if (!item.isFinalPeriodDamage) {
            rateCell.innerHTML = `<br>${item.rate.toFixed(2)}%`;
        } else {
            rateCell.textContent = item.rate.toFixed(2) + '%';
        }

        // Interest cell
        const interestCell = row.insertCell();
        if (item.isPayment) {
            interestCell.innerHTML = formatCurrencyForDisplay(item.interest);
            if (item.interest < 0) interestCell.classList.add('negative-value');
        } else if (!item.isFinalPeriodDamage) {
            interestCell.innerHTML = `<br>${formatCurrencyForDisplay(item.interest)}`;
        } else {
            interestCell.innerHTML = formatCurrencyForDisplay(item.interest);
        }

        // Apply text alignment
        row.cells[0].classList.add('text-left');   // Date/Period
        row.cells[1].classList.add('text-left');   // Description
        row.cells[2].classList.add('text-right');  // Principal
        row.cells[3].classList.add('text-center'); // Rate
        row.cells[4].classList.add('text-right');  // Interest
    });
}

// This function is kept separate as it involves a dynamic import and event listener.
// It's called from within renderInitialInterestRows.
export function createAndAddSpecialDamagesButton(descriptionContainer, item, tableBody, isPrejudgmentTable) {
    // Create dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'add-dropdown-container';
    
    // Create dropdown button
    const dropdownButton = document.createElement('button');
    dropdownButton.textContent = 'Add...';
    dropdownButton.className = 'add-dropdown-button';
    dropdownButton.dataset.date = item.start;
    dropdownButton.dataset.amount = item.interest;
    dropdownButton.setAttribute('tabindex', '0'); // Ensure focusable
    
    // Create dropdown menu
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'add-dropdown-menu';
    
    // Create special damages option
    const specialDamagesOption = document.createElement('button');
    specialDamagesOption.className = 'add-dropdown-item';
    specialDamagesOption.textContent = 'Special damages';
    specialDamagesOption.addEventListener('click', async function(event) {
        event.preventDefault();
        const currentRow = dropdownButton.closest('tr');
        if (!currentRow) {
            console.error("Could not find closest tr to button");
            return;
        }

        try {
            const { insertSpecialDamagesRow } = await import('./specialDamages.js');
            
            const currentDate = parseDateInput(item.start);
            if (currentDate) {
                const nextDate = new Date(normalizeDate(currentDate));
                nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                const nextDateFormatted = formatDateForDisplay(nextDate);
                insertSpecialDamagesRow(tableBody, currentRow, nextDateFormatted);
            } else {
                insertSpecialDamagesRow(tableBody, currentRow, item.start);
            }
            
            // Close dropdown by blurring the button
            dropdownButton.blur();
        } catch (e) {
            console.error("Failed to load or execute specialDamages.js module:", e);
        }
    });
    
    // Create payment option
    const paymentOption = document.createElement('button');
    paymentOption.className = 'add-dropdown-item';
    paymentOption.textContent = 'Payment';
    paymentOption.addEventListener('click', function(event) {
        event.preventDefault();
        
        try {
            const state = useStore.getState();
            
            console.log("[DEBUG] Payment option clicked. Starting payment creation process.");
            console.log("[DEBUG] Current table is " + (isPrejudgmentTable ? "prejudgment" : "postjudgment"));
            
            // Get row start and end dates for the midpoint calculation
            const rowStartDate = parseDateInput(item.start);
            const rowEndDate = parseDateInput(item._endDate);
            console.log("[DEBUG] Row dates for calculation:", { start: item.start, end: item._endDate, parsedStart: rowStartDate, parsedEnd: rowEndDate });
            
            // Calculate midpoint date between row start and end dates
            const midpointDate = calculateMidpointDate(rowStartDate, rowEndDate);
            console.log("[DEBUG] Calculated midpoint date:", midpointDate);
            
            if (midpointDate) {
                // Format date for display
                const formattedDate = formatDateForDisplay(midpointDate);
                console.log("[DEBUG] Formatted midpoint date:", formattedDate);
                
                // Get current payments before adding
                console.log("[DEBUG] Current payments in store BEFORE adding (raw):", state.results.payments);
                console.log("[DEBUG] Current payments in store BEFORE adding (JSON):", JSON.stringify(state.results.payments));
                
                // The payment date needs to respect which table we're working with
                // Note: This is just for the initial placement in the appropriate table
                // The actual payment date will always be the midpoint date, which is correct
                // for both prejudgment and postjudgment payments
                
                // Add payment to the store with zero amount
                const newPayment = { date: formattedDate, amount: 0.00 };
                console.log("[DEBUG] Detailed payment being added (JSON):", JSON.stringify(newPayment));
                state.addPayment(newPayment);
                
                // Check if payment was added to store
                console.log("[DEBUG] Current payments in store AFTER adding (raw):", state.results.payments);
                console.log("[DEBUG] Current payments in store AFTER adding (JSON):", JSON.stringify(state.results.payments));
                
                console.log(`Payment placeholder added: $0.00 on ${formattedDate} to ${isPrejudgmentTable ? "prejudgment" : "postjudgment"} table`);
                
                // Trigger recalculation
                console.log("[DEBUG] Dispatching payment-updated event");
                const event = new CustomEvent('payment-updated');
                document.dispatchEvent(event);
            } else {
                console.error("Failed to calculate midpoint date for payment", rowStartDate, rowEndDate);
            }
            
            // Close dropdown by blurring the button
            dropdownButton.blur();
        } catch (e) {
            console.error("Failed to add payment:", e);
        }
    });
    
    // Assemble dropdown - only include Special damages option for prejudgment table
    if (isPrejudgmentTable) {
        dropdownMenu.appendChild(specialDamagesOption);
    }
    dropdownMenu.appendChild(paymentOption);
    dropdownContainer.appendChild(dropdownButton);
    dropdownContainer.appendChild(dropdownMenu);
    
    // Add the dropdown to the description container
    descriptionContainer.appendChild(dropdownContainer);
}


// renderPaymentRow and renderSpecialDamageRowInFinalPeriod might not be needed if
// renderInitialInterestRows handles all `details` items correctly based on their flags.
// The original code's main loop in updateInterestTable iterated `details` which included these.
// If `details` passed to `renderInitialInterestRows` already contains payment and final period damage items,
// then separate rendering functions for those might be redundant unless called from rowSorting.
// For now, let's assume `renderInitialInterestRows` covers them based on `item.isPayment` and `item.isFinalPeriodDamage`.

export function updateTableFooter(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter, isPrejudgmentTable, details) {
    if (!interestTotalElement || !resultState || !details) {
        console.error("Missing required elements or state for updateTableFooter");
        return;
    }

    const { total: interestTotal = 0 } = resultState;

    if (principalTotalElement && principalTotalForFooter !== null) {
        principalTotalElement.innerHTML = formatCurrencyForDisplay(principalTotalForFooter);
    }

    // Special handling for postjudgment principal total in its own dedicated element
    if (!isPrejudgmentTable && principalTotalForFooter !== null) {
        const postjudgmentPrincipalEl = elements.postjudgmentPrincipalTotalEl;
        if (postjudgmentPrincipalEl) {
            postjudgmentPrincipalEl.innerHTML = formatCurrencyForDisplay(principalTotalForFooter);
        }
    }

    interestTotalElement.innerHTML = formatCurrencyForDisplay(interestTotal);

    const table = tableBody.closest('table');
    if (table) {
        const footerRow = table.querySelector('tfoot tr.total');
        if (footerRow) {
            const state = useStore.getState();
            let dateToShow = '';

            if (isPrejudgmentTable) {
                if (state.inputs.dateOfJudgment) {
                    dateToShow = formatDateForDisplay(state.inputs.dateOfJudgment);
                }
            } else {
                if (state.results.finalCalculationDate) {
                    dateToShow = formatDateForDisplay(state.results.finalCalculationDate);
                }
            }

            const totalDays = details.reduce((sum, item) => sum + (item._days || 0), 0);

            if (dateToShow) {
                let totalDaysCell, dateCell;
                if (isPrejudgmentTable) {
                    totalDaysCell = table.querySelector('[data-display="prejudgmentTotalDays"]');
                    dateCell = table.querySelector('[data-display="prejudgmentDateCell"]');
                } else {
                    totalDaysCell = table.querySelector('[data-display="postjudgmentTotalDays"]');
                    dateCell = table.querySelector('[data-display="postjudgmentDateCell"]');
                }

                if (totalDaysCell) {
                    totalDaysCell.textContent = `Total: ${totalDays} days`;
                    totalDaysCell.style.fontWeight = 'normal';
                }
                if (dateCell) {
                    dateCell.textContent = dateToShow;
                    dateCell.style.fontWeight = 'normal';
                }
            }
        }
    }
}

// The functions renderPaymentRow and renderSpecialDamageRowInFinalPeriod were placeholders.
// The original logic iterates through `details` which can contain these types of items.
// The updated `renderInitialInterestRows` now handles these items based on flags like `item.isPayment`
// and `item.isFinalPeriodDamage`. So, explicit separate functions might not be needed here
// unless `rowSorting.js` needs to render individual rows after sorting.
// For now, I will remove the unused placeholder functions.
/*
export function renderPaymentRow(tableBody, paymentItem) {
    // Logic to render a payment row
    console.log('renderPaymentRow called');
}

export function renderSpecialDamageRowInFinalPeriod(tableBody, damageItem) {
    // Logic to render a special damage row that falls within the final period calculation
    console.log('renderSpecialDamageRowInFinalPeriod called');
}
*/
