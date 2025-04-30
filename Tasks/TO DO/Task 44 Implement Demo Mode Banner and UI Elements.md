# Task 44: Implement Demo Mode Banner and UI Elements

## Objective

Create the visual elements needed for the demo mode in the COI Calculator, including a banner and the "Get Accurate Results" payment button.

## Estimated Time

1-2 hours

## Prerequisites

*   Understanding of the current UI structure
*   Basic knowledge of HTML/CSS

## Tasks

### 1\. Create Demo Mode Banner

*   Add a modal pop-up that is triggered after the user changes the Judgment Date, or the General Damages & Debt $ amount, with a message:  "The interest rates used in this demonstratoin version of this app for for demonstation purposes only.  Accurate court order interest rates are only in the paid version."  Followed by buttons "Dismiss", and "Purchase"
*   Ensure the banner is responsive and displays correctly on all screen sizes

### 2\. Add "Demo Mode" Watermark

*   Create a subtle watermark that displays "Demonstration" across calculation results.  Only one watermark per page.  
*   Ensure the watermark is visible but doesn't interfere with reading the results
*   Make sure the watermark appears on printed versions as well

### 3\. Create Payment Button

*   Add a prominent "Purchase Calculation- $24.99" button
*   Position the button in a highly visible location (e.g., below the banner, above results)
*   Style the button to draw attention (contrasting color, appropriate size)
*   Add hover effects for better user experience

### 4\. Add Explanatory Text

*   Create a short explanation about the demo mode and the benefits of purchasing
*   Add a tooltip to the payment button explaining what the user gets for $24.99
*   Ensure all text is clear and persuasive

## Implementation Details

### HTML for Banner

```html
<div id="demo-mode-banner" class="demo-banner">
  <span>DEMO MODE - Using approximate interest rates</span>
  <button id="get-accurate-results" class="payment-button">Get Accurate Results - $24.99</button>
</div>
```

### CSS for Demo Elements

```css
.demo-banner {
  background-color: #ffeb3b;
  color: #000;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.demo-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 4rem;
  opacity: 0.15;
  color: #ff0000;
  pointer-events: none;
  white-space: nowrap;
  z-index: 100;
}

.payment-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 15px;
  transition: background-color 0.3s;
}

.payment-button:hover {
  background-color: #45a049;
}
```

### JavaScript for Demo UI Elements

```javascript
function setupDemoUI() {
  // Add demo banner to DOM
  const bannerHTML = `
    <div id="demo-mode-banner" class="demo-banner">
      <span>DEMO MODE - Using approximate interest rates</span>
      <button id="get-accurate-results" class="payment-button">Get Accurate Results - $24.99</button>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', bannerHTML);
  
  // Add watermark to result sections
  const resultContainers = document.querySelectorAll('.results-container');
  resultContainers.forEach(container => {
    const watermark = document.createElement('div');
    watermark.classList.add('demo-watermark');
    watermark.textContent = 'Demonstration Only';
    container.style.position = 'relative';
    container.appendChild(watermark);
  });
  
  // Setup payment button click handler (placeholder)
  document.getElementById('get-accurate-results').addEventListener('click', () => {
    console.log('Payment button clicked - will implement payment flow later');
    // Will be implemented in Task 46
  });
}

// Call this function after the DOM is loaded
document.addEventListener('DOMContentLoaded', setupDemoUI);
```

## Acceptance Criteria

*   Demo mode banner is clearly visible at the top of the application
*   "Demonstration Only" watermark appears on all calculation results
*   Payment button is visible and styled appropriately
*   All UI elements are responsive and work on different screen sizes
*   Watermark appears in printed versions of the results

## Notes

*   Consider using a CSS framework like Bootstrap for consistent styling if already in use
*   Ensure the banner doesn't interfere with existing UI elements
*   The final implementation of the payment button click handler will be done in a later task