/**
 * Modal utility functions for custom dialog boxes
 */

/**
 * Creates and shows a modal dialog with the specified title, message, and button text
 * @param {string} title - The title of the modal
 * @param {string} message - The message to display in the modal
 * @param {string} buttonText - The text for the button (defaults to "OK")
 * @param {Function} onClose - Optional callback function to execute when the modal is closed
 */
export function showModal(title, message, buttonText = "OK", onClose = null) {
    // Create the modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create the modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Create the modal header
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = title;
    header.appendChild(headerTitle);
    
    // Create the modal body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = message;
    
    // Create the modal footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    const button = document.createElement('button');
    button.className = 'modal-btn';
    button.textContent = buttonText;
    
    // Function to close the modal
    const closeModal = () => {
        document.body.removeChild(overlay);
        if (onClose && typeof onClose === 'function') {
            onClose();
        }
    };
    
    // Add click event to the button
    button.addEventListener('click', closeModal);
    
    // Allow clicking outside the modal or pressing ESC to close it
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function escapeHandler(event) {
        if (event.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
    
    // Assemble the modal
    footer.appendChild(button);
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    
    // Add the modal to the document
    document.body.appendChild(overlay);
    
    // Focus the button for accessibility
    button.focus();
    
    // Return a function that can be used to close the modal programmatically
    return closeModal;
}

/**
 * Shows a confirmation dialog specific to special damages deletion with details
 * @param {string} date - The date of the special damage (formatted)
 * @param {string} description - The description of the special damage
 * @param {string} amount - The formatted amount of the special damage
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if canceled
 */
export function showSpecialDamagesConfirmationModal(date, description, amount) {
    return new Promise((resolve) => {
        // Create the modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // Create the modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Create the modal header
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = "Delete Special Damages Row?";
        header.appendChild(headerTitle);
        
        // Create the modal body with special damages details
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        // Format the details as a list
        body.innerHTML = `
            <p>Are you sure you want to delete this special damage?</p>
            <div class="special-damage-details">
                <div><strong>Date:</strong> ${date}</div>
                <div><strong>Description:</strong> ${description || '(No description)'}</div>
                <div><strong>Amount:</strong> ${amount}</div>
            </div>
        `;
        
        // Create the modal footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'modal-btn modal-btn-cancel';
        cancelButton.textContent = "Cancel";
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'modal-btn modal-btn-delete';
        deleteButton.textContent = "Delete";
        
        // Function to close the modal
        const closeModal = (confirmed) => {
            document.body.removeChild(overlay);
            resolve(confirmed);
        };
        
        // Add click events to the buttons
        cancelButton.addEventListener('click', () => closeModal(false));
        deleteButton.addEventListener('click', () => closeModal(true));
        
        // Allow clicking outside the modal or pressing ESC to close it (as cancel)
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal(false);
            }
        });
        
        document.addEventListener('keydown', function escapeHandler(event) {
            if (event.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        // Assemble the modal
        footer.appendChild(cancelButton);
        footer.appendChild(deleteButton);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        
        // Add the modal to the document
        document.body.appendChild(overlay);
        
        // Focus the delete button for accessibility
        deleteButton.focus();
    });
}

/**
 * Shows a confirmation dialog for clearing all editable fields in the calculator
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if canceled
 */
export function showClearConfirmationModal() {
    return new Promise((resolve) => {
        // Create the modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // Create the modal container
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Create the modal header
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = "Are you sure you want to reset the calculator?";
        header.appendChild(headerTitle);
        
        // Create the modal body with explanation of what will be cleared
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        body.innerHTML = `
            
            <div class="clear-details">
                <p>Clearing will result in the following changes:</p>
                <ul>
                    <li>Date fields will be set to default values:
                        <ul>
                            <li>Judgment Date: 6 months ago</li>
                            <li>Prejudgment Interest Date: 2 years ago</li>
                            <li>Postjudgment Interest Date: today</li>
                        </ul>
                    </li>
                    <li>All dollar amounts will be cleared.</li>
                    <li>All special damages rows will be deleted.</li>                    
                </ul>                
            </div>
        `;
        
        // Create the modal footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'modal-btn modal-btn-cancel';
        cancelButton.textContent = "Cancel";
        
        // Clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'modal-btn modal-btn-delete';
        clearButton.textContent = "Clear";
        
        // Function to close the modal
        const closeModal = (confirmed) => {
            document.body.removeChild(overlay);
            resolve(confirmed);
        };
        
        // Add click events to the buttons
        cancelButton.addEventListener('click', () => closeModal(false));
        clearButton.addEventListener('click', () => closeModal(true));
        
        // Allow clicking outside the modal or pressing ESC to close it (as cancel)
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal(false);
            }
        });
        
        document.addEventListener('keydown', function escapeHandler(event) {
            if (event.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        // Assemble the modal
        footer.appendChild(cancelButton);
        footer.appendChild(clearButton);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        
        // Add the modal to the document
        document.body.appendChild(overlay);
        
        // Focus the clear button for accessibility
        clearButton.focus();
    });
}

/**
 * Show a confirmation dialog specific to special damages deletion
 * @deprecated Use showSpecialDamagesConfirmationModal instead
 */
export function showSpecialDamagesDeletionModal() {
    return showModal(
        "Delete Special Damages Row?",
        "Delete description and change value to $0.00 before deleting row.",
        "OK"
    );
}

/**
 * Creates and shows a modal dialog for recording a payment
 * @param {Date} prejudgmentDate - The prejudgment interest start date
 * @param {Date} postjudgmentDate - The postjudgment interest end date
 * @returns {Promise<Object|null>} - Resolves to payment details object if confirmed, null if canceled
 */
export function promptForPaymentDetails(prejudgmentDate, postjudgmentDate) {
    return new Promise((resolve) => {
        // Import necessary utilities for currency formatting and form handling
        Promise.all([
            import('../utils.currency.js'),
            import('./setup.js')
        ]).then(([currencyUtils, setupUtils]) => {
            const { formatCurrencyForInputWithCommas, parseCurrency } = currencyUtils;
            const { setupCurrencyInputListeners } = setupUtils;
            console.log('Payment modal called with dates:', prejudgmentDate, postjudgmentDate);
            
            // Create the modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'payment-modal-overlay';
            
            // Create the modal container
            const modal = document.createElement('div');
            modal.className = 'payment-modal';
            
            // Create the modal header
            const header = document.createElement('div');
            header.className = 'payment-modal-header';
            
            const headerTitle = document.createElement('h3');
            headerTitle.textContent = "Record Payment";
            header.appendChild(headerTitle);
            
            // Create the modal body with form
            const body = document.createElement('div');
            body.className = 'payment-modal-body';
            
            // Amount of Payment form group
            const amountGroup = document.createElement('div');
            amountGroup.className = 'form-group';
            
            const amountLabel = document.createElement('label');
            amountLabel.textContent = "Amount of Payment";
            amountLabel.htmlFor = "payment-amount-input";
            
            const amountInput = document.createElement('input');
            amountInput.type = "text";
            amountInput.id = "payment-amount-input";
            amountInput.placeholder = "Enter payment amount";
            
            const amountValidation = document.createElement('div');
            amountValidation.className = 'validation-message';
            
            amountGroup.appendChild(amountLabel);
            amountGroup.appendChild(amountInput);
            amountGroup.appendChild(amountValidation);
            
            // Date of Payment form group
            const dateGroup = document.createElement('div');
            dateGroup.className = 'form-group';
            
            const dateLabel = document.createElement('label');
            dateLabel.textContent = "Date of Payment";
            dateLabel.htmlFor = "payment-date-input";
            
            const dateInput = document.createElement('input');
            dateInput.type = "text";
            dateInput.id = "payment-date-input";
            dateInput.placeholder = "Select a date";
            
            const dateValidation = document.createElement('div');
            dateValidation.className = 'validation-message';
            
            dateGroup.appendChild(dateLabel);
            dateGroup.appendChild(dateInput);
            dateGroup.appendChild(dateValidation);
            
            // Add form groups to the body
            body.appendChild(amountGroup);
            body.appendChild(dateGroup);
            
            // Create the modal footer
            const footer = document.createElement('div');
            footer.className = 'payment-modal-footer';
            
            // Cancel button
            const cancelButton = document.createElement('button');
            cancelButton.className = 'payment-modal-btn payment-modal-btn-cancel';
            cancelButton.textContent = "Cancel";
            
            // Confirm button
            const confirmButton = document.createElement('button');
            confirmButton.className = 'payment-modal-btn payment-modal-btn-confirm';
            confirmButton.textContent = "Confirm";
            
            // Create a wrapper div for the Flatpickr to be attached to
            // This helps with proper positioning
            const flatpickrContainer = document.createElement('div');
            flatpickrContainer.className = 'flatpickr-container';
            flatpickrContainer.style.position = 'fixed';
            flatpickrContainer.style.zIndex = '99999';
            flatpickrContainer.style.top = '0';
            flatpickrContainer.style.left = '0';
            flatpickrContainer.style.width = '100%';
            flatpickrContainer.style.height = '0';
            document.body.appendChild(flatpickrContainer);
            
            // Initialize Flatpickr with container as the appendTo target
            const minDate = prejudgmentDate instanceof Date && !isNaN(prejudgmentDate) 
                ? prejudgmentDate 
                : "1993-01-01"; // Fallback date if prejudgmentDate is invalid
                
            let datePickerInstance;
                
            // Helper function to close the modal
            const closeModal = (result = null) => {
                // Clean up Flatpickr instance to prevent memory leaks
                if (datePickerInstance) {
                    datePickerInstance.destroy();
                }
                
                // Remove the Flatpickr container from the DOM
                if (flatpickrContainer && flatpickrContainer.parentNode) {
                    document.body.removeChild(flatpickrContainer);
                }
                
                // Remove the Escape key event listener from document
                document.removeEventListener('keydown', escapeKeyHandler);
                
                // Remove the modal overlay from the document
                document.body.removeChild(overlay);
                
                // Resolve the promise with the result
                resolve(result);
            };
            
            // Define a validation function
            const validateForm = () => {
                const date = datePickerInstance?.selectedDates?.[0];
                const amountValue = amountInput.value.trim();
                
                // Parse the amount value, removing any currency symbols and commas
                const parsedAmount = parseCurrency(amountValue);
                
                // Validate date
                const isDateValid = date instanceof Date && !isNaN(date);
                
                // Validate amount
                const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
                
                // Update validation messages
                if (!isDateValid) {
                    dateValidation.textContent = "Please select a payment date";
                } else {
                    dateValidation.textContent = "";
                }
                
                if (amountValue === '') {
                    amountValidation.textContent = "Please enter a payment amount";
                } else if (isNaN(parsedAmount)) {
                    amountValidation.textContent = "Please enter a valid amount";
                } else if (parsedAmount <= 0) {
                    amountValidation.textContent = "Amount must be greater than $0.00";
                } else {
                    amountValidation.textContent = "";
                }
                
                // Determine overall form validity
                const isFormValid = isDateValid && isAmountValid;
                
                // Update confirm button state
                confirmButton.disabled = !isFormValid;
                
                return {
                    isValid: isFormValid,
                    parsedAmount,
                    date
                };
            };
            
            // Initialize Flatpickr on the date input
            datePickerInstance = flatpickr(dateInput, {
                dateFormat: "Y-m-d",
                allowInput: true,
                disableMobile: true,
                minDate: minDate,
                maxDate: "today",
                defaultDate: "today",
                onChange: function(selectedDates, dateStr) {
                    console.log("Selected date:", dateStr);
                    // Validate form when date changes
                    validateForm();
                },
                appendTo: flatpickrContainer,
                position: "below",
                static: false, // Don't use static positioning
                onOpen: function(selectedDates, dateStr, instance) {
                    // Position the calendar below the input
                    const inputRect = dateInput.getBoundingClientRect();
                    const calendar = instance.calendarContainer;
                    
                    // Position calendar below the input field
                    calendar.style.position = 'fixed';
                    calendar.style.top = (inputRect.bottom + 2) + 'px';
                    calendar.style.left = inputRect.left + 'px';
                    calendar.style.zIndex = '99999';
                }
            });
            
            // Event handler for Escape key
            function escapeKeyHandler(event) {
                if (event.key === 'Escape') {
                    closeModal(null);
                }
            }
            
            // Add click events to the buttons
            cancelButton.addEventListener('click', () => closeModal(null));
            
            confirmButton.addEventListener('click', () => {
                const validation = validateForm();
                
                if (validation.isValid) {
                    closeModal({
                        date: validation.date,
                        amount: validation.parsedAmount
                    });
                }
            });
            
            // Allow clicking outside the modal to close it (as cancel)
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    closeModal(null);
                }
            });
            
            // Add Escape key handler
            document.addEventListener('keydown', escapeKeyHandler);
            
            // Set up currency formatting for the amount input field using the standard app function
            setupCurrencyInputListeners(amountInput, validateForm);
            
            // Assemble the modal
            footer.appendChild(cancelButton);
            footer.appendChild(confirmButton);
            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            
            // Add the modal to the document
            document.body.appendChild(overlay);
            
            // Run initial validation to set confirm button state and display validation messages
            validateForm();
            
            // Focus the amount input for accessibility since it's now the first field
            // Use requestAnimationFrame to ensure the layout is stable before focusing
            requestAnimationFrame(() => {
                amountInput.focus();
            });
        }).catch(error => {
            console.error('Error loading currency utilities:', error);
            resolve(null);
        });
    });
}
