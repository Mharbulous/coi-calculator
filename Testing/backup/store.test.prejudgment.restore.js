import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import useStore from './store.js';

// Mock the normalizeDate function to ensure consistent date handling in tests
vi.mock('./utils.date.js', () => ({
    normalizeDate: (date) => date
}));

describe('Prejudgment Date Restoration', () => {
    // Reset the store before each test
    beforeEach(() => {
        useStore.getState().resetStore();
        // Spy on console.log for verification
        vi.spyOn(console, 'log');
    });
    
    afterEach(() => {
        // Clear all mocks after each test
        vi.clearAllMocks();
    });

    it('should restore prejudgment date without special damages', () => {
        // Create a test date
        const testDate = new Date('2023-05-15');
        
        // Set the prejudgment date
        useStore.getState().setInput('prejudgmentStartDate', testDate);
        
        // Save the state (simulating turning off the checkbox)
        useStore.getState().savePrejudgmentState();
        
        // Clear the current date
        useStore.getState().setInput('prejudgmentStartDate', null);
        
        // Verify the date was cleared
        expect(useStore.getState().inputs.prejudgmentStartDate).toBeNull();
        
        // Restore the state (simulating turning on the checkbox)
        useStore.getState().restorePrejudgmentState();
        
        // Verify console log was called with the correct date
        expect(console.log).toHaveBeenCalledWith(
            "Restoring prejudgment state with date:", 
            testDate
        );
        
        // Verify the date was restored properly
        expect(useStore.getState().inputs.prejudgmentStartDate).toEqual(testDate);
    });

    it('should restore prejudgment date with special damages', () => {
        // Create a test date and special damages
        const testDate = new Date('2023-05-15');
        const specialDamages = [
            { date: '2023-01-01', description: 'Test Damage', amount: 1000 }
        ];
        
        // Set the prejudgment date and special damages
        useStore.getState().setInput('prejudgmentStartDate', testDate);
        useStore.getState().setSpecialDamages(specialDamages);
        
        // Save the state
        useStore.getState().savePrejudgmentState();
        
        // Clear the current state
        useStore.getState().setInput('prejudgmentStartDate', null);
        useStore.getState().setSpecialDamages([]);
        
        // Verify the state was cleared
        expect(useStore.getState().inputs.prejudgmentStartDate).toBeNull();
        expect(useStore.getState().results.specialDamages).toHaveLength(0);
        
        // Restore the state
        useStore.getState().restorePrejudgmentState();
        
        // Verify both the date and special damages were restored
        expect(useStore.getState().inputs.prejudgmentStartDate).toEqual(testDate);
        expect(useStore.getState().results.specialDamages).toHaveLength(1);
        expect(useStore.getState().results.specialDamages[0].amount).toBe(1000);
    });

    it('should handle null prejudgment date gracefully', () => {
        // Save state with null prejudgment date
        useStore.getState().savePrejudgmentState();
        
        // Restore the state
        useStore.getState().restorePrejudgmentState();
        
        // Verify no errors occurred and console log was called
        expect(console.log).toHaveBeenCalledWith(
            "Restoring prejudgment state with date:", 
            null
        );
        
        // State should remain unchanged
        expect(useStore.getState().inputs.prejudgmentStartDate).toBeNull();
    });
});
