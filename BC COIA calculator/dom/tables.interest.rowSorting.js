// BC COIA calculator/dom/tables.interest.rowSorting.js
import { parseDateInput, datesEqual, formatDateForDisplay, normalizeDate } from '../utils.date.js';
import useStore from '../store.js';
import { logger } from '../util.logger.js'; // Import for enhanced debugging
import { insertSpecialDamagesRowFromData } from './specialDamages.js';
import { insertPaymentRowFromData } from './payments.js';
import { calculateInterestAllocation, getPriorPayments } from '../calculations.core.js';

// Helper function to get existing special damages rows from the store
// This function now prioritizes reading directly from the Zustand store,
// aligning with the architectural principle of the store being the single source of truth.
function getExistingSpecialDamages(tableBody, isPrejudgmentTable) {
    const existingSpecialDamagesRows = [];
    if (isPrejudgmentTable) {
        const state = useStore.getState();
        if (state.results.specialDamages && state.results.specialDamages.length > 0) {
            logger.debug('[getExistingSpecialDamages] Reading special damages from store.');
            state.results.specialDamages.forEach(damage => {
                existingSpecialDamagesRows.push({
                    date: damage.date, // Should be a string in YYYY-MM-DD format
                    description: damage.description,
                    amount: damage.amount.toString(), // Ensure amount is a string
                    specialDamageId: damage.specialDamageId // Include specialDamageId
                });
            });
        } else {
            logger.debug('[getExistingSpecialDamages] No special damages found in store.');
        }
    } else {
        logger.debug('[getExistingSpecialDamages] Not a prejudgment table, so no special damages will be fetched.');
    }
    // The tableBody parameter is no longer used but kept for API consistency with getExistingPayments.
    logger.debug(`[getExistingSpecialDamages] Returning ${existingSpecialDamagesRows.length} special damages.`);
    return existingSpecialDamagesRows;
}

// Helper function to get existing payments from store
// Filter payments based on date compared to judgment date
// Process payments to ensure they have principalApplied and interestApplied values
function getExistingPayments(isPrejudgmentTable, interestRatesData) {
    const existingPayments = [];
    const state = useStore.getState();
    console.log("[DEBUG] getExistingPayments: Checking store for payments, isPrejudgmentTable:", isPrejudgmentTable);
    
    if (state.results.payments && state.results.payments.length > 0) {
        console.log("[DEBUG] getExistingPayments: Found payments in store (raw):", state.results.payments);
        console.log("[DEBUG] getExistingPayments: Detailed payments list (JSON):", JSON.stringify(state.results.payments));
        
        // Get judgment date to filter payments
        const judgmentDate = state.inputs.dateOfJudgment ? 
            (typeof state.inputs.dateOfJudgment === 'string' ? 
                parseDateInput(state.inputs.dateOfJudgment) : 
                state.inputs.dateOfJudgment) : 
            null;
        
        if (!judgmentDate) {
            console.warn("[DEBUG] getExistingPayments: No judgment date found, can't filter payments");
            return existingPayments;
        }
        
        // Process each payment synchronously using the core calculation module
        state.results.payments.forEach(payment => {
            // Parse payment date
            const paymentDate = parseDateInput(payment.date);
            
            if (!paymentDate) {
                console.warn(`[DEBUG] getExistingPayments: Invalid payment date: ${payment.date}`);
                return; // Skip this payment
            }
            
            // For prejudgment table: include payments with dates <= judgmentDate
            // For postjudgment table: include payments with dates > judgmentDate
            const isForPrejudgmentTable = paymentDate <= judgmentDate;
            
            if ((isPrejudgmentTable && isForPrejudgmentTable) || 
                (!isPrejudgmentTable && !isForPrejudgmentTable)) {
                // Process the payment to ensure it has principalApplied and interestApplied values
                let processedPayment = { ...payment };
                
                // If interestRatesData is provided and the payment doesn't have principalApplied/interestApplied
                if (interestRatesData && (processedPayment.principalApplied === undefined || processedPayment.interestApplied === undefined)) {
                    try {
                        // Get all prior payments for this payment
                        const priorPayments = getPriorPayments(state, paymentDate);
                        
                        // Use the core calculation module to calculate interest allocation
                        const { interestApplied, principalApplied, remainingPrincipal } = calculateInterestAllocation(
                            state, 
                            paymentDate, 
                            processedPayment.amount, 
                            priorPayments, 
                            interestRatesData
                        );
                        
                        // Update the processed payment with the calculated values
                        processedPayment.interestApplied = interestApplied;
                        processedPayment.principalApplied = principalApplied;
                        processedPayment.remainingPrincipal = remainingPrincipal;
                        
                        console.log(`[DEBUG] getExistingPayments: Processed payment: ${JSON.stringify(processedPayment)}`);
                    } catch (err) {
                        console.error("[ERROR] getExistingPayments: Error processing payment:", err);
                    }
                }
                
                // Push the payment object, ensuring amount is a string for consistency if needed elsewhere
                existingPayments.push({
                    ...processedPayment, // Include all properties like principalApplied, interestApplied
                    amount: processedPayment.amount.toString() 
                });
            }
        });
    } else {
        console.log("[DEBUG] getExistingPayments: No payments found in store or empty array");
    }
    
    console.log(`[DEBUG] getExistingPayments: Returning ${existingPayments.length} payments for ${isPrejudgmentTable ? 'prejudgment' : 'postjudgment'} table`);
    return existingPayments;
}

export function collectAndSortRows(tableBody, details, resultState, isPrejudgmentTable, finalPeriodStartDateStr, finalPeriodDamageInterestDetails, interestRatesData) {
    console.log("[DEBUG] collectAndSortRows: Starting with tableBody ID:", tableBody.id, "isPrejudgmentTable:", isPrejudgmentTable);

    const existingSpecialDamagesRows = getExistingSpecialDamages(tableBody, isPrejudgmentTable);
    console.log("[DEBUG] collectAndSortRows: Retrieved existingSpecialDamagesRows:", existingSpecialDamagesRows.length);
    
    const existingPayments = getExistingPayments(isPrejudgmentTable, interestRatesData);
    // Detailed log for payment amounts as retrieved by getExistingPayments
    logger.debug(`[tables.interest.rowSorting.js collectAndSortRows] existingPayments from getExistingPayments: ${JSON.stringify(existingPayments.map(p => ({ amount: p.amount, date: p.date, id: p.paymentId })))}`);
    console.log("[DEBUG] collectAndSortRows: Retrieved existingPayments:", existingPayments.length);

    if (existingSpecialDamagesRows.length === 0 && existingPayments.length === 0) {
        console.log("[DEBUG] collectAndSortRows: No special damages or payments to process, exiting");
        return; // No special damages or payments to process
    }
    
    // `finalPeriodStartDateStr` is passed from core, it's the start date of the last interest period.
    // We need to parse it if it's used for `insertSpecialDamagesRowFromData`.
    const finalPeriodStartDate = finalPeriodStartDateStr ? parseDateInput(finalPeriodStartDateStr) : null;
    const mutableFinalPeriodDetails = [...(finalPeriodDamageInterestDetails || [])];


    let allRowsToInsert = [ // Changed to let for logging before sort
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

    // DEBUG_SORT: Log allRowsToInsert before sorting
    console.log("[DEBUG_SORT] collectAndSortRows: allRowsToInsert BEFORE sort:", JSON.stringify(allRowsToInsert.map(r => ({ dateStr: r.dateStr, type: r.isSpecialDamage ? 'SD' : (r.isPayment ? 'Payment' : 'Unknown'), id: r.rowData.specialDamageId || r.rowData.paymentId }))));

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

    // DEBUG_SORT: Log allRowsToInsert after sorting
    console.log("[DEBUG_SORT] collectAndSortRows: allRowsToInsert AFTER sort:", JSON.stringify(allRowsToInsert.map(r => ({ dateStr: r.dateStr, type: r.isSpecialDamage ? 'SD' : (r.isPayment ? 'Payment' : 'Unknown'), id: r.rowData.specialDamageId || r.rowData.paymentId }))));

    for (const rowToInsert of allRowsToInsert) {
        // DEBUG_SORT: Log current rowToInsert
        console.log("[DEBUG_SORT] collectAndSortRows: Processing rowToInsert:", JSON.stringify({ dateStr: rowToInsert.dateStr, type: rowToInsert.isSpecialDamage ? 'SD' : (rowToInsert.isPayment ? 'Payment' : 'Unknown'), id: rowToInsert.rowData.specialDamageId || rowToInsert.rowData.paymentId, data: rowToInsert.rowData }));

        const insertIndex = findInsertionIndex(tableBody, rowToInsert.date, rowToInsert.isSpecialDamage, rowToInsert.isPayment);
        console.log("[DEBUG] collectAndSortRows: For row type:", rowToInsert.isPayment ? "Payment" : "Special Damage", 
                   "date:", rowToInsert.dateStr, "found insertIndex:", insertIndex);
        // DEBUG_SORT: Log insertIndex received for current rowToInsert
        console.log("[DEBUG_SORT] collectAndSortRows: Received insertIndex:", insertIndex, "for item:", rowToInsert.dateStr);
        
        if (rowToInsert.isSpecialDamage) {
            console.log("[DEBUG] collectAndSortRows: Inserting special damage row with data:", rowToInsert.rowData);
            insertSpecialDamagesRowFromData(
                tableBody,
                insertIndex,
                rowToInsert.rowData,
                finalPeriodStartDate, // This is the parsed date object
                mutableFinalPeriodDetails
            );
        } else if (rowToInsert.isPayment) {
            logger.debug(`[DEBUG rowSorting] collectAndSortRows: Inserting payment row with data: ${JSON.stringify(rowToInsert.rowData)}`); // DEBUG LOG
            const insertedPaymentRow = insertPaymentRowFromData(
                tableBody,
                insertIndex,
                rowToInsert.rowData
            );
            console.log("[DEBUG] collectAndSortRows: Result of insertPaymentRowFromData:", insertedPaymentRow ? "Row inserted" : "No row inserted");
            
            if (insertedPaymentRow) {
                console.log("[DEBUG] collectAndSortRows: Calling handleRowDuplicationAfterPayment for inserted payment row");
                handleRowDuplicationAfterPayment(insertedPaymentRow, tableBody, insertIndex);
            }
        }
    }
}

export function findInsertionIndex(tableBody, dateToInsert, isSpecialDamage, isPayment) {
    // DEBUG_SORT: Log parameters on entry to findInsertionIndex
    console.log("[DEBUG_SORT] findInsertionIndex: Called with dateToInsert:", dateToInsert ? formatDateForDisplay(dateToInsert) : 'null date', "isSpecialDamage:", isSpecialDamage, "isPayment:", isPayment);
    let insertIndex = -1; // Default to append

    for (let i = 0; i < tableBody.rows.length; i++) {
        const currentRow = tableBody.rows[i];
        const currentRowDateCell = currentRow.cells[0];
        let currentRowStartDate = null;
        let currentRowEndDate = null; // For interest calculation rows
        let rawDateSource = ''; // To log the source of the date string

        const isCurrentRowPayment = currentRow.classList.contains('payment-row');
        const isCurrentRowSpecialDamage = currentRow.classList.contains('editable-item-row'); // Assuming this class is added by insertSpecialDamagesRowFromData

        // Try to get date from special damage or payment input fields if they exist
        const sdDateInput = currentRow.querySelector('.special-damages-date');
        const paymentDateInput = currentRow.querySelector('.payment-date'); // Assuming .payment-date exists on payment rows

        if (sdDateInput) {
            rawDateSource = `SD Input Value: '${sdDateInput.value}'`;
            currentRowStartDate = parseDateInput(sdDateInput.value);
        } else if (paymentDateInput) {
            rawDateSource = `Payment Input Value: '${paymentDateInput.value}'`;
            currentRowStartDate = parseDateInput(paymentDateInput.value);
        } else { // It's an interest calculation row
            const dateText = currentRowDateCell.textContent.trim();
            const dateHtml = currentRowDateCell.innerHTML;
            rawDateSource = `Interest Row HTML: '${dateHtml}'`;
            if (dateHtml.includes('<br>')) {
                const dateLines = dateHtml.split('<br>');
                currentRowStartDate = parseDateInput(dateLines[0].trim());
                currentRowEndDate = dateLines[1] ? parseDateInput(dateLines[1].trim()) : null;
            } else {
                currentRowStartDate = parseDateInput(dateText); // Single date (e.g. final period damage calc)
            }
        }

        // DEBUG_SORT: Log details of currentRow inside the loop in findInsertionIndex
        console.log(`[DEBUG_SORT] findInsertionIndex: Row ${i}, Parsed Start: ${currentRowStartDate ? formatDateForDisplay(currentRowStartDate) : 'null'}, Parsed End: ${currentRowEndDate ? formatDateForDisplay(currentRowEndDate) : 'null'}, isSD: ${isCurrentRowSpecialDamage}, isPayment: ${isCurrentRowPayment}, Raw Date Source: ${rawDateSource}`);

        if (currentRowStartDate) {
            if (dateToInsert && datesEqual(dateToInsert, currentRowStartDate)) { // Added null check for dateToInsert
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
    // DEBUG_SORT: Log the returned insertIndex from findInsertionIndex
    console.log("[DEBUG_SORT] findInsertionIndex: Returning insertIndex:", insertIndex);
    return insertIndex;
}

export function handleRowDuplicationAfterPayment(insertedPaymentRow, tableBody, insertIndex) {
    console.log("[DEBUG] handleRowDuplicationAfterPayment: Starting with insertedPaymentRow:", insertedPaymentRow, 
                "tableBody rowCount:", tableBody.rows.length, "original insertIndex:", insertIndex);
    
    // Detailed check of the insertedPaymentRow to verify it's a valid row
    console.log("[DEBUG] handleRowDuplicationAfterPayment: Payment row details:", 
                "instanceof HTMLTableRowElement:", insertedPaymentRow instanceof HTMLTableRowElement,
                "className:", insertedPaymentRow?.className,
                "nodeType:", insertedPaymentRow?.nodeType,
                "parentNode:", insertedPaymentRow?.parentNode);
    
    // Find the actual index of the insertedPaymentRow as DOM might have shifted
    let actualPaymentRowIndex = -1;
    console.log("[DEBUG] handleRowDuplicationAfterPayment: Trying to find payment row index in tableBody.rows");
    for(let i=0; i < tableBody.rows.length; i++) {
        console.log(`[DEBUG] handleRowDuplicationAfterPayment: Checking row ${i}, same as insertedPaymentRow:`, 
                    tableBody.rows[i] === insertedPaymentRow,
                    "row class:", tableBody.rows[i].className);
        if (tableBody.rows[i] === insertedPaymentRow) {
            actualPaymentRowIndex = i;
            break;
        }
    }
    console.log("[DEBUG] handleRowDuplicationAfterPayment: Found actualPaymentRowIndex:", actualPaymentRowIndex);

    // Check if this payment falls on the end date of an interest period
    // by examining the date in the payment row and the date in the previous row
    let isPaymentOnEndDate = false;
    
    if (actualPaymentRowIndex > 0) {
        const targetRowElement = tableBody.rows[actualPaymentRowIndex - 1];
        const paymentDateCell = insertedPaymentRow.cells[0];
        const previousRowDateCell = targetRowElement.cells[0];
        
        // Get payment date
        const paymentDate = paymentDateCell.textContent.trim();
        
        // Get previous row end date - it may be in a <br> format like "2019-06-30<br>2019-07-01"
        let previousRowEndDate = "";
        if (previousRowDateCell.innerHTML.includes('<br>')) {
            const dateLines = previousRowDateCell.innerHTML.split('<br>');
            previousRowEndDate = dateLines[1] ? dateLines[1].trim() : "";
        }
        
        // Check if payment date is exactly the end date of the previous row
        if (paymentDate === previousRowEndDate) {
            isPaymentOnEndDate = true;
            console.log("[DEBUG] handleRowDuplicationAfterPayment: Payment date matches previous row end date, not duplicating");
        }
    }
    
    // Only duplicate the row if it's not a payment on an end date
    if (!isPaymentOnEndDate && actualPaymentRowIndex > 0) {
        const targetRowElement = tableBody.rows[actualPaymentRowIndex - 1];
        // console.log("[DEBUG] handleRowDuplicationAfterPayment: Target row for duplication:", targetRowElement);
        // console.log("[DEBUG] handleRowDuplicationAfterPayment: Target row classes:", targetRowElement.className);
        // console.log("[DEBUG] handleRowDuplicationAfterPayment: Target row innerHTML:", targetRowElement.innerHTML);

        // Ensure target is an interest calculation row (not SD or another payment)
        if (targetRowElement && 
            !targetRowElement.classList.contains('editable-item-row') &&
            !targetRowElement.classList.contains('payment-row')) {
            // console.log("[DEBUG] handleRowDuplicationAfterPayment: Attempting to duplicate target row");
            
            // try {
            //     const duplicatedRowElement = targetRowElement.cloneNode(true);
            //     console.log("[DEBUG] handleRowDuplicationAfterPayment: Successfully cloned target row");
            //     console.log("[DEBUG] handleRowDuplicationAfterPayment: Duplicated row innerHTML:", duplicatedRowElement.innerHTML);
                
            //     // Re-attach click event listener to "add special damages" button in the cloned row
            //     const addButton = duplicatedRowElement.querySelector('.add-special-damages-btn');
            //     if (addButton) {
            //         // Get the date and interest from the button's data attributes
            //         const startDate = addButton.dataset.date;
            //         const interestAmount = addButton.dataset.amount;
                    
            //         // Remove the original non-functional event listener
            //         const newButton = addButton.cloneNode(true);
            //         addButton.parentNode.replaceChild(newButton, addButton);
                    
            //         // Add new event listener with the same functionality as in createAndAddSpecialDamagesButton
            //         newButton.addEventListener('click', async function(event) {
            //             event.preventDefault();
            //             const currentRow = this.closest('tr');
            //             if (!currentRow) {
            //                 console.error("Could not find closest tr to button");
            //                 return;
            //             }

            //             try {
            //                 const { insertSpecialDamagesRow } = await import('./specialDamages.js');
                            
            //                 const currentDate = parseDateInput(startDate);
            //                 if (currentDate) {
            //                     const nextDate = new Date(normalizeDate(currentDate));
            //                     nextDate.setUTCDate(nextDate.getUTCDate() + 1);
            //                     const nextDateFormatted = formatDateForDisplay(nextDate);
            //                     insertSpecialDamagesRow(tableBody, currentRow, nextDateFormatted);
            //                 } else {
            //                     insertSpecialDamagesRow(tableBody, currentRow, startDate);
            //                 }
            //             } catch (e) {
            //                 console.error("Failed to load or execute specialDamages.js module:", e);
            //             }
            //         });
            //     }
                
            //     // Insert the duplicated row immediately after the payment row
            //     if (tableBody.rows[actualPaymentRowIndex + 1]) {
            //         tableBody.insertBefore(duplicatedRowElement, tableBody.rows[actualPaymentRowIndex + 1]);
            //     } else {
            //         tableBody.appendChild(duplicatedRowElement);
            //     }
            // } catch (e) {
            //     console.error("Error duplicating or inserting row:", e);
            // }
            console.log("[DEBUG] handleRowDuplicationAfterPayment: Row duplication logic has been intentionally disabled to prevent visual duplication. The store should provide the correct split rows.");
        }
    }
}
