import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import useStore from './store.js';

// Mock the normalizeDate function to ensure consistent date handling in tests
vi.mock('./utils.date.js', () => ({
    normalizeDate: (date) => date
}));

describe('Prejudgment State Preservation', () => {
    // Reset the store before each test
    beforeEach(() => {
        useStore.getState().resetStore();
    });

    it('should save and restore prejudgment calculation state when toggling checkbox', () => {
        // Setup initial state with some special damages and prejudgment result
        const specialDamages = [
            { date: '2023-01-01', description: 'Test Damage 1', amount: 1000 },
            { date: '2023-02-01', description: 'Test Damage 2', amount: 2000 }
        ];
        
        const prejudgmentResult = {
            details: [
                { startDate: '2023-01-01', endDate: '2023-06-30', rate: 0.05, interest: 100 }
            ],
            total: 100,
            principal: 5000,
            finalPeriodDamageInterestDetails: []
        };
        
        // Set the initial state
        useStore.getState().setSpecialDamages(specialDamages);
        useStore.getState().setPrejudgmentResult(prejudgmentResult);
        
        // Verify initial state
        expect(useStore.getState().results.specialDamages).toHaveLength(2);
        expect(useStore.getState().results.prejudgmentResult.total).toBe(100);
        
        // Save the state (simulating turning off the checkbox)
        useStore.getState().savePrejudgmentState();
        
        // Clear the current state to simulate what happens when checkbox is off
        useStore.getState().setSpecialDamages([]);
        useStore.getState().setPrejudgmentResult({ details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] });
        
        // Verify state was cleared
        expect(useStore.getState().results.specialDamages).toHaveLength(0);
        expect(useStore.getState().results.prejudgmentResult.total).toBe(0);
        
        // Restore the state (simulating turning on the checkbox)
        useStore.getState().restorePrejudgmentState();
        
        // Verify state was restored
        expect(useStore.getState().results.specialDamages).toHaveLength(2);
        expect(useStore.getState().results.specialDamages[0].amount).toBe(1000);
        expect(useStore.getState().results.specialDamages[1].amount).toBe(2000);
        expect(useStore.getState().results.prejudgmentResult.total).toBe(100);
        expect(useStore.getState().results.prejudgmentResult.principal).toBe(5000);
        expect(useStore.getState().results.prejudgmentResult.details).toHaveLength(1);
    });

    it('should handle empty saved state gracefully', () => {
        // Setup initial state with no special damages
        useStore.getState().setSpecialDamages([]);
        
        // Save the empty state
        useStore.getState().savePrejudgmentState();
        
        // Add some special damages after saving
        const specialDamages = [
            { date: '2023-01-01', description: 'Test Damage 1', amount: 1000 }
        ];
        useStore.getState().setSpecialDamages(specialDamages);
        
        // Verify current state has damages
        expect(useStore.getState().results.specialDamages).toHaveLength(1);
        
        // Restore the state (which was empty)
        useStore.getState().restorePrejudgmentState();
        
        // Verify current state is unchanged since saved state was empty
        expect(useStore.getState().results.specialDamages).toHaveLength(1);
    });

    it('should preserve user-entered prejudgment interest when toggling checkbox', () => {
        // Set user-entered prejudgment interest
        useStore.getState().setInput('userEnteredPrejudgmentInterest', 500);
        
        // Set calculated prejudgment interest
        useStore.getState().setPrejudgmentResult({ total: 300 });
        
        // Save state (simulating turning off checkbox)
        useStore.getState().savePrejudgmentState();
        
        // Verify saved state has the calculated value
        expect(useStore.getState().savedPrejudgmentState.prejudgmentResult.total).toBe(300);
        
        // Verify user-entered value is preserved
        expect(useStore.getState().inputs.userEnteredPrejudgmentInterest).toBe(500);
    });
});
