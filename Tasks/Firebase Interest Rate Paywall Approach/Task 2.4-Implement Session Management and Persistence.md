# Task 2.4: Implement Session Management and Persistence with Mode Awareness

## Overview

This task involves implementing session management and persistence for both authentication and application mode (demo/paid). You'll ensure that users remain logged in across page refreshes, maintain their selected application mode between sessions, and properly manage the state transitions between demo and paid modes.

## Complexity

Medium (increased from Simple due to mode-aware functionality)

## Estimated Time

1 hour (increased from 30 minutes to accommodate mode management)

## Implementation Steps

### 1. Enhance Store with Mode Management

First, extend the existing Zustand store to include mode-related state:

```javascript
// Modify the store.js file to include mode state
import { create } from 'zustand/vanilla';

const createStore = () => create((set, get) => ({
  // Existing state (authentication, calculations, etc.)
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

### 2. Create App Mode Manager Service

Implement a dedicated service to handle mode-related functionality:

```javascript
// Create a new file: app-mode-manager.js
import useStore from './store.js';
import FirebaseAccessControl from './firebase-access-control.js';

class AppModeManager {
  constructor() {
    this.initialized = false;
    this.store = useStore;
    this.upgradeSource = null;
  }
  
  /**
   * Initialize the mode manager
   * @param {boolean} forceDemo - Force demo mode regardless of authentication status
   * @returns {Promise<string>} The initial mode
   */
  async initialize(forceDemo = false) {
    if (this.initialized) return this.store.getState().appMode;
    
    try {
      // First check for saved mode
      const savedMode = this._loadModeFromStorage();
      
      // If demo mode is forced or no saved mode exists, determine mode from auth status
      if (forceDemo || !savedMode) {
        // Check if user is authenticated and has paid
        const hasPaid = forceDemo ? false : await FirebaseAccessControl.checkAuthStatus();
        
        // Set initial mode
        const initialMode = hasPaid ? 'paid' : 'demo';
        this.store.getState().initializeWithMode(initialMode);
        
        // Dispatch event for other components
        this._dispatchModeChangeEvent(initialMode);
        
        // Save the mode to storage
        this._saveModeToStorage();
        
        this.initialized = true;
        console.log(`Application initialized in ${initialMode} mode`);
        
        return initialMode;
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
            this.initialized = true;
            return 'demo';
          }
        }
        
        // Use saved mode
        this.store.getState().initializeWithMode(savedMode);
        this._dispatchModeChangeEvent(savedMode);
        this.initialized = true;
        return savedMode;
      }
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
      
      // Save the mode to storage
      this._saveModeToStorage();
      
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
      
      // Save the mode to storage
      this._saveModeToStorage();
      
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
   * Set the source of an upgrade attempt
   * @param {string} source - Identifier for where the upgrade was initiated
   */
  setUpgradeSource(source) {
    this.upgradeSource = source;
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
   * Handle successful payment completion
   * @returns {Promise<void>}
   */
  async handlePaymentSuccess() {
    await this.switchToPaidMode();
  }
  
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
   * @returns {string|null} Saved mode or null if not found or expired
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
}

// Create and export a singleton instance
export const appModeManager = new AppModeManager();
export default appModeManager;
```

### 3. Enhance the Authentication State Change Handler

Update the authentication handler to be mode-aware:

```javascript
/**
 * Enhanced authentication state change handler
 * @param {Object} user - Firebase user object
 */
async function handleAuthStateChange(user) {
  if (user) {
    // User is signed in
    console.log('User authenticated:', user.uid);
    
    // Check access and generate token if needed
    const hasAccess = await verifyPaymentStatus(user.uid);
    
    if (hasAccess) {
      // Generate token if not exists or expired
      const cachedToken = getFromCache('access_token');
      if (!cachedToken || cachedToken.expires <= Date.now()) {
        await generateAccessToken();
      }
      
      // Set up token refresh
      setupTokenRefresh();
      
      // Check if we should switch to paid mode
      if (appModeManager && appModeManager.getCurrentMode() === 'demo') {
        appModeManager.switchToPaidMode();
      }
    }
    
    // Trigger UI updates
    document.dispatchEvent(new CustomEvent('auth-state-changed', { 
      detail: { authenticated: true, hasAccess }
    }));
  } else {
    // User is signed out
    console.log('User signed out');
    
    // If we're in paid mode, we should switch to demo mode
    if (appModeManager && appModeManager.getCurrentMode() === 'paid') {
      appModeManager.switchToDemoMode();
    }
    
    // Clear any cached data that requires authentication
    clearSession();
  }
}
```

### 4. Implement Mode Change Listeners for UI Updates

Add functions to handle mode changes and update UI accordingly:

```javascript
/**
 * Set up listeners for mode changes
 */
function setupModeChangeListeners() {
  document.addEventListener('mode-changed', async (event) => {
    const newMode = event.detail.mode;
    console.log(`Mode changed to: ${newMode}`);
    
    // Update UI classes
    document.body.classList.toggle('demo-mode', newMode === 'demo');
    document.body.classList.toggle('paid-mode', newMode === 'paid');
    
    // Update rate data based on new mode
    try {
      if (typeof preloadCommonJurisdictions === 'function') {
        await preloadCommonJurisdictions(newMode === 'demo');
      }
      
      // Trigger recalculation with new rates if available
      if (typeof recalculate === 'function') {
        recalculate();
      }
    } catch (error) {
      console.error(`Error updating data after mode change to ${newMode}:`, error);
    }
  });
}
```

### 5. Update Session Clearing to Handle Mode State

Enhance session clearing to be mode-aware:

```javascript
/**
 * Clear all session data with mode awareness
 * @param {boolean} preserveMode - Whether to preserve mode information
 */
function clearSession(preserveMode = false) {
  // Store mode info if needed
  const modeInfo = preserveMode ? {
    mode: localStorage.getItem('app_mode'),
    timestamp: localStorage.getItem('mode_timestamp')
  } : null;
  
  // Clear all cached data
  clearDataCache();
  
  // Restore mode info if needed
  if (preserveMode && modeInfo && modeInfo.mode) {
    localStorage.setItem('app_mode', modeInfo.mode);
    localStorage.setItem('mode_timestamp', modeInfo.timestamp || new Date().getTime().toString());
  }
  
  // Dispatch event for UI update
  document.dispatchEvent(new CustomEvent('auth-state-changed', { 
    detail: { authenticated: false } 
  }));
}

/**
 * Clear all data cache with mode awareness
 * @param {boolean} clearModeData - Whether to clear mode-related data
 */
function clearDataCache(clearModeData = true) {
  // Only clear our app-specific cache items
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Only remove cache items related to our app
    if (key.startsWith('rates_') || key.startsWith('payment_') || key === 'access_token') {
      keysToRemove.push(key);
    }
    
    // Optionally remove mode data
    if (clearModeData && (key === 'app_mode' || key === 'mode_timestamp')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear token refresh timer
  if (window.tokenRefreshTimer) {
    clearTimeout(window.tokenRefreshTimer);
    window.tokenRefreshTimer = null;
  }
}
```

### 6. Add Enhanced API for Authentication and Mode Status

Add a combined function to check both authentication and mode status:

```javascript
/**
 * Get complete application status including auth and mode
 * @returns {Promise<Object>} Complete status object
 */
async function getApplicationStatus() {
  try {
    // Get authentication status
    const authStatus = await getAuthenticationStatus();
    
    // Get mode status
    const modeStatus = {
      mode: appModeManager ? appModeManager.getCurrentMode() : 'unknown',
      isDemoMode: appModeManager ? appModeManager.isDemoMode() : true,
      modeInitialized: appModeManager ? appModeManager.initialized : false
    };
    
    return {
      ...authStatus,
      ...modeStatus,
      // Add combined fields for easier checks
      isPaidMode: modeStatus.mode === 'paid' && authStatus.authenticated && authStatus.hasAccess,
      requiresUpgrade: modeStatus.mode === 'demo' && (!authStatus.authenticated || !authStatus.hasAccess)
    };
  } catch (error) {
    console.error('Error getting application status:', error);
    return { 
      authenticated: false, 
      hasAccess: false, 
      mode: 'demo',
      isDemoMode: true,
      error: error.message 
    };
  }
}
```

### 7. Update Module Exports

```javascript
// Update the exported module interface
const FirebaseAccessControl = {
  // Auth management
  initializeAuth,
  checkAuthStatus,
  signInAnonymously,
  signInWithEmail,
  signOut,
  createUserWithEmail,
  handleAuthStateChange,
  
  // Access verification
  verifyPaymentStatus,
  generateAccessToken, 
  validateAccessToken,
  checkAccessForRates,
  
  // Session management
  getAuthenticationStatus,
  getApplicationStatus,
  checkPersistedSession,
  clearSession,
  setupModeChangeListeners,
  
  // Cache management
  setInCache,
  getFromCache,
  clearFromCache,
  clearDataCache
};

export default FirebaseAccessControl;
```

### 8. Add Application Initialization Function

Create a function to initialize both authentication and mode services:

```javascript
/**
 * Initialize all authentication and mode services
 * @param {boolean} forceDemoMode - Whether to force demo mode
 * @returns {Promise<Object>} Initialization status
 */
async function initializeApplication(forceDemoMode = false) {
  try {
    // Initialize authentication
    await initializeAuth();
    
    // Initialize mode manager if available
    let modeStatus = { mode: 'unknown', initialized: false };
    if (appModeManager) {
      const initialMode = await appModeManager.initialize(forceDemoMode);
      modeStatus = { mode: initialMode, initialized: true };
    }
    
    // Set up mode change listeners
    setupModeChangeListeners();
    
    // Return initialization status
    return {
      authInitialized: true,
      modeInitialized: modeStatus.initialized,
      initialMode: modeStatus.mode
    };
  } catch (error) {
    console.error('Application initialization error:', error);
    return {
      authInitialized: false,
      modeInitialized: false,
      error: error.message
    };
  }
}

// Add to exports
const FirebaseAccessControl = {
  // ...existing exports
  initializeApplication
};
```

## Testing Procedures

1. Test mode persistence across page reloads:
   ```javascript
   // Set demo mode
   await appModeManager.switchToDemoMode();
   
   // Verify mode is set
   console.log('Current mode:', appModeManager.getCurrentMode());
   
   // Reload the page manually, then check
   console.log('Mode after reload:', appModeManager.getCurrentMode());
   ```

2. Test auth status with mode integration:
   ```javascript
   // Get combined status
   const status = await FirebaseAccessControl.getApplicationStatus();
   console.log('Application status:', status);
   
   // Check specific conditions
   console.log('Needs upgrade?', status.requiresUpgrade);
   console.log('Is full paid version?', status.isPaidMode);
   ```

3. Test mode switching with events:
   ```javascript
   // Set up listener
   document.addEventListener('mode-changed', (event) => {
     console.log('Mode changed event:', event.detail);
   });
   
   // Switch modes
   await appModeManager.switchToDemoMode();
   setTimeout(async () => {
     // Try switching to paid (will fail if not authenticated)
     await appModeManager.switchToPaidMode();
   }, 2000);
   ```

## Expected Outcome

By the end of this task, you should have:

1. Enhanced Zustand store with mode-related state and actions
2. App Mode Manager service for handling mode-related operations
3. Mode persistence across sessions with localStorage
4. Mode change event handling for UI updates
5. Integration between authentication state and application mode
6. Enhanced session management that preserves mode data appropriately
7. Combined API for checking both authentication and mode status

## Notes

- This implementation supports both demo and paid modes with appropriate persistence
- The mode system is integrated with the authentication system for cohesive state management
- Session data is properly maintained or cleared based on authentication and mode changes
- The implementation follows best practices for state management and event handling
- This implementation integrates requirements from Task A.4 (Implement Application Mode Management)
