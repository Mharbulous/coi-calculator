// BC COIA calculator/dom/tables.interest.rowRendering.js
import { parseDateInput, formatDateForDisplay, normalizeDate } from '../utils.date.js';
import { formatCurrencyForDisplay } from '../utils.currency.js';
import elements from './elements.js'; // Needed for footer updates
import useStore from '../store.js'; // Potentially for "add special damages" context or footer

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
            row.classList.add('payment-row');
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

        // "Add special damages" button
        if (isPrejudgmentTable && item.interest > 0 && !item.isFinalPeriodDamage && !item.isPayment) {
            createAndAddSpecialDamagesButton(descriptionContainer, item, tableBody);
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
export function createAndAddSpecialDamagesButton(descriptionContainer, item, tableBody) {
    const addButton = document.createElement('button');
    addButton.textContent = 'add special damages';
    addButton.className = 'add-special-damages-btn';
    addButton.dataset.date = item.start;
    addButton.dataset.amount = item.interest;

    addButton.addEventListener('click', async function(event) {
        event.preventDefault();
        const currentRow = this.closest('tr');
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
        } catch (e) {
            console.error("Failed to load or execute specialDamages.js module:", e);
        }
    });
    descriptionContainer.appendChild(addButton);
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
