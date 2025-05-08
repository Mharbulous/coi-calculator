/**
 * Test automation script to verify special damages persistence
 * This script can be run manually to test the handling of special damages
 * when toggling the prejudgment interest checkbox.
 */

// Function to be called directly from the browser console
function testSpecialDamagesPersistence() {
    console.log("=== SPECIAL DAMAGES PERSISTENCE TEST ===");
    console.log("Starting test sequence...");

    // Get current store state
    const store = window.useStore.getState();
    console.log("Initial special damages:", store.results.specialDamages);

    // Step 1: Toggle prejudgment off
    console.log("\nStep 1: Turning prejudgment interest off");
    const prejCheckbox = document.getElementById('showPrejudgmentCheckbox');
    if (prejCheckbox.checked) {
        prejCheckbox.checked = false;
        
        // Manually trigger the change event
        const event = new Event('change');
        prejCheckbox.dispatchEvent(event);
        
        console.log("- Prejudgment interest is now turned off");
        console.log("- Special damages should be saved in savedPrejudgmentState:", 
                   window.useStore.getState().savedPrejudgmentState.specialDamages);
    } else {
        console.log("- Prejudgment interest was already off, turning it on first");
        prejCheckbox.checked = true;
        const event = new Event('change');
        prejCheckbox.dispatchEvent(event);
        
        // Wait 500ms then toggle off
        setTimeout(() => {
            console.log("\nStep 1 (delayed): Turning prejudgment interest off");
            prejCheckbox.checked = false;
            prejCheckbox.dispatchEvent(new Event('change'));
            console.log("- Prejudgment interest is now turned off");
            console.log("- Special damages should be saved in savedPrejudgmentState:", 
                       window.useStore.getState().savedPrejudgmentState.specialDamages);
                       
            // Continue with step 2
            step2();
        }, 500);
        return; // Exit early as we'll continue in the timeout
    }
    
    // Continue with step 2
    step2();
    
    function step2() {
        // Step 2: Verify saved state
        console.log("\nStep 2: Verifying saved state");
        const savedState = window.useStore.getState().savedPrejudgmentState;
        if (savedState && savedState.specialDamages && savedState.specialDamages.length > 0) {
            console.log("- SUCCESS: Special damages were saved:", savedState.specialDamages);
        } else {
            console.error("- FAILURE: Special damages were not properly saved");
        }
        
        // Step 3: Toggle prejudgment back on
        console.log("\nStep 3: Turning prejudgment interest back on");
        prejCheckbox.checked = true;
        prejCheckbox.dispatchEvent(new Event('change'));
        console.log("- Prejudgment interest is now turned on");
        
        // Step 4: Verify restoration
        console.log("\nStep 4: Verifying restoration of special damages");
        const restoredSpecialDamages = window.useStore.getState().results.specialDamages;
        if (restoredSpecialDamages && restoredSpecialDamages.length > 0) {
            console.log("- SUCCESS: Special damages were restored:", restoredSpecialDamages);
        } else {
            console.error("- FAILURE: Special damages were not properly restored");
        }
        
        // Step 5: Verify DOM rendering
        console.log("\nStep 5: Verifying DOM rendering of special damages");
        const prejudgmentTable = document.getElementById('prejudgmentTableBody');
        const specialDamagesRows = prejudgmentTable.querySelectorAll('.editable-item-row');
        console.log(`- Found ${specialDamagesRows.length} special damages rows in the DOM`);
        
        if (specialDamagesRows.length === restoredSpecialDamages.length) {
            console.log("- SUCCESS: DOM rendering matches store state");
        } else {
            console.error(`- FAILURE: DOM rendering (${specialDamagesRows.length} rows) doesn't match store state (${restoredSpecialDamages.length} items)`);
        }
        
        console.log("\n=== TEST SEQUENCE COMPLETE ===");
    }
}

// Export the function for manual execution
window.testSpecialDamagesPersistence = testSpecialDamagesPersistence;

console.log("Special damages persistence test script loaded.");
console.log("Run 'testSpecialDamagesPersistence()' in the console to execute the test.");
