# Task A.4: Implement Application Mode Management

## Overview
This task involves implementing the core functionality to manage application state between demo and paid modes. It includes enhancing the state management system, adding mode-aware initialization, and implementing smooth transitions between modes.

## Implementation Details

### 1. Extend State Management
Enhance the existing Zustand store to include mode-related state:

```javascript
// Modify the store.js file to include mode state
import { create } from 'zustand/vanilla';

const createStore = () => create((set, get) => ({
  // Existing state
  // ...
  
  // Add mode-related state
  appMode: 'demo', // Default to demo mode
  isInitialized: false,
  modeHistory: [], // For tracking mode changes
  
  // Add mode-related actions
  setAppMode: (mode) => set((state) => ({
    appMode: mode,
    modeHistory: [...state.modeHistory, { 
      from: state.appMode, 
      to: mode, 
      timestamp: new Date() 
    }]
  })),
  
  // Method to check if in demo mode
  isDemoMode: () => get().appMode === 'demo',
  
  // Method to initialize app with specific mode
  initializeWithMode: (mode) => set({
    appMode: mode,
    isInitialized: true,
    modeHistory: [{ from: null, to: mode, timestamp: new Date() }]
  })
}));

// Create the store instance
const useStore = createStore();

export default useStore;
```

### 2. Create Mode Management Service
Implement a dedicated service to handle mode-related functionality:

```javascript
// Create a new file: app-mode-manager.js
import useStore from './store.js';
import FirebaseAccessControl from './firebase-access-control.js';
import { demoModeUI } from './demo-mode-ui.js';

class AppModeManager {
  constructor() {
    this.initialized = false;
    this.store = useStore;
  }
  
  /**
   * Initialize the mode manager
   * @param {boolean} forceDemo - Force demo mode regardless of authentication status
   * @returns {Promise<string>} The initial mode
   */
  async initialize(forceDemo = false) {
    if (this.initialized) return this.store.getState().appMode;
    
    try {
      // Check if user is authenticated and has paid
      const hasPaid = forceDemo ? false : await FirebaseAccessControl.checkAuthStatus();
      
      // Set initial mode
      const initialMode = hasPaid ? 'paid' : 'demo';
      this.store.getState().initializeWithMode(initialMode);
      
      // Dispatch event for other components
      this._dispatchModeChangeEvent(initialMode);
      
      this.initialized = true;
      console.log(`Application initialized in ${initialMode} mode`);
      
      return initialMode;
    } catch (error) {
      console.error('Error initializing app mode:', error);
      // Default to demo mode on error
      this.store.getState().initializeWithMode('demo');
      this._dispatchModeChangeEvent('demo');
      this.initialized = true;
      return 'demo';
    }
  }
  
  /**
   * Switch to demo mode
   * @returns {Promise<boolean>} Success status
   */
  async switchToDemoMode() {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.initialize(true);
        return true;
      }
      
      // If already in demo mode, do nothing
      if (this.store.getState().appMode === 'demo') {
        return true;
      }
      
      // Switch to demo mode
      await FirebaseAccessControl.switchToDemoMode();
      this.store.getState().setAppMode('demo');
      
      // Dispatch event for other components
      this._dispatchModeChangeEvent('demo');
      
      console.log('Successfully switched to demo mode');
      return true;
    } catch (error) {
      console.error('Error switching to demo mode:', error);
      return false;
    }
  }
  
  /**
   * Switch to paid mode after successful payment
   * @returns {Promise<boolean>} Success status
   */
  async switchToPaidMode() {
    try {
      // Ensure we're initialized
      if (!this.initialized) {
        await this.initialize();
        return this.store.getState().appMode === 'paid';
      }
      
      // Verify payment status
      const hasPaid = await FirebaseAccessControl.checkAuthStatus();
      if (!hasPaid) {
        console.warn('Cannot switch to paid mode: No valid payment found');
        return false;
      }
      
      // If already in paid mode, do nothing
      if (this.store.getState().appMode === 'paid') {
        return true;
      }
      
      // Switch to paid mode
      await FirebaseAccessControl.switchToPaidMode();
      this.store.getState().setAppMode('paid');
      
      // Dispatch event for other components
      this._dispatchModeChangeEvent('paid');
      
      console.log('Successfully switched to paid mode');
      return true;
    } catch (error) {
      console.error('Error switching to paid mode:', error);
      return false;
    }
  }
  
  /**
   * Get the current application mode
   * @returns {string} Current mode ('demo' or 'paid')
   */
  getCurrentMode() {
    return this.store.getState().appMode;
  }
  
  /**
   * Check if application is in demo mode
   * @returns {boolean} True if in demo mode
   */
  isDemoMode() {
    return this.store.getState().isDemoMode();
  }
  
  /**
   * Dispatch custom event for mode change
   * @param {string} mode - The new mode
   * @private
   */
  _dispatchModeChangeEvent(mode) {
    document.dispatchEvent(new CustomEvent('mode-changed', {
      detail: { mode, timestamp: new Date() }
    }));
  }
  
  /**
   * Handle successful payment completion
   * @returns {Promise<void>}
   */
  async handlePaymentSuccess() {
    await this.switchToPaidMode();
  }
}

// Create and export a singleton instance
export const appModeManager = new AppModeManager();
export default appModeManager;
```

### 3. Modify Calculator Initialization
Update the calculator initialization to utilize the mode manager:

```javascript
// In calculator.ui.js
import appModeManager from './app-mode-manager.js';
import { preloadCommonJurisdictions } from './interestRates.js';

/**
 * Initializes the calculator when the DOM is fully loaded.
 */
async function initializeCalculator() {
  // Setup essential components first
  setDefaultInputValues();
  setupEventListeners();
  
  // Initialize application mode
  const initialMode = await appModeManager.initialize();
  
  // Initialize UI based on mode
  if (initialMode === 'demo') {
    console.log('Starting in demo mode');
    // Demo mode initialization specific logic
  } else {
    console.log('Starting in paid mode');
    // Paid mode initialization specific logic
  }
  
  // Preload interest rates based on mode
  try {
    await preloadCommonJurisdictions(appModeManager.isDemoMode());
  } catch (error) {
    console.error('Error loading interest rates:', error);
    // Handle rate loading failure
    if (!appModeManager.isDemoMode()) {
      // If failed in paid mode, suggest switching to demo
      const shouldSwitchToDemo = confirm(
        'Error loading interest rate data. Would you like to try the demo version instead?'
      );
      if (shouldSwitchToDemo) {
        await appModeManager.switchToDemoMode();
        // Try loading demo rates
        await preloadCommonJurisdictions(true);
      }
    }
  }
  
  // Set visibility states
  togglePrejudgmentVisibility(true, null);
  togglePostjudgmentVisibility(true, null);
  togglePerDiemVisibility(true, null);
  
  // Update UI components
  updateSummaryTable(useStore, recalculate);
  
  // Perform initial calculation
  recalculate();
}
```

### 4. Handle Mode Changes During Usage
Add event listeners to handle mode changes during application use:

```javascript
// In calculator.ui.js
function setupModeChangeListeners() {
  document.addEventListener('mode-changed', async (event) => {
    const newMode = event.detail.mode;
    console.log(`Mode changed to: ${newMode}`);
    
    // Update rate data based on new mode
    try {
      await preloadCommonJurisdictions(newMode === 'demo');
      
      // Recalculate with new rates
      recalculate();
      
      // Update any mode-specific UI
      document.body.classList.toggle('demo-mode', newMode === 'demo');
      document.body.classList.toggle('paid-mode', newMode === 'paid');
      
    } catch (error) {
      console.error(`Error updating data after mode change to ${newMode}:`, error);
    }
  });
  
  // Listen for payment completion events
  document.addEventListener('payment-completed', async () => {
    // Switch to paid mode after successful payment
    await appModeManager.handlePaymentSuccess();
  });
}
```

### 5. Implement Mode Persistence
Add functionality to remember the user's mode across sessions:

```javascript
// In app-mode-manager.js, add persistence methods
/**
 * Save mode to local storage
 * @private
 */
_saveModeToStorage() {
  const state = this.store.getState();
  localStorage.setItem('app_mode', state.appMode);
  localStorage.setItem('mode_timestamp', new Date().getTime().toString());
}

/**
 * Load mode from local storage
 * @returns {string|null} Saved mode or null if not found
 * @private
 */
_loadModeFromStorage() {
  const savedMode = localStorage.getItem('app_mode');
  const timestamp = localStorage.getItem('mode_timestamp');
  
  // Only use saved mode if it's recent (within 7 days)
  if (savedMode && timestamp) {
    const savedTime = parseInt(timestamp, 10);
    const now = new Date().getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (now - savedTime < sevenDays) {
      return savedMode;
    }
  }
  
  return null;
}

// Then modify initialize method to check storage first:
async initialize(forceDemo = false) {
  if (this.initialized) return this.store.getState().appMode;
  
  // Check for saved mode first
  const savedMode = this._loadModeFromStorage();
  
  // If demo mode is forced or no saved mode exists, proceed with normal flow
  if (forceDemo || !savedMode) {
    // Existing initialization code...
  } else {
    // Use saved mode, but verify if paid mode is still valid
    if (savedMode === 'paid') {
      // Verify payment status is still valid
      const hasPaid = await FirebaseAccessControl.checkAuthStatus();
      if (!hasPaid) {
        // Payment no longer valid, fall back to demo
        this.store.getState().initializeWithMode('demo');
        this._dispatchModeChangeEvent('demo');
        this._saveModeToStorage();
        return 'demo';
      }
    }
    
    // Use saved mode
    this.store.getState().initializeWithMode(savedMode);
    this._dispatchModeChangeEvent(savedMode);
    return savedMode;
  }
  
  // Save the mode after initialization
  this._saveModeToStorage();
}

// Also update mode switching methods to save to storage
async switchToDemoMode() {
  // Existing code...
  
  // After successful switch
  this._saveModeToStorage();
}

async switchToPaidMode() {
  // Existing code...
  
  // After successful switch
  this._saveModeToStorage();
}
```

## Dependencies
- Task A.2-Modify Access Control for Demo Mode
- Task A.3-Implement UI Enhancements for Demo Mode
- Task 3-Modify Interest Rates Module for Firebase

## Deliverables
1. Enhanced Zustand store with mode-related state
2. App Mode Manager service for handling mode-related operations
3. Modified calculator initialization to be mode-aware
4. Mode change event handling system
5. Mode persistence across sessions

## Estimated Time
1 hour
