# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BC Court Order Interest Calculator - A web application for calculating prejudgment and postjudgment interest on court orders in British Columbia. The application uses a hybrid deployment architecture:
- **Firebase**: Hosts the application and stores interest rate data in Firestore
- **Netlify**: Provides serverless functions for payment processing only

The application operates in two modes:
- **Demo Mode**: Uses mock interest rates with visible watermarks
- **Paid Mode**: Uses real Firebase interest rates after Stripe payment verification

## Development Commands

### Local Development
```bash
npm run dev
```
Starts Netlify dev server on port 8888 (for testing serverless functions locally). The main application is hosted on Firebase.

### Firebase Testing
```bash
npm run test:firebase
```
Tests Firebase integration and rate fetching.

### Data Migration
```bash
npm run migrate
```
Migrates interest rate data to Firebase Firestore.

## Architecture

### Mode Management System
The application has a sophisticated mode detection system:

**Test Mode**: Accessed via `/test` URL path
- Requires IP authorization (207.6.212.70) or secret key (`?key=coi-test-mode-2025`)
- Authorization stored in sessionStorage for session persistence
- Visual indicator added via `mode-manager.js`
- Can be forced locally by setting `FORCE_TEST_MODE = true` in `app-initializer.js`

**Live Mode**: Default production mode accessed via root URL

**Demo vs Paid Mode**: Separate from test mode, controls which interest rates are used
- Controlled by `paymentVerification.js` which checks for verified Stripe payment
- Demo mode shows watermarks and uses mock rates from `mockRates.js`
- Paid mode removes watermarks and fetches real rates from Firebase

### Application Initialization Flow
1. `app-initializer.js`: Detects mode (test vs live) via `mode-manager.js`
2. `stripeLoader.js`: Dynamically loads appropriate Stripe integration based on mode
3. `firebaseLoader.js`: Initializes Firebase connection
4. `calculator.core.js`: Loads interest rates from Firebase (calls `firebaseIntegration.js`)
5. `demo-mode.js`: Adds watermarks and demo UI if payment not verified

### State Management
Uses **Zustand vanilla store** (`store.js`) for centralized state:
- Input values (dates, amounts, jurisdiction, checkboxes)
- Calculation results (special damages, prejudgment, postjudgment totals)
- Saved prejudgment state (for toggling prejudgment checkbox without losing data)

Store is imported throughout the codebase to maintain single source of truth.

### Interest Rate Calculation
Core calculation logic in `calculations.js`:
- `getInterestRateForDate()`: Finds applicable rate for specific date/jurisdiction
- `calculateInterestPeriods()`: Computes interest across multiple rate periods
- `calculatePerDiem()`: Calculates daily interest rate

Rates are fetched from Firebase Firestore by `firebaseRates.js` and exposed via `firebaseIntegration.js`, which switches between real and mock rates based on payment status.

### DOM Management
DOM utilities organized in `src/dom/` folder:
- `elements.js`: Centralized DOM element references
- `datepickers.js`: Flatpickr date picker initialization
- `inputs.js`: Input field change handlers
- `tables.interest.js`: Interest calculation table rendering
- `tables.summary.js`: Summary table rendering
- `specialDamages.js`: Special damages row management
- `pageBreaks/`: Page break system for print layout
  - `pageBreaksCore.js`: Core page break logic
  - `printUtils.js`: Print-specific utilities
  - `utils.js`: Page break helper functions

### Payment Processing
Stripe integration uses different configurations based on mode:
- `stripeIntegration.production.js`: Live Stripe keys (loaded in live mode)
- `stripeIntegration.test.js`: Test Stripe keys (loaded in test mode)
- `stripeLoader.js`: Dynamically loads appropriate integration
- `paymentVerification.js`: Verifies payment via Netlify serverless function

Netlify serverless function (`functions/verify-payment.js`) verifies Stripe checkout sessions and issues verification tokens stored in localStorage.

### Page Break System
Intelligent page break system for print layout (`src/dom/pageBreaks/`):
- Automatically inserts page breaks to prevent content from splitting across pages
- Uses MutationObserver to handle dynamic content changes
- Respects manual page breaks added by users
- Debug mode available via URL parameter: `?debug=true`

### UI Components
- Mobile detection with helpful user messaging
- Two-layer visual design (paper layer + ink layer)
- Print warning modal for demo mode users
- Test mode visual indicator banner
- Ad blocker detection and fallback handling

## Important File Paths

### Core Application Files
- `src/index.html`: Main application entry point
- `src/app-initializer.js`: Application initialization orchestrator
- `src/calculator.core.js`: Core calculator logic and Firebase rate loading
- `src/calculations.js`: Interest calculation algorithms
- `src/store.js`: Zustand state management

### Firebase Integration
- `src/firebaseConfig.js`: Firebase configuration
- `src/firebaseIntegration.js`: Main Firebase interface (switches between real/mock rates)
- `src/firebaseRates.js`: Fetches rates from Firestore
- `src/mockRates.js`: Mock rates for demo mode

### Stripe Integration
- `src/stripeLoader.js`: Dynamic Stripe integration loader
- `src/stripeIntegration.production.js`: Live mode Stripe config
- `src/stripeIntegration.test.js`: Test mode Stripe config
- `src/paymentVerification.js`: Payment verification logic
- `functions/verify-payment.js`: Netlify serverless payment verification

### Mode Management
- `src/mode-manager.js`: Test vs live mode detection and authorization
- `src/demo-mode.js`: Demo mode UI (watermarks, banners, modals)

### Utilities
- `src/utils.date.js`: Date parsing, formatting, and comparison utilities
- `src/utils.currency.js`: Currency parsing and formatting
- `src/util.logger.js`: Console log filtering to suppress third-party noise
- `src/error-handling.js`: Error handling utilities

## Configuration Files

### Netlify Configuration
`netlify.toml` - Serverless functions only:
- Functions directory: `functions/`
- API redirects: `/api/*` → `/.netlify/functions/:splat`
- Local dev port: 8888

Note: Despite the Netlify config, the main application is hosted on Firebase. Netlify is only used for serverless payment processing functions.

### Import Maps
ES module import maps defined in `index.html`:
- `zustand`: Uses esm.sh CDN for browser-compatible Zustand
- `firebase/app` and `firebase/firestore`: Uses Firebase CDN

### Environment Variables
Required environment variable for Netlify functions:
- `STRIPE_SECRET_KEY`: Stripe secret key (set in Netlify dashboard)

## Git Workflow

**Main branch**: `main`
**Current branch**: `production`

The repository uses a standard Git workflow. Always check current branch status before making commits.

## Key Technical Considerations

### Date Handling
- All dates internally use UTC midnight to avoid timezone issues
- `utils.date.js` provides `normalizeDate()` to ensure consistent UTC dates
- Date inputs are in YYYY-MM-DD format
- Display dates use `formatDateForDisplay()` for user-friendly output

### Print Layout
- Application generates court-ready PDF documents
- Requires minimum screen width of 800px (enforced with mobile detection message)
- Page break system automatically manages pagination
- Visual "paper layer" shows page boundaries in browser

### Testing Approach
- No formal test suite currently (package.json test script returns error)
- Manual testing via:
  - `testFirebase.html`: Firebase integration testing
  - `test-error-handling.html`: Error handling testing
  - Test mode URL path with debug parameter

### Module System
Uses ES6 modules throughout with `.js` extensions explicitly specified in all imports.
