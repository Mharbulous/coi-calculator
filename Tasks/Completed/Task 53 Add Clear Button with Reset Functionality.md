# Task 53: Add Clear Button with Reset Functionality

## Overview

**IMPORTANT: This is a wireframe implementation only!** This task is focused on adding the Clear button UI elements and preparing the layout. The actual data clearing functionality will be implemented in a future task.

Add a "Clear" button positioned directly below the existing green "Print" button. The button should open a confirmation modal when clicked, but for this phase, the modal will only be for display purposes and won't perform any actual data clearing operations.

## UI Requirements

Button appearance:

*   Position the Clear button directly below the Print button
*   Use soft red color (#e74c3c) with white text
*   Match the width of the Print button
*   Include hover state (darkens to #c0392b)
*   Add 8-10px margin between the Print and Clear buttons

Layout adjustments:

*   Increase spacing between title and summary table (margin-bottom: 60px)
*   Adjust the DEMONSTRATION watermark to maintain proper positioning relative to content (margin-top: 140px)
*   Ensure the top of the summary table aligns approximately with the bottom of the Clear button

Confirmation modal:

*   Display a modal when Clear button is clicked
*   Include clear warning text about data loss
*   Provide "Clear All" confirmation button
*   Allow user to cancel the operation

## Implementation Steps

### 1\. Add Button and CSS Styles

Add styles for the Clear button:

```css
/* Clear button - soft red with white text */
.action-button.clear,
#clear-button {
    background-color: #e74c3c; /* Soft red */
    color: white;
}

.action-button.clear:hover,
#clear-button:hover {
    background-color: #c0392b; /* Darker soft red on hover */
}

/* Position the clear button below print button */
#clear-button {
    position: absolute;
    top: 40px; /* Position below print button with spacing */
    right: 0;
    width: var(--value-width-right);
}
```

Increase spacing below the title container:

```css
#title-container {
    margin-bottom: 60px;
}
```

Adjust the DEMONSTRATION watermark position:

```css
#main-demo-watermark {
    margin-top: 140px; /* Original 100px + 40px additional spacing */
}
```

Add the Print and Clear buttons to the title container in HTML:

```html
<div id="title-container" style="position: relative; text-align: center; margin-bottom: 60px;">
    <h1><i>Court Order Interest Act</i> Calculator</h1>
    <button id="action-button" class="action-button">
        <span class="shimmer-overlay"></span>
    </button>
    <button id="print-button" class="action-button print" style="position: absolute; top: 0; right: 0;">Print</button>
    <button id="clear-button" class="action-button clear" style="position: absolute; top: 40px; right: 0; background-color: #e74c3c; color: white;">Clear</button>
</div>
```

### 2\. Add Modal Functionality for Wireframe (Display Only)

Create a simple event listener file `clear-button-listener.js` with basic modal display:

```javascript
// Simple event listener for the Clear button (wireframe only)
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
```

Add the script to the HTML:

```html
<!-- Load the Clear button functionality -->
<script src="clear-button-listener.js" type="module"></script>
```

**Note:** The full data clearing functionality will be implemented in a future task. The code in this task is for display purposes only.

## Common Obstacles and Solutions

### 1\. Button Not Appearing

**Problem:** The Clear button is not visible on the page.

**Solutions:**

*   Check if the HTML for the Clear button is being properly inserted into the DOM. Use browser dev tools to inspect the `title-container` element.
*   If using JavaScript to inject the button, ensure the script is loaded after the DOM is ready using either DOMContentLoaded or defer attribute.
*   Verify that CSS styles are properly applied - especially check if there's any `display: none` or z-index issues.
*   If the button was added programmatically but doesn't appear, make sure the parent element (title-container) exists before trying to append to it.

### 2\. Button Appears in Wrong Position

**Problem:** The Clear button appears, but not directly below the Print button.

**Solutions:**

*   Check CSS positioning - ensure `position: absolute`, correct `top` and `right` values.
*   Make sure the parent container has `position: relative` for absolute positioning to work correctly.
*   Verify that there are no conflicting styles in other CSS files that might be overriding your positioning.
*   Try using browser dev tools to inspect the button's layout and computed styles.

### 3\. Modal Not Showing When Button is Clicked

**Problem:** Clicking the Clear button doesn't open the confirmation modal.

**Solutions:**

*   Check browser console for JavaScript errors that might prevent event listeners from working properly.
*   Verify that the modal.js file is properly loaded and the showModal/showClearConfirmationModal functions are properly exported.
*   Make sure event listeners are attached to the button and check for any stopPropagation or preventDefault calls that might interfere.
*   Add console.log statements in the click handler to debug the execution flow.

### 4\. Clear Functionality Not Working

**Problem:** The modal appears, but confirming doesn't clear the data as expected.

**Solutions:**

*   Make sure the clearCalculator function is being called when the user confirms the modal action.
*   Check that the state management (Zustand store) methods are properly updating the state.
*   Verify that all selectors for date and amount inputs are correctly targeting the elements to be cleared.
*   Test each part of the clearCalculator function individually to pinpoint where the issue might be.
*   Consider adding more specific error handling and logging to trace the execution flow.

### 5\. Watermark Position Issues

**Problem:** The DEMONSTRATION watermark is not properly positioned after adjusting the spacing.

**Solutions:**

*   Check CSS specificity - make sure your style declarations have enough specificity to override any default styles.
*   Ensure the adjustment to margin-top is being applied to the #main-demo-watermark element specifically.
*   If using print media queries, make sure they're also updated for consistent positioning in print preview.
*   Inspect the element with browser dev tools to see if any other styles are taking precedence.

## Testing Checklist

Visual appearance:

*   Clear button appears directly below Print button
*   Button has the correct soft red color (#e74c3c)
*   Button darkens on hover
*   Spacing between title and summary table is increased

Modal functionality:

*   Clicking Clear button opens confirmation modal
*   Modal displays proper warning text
*   Clicking outside modal or pressing ESC closes it
*   "Clear All" button in modal closes the modal (no actual data clearing)

Layout consistency:

*   Modal appears properly centered
*   Modal text is readable and properly formatted
*   Modal buttons are properly styled and positioned

Layout and spacing:

*   Summary table aligns with bottom of Clear button
*   DEMONSTRATION watermark is properly positioned
*   No unintended layout shifts occur elsewhere in the application

## Summary

This task adds a new Clear button UI element with a confirmation modal, but without actual data clearing functionality. The button is positioned directly below the existing Print button and uses a soft red color to indicate its cautionary nature. This wireframe implementation focuses on visual design and layout changes, with the actual data clearing functionality to be implemented in a future task.

```javascript
// Add import at the top:
import { setupClearButton } from './dom/clear-calculator.js';

// Then call after pagination listeners are set up:
// Initialize pagination listeners
setupPaginationListeners();

// Setup the Clear button
setupClearButton();
```

```html
<!-- Load the Clear button functionality -->
<script src="clear-button-listener.js" type="module"></script>
```

```javascript
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
```

```javascript
import { showClearConfirmationModal } from './modal.js';
import useStore from '../store.js';
import { recalculate } from '../calculator.core.js';
import elements from './elements.js';

/**
 * Clears all calculator values:
 * - Erases all special damage rows
 * - Resets all dates to blank
 * - Sets all dollar amounts to blank
 */
function clearCalculator() {
    // Get the current store state
    const state = useStore.getState();
    
    // 1. Clear special damages
    state.setResults({
        specialDamages: [],
        specialDamagesTotal: 0
    });
    
    // 2. Clear all date fields and amounts in the UI
    const dateInputs = document.querySelectorAll('input[data-input*="Date"], input.custom-date-input');
    dateInputs.forEach(input => {
        if (input !== elements.judgmentDateInput) { // Keep judgment date as is
            input.value = '';
        }
    });
    
    // 3. Clear all amount fields
    const amountInputs = document.querySelectorAll('input[data-input*="amount"], input[data-input*="Amount"]');
    amountInputs.forEach(input => {
        input.value = '';
    });
    
    // 4. Update the store with empty values
    state.setInputs({
        judgmentAwarded: 0,
        nonPecuniaryAwarded: 0,
        costsAwarded: 0,
        prejudgmentStartDate: null,
        postjudgmentEndDate: null
    });
    
    // 5. Recalculate everything with the cleared values
    recalculate();
    
    // 6. Trigger content-changed event to update pagination
    document.dispatchEvent(new CustomEvent('content-changed'));
}

/**
 * Adds a Clear button to the UI
 */
export function setupClearButton() {
    // Check if there's already a print button to position relative to
    const titleContainer = document.getElementById('title-container');
    const existingPrintButton = document.getElementById('print-button');
    
    if (!titleContainer || !existingPrintButton) {
        console.error('Cannot add Clear button: title container or print button not found');
        return;
    }
    
    // Create the Clear button
    const clearButton = document.createElement('button');
    clearButton.id = 'clear-button';
    clearButton.className = 'action-button clear';
    clearButton.textContent = 'Clear';
    
    // Add the button to the page
    titleContainer.appendChild(clearButton);
    
    // Add click event listener with confirmation modal
    clearButton.addEventListener('click', () => {
        showClearConfirmationModal(clearCalculator);
    });
}
```

```javascript
/**
 * Show a confirmation dialog for clearing all calculator values
 * @param {Function} onConfirm - Callback function to execute if user confirms the action
 */
export function showClearConfirmationModal(onConfirm) {
    return showModal(
        "Clear Calculator?",
        "This will erase all special damage rows, reset all dates to blank, and set all dollar amounts to blank. This action cannot be undone.",
        "Clear All",
        onConfirm
    );
}
```

```html
<div id="title-container" style="position: relative; text-align: center; margin-bottom: 60px;">
    <h1><i>Court Order Interest Act</i> Calculator</h1>
    <button id="action-button" class="action-button">
        <span class="shimmer-overlay"></span>
    </button>
    <button id="print-button" class="action-button print" style="position: absolute; top: 0; right: 0;">Print</button>
    <button id="clear-button" class="action-button clear" style="position: absolute; top: 40px; right: 0; background-color: #e74c3c; color: white;">Clear</button>
</div>
```

```css
#main-demo-watermark {
    margin-top: 140px; /* Original 100px + 40px additional spacing */
}
```

```css
#title-container {
    margin-bottom: 60px;
}
```

```css
/* Clear button - soft red with white text */
.action-button.clear,
#clear-button {
    background-color: #e74c3c; /* Soft red */
    color: white;
}

.action-button.clear:hover,
#clear-button:hover {
    background-color: #c0392b; /* Darker soft red on hover */
}

/* Position the clear button below print button */
#clear-button {
    position: absolute;
    top: 40px; /* Position below print button with spacing */
    right: 0;
    width: var(--value-width-right);
}
```