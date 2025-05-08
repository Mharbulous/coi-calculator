// BC COIA calculator/dom/tables.interest.rowSorting.js
import { parseDateInput, datesEqual, formatDateForDisplay, normalizeDate } from '../utils.date.js';
import useStore from '../store.js';
import { insertSpecialDamagesRowFromData } from './specialDamages.js';
import { insertPaymentRowFromData } from './payments.js';

// Helper function to get existing special damages rows from DOM or store
function getExistingSpecialDamages(tableBody, isPrejudgmentTable) {
    const existingSpecialDamagesRows = [];
    if (isPrejudgmentTable) {
        const specialRows = tableBody.querySelectorAll('.editable-item-row');
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
        if (existingSpecialDamagesRows.length === 0) {
            const state = useStore.getState();
            if (state.results.specialDamages && state.results.specialDamages.length > 0) {
                state.results.specialDamages.forEach(damage => {
                    existingSpecialDamagesRows.push({
                        date: damage.date,
                        description: damage.description,
                        amount: damage.amount.toString()
                    });
                });
            }
        }
    }
    return existingSpecialDamagesRows;
}

// Helper function to get existing payments from store
function getExistingPayments(isPrejudgmentTable) {
    const existingPayments = [];
    if (isPrejudgmentTable) {
        const state = useStore.getState();
        if (state.results.payments && state.results.payments.length > 0) {
            state.results.payments.forEach(payment => {
                existingPayments.push({
                    date: payment.date,
                    amount: payment.amount.toString()
                });
            });
        }
    }
    return existingPayments;
}

export function collectAndSortRows(tableBody, details, resultState, isPrejudgmentTable, finalPeriodStartDateStr, finalPeriodDamageInterestDetails) {
    if (!isPrejudgmentTable) return; // Sorting logic is primarily for prejudgment

    const existingSpecialDamagesRows = getExistingSpecialDamages(tableBody, isPrejudgmentTable);
    const existingPayments = getExistingPayments(isPrejudgmentTable);

    if (existingSpecialDamagesRows.length === 0 && existingPayments.length === 0) {
        return; // No special damages or payments to process
    }
    
    // `finalPeriodStartDateStr` is passed from core, it's the start date of the last interest period.
    // We need to parse it if it's used for `insertSpecialDamagesRowFromData`.
    const finalPeriodStartDate = finalPeriodStartDateStr ? parseDateInput(finalPeriodStartDateStr) : null;
    const mutableFinalPeriodDetails = [...(finalPeriodDamageInterestDetails || [])];


    const allRowsToInsert = [
        ...existingSpecialDamagesRows.map(rowData => ({
            date: parseDateInput(rowData.date),
            dateStr: rowData.date,
            isSpecialDamage: true,
            isPayment: false,
            rowData
        })),
        ...existingPayments.map(rowData => ({
            date: parseDateInput(rowData.date),
            dateStr: rowData.date,
            isSpecialDamage: false,
            isPayment: true,
            rowData
        }))
    ].filter(item => item.date !== null);

    allRowsToInsert.sort((a, b) => {
        const dateComparison = a.date - b.date;
        if (dateComparison === 0) {
            // Order: Special Damage (true = 1) before Payment (false = 0) if types differ
            // This means if a is SD and b is Payment, a comes first.
            // If a is Payment and b is SD, b comes first.
            // The original sort was:
            // if (a.isSpecialDamage && !b.isSpecialDamage) return 1; (SD after non-SD, which means payment first)
            // if (!a.isSpecialDamage && b.isSpecialDamage) return -1; (non-SD before SD, which means payment first)
            // This seems to prioritize payments over special damages on the same day.
            // Let's stick to the original logic: Payments first, then Special Damages.
            if (a.isPayment && !b.isPayment) return -1; // Payment a comes before Special Damage b
            if (!a.isPayment && b.isPayment) return 1;  // Special Damage a comes after Payment b
            return 0; // Same type or neither is payment/SD (should not happen here)
        }
        return dateComparison;
    });

    for (const rowToInsert of allRowsToInsert) {
        const insertIndex = findInsertionIndex(tableBody, rowToInsert.date, rowToInsert.isSpecialDamage, rowToInsert.isPayment);
        
        if (rowToInsert.isSpecialDamage) {
            insertSpecialDamagesRowFromData(
                tableBody,
                insertIndex,
                rowToInsert.rowData,
                finalPeriodStartDate, // This is the parsed date object
                mutableFinalPeriodDetails
            );
        } else if (rowToInsert.isPayment) {
            const insertedPaymentRow = insertPaymentRowFromData(
                tableBody,
                insertIndex,
                rowToInsert.rowData
            );
            if (insertedPaymentRow) {
                 handleRowDuplicationAfterPayment(insertedPaymentRow, tableBody, insertIndex);
            }
        }
    }
}

export function findInsertionIndex(tableBody, dateToInsert, isSpecialDamage, isPayment) {
    let insertIndex = -1; // Default to append

    for (let i = 0; i < tableBody.rows.length; i++) {
        const currentRow = tableBody.rows[i];
        const currentRowDateCell = currentRow.cells[0];
        let currentRowStartDate = null;
        let currentRowEndDate = null; // For interest calculation rows

        const isCurrentRowPayment = currentRow.classList.contains('payment-row');
        const isCurrentRowSpecialDamage = currentRow.classList.contains('editable-item-row'); // Assuming this class is added by insertSpecialDamagesRowFromData

        // Try to get date from special damage or payment input fields if they exist
        const sdDateInput = currentRow.querySelector('.special-damages-date');
        const paymentDateInput = currentRow.querySelector('.payment-date'); // Assuming .payment-date exists on payment rows

        if (sdDateInput) {
            currentRowStartDate = parseDateInput(sdDateInput.value);
        } else if (paymentDateInput) {
            currentRowStartDate = parseDateInput(paymentDateInput.value);
        } else { // It's an interest calculation row
            const dateText = currentRowDateCell.textContent.trim();
            const dateHtml = currentRowDateCell.innerHTML;
            if (dateHtml.includes('<br>')) {
                const dateLines = dateHtml.split('<br>');
                currentRowStartDate = parseDateInput(dateLines[0].trim());
                currentRowEndDate = dateLines[1] ? parseDateInput(dateLines[1].trim()) : null;
            } else {
                currentRowStartDate = parseDateInput(dateText); // Single date (e.g. final period damage calc)
            }
        }

        if (currentRowStartDate) {
            if (datesEqual(dateToInsert, currentRowStartDate)) {
                // Same date, apply precedence:
                // 1. Interest calculation row ENDING on this day (handled by dateToInsert < currentRowStartDate for next row)
                // 2. Special Damage
                // 3. Payment
                // 4. Interest calculation row STARTING on this day
                
                if (isPayment) { // Inserting a payment
                    // Payment comes after SD and after interest rows ending today.
                    // Payment comes before interest rows starting today.
                    if (isCurrentRowSpecialDamage) { // Current is SD, payment comes after
                        continue; // Check next row
                    } else if (!isCurrentRowPayment && !isCurrentRowSpecialDamage && currentRowEndDate && datesEqual(dateToInsert, currentRowEndDate)) {
                        // Current is interest row ending today, payment comes after
                        continue;
                    } else {
                        insertIndex = i; // Insert before current (which is interest starting today or another payment)
                        break;
                    }
                } else if (isSpecialDamage) { // Inserting a Special Damage
                    // SD comes after interest rows ending today.
                    // SD comes before payments and before interest rows starting today.
                    if (!isCurrentRowPayment && !isCurrentRowSpecialDamage && currentRowEndDate && datesEqual(dateToInsert, currentRowEndDate)) {
                        // Current is interest row ending today, SD comes after
                        continue;
                    } else {
                         insertIndex = i; // Insert before current (payment or interest starting today)
                         break;
                    }
                }
            } else if (dateToInsert < currentRowStartDate) {
                insertIndex = i;
                break;
            }
        }
    }
    return insertIndex;
}

export function handleRowDuplicationAfterPayment(insertedPaymentRow, tableBody, insertIndex) {
    // The original logic for insertIndex for duplication was `tableBody.rows[insertIndex -1]`
    // If insertIndex is where the payment row IS, then the row before it is `insertIndex -1` if insertIndex > 0.
    // If payment row was inserted at index `idx`, it is now `tableBody.rows[idx]`.
    // The row *before* the payment row (which was the target for duplication) would be `tableBody.rows[idx-1]` if `idx > 0`.
    // The payment row itself is `insertedPaymentRow`.

    // Find the actual index of the insertedPaymentRow as DOM might have shifted
    let actualPaymentRowIndex = -1;
    for(let i=0; i < tableBody.rows.length; i++) {
        if (tableBody.rows[i] === insertedPaymentRow) {
            actualPaymentRowIndex = i;
            break;
        }
    }

    if (actualPaymentRowIndex > 0) {
        const targetRowElement = tableBody.rows[actualPaymentRowIndex - 1];
        // Ensure target is an interest calculation row (not SD or another payment)
        if (targetRowElement && 
            !targetRowElement.classList.contains('editable-item-row') &&
            !targetRowElement.classList.contains('payment-row')) {
            try {
                const duplicatedRowElement = targetRowElement.cloneNode(true);
                
                // Re-attach click event listener to "add special damages" button in the cloned row
                const addButton = duplicatedRowElement.querySelector('.add-special-damages-btn');
                if (addButton) {
                    // Get the date and interest from the button's data attributes
                    const startDate = addButton.dataset.date;
                    const interestAmount = addButton.dataset.amount;
                    
                    // Remove the original non-functional event listener
                    const newButton = addButton.cloneNode(true);
                    addButton.parentNode.replaceChild(newButton, addButton);
                    
                    // Add new event listener with the same functionality as in createAndAddSpecialDamagesButton
                    newButton.addEventListener('click', async function(event) {
                        event.preventDefault();
                        const currentRow = this.closest('tr');
                        if (!currentRow) {
                            console.error("Could not find closest tr to button");
                            return;
                        }

                        try {
                            const { insertSpecialDamagesRow } = await import('./specialDamages.js');
                            
                            const currentDate = parseDateInput(startDate);
                            if (currentDate) {
                                const nextDate = new Date(normalizeDate(currentDate));
                                nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                                const nextDateFormatted = formatDateForDisplay(nextDate);
                                insertSpecialDamagesRow(tableBody, currentRow, nextDateFormatted);
                            } else {
                                insertSpecialDamagesRow(tableBody, currentRow, startDate);
                            }
                        } catch (e) {
                            console.error("Failed to load or execute specialDamages.js module:", e);
                        }
                    });
                }
                
                // Insert the duplicated row immediately after the payment row
                if (tableBody.rows[actualPaymentRowIndex + 1]) {
                    tableBody.insertBefore(duplicatedRowElement, tableBody.rows[actualPaymentRowIndex + 1]);
                } else {
                    tableBody.appendChild(duplicatedRowElement);
                }
            } catch (e) {
                console.error("Error duplicating or inserting row:", e);
            }
        }
    }
}
