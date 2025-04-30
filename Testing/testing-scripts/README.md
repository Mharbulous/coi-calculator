# Paywall Testing and Deployment Scripts

This directory contains scripts and documentation to help test and deploy the paywall implementation for the Court Order Interest Calculator.

## Contents

- **paywall-testing-script.js** - JavaScript module for testing paywall functionality
- **production-deployment-checklist.md** - Detailed checklist for production deployment
- **browser-compatibility-test.html** - HTML page to test browser compatibility
- **stripe-production-setup.md** - Guide for setting up Stripe in production

## How to Use These Scripts

### Paywall Testing Script

This JavaScript module provides functions to test various components of the paywall implementation.

To use the script:

1. Import it in the browser console while viewing the application:
   ```javascript
   import * as PaywallTests from './testing-scripts/paywall-testing-script.js';
   ```

2. Run individual test functions:
   ```javascript
   // Test demo mode features
   PaywallTests.testDemoMode();
   
   // Test paid mode features
   PaywallTests.testPaidMode();
   
   // Test payment verification
   PaywallTests.testPaymentVerification('test_session_123');
   
   // Test localStorage persistence
   PaywallTests.testPaymentPersistence();
   
   // Test clearing payment data
   PaywallTests.testClearPayment();
   
   // Test Stripe integration
   PaywallTests.testStripeIntegration();
   
   // Test interest rate data sources
   PaywallTests.testRateDataSources();
   ```

### Browser Compatibility Test

This standalone HTML page tests various browser features required by the paywall implementation.

To use:

1. Open the `browser-compatibility-test.html` file in different browsers
2. Click the "Run All Tests" button or test individual features
3. Check the results to ensure compatibility

Run this test in all target browsers before deploying to production:
- Chrome
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome for Android)

### Production Deployment Checklist

A comprehensive checklist for deploying the paywall to production. Use this as a step-by-step guide during deployment.

The checklist includes:
- Pre-deployment testing
- Production configuration
- Deployment steps
- Post-deployment verification
- Analytics and monitoring setup
- Documentation and support
- Security review
- Rollback plan

### Stripe Production Setup Guide

Detailed instructions for transitioning from Stripe test mode to production mode. This guide covers:
- Stripe account configuration
- API key management
- Code updates for production
- Testing in production
- Handling refunds
- Troubleshooting common issues

## Testing Workflow

Follow this recommended workflow when testing the paywall implementation:

1. **Local Testing**
   - Run the paywall testing script in demo mode
   - Test the payment flow using test cards
   - Verify payment persistence works correctly
   - Test data switching between mock and real rates

2. **Browser Compatibility**
   - Run the browser compatibility test across all target browsers
   - Address any compatibility issues before proceeding

3. **Pre-Production Setup**
   - Follow the Stripe production setup guide
   - Set up environment variables for production
   - Update URLs and API keys

4. **Production Deployment**
   - Follow the production deployment checklist
   - Deploy code and serverless functions
   - Test the entire flow in production with a real purchase

5. **Monitoring and Maintenance**
   - Set up monitoring for payment failures
   - Document the deployment process
   - Prepare support documentation

## Note on Test Environment

These scripts assume you're testing in a development environment with:
- Live Server VS Code extension for local previewing
- Firebase configured for development
- Stripe in test mode (for initial testing)

When running in production, make sure to:
- Update all API keys to production keys
- Configure webhook endpoints for production
- Use proper error logging and monitoring
