import { parseDateInput, formatDateForDisplay, normalizeDate, datesEqual } from '../utils.date.js';
import { formatCurrencyForDisplay } from '../utils.currency.js';
import elements from './elements.js';
import { insertSpecialDamagesRowFromData } from './specialDamages.js';
import { insertPaymentRowFromData } from './payments.js';
import useStore from '../store.js';

/**
 * Updates an interest table (prejudgment or postjudgment) with calculated details.
 * Handles the new 5-column structure and separate total elements.
 * @param {HTMLTableSectionElement} tableBody - The tbody element of the table.
 * @param {HTMLElement|null} principalTotalElement - Element for principal total (null if not applicable).
 * @param {HTMLElement} interestTotalElement - Element for interest total.
 * @param {object} resultState - The state object containing details, total, principal, etc. (e.g., appState.results.prejudgmentResult).
 * @param {number|null} principalTotalForFooter - The specific principal total to display in the footer (used for prejudgment).
 */
export function updateInterestTable(tableBody, principalTotalElement, interestTotalElement, resultState, principalTotalForFooter) {
    if (!tableBody || !interestTotalElement || !resultState) {
        console.error("Missing required table elements or result state for updateInterestTable");
        return;
    }
    
    const { details = [], total: interestTotal = 0, finalPeriodDamageInterestDetails = [] } = resultState;
    // principalTotal is derived from principalTotalForFooter for the footer display
    const principalTotal = principalTotalForFooter;

    // Determine if this is the prejudgment table
    const isPrejudgmentTable = tableBody.id === 'prejudgmentTableBody' || 
                              tableBody.closest('table')?.id === 'prejudgmentTable';
    
    // If this is the prejudgment table, save any existing special damages rows
    const existingSpecialDamagesRows = [];
    if (isPrejudgmentTable) {
        const specialRows = tableBody.querySelectorAll('.special-damages-row');
        specialRows.forEach(row => {
            const dateInput = row.querySelector('.special-damages-date');
            const descInput = row.querySelector('.special-damages-description');
            const amountInput = row.querySelector('.special-damages-amount');
            
            if (dateInput && descInput && amountInput) {
                existingSpecialDamagesRows.push({
                    date: dateInput.value,
                    description: descInput.value.trim() || descInput.placeholder,
                    amount: amountInput.value
                });
            }
        });
        
        // Check if existingSpecialDamagesRows is empty, and if so, retrieve from the store
        if (existingSpecialDamagesRows.length === 0) {
            const state = useStore.getState();
            if (state.results.specialDamages && state.results.specialDamages.length > 0) {
                // Format store values for DOM insertion
                state.results.specialDamages.forEach(damage => {
                    existingSpecialDamagesRows.push({
                        date: damage.date, // Already in YYYY-MM-DD format
                        description: damage.description,
                        amount: damage.amount.toString() // Convert to string for consistent handling
                    });
                });
            }
        }
    }
    
    // Clear previous rows
    tableBody.innerHTML = '';

    // Populate new rows (assuming 5 columns: Date/Period, Description, Rate, Principal, Interest)
    details.forEach((item, index) => {
        const row = tableBody.insertRow();

        // Add .breakable class to all rows except the first one
        if (index > 0) {
            row.classList.add('breakable');
        }

        // Add payment-row class for payment rows for styling
        if (item.isPayment) {
            row.classList.add('payment-row');
        }

        // Date cell - format differs based on row type
        const dateCell = row.insertCell();
        if (item.isPayment) {
            // For payment rows, just show the payment date
            dateCell.textContent = item.start;
        } else if (!item.isFinalPeriodDamage) {
            // For interest calculation rows, show both start and end date with a line break
            dateCell.innerHTML = `${item.start}<br>${item._endDate}`;
        } else {
            // For special damages rows in final period, just use the start date
            dateCell.textContent = item.start;
        }
        
        // Description cell with potential button
        const descCell = row.insertCell();
        
        // Create a container for description and button
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'description-container';
        
        // Add the description text with formatting based on row type
        const descriptionText = document.createElement('span');
        
        if (item.isPayment) {
            // For payment rows, display "Payment received: $XXX.XX" format
            const paymentAmount = item.paymentAmount || 0;
            descriptionText.innerHTML = `Payment received: ${formatCurrencyForDisplay(paymentAmount)}`;
        } else if (!item.isFinalPeriodDamage) {
            descriptionText.innerHTML = `<br>${item.description}`;
        } else {
            descriptionText.textContent = item.description;
        }
        descriptionContainer.appendChild(descriptionText);

        // Add the "add special damages" button only for regular period rows (not final period damage calc rows)
        // with interest in the prejudgment table, and not for payment rows
        if (isPrejudgmentTable && item.interest > 0 && !item.isFinalPeriodDamage && !item.isPayment) {
            const addButton = document.createElement('button');
            addButton.textContent = 'add special damages';
            addButton.className = 'add-special-damages-btn';
            addButton.dataset.date = item.start;
            addButton.dataset.amount = item.interest;
            
            // Add click event listener
            addButton.addEventListener('click', async function(event) {
                event.preventDefault();
                
                // Get the current row
                const currentRow = this.closest('tr');
                if (!currentRow) return;
                
                // Create a new special damages row with date +1 day from the current row date
                // Use a static import instead of dynamic import to prevent multiple module instances
                const specialDamagesModule = await import('./specialDamages.js');
                
                // Parse the current row date
                const currentDate = parseDateInput(item.start);
                if (currentDate) {
                    // Add one day to the date
                    const nextDate = new Date(normalizeDate(currentDate));
                    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                    
                    // Format it back to YYYY-MM-DD
                    const nextDateFormatted = formatDateForDisplay(nextDate);
                    
                    // Use this new date for the special damages row
                    specialDamagesModule.insertSpecialDamagesRow(tableBody, currentRow, nextDateFormatted);
                } else {
                    // Fallback to current date if parsing fails
                    specialDamagesModule.insertSpecialDamagesRow(tableBody, currentRow, item.start);
                }
            });
            
            descriptionContainer.appendChild(addButton);
        }
        
        descCell.appendChild(descriptionContainer);
        
        // Principal cell with proper handling for payments
        const principalCell = row.insertCell();
        
        if (item.isPayment) {
            // For payment rows, display the principal value directly (it's already negative)
            principalCell.innerHTML = formatCurrencyForDisplay(item.principal);
            // Add special class for negative values
            if (item.principal < 0) {
                principalCell.classList.add('negative-value');
            }
        } else if (!isPrejudgmentTable && principalTotal !== null) {
            // For postjudgment table, use the same principal amount for all rows (principalTotal)
            principalCell.innerHTML = formatCurrencyForDisplay(principalTotal);
        } else {
            // For regular rows, use the principal from the calculation
            principalCell.innerHTML = formatCurrencyForDisplay(item.principal);
        }
        
        // Rate cell with different formatting for different row types
        const rateCell = row.insertCell();
        if (item.isPayment) {
            // For payment rows, leave rate blank
            rateCell.textContent = '';
        } else if (!item.isFinalPeriodDamage) {
            // For regular interest rows, show rate with line break
            rateCell.innerHTML = `<br>${item.rate.toFixed(2)}%`;
        } else {
            // For special damage rows, show just the rate
            rateCell.textContent = item.rate.toFixed(2) + '%';
        }
        
        // Interest cell with different formatting for different row types
        const interestCell = row.insertCell();
        if (item.isPayment) {
            // For payment rows, display the interest value directly (it's already negative)
            interestCell.innerHTML = formatCurrencyForDisplay(item.interest);
            // Add special class for negative values
            if (item.interest < 0) {
                interestCell.classList.add('negative-value');
            }
        } else if (!item.isFinalPeriodDamage) {
            // For regular interest rows, show with line break
            interestCell.innerHTML = `<br>${formatCurrencyForDisplay(item.interest)}`;
        } else {
            // For special damage rows, show just the value
            interestCell.innerHTML = formatCurrencyForDisplay(item.interest);
        }

        // Apply text alignment via CSS classes (adjust indices if needed)
        row.cells[0].classList.add('text-left');   // Date/Period
        row.cells[1].classList.add('text-left');   // Description
        row.cells[2].classList.add('text-right');  // Principal
        row.cells[3].classList.add('text-center'); // Rate
        row.cells[4].classList.add('text-right');  // Interest
    });

    // Re-insert existing payments
    const existingPayments = [];
    if (isPrejudgmentTable) {
        // Retrieve payments from the store
        const state = useStore.getState();
        if (state.results.payments && state.results.payments.length > 0) {
            // Format store values for DOM insertion
            state.results.payments.forEach(payment => {
                existingPayments.push({
                    date: payment.date, // Already in YYYY-MM-DD format
                    amount: payment.amount.toString() // Convert to string for consistent handling
                });
            });
        }
    }
    
    // Re-insert existing special damages rows in correct sorted order
    if (isPrejudgmentTable && (existingSpecialDamagesRows.length > 0 || existingPayments.length > 0)) {
        // Get all dates from interest calculation periods for comparison
        const periodDates = details.map(item => ({
            date: parseDateInput(item.start),
            dateStr: item.start,
            isStartPeriod: true
        }));
        
        // Add final period start date if available
        let finalPeriodStartDate = null;
        if (details.length > 0) {
            const lastDetail = details[details.length - 1];
            finalPeriodStartDate = parseDateInput(lastDetail.start);
        }
        
        // Make a mutable copy of the final period details for safe removal during iteration
        const mutableFinalPeriodDetails = [...finalPeriodDamageInterestDetails];

        // Parse all special damages and payment dates first and add to our collection for sorting
        const allRowsToInsert = [
            ...existingSpecialDamagesRows.map(rowData => {
                const date = parseDateInput(rowData.date);
                return {
                    date: date,
                    dateStr: rowData.date,
                    isSpecialDamage: true,
                    isPayment: false,
                    rowData: rowData
                };
            }),
            ...existingPayments.map(rowData => {
                const date = parseDateInput(rowData.date);
                return {
                    date: date,
                    dateStr: rowData.date,
                    isSpecialDamage: false,
                    isPayment: true,
                    rowData: rowData
                };
            })
        ].filter(item => item.date !== null); // Filter out invalid dates

        // Sort all rows chronologically, with proper order for same-day events following the spec:
        // 1. Interest calculation row/segment ending on that day.
        // 2. Special Damage entry on that day (if applicable).
        // 3. Payment row for a payment made on that day.
        // 4. Interest calculation row/segment starting on that day.
        allRowsToInsert.sort((a, b) => {
            // First compare by date
            const dateComparison = a.date - b.date;
            
            // If dates are the same, follow the specified order
            if (dateComparison === 0) {
                // If a is a special damage and b is not, b should come first
                if (a.isSpecialDamage && !b.isSpecialDamage) return 1;
                // If a is not a special damage and b is, a should come first
                if (!a.isSpecialDamage && b.isSpecialDamage) return -1;
            }
            
            // Otherwise, sort by date
            return dateComparison;
        });

        // Now insert each special damages row at the correct position
        for (const rowToInsert of allRowsToInsert) {
            let insertIndex = -1; // Default to append at end
            
            // Find where to insert this row based on date
            for (let i = 0; i < tableBody.rows.length; i++) {
                const currentRow = tableBody.rows[i];
                const currentRowDateCell = currentRow.cells[0];
                let currentRowDate = null;
                let currentRowEndDate = null;
                const isPaymentRow = currentRow.classList.contains('payment-row');
                
                // Check if current row is a special damages or payment row (already inserted)
                const specialDamagesDateInput = currentRow.querySelector('.special-damages-date');
                const paymentDateInput = currentRow.querySelector('.payment-date');
                if (specialDamagesDateInput) {
                    currentRowDate = parseDateInput(specialDamagesDateInput.value);
                } else if (paymentDateInput) {
                    currentRowDate = parseDateInput(paymentDateInput.value);
                } else {
                    // Otherwise it's a calculated row
                    const dateText = currentRowDateCell.textContent.trim();
                    
                    // Check if the content contains a line break (HTML br element)
                    if (dateText.includes('\n')) {
                        const dateLines = dateText.split('\n');
                        // Parse start and end dates separately
                        currentRowDate = parseDateInput(dateLines[0].trim());
                        currentRowEndDate = parseDateInput(dateLines[1].trim());
                    } else if (currentRowDateCell.innerHTML.includes('<br>')) {
                        // Alternative approach using the HTML content if \n splitting didn't work
                        const dateLines = currentRowDateCell.innerHTML.split('<br>');
                        currentRowDate = parseDateInput(dateLines[0].trim());
                        currentRowEndDate = dateLines[1] ? parseDateInput(dateLines[1].trim()) : null;
                    } else {
                        // Single date - for payment rows or final period damages
                        currentRowDate = parseDateInput(dateText);
                    }
                }
                
                // Compare dates for insertion position following the sorting order:
                // 1. Interest calculation row/segment ending on that day.
                // 2. Special Damage entry on that day.
                // 3. Payment row for a payment made on that day.
                // 4. Interest calculation row/segment starting on that day.
                if (currentRowDate) {
                    // If dates are equal, apply the sorting rules
                    if (rowToInsert.date.getTime() === currentRowDate.getTime()) {
                        // Special damages come after interest calculation rows ending on that day
                        // but before payment rows and interest rows starting on that day
                        
                        // If current row is a payment row, insert special damages before it
                        if (isPaymentRow) {
                            insertIndex = i;
                            break;
                        }
                        
                        // If current row is a special damages or payment row, continue to next row
                        // (this will place the new row after existing ones of the same type)
                        if (specialDamagesDateInput || paymentDateInput) {
                            continue;
                        }
                        
                        // For interest calculation rows, determine if it's ending or starting on this date
                        if (currentRowEndDate && datesEqual(rowToInsert.date, currentRowEndDate)) {
                            // Row is ending on this date - place special damages after it
                            insertIndex = i + 1;
                            break;
                        } else {
                            // Row is starting on this date - place special damages before it
                            insertIndex = i;
                            break;
                        }
                    } 
                    // If special damages date is less than current row date, insert before it
                    else if (rowToInsert.date < currentRowDate) {
                        insertIndex = i;
                        break;
                    }
                }
            }
            
            // Insert the row at the determined position
            if (rowToInsert.isSpecialDamage) {
                insertSpecialDamagesRowFromData(
                    tableBody, 
                    insertIndex, 
                    rowToInsert.rowData, 
                    finalPeriodStartDate, 
                    mutableFinalPeriodDetails
                );
            } else if (rowToInsert.isPayment) {
                const insertedPaymentRow = insertPaymentRowFromData(
                    tableBody,
                    insertIndex,
                    rowToInsert.rowData
                );

                // --- START: Added logic for duplicating target row ---
                if (insertedPaymentRow && insertIndex > 0) {
                    const targetRowElement = tableBody.rows[insertIndex - 1];
                    
                    // Check if the preceding row is an interest calculation row 
                    // (heuristic: doesn't have special-damages-row class, which payments/damages get)
                    // and not the table header row (though insertIndex > 0 should prevent that)
                    if (targetRowElement && !targetRowElement.classList.contains('special-damages-row')) {
                        try {
                            const duplicatedRowElement = targetRowElement.cloneNode(true);
                            // Insert the duplicated row immediately after the payment row
                            // The payment row is at tableBody.rows[insertIndex]
                            tableBody.rows[insertIndex].after(duplicatedRowElement);
                        } catch (e) {
                            console.error("Error duplicating or inserting row:", e);
                        }
                    }
                }
                // --- END: Added logic for duplicating target row ---
            }
        }
    }

    // Update totals in the footer
    if (principalTotalElement && principalTotal !== null) {
        principalTotalElement.innerHTML = formatCurrencyForDisplay(principalTotal);
    }
    
    // If this is the postjudgment table, update the principal total in the footer
    if (!isPrejudgmentTable && principalTotal !== null) {
        const postjudgmentPrincipalEl = elements.postjudgmentPrincipalTotalEl;
        if (postjudgmentPrincipalEl) {
            postjudgmentPrincipalEl.innerHTML = formatCurrencyForDisplay(principalTotal);
        }
    }
    
    interestTotalElement.innerHTML = formatCurrencyForDisplay(interestTotal);
    
    // Add date and total days to the footer row
    const table = tableBody.closest('table');
    if (table) {
        const footerRow = table.querySelector('tfoot tr.total');
        if (footerRow) {
            // Get the appropriate date based on which table this is
            const state = useStore.getState();
            let dateToShow = '';
            
            if (isPrejudgmentTable) {
                // For prejudgment table, use the judgment date
                if (state.inputs.dateOfJudgment) {
                    dateToShow = formatDateForDisplay(state.inputs.dateOfJudgment);
                }
            } else {
                // For postjudgment table, use the postjudgment end date (finalCalculationDate)
                if (state.results.finalCalculationDate) {
                    dateToShow = formatDateForDisplay(state.results.finalCalculationDate);
                }
            }
            
            // Calculate total days from all periods
            const totalDays = details.reduce((sum, item) => sum + (item._days || 0), 0);
            
            // Update the text in the cells
            if (dateToShow) {
                // Get the cells using the new data-display attributes
                let totalDaysCell, dateCell;
                
                if (isPrejudgmentTable) {
                    totalDaysCell = table.querySelector('[data-display="prejudgmentTotalDays"]');
                    dateCell = table.querySelector('[data-display="prejudgmentDateCell"]');
                } else {
                    totalDaysCell = table.querySelector('[data-display="postjudgmentTotalDays"]');
                    dateCell = table.querySelector('[data-display="postjudgmentDateCell"]');
                }
                
                // Update total days cell
                if (totalDaysCell) {
                    totalDaysCell.textContent = `Total: ${totalDays} days`;
                    totalDaysCell.style.fontWeight = 'normal';
                }
                
                // Update date cell
                if (dateCell) {
                    dateCell.textContent = dateToShow;
                    dateCell.style.fontWeight = 'normal';
                }
            }
        }
    }
}
