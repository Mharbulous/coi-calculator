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
