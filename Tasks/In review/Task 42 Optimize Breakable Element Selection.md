# Task 42: Optimize Breakable Element Selection

## Problem Statement
The current pagination system first queries all elements with the `.breakable` class and then checks for visibility during iteration through the loop. This approach is inefficient as it processes elements that are ultimately skipped if they're not visible, resulting in unnecessary overhead.

## Current Implementation
```javascript
// Current implementation in pageBreaksCore.js
const breakableElements = Array.from(inkLayer.querySelectorAll('.breakable'));

for (let i = 0; i < breakableElements.length; i++) {
    const currentElement = breakableElements[i];
    // Ensure the element is visible before processing
    if (currentElement.offsetParent === null || getElementOuterHeight(currentElement) === 0) {
         console.log("Skipping hidden breakable element:", currentElement);
         continue;
    }
    
    // ... rest of processing logic for visible elements
}
```

## Proposed Solution
Filter the breakable elements for visibility upfront, before entering the main processing loop. This reduces the number of iterations and eliminates the need for visibility checks inside the loop.

```javascript
// Proposed implementation with upfront filtering
const breakableElements = Array.from(inkLayer.querySelectorAll('.breakable'))
    .filter(element => element.offsetParent !== null && getElementOuterHeight(element) > 0);

// Now all elements in the array are guaranteed to be visible
for (let i = 0; i < breakableElements.length; i++) {
    const currentElement = breakableElements[i];
    
    // No need for visibility check here anymore
    // ... rest of processing logic
}
```

## Expected Benefits
1. **Reduced Iterations**: Fewer elements to process in the main loop
2. **Cleaner Code**: Eliminates redundant visibility checks inside the loop
3. **Improved Performance**: Especially noticeable when many breakable elements are hidden
4. **Better Memory Efficiency**: Creates an array with only the elements that will actually be processed

## Implementation Steps
1. Open `src/dom/pageBreaks/pageBreaksCore.js`
2. Locate the breakable elements selection code
3. Modify the selection to include the filter for visibility
4. Remove the redundant visibility checks inside the loop
5. Test pagination with various content visibility scenarios

## Testing Considerations
- Verify pagination works correctly with a mix of visible and hidden breakable elements
- Test scenarios where elements become visible or hidden dynamically
- Check performance with large numbers of breakable elements
- Ensure no regressions in core pagination functionality

## Rollback Plan
If issues arise, simply revert to the original implementation with in-loop visibility checks.
