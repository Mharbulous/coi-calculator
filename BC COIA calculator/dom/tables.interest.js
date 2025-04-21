import { parseDateInput, formatDateForDisplay, normalizeDate } from '../utils.date.js';
import { formatCurrencyForDisplay } from '../utils.currency.js';
import elements from './elements.js';
import { insertSpecialDamagesRowFromData } from './specialDamages.js';
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
                // Log for debugging
                console.log('Getting special damages from store for table rendering:', state.results.specialDamages);
                
                // Format store values for DOM insertion
                state.results.specialDamages.forEach(damage => {
                    existingSpecialDamagesRows.push({
                        date: damage.date, // Already in YYYY-MM-DD format
                        description: damage.description,
                        amount: damage.amount.toString() // Convert to string for consistent handling
                    });
                });
                
                // Log the formatted rows we'll insert
                console.log('Formatted special damages rows for insertion:', existingSpecialDamagesRows);
            } else {
                console.log('No special damages found in store, table will be empty');
            }
        } else {
            console.log('Using special damages rows collected from DOM:', existingSpecialDamagesRows.length, 'rows');
        }
    }
    
    // Clear previous rows
    tableBody.innerHTML = '';

    // Populate new rows (assuming 5 columns: Date/Period, Description, Rate, Principal, Interest)
    details.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = item.start; // Expect formatted date/period start
        
        // Description cell with potential button
        const descCell = row.insertCell();
        
        // Create a container for description and button
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'description-container';
        
        // Add the description text
        const descriptionText = document.createElement('span');
        descriptionText.textContent = item.description;
        descriptionContainer.appendChild(descriptionText);

        // Add the "add special damages" button only for regular period rows (not final period damage calc rows)
        // with interest in the prejudgment table
        if (isPrejudgmentTable && item.interest > 0 && !item.isFinalPeriodDamage) {
            const addButton = document.createElement('button');
            addButton.textContent = 'add special damages';
            addButton.className = 'add-special-damages-btn';
            addButton.dataset.date = item.start;
            addButton.dataset.amount = item.interest;
            
            // Add click event listener
            addButton.addEventListener('click', function(event) {
                event.preventDefault();
                console.log('Add special damages clicked for:', item);
                
                // Get the current row
                const currentRow = this.closest('tr');
                if (!currentRow) return;
                
                // Create a new special damages row with date +1 day from the current row date
                import('./specialDamages.js').then(module => {
                    // Parse the current row date
                    const currentDate = parseDateInput(item.start);
                    if (currentDate) {
                        // Add one day to the date
                        const nextDate = new Date(normalizeDate(currentDate));
                        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
                        
                        // Format it back to YYYY-MM-DD
                        const nextDateFormatted = formatDateForDisplay(nextDate);
                        
                        // Use this new date for the special damages row
                        module.insertSpecialDamagesRow(tableBody, currentRow, nextDateFormatted);
                    } else {
                        // Fallback to current date if parsing fails
                        module.insertSpecialDamagesRow(tableBody, currentRow, item.start);
                    }
                });
            });
            
            descriptionContainer.appendChild(addButton);
        }
        
        descCell.appendChild(descriptionContainer);
        
        row.insertCell().textContent = item.rate.toFixed(2) + '%';
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.principal); // Principal for the period
        row.insertCell().innerHTML = formatCurrencyForDisplay(item.interest); // Interest for the period

        // Apply text alignment via CSS classes (adjust indices if needed)
        row.cells[0].classList.add('text-left');   // Date/Period
        row.cells[1].classList.add('text-left');   // Description
        row.cells[2].classList.add('text-center'); // Rate
        row.cells[3].classList.add('text-right');  // Principal
        row.cells[4].classList.add('text-right');  // Interest
    });

    // Re-insert existing special damages rows in correct sorted order
    if (isPrejudgmentTable && existingSpecialDamagesRows.length > 0) {
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

        // Parse all special damages dates first and add to our collection for sorting
        const allRowsToInsert = existingSpecialDamagesRows.map(rowData => {
            const date = parseDateInput(rowData.date);
            return {
                date: date,
                dateStr: rowData.date,
                isSpecialDamage: true,
                rowData: rowData
            };
        }).filter(item => item.date !== null); // Filter out invalid dates

        // Sort all rows chronologically
        allRowsToInsert.sort((a, b) => a.date - b.date);

        // Now insert each special damages row at the correct position
        for (const rowToInsert of allRowsToInsert) {
            let insertIndex = -1; // Default to append at end
            
            // Find where to insert this row based on date
            for (let i = 0; i < tableBody.rows.length; i++) {
                const currentRow = tableBody.rows[i];
                const currentRowDateCell = currentRow.cells[0];
                let currentRowDate = null;
                
                // Check if current row is a special damages row (already inserted)
                const dateInput = currentRow.querySelector('.special-damages-date');
                if (dateInput) {
                    currentRowDate = parseDateInput(dateInput.value);
                } else {
                    // Otherwise it's a calculated row
                    const dateStr = currentRowDateCell.textContent.trim();
                    currentRowDate = parseDateInput(dateStr);
                }
                
                // Compare dates for insertion position
                if (currentRowDate && rowToInsert.date <= currentRowDate) {
                    insertIndex = i;
                    break;
                }
            }
            
            // Insert the special damages row at the determined position
            insertSpecialDamagesRowFromData(
                tableBody, 
                insertIndex, 
                rowToInsert.rowData, 
                finalPeriodStartDate, 
                mutableFinalPeriodDetails
            );
        }
    }

    // Update totals in the footer
    if (principalTotalElement && principalTotal !== null && !isPrejudgmentTable) {
        // Only update the principal total for non-prejudgment tables
        principalTotalElement.innerHTML = formatCurrencyForDisplay(principalTotal);
    }
    interestTotalElement.innerHTML = formatCurrencyForDisplay(interestTotal);
    
    // Add date and total days to the footer row
    const table = tableBody.closest('table');
    if (table) {
        const footerRow = table.querySelector('tfoot tr.total');
        if (footerRow && footerRow.cells.length > 0) {
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
            
            // Update the text in the first cell (which has colspan="2")
            if (dateToShow) {
                const firstCell = footerRow.cells[0];
                
                // Create a container for date and total days
                const footerContainer = document.createElement('div');
                footerContainer.style.display = 'flex';
                footerContainer.style.justifyContent = 'space-between';
                footerContainer.style.width = '100%';
                
                // Create a span for the date
                const dateSpan = document.createElement('span');
                dateSpan.textContent = dateToShow;
                dateSpan.style.textAlign = 'left';
                dateSpan.style.fontWeight = 'normal'; // Changed from bold to normal to match the total days style
                
                // Create a span for the total days
                const daysSpan = document.createElement('span');
                daysSpan.textContent = `Total: ${totalDays} days`;
                daysSpan.style.textAlign = 'right';
                daysSpan.style.fontWeight = 'normal';
                
                // Add both spans to the container
                footerContainer.appendChild(dateSpan);
                footerContainer.appendChild(daysSpan);
                
                // Clear the cell and add the container
                firstCell.innerHTML = '';
                firstCell.appendChild(footerContainer);
            }
        }
    }
}
