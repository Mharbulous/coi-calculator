/**
 * Test script for the ResizeObserver-based pagination system.
 * This script adds debugging info to check that height observations are working.
 */

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ResizeObserver test script...');
    
    // Add test log to ResizeObserver callbacks
    const originalUpdatePagination = window.updatePagination || null;
    
    if (typeof originalUpdatePagination === 'function') {
        window.updatePagination = function() {
            console.log('[ResizeObserver Test] Pagination update triggered at', new Date().toLocaleTimeString());
            return originalUpdatePagination.apply(this, arguments);
        };
    }
    
    // Monitor the checkboxes that might trigger content changes
    const checkboxSelectors = [
        '#showPrejudgmentCheckbox',
        '#showPostjudgmentCheckbox',
        '#showPerDiemCheckbox'
    ];
    
    checkboxSelectors.forEach(selector => {
        const checkbox = document.querySelector(selector);
        if (checkbox) {
            // Log when checkbox is clicked
            checkbox.addEventListener('change', () => {
                console.log(`[ResizeObserver Test] Checkbox ${selector} changed to ${checkbox.checked}`);
                
                // Optional: Add a small delay and force a height change to test ResizeObserver
                setTimeout(() => {
                    // Find ink layer
                    const inkLayer = document.querySelector('.ink-layer');
                    if (inkLayer) {
                        // Create temporary padding to force height change
                        inkLayer.style.paddingBottom = '1px';
                        
                        // Then remove it to restore original height (but different enough to trigger observer)
                        setTimeout(() => {
                            inkLayer.style.paddingBottom = '';
                        }, 50);
                    }
                }, 100);
            });
            
            console.log(`[ResizeObserver Test] Monitoring checkbox: ${selector}`);
        }
    });

    // Add a manual test button to the UI
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Pagination Observer';
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '1000';
    testButton.style.padding = '5px 10px';
    testButton.style.backgroundColor = '#007bff';
    testButton.style.color = '#fff';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    testButton.classList.add('screen-only');
    
    testButton.addEventListener('click', () => {
        console.log('[ResizeObserver Test] Manual test triggered');
        
        // Dispatch a content-changed event
        const contentChangedEvent = new Event('content-changed');
        document.dispatchEvent(contentChangedEvent);
        
        // Also try to trigger the ResizeObserver
        const inkLayer = document.querySelector('.ink-layer');
        if (inkLayer) {
            // Toggle padding quickly to change height
            inkLayer.style.paddingBottom = '2px';
            setTimeout(() => {
                inkLayer.style.paddingBottom = '';
                console.log('[ResizeObserver Test] Height change applied');
            }, 50);
        }
    });
    
    document.body.appendChild(testButton);
    
    console.log('ResizeObserver test script initialized');
});
