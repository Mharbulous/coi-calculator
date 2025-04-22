# Task A.5: Implement Upgrade Pathways

## Overview
This task involves creating clear and compelling upgrade pathways throughout the application to encourage users to transition from the demo version to the paid version. The goal is to implement strategic upgrade prompts that highlight the limitations of the demo version and the benefits of the full version without disrupting the user experience.

## Implementation Details

### 1. Enhance Payment Modal for Demo Context
Modify the payment modal to include demo-specific messaging:

```javascript
// In payment-ui.js, update the payment modal content
import appModeManager from './app-mode-manager.js';

// In the PaymentUI class constructor
constructor() {
  this.modalContainer = null;
  this.isInitialized = false;
  // Add property to track upgrade source
  this.upgradeSource = null;
}

// Modify the createModalContainer method to include demo-specific content
createModalContainer() {
  // Create container if it doesn't exist
  if (!this.modalContainer) {
    this.modalContainer = document.createElement('div');
    this.modalContainer.className = 'payment-modal-container';
    this.modalContainer.style.display = 'none';
    
    // Create modal content with demo-specific messaging
    this.modalContainer.innerHTML = `
      <div class="payment-modal">
        <div class="payment-modal-header">
          <h2>Upgrade to Full Version</h2>
          <p class="demo-message">You're currently using the demo version with incorrect interest rates</p>
        </div>
        
        <div class="payment-modal-body">
          <div class="upgrade-benefits">
            <h3>Benefits of the Full Version:</h3>
            <ul>
              <li>Accurate and up-to-date interest rates</li>
              <li>Reliable calculations for legal documents</li>
              <li>No watermarks or warning messages</li>
              <li>12 months of updates included</li>
            </ul>
          </div>
          
          <div class="payment-option">
            <h3>Full Access</h3>
            <p class="price">$29.99</p>
            <p class="price-detail">One-time payment for 12 months of access</p>
            <button class="payment-button" id="subscribe-button">Subscribe Now</button>
          </div>
          
          <div class="payment-form-container" style="display: none;">
            <!-- Payment form content (existing code) -->
          </div>
          
          <div class="payment-success" style="display: none;">
            <!-- Success content (existing code) -->
          </div>
          
          <div class="payment-loading" style="display: none;">
            <!-- Loading content (existing code) -->
          </div>
        </div>
        
        <div class="payment-modal-footer">
          <p>Secure payment processing</p>
          <p class="demo-continue">Want to stay in demo mode? <a href="#" id="continue-demo-link">Continue with demo</a></p>
        </div>
      </div>
    `;
    
    // Append to body and attach event listeners
    document.body.appendChild(this.modalContainer);
    this.attachEventListeners();
  }
}

// Add method to track upgrade source
setUpgradeSource(source) {
  this.upgradeSource = source;
}

// Add method to show payment modal with source tracking
showPaymentModalWithSource(source) {
  this.setUpgradeSource(source);
  this.showPaymentModal();
}

// Enhance attachEventListeners to include demo-specific handlers
attachEventListeners() {
  // Existing event listeners

  // Add event listener for "Continue with demo" link
  const continueDemoLink = this.modalContainer.querySelector('#continue-demo-link');
  if (continueDemoLink) {
    continueDemoLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.hidePaymentModal();
    });
  }
}

// Add analytics tracking for upgrade attempts
processPayment() {
  // Existing code
  
  try {
    // Add analytics event with upgrade source
    if (typeof analytics !== 'undefined') {
      analytics.track('upgrade_attempt', {
        source: this.upgradeSource || 'unknown',
        timestamp: new Date()
      });
    }
    
    // Rest of existing code
  } catch (error) {
    // Existing error handling
  }
}
```

```css
/* Add to payment-screen.css */
.demo-message {
  color: #e74c3c;
  font-weight: bold;
}

.upgrade-benefits {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.upgrade-benefits ul {
  padding-left: 25px;
  margin: 10px 0;
}

.upgrade-benefits li {
  margin-bottom: 5px;
}

.price-detail {
  color: #666;
  margin-top: -10px;
  font-size: 0.9em;
}

.demo-continue {
  font-size: 0.9em;
  margin-top: 10px;
}
```

### 2. Implement Strategic Upgrade Buttons and CTAs
Add strategically placed upgrade call-to-actions throughout the application:

```javascript
// Create a new file: upgrade-pathways.js
import { paymentUI } from './payment-ui.js';
import appModeManager from './app-mode-manager.js';

export class UpgradePathways {
  constructor() {
    this.upgradeSources = [];
    this.initialized = false;
  }
  
  initialize() {
    if (this.initialized) return;
    
    // Only initialize if in demo mode
    if (!appModeManager.isDemoMode()) {
      return;
    }
    
    // Add strategic upgrade buttons
    this.addHeaderUpgradeButton();
    this.addSummaryUpgradeButton();
    this.addFooterUpgradeButton();
    
    // Add event listeners for upgrade buttons
    this.setupEventListeners();
    
    this.initialized = true;
  }
  
  /**
   * Add upgrade button to the application header
   */
  addHeaderUpgradeButton() {
    const headerContainer = document.querySelector('h1');
    if (!headerContainer) return;
    
    const upgradeButton = document.createElement('button');
    upgradeButton.className = 'header-upgrade-button';
    upgradeButton.textContent = 'Get Accurate Rates';
    upgradeButton.dataset.source = 'header';
    
    headerContainer.parentNode.insertBefore(upgradeButton, headerContainer.nextSibling);
    this.upgradeSources.push('header');
  }
  
  /**
   * Add upgrade button to the summary table
   */
  addSummaryUpgradeButton() {
    const summaryTable = document.querySelector('.summary-table');
    if (!summaryTable) return;
    
    const summaryFooter = summaryTable.querySelector('tfoot');
    if (!summaryFooter) return;
    
    const upgradeRow = document.createElement('tr');
    upgradeRow.className = 'upgrade-cta-row';
    upgradeRow.innerHTML = `
      <td colspan="3" class="upgrade-cta">
        <div class="upgrade-cta-content">
          <p>Need accurate calculations for court documents?</p>
          <button class="upgrade-cta-button" data-source="summary">Upgrade to Full Version</button>
        </div>
      </td>
    `;
    
    summaryFooter.appendChild(upgradeRow);
    this.upgradeSources.push('summary');
  }
  
  /**
   * Add upgrade button to the page footer
   */
  addFooterUpgradeButton() {
    const paperContainer = document.querySelector('.paper');
    if (!paperContainer) return;
    
    const footerCta = document.createElement('div');
    footerCta.className = 'footer-upgrade-cta';
    footerCta.innerHTML = `
      <div class="footer-upgrade-content">
        <div class="upgrade-message">
          <h3>Ready for accurate interest calculations?</h3>
          <p>Switch to the full version with correct interest rates for only $29.99</p>
        </div>
        <button class="footer-upgrade-button" data-source="footer">Upgrade Now</button>
      </div>
    `;
    
    paperContainer.appendChild(footerCta);
    this.upgradeSources.push('footer');
  }
  
  /**
   * Setup event listeners for all upgrade buttons
   */
  setupEventListeners() {
    // Listen for clicks on any upgrade button
    document.addEventListener('click', (event) => {
      // Check if clicked element is an upgrade button
      if (event.target.matches('[data-source]')) {
        event.preventDefault();
        const source = event.target.dataset.source;
        
        // Show payment modal with source
        if (paymentUI && typeof paymentUI.showPaymentModalWithSource === 'function') {
          paymentUI.showPaymentModalWithSource(source);
        } else if (paymentUI && typeof paymentUI.showPaymentModal === 'function') {
          // Fallback if source tracking not available
          paymentUI.showPaymentModal();
        }
      }
    });
    
    // Update CTAs when mode changes
    document.addEventListener('mode-changed', (event) => {
      const newMode = event.detail.mode;
      
      if (newMode === 'demo') {
        // Show upgrade CTAs
        this.showUpgradeCTAs();
      } else {
        // Hide upgrade CTAs
        this.hideUpgradeCTAs();
      }
    });
  }
  
  /**
   * Show all upgrade CTAs
   */
  showUpgradeCTAs() {
    document.querySelectorAll('.header-upgrade-button, .upgrade-cta-row, .footer-upgrade-cta')
      .forEach(elem => {
        elem.style.display = '';
      });
  }
  
  /**
   * Hide all upgrade CTAs
   */
  hideUpgradeCTAs() {
    document.querySelectorAll('.header-upgrade-button, .upgrade-cta-row, .footer-upgrade-cta')
      .forEach(elem => {
        elem.style.display = 'none';
      });
  }
}

// Create and export singleton instance
export const upgradePathways = new UpgradePathways();
export default upgradePathways;
```

```css
/* Add to a new file: styles/components/upgrade-cta.css */
/* Header upgrade button */
.header-upgrade-button {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-left: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
}

.header-upgrade-button:hover {
  background-color: #218838;
}

/* Summary table upgrade CTA */
.upgrade-cta {
  background-color: #f8f9fa;
  padding: 15px;
  text-align: center;
  border-top: 2px dashed #dc3545;
}

.upgrade-cta-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upgrade-cta-content p {
  margin: 0;
  font-weight: bold;
  color: #495057;
}

.upgrade-cta-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.upgrade-cta-button:hover {
  background-color: #c82333;
}

/* Footer upgrade CTA */
.footer-upgrade-cta {
  margin-top: 30px;
  padding: 20px;
  background-color: #e9ecef;
  border-radius: 8px;
  border-left: 5px solid #007bff;
}

.footer-upgrade-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upgrade-message h3 {
  margin: 0 0 10px 0;
  color: #343a40;
}

.upgrade-message p {
  margin: 0;
  color: #6c757d;
}

.footer-upgrade-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.footer-upgrade-button:hover {
  background-color: #0069d9;
}

/* Hide CTAs when printing */
@media print {
  .header-upgrade-button,
  .upgrade-cta-row,
  .footer-upgrade-cta {
    display: none !important;
  }
}
```

### 3. Implement "Feature Limited" Indicators
Add visual indicators when users attempt to access features limited in the demo version:

```javascript
// Add to upgrade-pathways.js
/**
 * Add feature limitation indicators
 */
addFeatureLimitationIndicators() {
  // Add notification for limited jurisdictions
  const jurisdictionSelect = document.querySelector('[data-input="jurisdictionSelect"]');
  if (jurisdictionSelect) {
    // Add indicator next to jurisdiction selector
    const limitedFeatureIndicator = document.createElement('span');
    limitedFeatureIndicator.className = 'limited-feature-indicator';
    limitedFeatureIndicator.textContent = 'Limited in demo';
    limitedFeatureIndicator.title = 'Only BC jurisdiction has demo rates. Upgrade for access to all jurisdictions.';
    
    // Insert after the select element
    jurisdictionSelect.parentNode.insertBefore(limitedFeatureIndicator, jurisdictionSelect.nextSibling);
    
    // Add event listener to show upgrade modal when selecting disabled jurisdictions
    jurisdictionSelect.addEventListener('change', (event) => {
      if (appModeManager.isDemoMode() && event.target.value !== 'BC') {
        // Show limited feature modal
        this.showLimitedFeatureModal('jurisdiction', 'Additional jurisdictions are only available in the full version.');
        
        // Reset to BC
        setTimeout(() => {
          event.target.value = 'BC';
        }, 0);
      }
    });
  }
}

/**
 * Show modal for limited features
 * @param {string} feature - The limited feature
 * @param {string} message - The limitation message
 */
showLimitedFeatureModal(feature, message) {
  // Create modal if it doesn't exist
  if (!this.limitedFeatureModal) {
    this.limitedFeatureModal = document.createElement('div');
    this.limitedFeatureModal.className = 'limited-feature-modal';
    this.limitedFeatureModal.innerHTML = `
      <div class="limited-feature-content">
        <h3>Feature Limited in Demo Version</h3>
        <p id="limited-feature-message"></p>
        <div class="limited-feature-buttons">
          <button id="upgrade-from-limited" class="primary-button">Upgrade Now</button>
          <button id="continue-with-demo" class="secondary-button">Continue with Demo</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.limitedFeatureModal);
    
    // Add event listeners
    const upgradeButton = this.limitedFeatureModal.querySelector('#upgrade-from-limited');
    upgradeButton.addEventListener('click', () => {
      this.hideLimitedFeatureModal();
      paymentUI.showPaymentModalWithSource('limited-feature-' + this.currentLimitedFeature);
    });
    
    const continueButton = this.limitedFeatureModal.querySelector('#continue-with-demo');
    continueButton.addEventListener('click', () => {
      this.hideLimitedFeatureModal();
    });
  }
  
  // Update current limited feature
  this.currentLimitedFeature = feature;
  
  // Update message
  const messageElement = this.limitedFeatureModal.querySelector('#limited-feature-message');
  messageElement.textContent = message;
  
  // Show modal
  this.limitedFeatureModal.style.display = 'flex';
}

/**
 * Hide limited feature modal
 */
hideLimitedFeatureModal() {
  if (this.limitedFeatureModal) {
    this.limitedFeatureModal.style.display = 'none';
  }
}
```

```css
/* Add to styles/components/upgrade-cta.css */
.limited-feature-indicator {
  display: inline-block;
  margin-left: 10px;
  padding: 2px 6px;
  background-color: #ffc107;
  color: #212529;
  font-size: 0.8rem;
  border-radius: 3px;
  cursor: help;
}

.limited-feature-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 1002;
}

.limited-feature-content {
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.limited-feature-content h3 {
  margin-top: 0;
  color: #dc3545;
}

.limited-feature-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.limited-feature-buttons button {
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  border: none;
}

.limited-feature-buttons .primary-button {
  background-color: #007bff;
  color: white;
}

.limited-feature-buttons .secondary-button {
  background-color: #f8f9fa;
  color: #212529;
  border: 1px solid #dee2e6;
}
```

### 4. Integrate Upgrade Pathways with Main Application
Add initialization code to the main application:

```javascript
// In calculator.ui.js
import { upgradePathways } from './upgrade-pathways.js';

/**
 * Initializes the calculator when the DOM is fully loaded.
 */
async function initializeCalculator() {
  // Existing initialization code
  
  // Initialize application mode
  const initialMode = await appModeManager.initialize();
  
  // Initialize UI based on mode
  if (initialMode === 'demo') {
    console.log('Starting in demo mode');
    
    // Initialize upgrade pathways if in demo mode
    upgradePathways.initialize();
  } else {
    console.log('Starting in paid mode');
  }
  
  // Rest of existing initialization code
}

// Add code to refresh upgrade CTAs after recalculation
function afterResultsUpdated() {
  // If we have demo mode UI, update warnings
  if (demoModeUI && typeof demoModeUI.updateWarnings === 'function') {
    demoModeUI.updateWarnings();
  }
  
  // If we have upgrade pathways and are in demo mode, refresh CTAs
  if (upgradePathways && appModeManager.isDemoMode() &&
      typeof upgradePathways.addSummaryUpgradeButton === 'function') {
    // Remove existing summary CTA if it exists
    const existingCta = document.querySelector('.upgrade-cta-row');
    if (existingCta) {
      existingCta.remove();
    }
    
    // Add fresh summary CTA
    upgradePathways.addSummaryUpgradeButton();
  }
}
```

### 5. Add Conversion Tracking (Optional)
Implement basic analytics to track conversion from demo to paid version:

```javascript
// Create a new file: analytics.js
class AnalyticsService {
  constructor() {
    this.enabled = false;
    this.events = [];
  }
  
  initialize() {
    this.enabled = true;
    console.log('Analytics service initialized');
  }
  
  track(eventName, properties = {}) {
    if (!this.enabled) return;
    
    // Add timestamp if not provided
    if (!properties.timestamp) {
      properties.timestamp = new Date();
    }
    
    // Store event
    this.events.push({ 
      name: eventName, 
      properties, 
      timestamp: properties.timestamp 
    });
    
    // Log event to console
    console.log(`Analytics event: ${eventName}`, properties);
    
    // Send to Firebase (if available)
    this._sendToFirebase(eventName, properties);
  }
  
  _sendToFirebase(eventName, properties) {
    try {
      // Check if Firebase Analytics is available
      if (typeof firebase !== 'undefined' && firebase.analytics) {
        firebase.analytics().logEvent(eventName, properties);
      }
    } catch (error) {
      console.error('Error sending event to Firebase:', error);
    }
  }
  
  // Get conversion rate (demo to paid)
  getConversionRate() {
    if (this.events.length === 0) return 0;
    
    const demoStarts = this.events.filter(e => e.name === 'demo_mode_start').length;
    const conversions = this.events.filter(e => e.name === 'upgrade_success').length;
    
    if (demoStarts === 0) return 0;
    return (conversions / demoStarts) * 100;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;
```

```javascript
// In app-mode-manager.js, add analytics tracking
import { analytics } from './analytics.js';

// In initialize method, after setting initial mode
this.store.getState().initializeWithMode(initialMode);
      
// Track mode initialization in analytics
if (analytics && typeof analytics.track === 'function') {
  analytics.track(initialMode === 'demo' ? 'demo_mode_start' : 'paid_mode_start', {
    initial_mode: initialMode
  });
}

// In switchToPaidMode method, after successful switch
console.log('Successfully switched to paid mode');

// Track successful upgrade in analytics
if (analytics && typeof analytics.track === 'function') {
  analytics.track('upgrade_success', {
    from_source: this.upgradeSource || 'unknown'
  });
}

// In payment-ui.js, add tracking for payment submission
processPayment() {
  // Add analytics tracking to existing method
  if (analytics && typeof analytics.track === 'function') {
    analytics.track('payment_attempt', {
      source: this.upgradeSource || 'unknown'
    });
  }
  
  // Existing payment processing code...
}
```

## Dependencies
- Task A.3-Implement UI Enhancements for Demo Mode
- Task A.4-Implement Application Mode Management
- Task 4-Implement Payment UI and Processing

## Deliverables
1. Enhanced payment modal with demo-specific content
2. Strategic upgrade buttons and CTAs throughout the application
3. Feature limitation indicators for demo version
4. Integration with main application
5. Conversion tracking implementation (optional)

## Estimated Time
1.5 hours
