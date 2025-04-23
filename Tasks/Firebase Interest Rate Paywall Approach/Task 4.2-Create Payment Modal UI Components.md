# Task 4.2: Create Payment Modal UI Components with Demo Mode Support

## Overview
This task focuses on implementing the necessary UI components for the payment system and demo mode indication. You'll create modal dialogs for user registration, login, and payment processing, as well as visual elements to clearly identify when the application is running in demo mode.

## Complexity
Medium (increased from Simple due to demo mode UI requirements)

## Estimated Time
1 hour (increased from 30 minutes to accommodate demo mode UI)

## Implementation Steps

### 1. Design Modal Framework
1. Create a reusable modal component structure for payment processing
2. Include overlay, header with title, content area, and footer for action buttons
3. Implement smooth transitions and animations for modal display
4. Ensure accessibility compliance with proper focus management

### 2. Create Demo Mode Visual Indicators
1. Implement a watermark component that displays when in demo mode
   - Add fixed-position watermark with "DEMO VERSION" text
   - Style it to be visible but not interfere with usability
   - Include print-specific styling to ensure watermark appears on printed pages
2. Create a demo banner that appears at the top of the application
   - Add sticky positioning so it remains visible during scrolling
   - Include upgrade button to trigger payment modal
   - Style with distinctive color to clearly indicate demo status

### 3. Add Warning Messages to Calculation Results
1. Implement functions to add warning text to calculation results in demo mode
   - Add warnings to summary tables indicating values use demo rates
   - Add warnings to interest tables with upgrade buttons
   - Ensure warnings are clearly visible but don't disrupt layout
2. Create styles for warning messages and upgrade buttons
   - Use warning colors to draw attention
   - Style upgrade links and buttons consistently

### 4. Create Demo Mode UI Manager
1. Develop a manager class to handle demo mode UI elements
   - Add methods to activate/deactivate demo UI elements
   - Implement event listeners for mode changes
   - Include functions to update warnings after recalculation
2. Implement dynamic CSS loading for demo mode styles
3. Add template management for demo UI components

### 5. Enhance Payment Modal for Demo Context
1. Modify payment modal to be aware of application mode
   - Add demo-specific messaging when in demo mode
   - Highlight benefits of upgrading to full version
   - Include comparison between demo and full features
2. Add tracking for upgrade attempt sources
3. Implement continuation options for users who want to stay in demo mode

### 6. Implement Integration Hooks
1. Add integration points with the main application
   - Connect to mode change events
   - Add hooks for recalculation events to update warnings
   - Implement initialization logic based on application mode
2. Add CSS for styling all demo-related UI components
3. Ensure proper cleanup when transitioning between modes

## Testing Procedures
1. Test all modal displays on different screen sizes
2. Verify demo mode visual indicators appear and disappear when modes change
3. Test that warning messages display correctly in calculation results
4. Verify all upgrade buttons properly trigger the payment modal
5. Test proper cleanup of UI elements when switching modes

## Expected Outcome
1. A complete set of modals for authentication and payment processing
2. Clear visual indicators when the application is in demo mode
3. Warning messages in calculation results with upgrade options
4. Seamless transition between demo and paid modes
5. Consistent styling across all components

## Notes
- This implementation combines the original payment UI requirements with demo mode enhancements
- The demo mode UI should be noticeable without being overly intrusive
- All UI components should follow a consistent design language
- This task integrates requirements from Task A.3 (Implement UI Enhancements for Demo Mode)
