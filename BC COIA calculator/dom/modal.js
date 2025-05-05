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
        headerTitle.textContent = "Reset Calculator?";
        header.appendChild(headerTitle);
        
        // Create the modal body with explanation of what will be cleared
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        body.innerHTML = `
            <p>Are you sure you want to reset the calculator?</p>
            <div class="clear-details">
                <p>The following changes will be made:</p>
                <ul>
                    <li>Date fields will be set to default values:
                        <ul>
                            <li>Judgment Date: 6 months ago</li>
                            <li>Prejudgment Interest Date: 2 years ago</li>
                            <li>Postjudgment Interest Date: today</li>
                        </ul>
                    </li>
                    <li>All dollar amounts will be cleared</li>
                    <li>Special damage descriptions will be cleared</li>
                    <li>Special damage rows will be removed</li>
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
 * Shows a modal dialog for recording a payment with date and amount fields
 * @param {Date} prejudgmentDate - The prejudgment interest date (for validation)
 * @param {Date} postjudgmentDate - The postjudgment interest date (for validation)
 * @returns {Promise<{date: Date, amount: number} | null>} - Resolves to payment data if confirmed, null if canceled
 */
export function showRecordPaymentModal(prejudgmentDate, postjudgmentDate) {
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
        headerTitle.textContent = "Record Payment";
        header.appendChild(headerTitle);
        
        // Create the modal body with payment form
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        // Create date input field with label
        const dateGroup = document.createElement('div');
        dateGroup.className = 'form-group';
        
        const dateLabel = document.createElement('label');
        dateLabel.setAttribute('for', 'payment-date');
        dateLabel.textContent = 'Date of Payment';
        
        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.id = 'payment-date';
        dateInput.className = 'custom-date-input';
        dateInput.placeholder = 'YYYY-MM-DD';
        
        const dateValidation = document.createElement('div');
        dateValidation.className = 'validation-message';
        
        dateGroup.appendChild(dateLabel);
        dateGroup.appendChild(dateInput);
        dateGroup.appendChild(dateValidation);
        
        // Create amount input field with label
        const amountGroup = document.createElement('div');
        amountGroup.className = 'form-group';
        
        const amountLabel = document.createElement('label');
        amountLabel.setAttribute('for', 'payment-amount');
        amountLabel.textContent = 'Amount of Payment';
        
        const amountInput = document.createElement('input');
        amountInput.type = 'text';
        amountInput.id = 'payment-amount';
        amountInput.placeholder = '$0.00';
        
        const amountValidation = document.createElement('div');
        amountValidation.className = 'validation-message';
        
        amountGroup.appendChild(amountLabel);
        amountGroup.appendChild(amountInput);
        amountGroup.appendChild(amountValidation);
        
        // Add form groups to body
        body.appendChild(dateGroup);
        body.appendChild(amountGroup);
        
        // Create the modal footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'modal-btn modal-btn-cancel';
        cancelButton.textContent = "Cancel";
        
        // Confirm button
        const confirmButton = document.createElement('button');
        confirmButton.className = 'modal-btn modal-btn-confirm';
        confirmButton.textContent = "Confirm";
        confirmButton.disabled = true; // Disabled by default
        
        // Function to close the modal
        const closeModal = (paymentData = null) => {
            // Clean up flatpickr if it was initialized
            if (window.paymentDatepicker) {
                window.paymentDatepicker.destroy();
            }
            
            document.body.removeChild(overlay);
            resolve(paymentData);
        };
        
        // Add click events to the buttons
        cancelButton.addEventListener('click', () => closeModal(null));
        confirmButton.addEventListener('click', () => {
            // Get the selected date from flatpickr
            const selectedDate = window.paymentDatepicker.selectedDates[0];
            
            // Get the amount value and remove formatting
            let amountValue = amountInput.value.replace(/[^0-9.]/g, '');
            amountValue = parseFloat(amountValue);
            
            closeModal({ date: selectedDate, amount: amountValue });
        });
        
        // Allow clicking outside the modal or pressing ESC to close it (as cancel)
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal(null);
            }
        });
        
        document.addEventListener('keydown', function escapeHandler(event) {
            if (event.key === 'Escape') {
                closeModal(null);
                document.removeEventListener('keydown', escapeHandler);
            }
        });
        
        // Assemble the modal
        footer.appendChild(cancelButton);
        footer.appendChild(confirmButton);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        
        // Add the modal to the document
        document.body.appendChild(overlay);

        const today = new Date();
        
        // Initialize the flatpickr date picker
        window.paymentDatepicker = flatpickr(dateInput, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true, // Calendar opens on click/focus
            disableMobile: true,
            monthSelectorType: "dropdown",
            enableTime: false,
            // Set min date to prejudgment date if provided
            minDate: prejudgmentDate || "1993-01-01",
            // Set max date to today (prevent future dates)
            maxDate: today,
            // Set default date to today's date
            defaultDate: today,
            onChange: validateForm
            // Removed onClose handler - defaultDate handles initial state
            // Removed inline and autoOpen options
        });
        
        // Add input handler for amount field
        amountInput.addEventListener('input', function() {
            // Format as currency
            let value = this.value.replace(/[^0-9.]/g, '');
            if (value) {
                // Format with $ and commas
                this.value = '$' + parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            validateForm();
        });
        
        // Function to validate the form and toggle confirm button state
        function validateForm() {
            let isValid = true;
            let dateErrorMessage = '';
            let amountErrorMessage = '';
            
            // Validate date
            const selectedDate = window.paymentDatepicker.selectedDates[0];
            if (!selectedDate) {
                isValid = false;
                dateErrorMessage = 'Please select a payment date';
            }
            
            // Validate amount
            let amountValue = amountInput.value.replace(/[^0-9.]/g, '');
            if (!amountValue) {
                isValid = false;
                amountErrorMessage = 'Please enter a payment amount';
            } else {
                amountValue = parseFloat(amountValue);
                if (amountValue <= 0) {
                    isValid = false;
                    amountErrorMessage = 'Amount must be greater than $0.00';
                }
            }
            
            // Update validation messages
            dateValidation.textContent = dateErrorMessage;
            amountValidation.textContent = amountErrorMessage;
            
            // Toggle confirm button state
            confirmButton.disabled = !isValid;
        }
        
        // Initial validation
        validateForm();
        
        // Focus the amount input for accessibility instead of date input
        // This prevents the date picker from opening automatically on modal load
        amountInput.focus();
    });
}
