// Simple event listener for the Clear button
// This only adds the confirmation modal functionality without actual data clearing
import { showModal } from './dom/modal.js';

document.addEventListener('DOMContentLoaded', () => {
    const clearButton = document.getElementById('clear-button');
    
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            showModal(
                "Clear Calculator?",
                "This will erase all special damage rows, reset all dates to blank, and set all dollar amounts to blank. This action cannot be undone.",
                "Clear All"
            );
        });
    }
});
