# Auto-Format Date Inputs

## Problem

Currently, when users enter dates without hyphens (e.g., "20190402" instead of "2019-04-02"), they receive an error message that says "Invalid date format: 20190402. Please use YYYY-MM-DD format." This creates a poor user experience as users have to manually add hyphens.

## Solution

Implement auto-formatting for date input fields that will automatically insert hyphens as the user types. This will improve the user experience by:

1.  Automatically inserting hyphens after the year (position 4) and month (position 7)
2.  Limiting input to a maximum of 8 digits (excluding hyphens)
3.  Maintaining proper cursor position after auto-formatting
4.  Handling backspace and delete operations correctly

## Implementation Details

### Flow Diagram

```
flowchart TD
    A[User types digit] --> B{Position?}
    B -->|After 4th digit| C[Insert hyphen]
    B -->|After 7th digit| D[Insert hyphen]
    B -->|Other position| E[Continue normally]
    C --> F[Update input value]
    D --> F
    E --> F
    F --> G[Adjust cursor position]
    G --> H[Continue listening for input]
```

### New Function

Create a new function in `setup.js` called `setupAutoFormattingDateInputListeners` that will:

*   Listen for the 'input' event on date fields
*   Strip non-digit characters from the input
*   Insert hyphens at the appropriate positions
*   Limit input to 8 digits (10 characters with hyphens)
*   Maintain cursor position correctly
*   Still use existing validation on blur for final validation

### HTML Attributes

Ensure date input fields have:

*   `maxlength="10"` to limit the total length including hyphens
*   `placeholder="YYYY-MM-DD"` to provide a visual hint

### Integration

Update the existing date input setup to use this new auto-formatting function for all date inputs in the application.

## Expected Behavior

1.  User types: "2019" → Field shows: "2019"
2.  User types: "20190" → Field shows: "2019-0"
3.  User types: "201904" → Field shows: "2019-04"
4.  User types: "2019040" → Field shows: "2019-04-0"
5.  User types: "20190402" → Field shows: "2019-04-02"

This approach is commonly used in credit card inputs, phone numbers, and other formatted fields where separators need to be automatically inserted.