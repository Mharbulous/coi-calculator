# Task A.3: Implement UI Enhancements for Demo Mode

## Overview
This task involves creating UI elements to clearly indicate when the application is running in demo mode. These elements include watermarks, banners, and warning messages that ensure users understand they are using a version with intentionally incorrect interest rates.

## Implementation Details

### 1. Create Watermark Component
Implement a prominent watermark that appears on both screen display and printed output:

```css
/* CSS for watermark - add to a new file: styles/components/demo-watermark.css */
.demo-watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 5rem;
  color: rgba(255, 0, 0, 0.2);
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  font-weight: bold;
  text-transform: uppercase;
}

/* Print-specific watermark */
@media print {
  .demo-watermark {
    position: fixed;
    font-size: 3rem;
    color: rgba(255, 0, 0, 0.4);
    page-break-after: always;
    page-break-before: always;
  }
  
  /* Add watermark to each page when printing */
  @page {
    margin: 0.5cm;
  }
  
  body::after {
    content: "DEMO VERSION - INCORRECT RATES";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: rgba(255, 0, 0, 0.2);
    transform: rotate(-45deg);
    pointer-events: none;
  }
}
```

```javascript
// JavaScript function to add watermark to DOM
function addDemoWatermark() {
  const watermark = document.createElement('div');
  watermark.className = 'demo-watermark';
  watermark.textContent = 'DEMO VERSION - INCORRECT RATES';
  document.body.appendChild(watermark);
}

function removeDemoWatermark() {
  const watermark = document.querySelector('.demo-watermark');
  if (watermark) {
    watermark.remove();
  }
}
```

### 2. Create Demo Banner
Implement a persistent banner at the top of the application to indicate demo mode:

```html
<!-- HTML template for demo banner -->
<template id="demo-banner-template">
  <div class="demo-banner">
    <div class="demo-banner-content">
      <p>DEMONSTRATION VERSION - Interest rates shown are intentionally incorrect</p>
      <button id="upgrade-button" class="upgrade-button">Upgrade to Full Version</button>
    </div>
  </div>
</template>
```

```css
/* CSS for demo banner - add to styles/components/demo-banner.css */
.demo-banner {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #ffcc00;
  color: #333;
  z-index: 1001;
  font-weight: bold;
  padding: 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.demo-banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.demo-banner p {
  margin: 0;
}

.upgrade-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upgrade-button:hover {
  background-color: #c0392b;
}

/* Hide banner when printing */
@media print {
  .demo-banner {
    display: none;
  }
}
```

```javascript
// JavaScript function to add banner to DOM
function addDemoBanner() {
  const template = document.getElementById('demo-banner-template');
  if (!template) return;
  
  const banner = template.content.cloneNode(true);
  document.body.prepend(banner);
  
  // Add event listener to upgrade button
  const upgradeButton = document.getElementById('upgrade-button');
  if (upgradeButton) {
    upgradeButton.addEventListener('click', () => {
      // Show payment modal
      if (typeof paymentUI !== 'undefined' && paymentUI.showPaymentModal) {
        paymentUI.showPaymentModal();
      }
    });
  }
}

function removeDemoBanner() {
  const banner = document.querySelector('.demo-banner');
  if (banner) {
    banner.remove();
  }
}
```

### 3. Add Warning Text to Results
Add clear warning messages to calculation results:

```javascript
// Function to add warning text to calculation results
function addWarningToResults() {
  // Add warning text to summary table
  const summaryTable = document.querySelector('.summary-table');
  if (summaryTable) {
    const warningRow = document.createElement('tr');
    warningRow.className = 'demo-warning-row';
    warningRow.innerHTML = `
      <td colspan="3" class="demo-warning">
        <strong>WARNING:</strong> These calculations use DEMO interest rates which are 
        intentionally incorrect. For accurate calculations, please 
        <a href="#" class="upgrade-link">upgrade to the full version</a>.
      </td>
    `;
    summaryTable.querySelector('tbody').appendChild(warningRow);
    
    // Add event listener to upgrade link
    const upgradeLink = warningRow.querySelector('.upgrade-link');
    upgradeLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof paymentUI !== 'undefined' && paymentUI.showPaymentModal) {
        paymentUI.showPaymentModal();
      }
    });
  }
  
  // Add warning text to interest tables
  const interestTables = document.querySelectorAll('.interest-table');
  interestTables.forEach(table => {
    const footer = table.querySelector('tfoot');
    if (footer) {
      const warningRow = document.createElement('tr');
      warningRow.className = 'demo-warning-row';
      warningRow.innerHTML = `
        <td colspan="5" class="demo-warning">
          <strong>NOTE:</strong> Demo rates are deliberately inaccurate.
          <button class="small-upgrade-button">Get Accurate Rates</button>
        </td>
      `;
      footer.appendChild(warningRow);
      
      // Add event listener to small upgrade button
      const smallUpgradeButton = warningRow.querySelector('.small-upgrade-button');
      smallUpgradeButton.addEventListener('click', () => {
        if (typeof paymentUI !== 'undefined' && paymentUI.showPaymentModal) {
          paymentUI.showPaymentModal();
        }
      });
    }
  });
}

function removeWarningsFromResults() {
  // Remove all warning elements
  document.querySelectorAll('.demo-warning-row').forEach(elem => elem.remove());
}
```

```css
/* CSS for warning messages - add to styles/components/demo-warnings.css */
.demo-warning {
  background-color: #fff3cd;
  color: #856404;
  padding: 10px;
  text-align: center;
  font-size: 0.9rem;
  border-top: 1px solid #ffeeba;
}

.small-upgrade-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.8rem;
  margin-left: 10px;
  cursor: pointer;
}

.small-upgrade-button:hover {
  background-color: #0069d9;
}

.upgrade-link {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}

.upgrade-link:hover {
  color: #0056b3;
}
```

### 4. Combine UI Components in a Demo Mode Manager
Create a manager to handle demo mode UI elements:

```javascript
// Create a demo mode UI manager - add to a new file: demo-mode-ui.js
export class DemoModeUI {
  constructor() {
    this.isActive = false;
    this.init();
  }
  
  init() {
    // Import demo mode CSS
    this.loadDemoStyles();
    
    // Add demo banner template to DOM
    this.addBannerTemplate();
    
    // Listen for mode change events
    document.addEventListener('mode-changed', (event) => {
      if (event.detail.mode === 'demo') {
        this.activate();
      } else {
        this.deactivate();
      }
    });
  }
  
  loadDemoStyles() {
    // Dynamically load demo mode CSS files
    const cssFiles = [
      'styles/components/demo-watermark.css',
      'styles/components/demo-banner.css',
      'styles/components/demo-warnings.css'
    ];
    
    cssFiles.forEach(file => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = file;
      link.className = 'demo-mode-css';
      document.head.appendChild(link);
    });
  }
  
  addBannerTemplate() {
    const template = document.createElement('template');
    template.id = 'demo-banner-template';
    template.innerHTML = `
      <div class="demo-banner">
        <div class="demo-banner-content">
          <p>DEMONSTRATION VERSION - Interest rates shown are intentionally incorrect</p>
          <button id="upgrade-button" class="upgrade-button">Upgrade to Full Version</button>
        </div>
      </div>
    `;
    document.body.appendChild(template);
  }
  
  activate() {
    if (this.isActive) return;
    
    addDemoWatermark();
    addDemoBanner();
    addWarningToResults();
    
    this.isActive = true;
    console.log('Demo mode UI activated');
  }
  
  deactivate() {
    if (!this.isActive) return;
    
    removeDemoWatermark();
    removeDemoBanner();
    removeWarningsFromResults();
    
    this.isActive = false;
    console.log('Demo mode UI deactivated');
  }
  
  // Method to update warnings after calculation results change
  updateWarnings() {
    if (!this.isActive) return;
    
    removeWarningsFromResults();
    addWarningToResults();
  }
}

// Export a singleton instance
export const demoModeUI = new DemoModeUI();
export default demoModeUI;
```

### 5. Integration with Main Application
Add integration points to the main application:

```javascript
// In calculator.ui.js, after initialization:
import { demoModeUI } from './demo-mode-ui.js';

// After recalculating results
function afterResultsUpdated() {
  // Update demo warnings if in demo mode
  if (demoModeUI && typeof demoModeUI.updateWarnings === 'function') {
    demoModeUI.updateWarnings();
  }
}
```

## Dependencies
- Task A.2-Modify Access Control for Demo Mode
- Task 4-Implement Payment UI and Processing

## Deliverables
1. Demo watermark implementation (CSS and JavaScript)
2. Demo banner implementation (HTML, CSS, and JavaScript)
3. Warning messages for calculation results
4. Demo mode UI manager component
5. Integration points with main calculator application

## Estimated Time
1.5 hours
