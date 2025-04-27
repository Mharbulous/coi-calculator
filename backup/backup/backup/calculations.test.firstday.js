import { calculateInterestPeriods } from './calculations.js';
import { describe, it, expect } from 'vitest';

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

// Helper function for comparing floating point numbers
const expectToBeCloseTo = (actual, expected, precision = 2) => {
    expect(actual).toBeCloseTo(expected, precision);
};

// Mock interest rates data for testing
const mockRatesData = {
    BC: [
        { start: createUTCDate(2024, 7, 1), end: createUTCDate(2024, 12, 31), prejudgment: 4.5, postjudgment: 5.5 },
    ]
};

describe('Special damages on first day of interest period', () => {
    it('should calculate interest correctly for special damages on the first day of the final period', () => {
        // Create special damages occurring on the first day of the period
        const specialDamages = [
            { date: '2024-07-01', amount: 100, description: 'First Day Damage' }
        ];
        
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages }
        };
        
        const principal = 1000;
        const startDate = createUTCDate(2024, 7, 1); // Start date is Jul 1, 2024
        const endDate = createUTCDate(2024, 7, 31); // End date is Jul 31, 2024
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify that the special damage gets its own interest calculation row
        expect(result.finalPeriodDamageInterestDetails.length).toBe(1);
        expect(result.finalPeriodDamageInterestDetails[0].principal).toBe(100);
        expect(result.finalPeriodDamageInterestDetails[0].description).toContain('First Day Damage');
        expect(result.finalPeriodDamageInterestDetails[0].isFinalPeriodDamage).toBe(true);
        
        // Verify that the special damage isn't counted in the main calculation
        expect(result.details[0].principal).toBe(principal);
        
        // Verify the final principal is correct (includes the special damage)
        expect(result.principal).toBe(principal + 100);
    });
    
    it('should calculate interest correctly for special damages on days after the first day', () => {
        // Create special damages occurring after the first day of the period
        const specialDamages = [
            { date: '2024-07-15', amount: 200, description: 'Mid Period Damage' }
        ];
        
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages }
        };
        
        const principal = 1000;
        const startDate = createUTCDate(2024, 7, 1); // Start date is Jul 1, 2024
        const endDate = createUTCDate(2024, 7, 31); // End date is Jul 31, 2024
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify that the special damage gets its own interest calculation row
        expect(result.finalPeriodDamageInterestDetails.length).toBe(1);
        expect(result.finalPeriodDamageInterestDetails[0].principal).toBe(200);
        expect(result.finalPeriodDamageInterestDetails[0].description).toContain('Mid Period Damage');
        
        // Verify the final principal is correct (includes the special damage)
        expect(result.principal).toBe(principal + 200);
    });
    
    it('should calculate interest correctly for multiple special damages in final period', () => {
        // Create multiple special damages in the period, including one on the first day
        const specialDamages = [
            { date: '2024-07-01', amount: 100, description: 'First Day Damage' },
            { date: '2024-07-15', amount: 200, description: 'Mid Period Damage' }
        ];
        
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages }
        };
        
        const principal = 1000;
        const startDate = createUTCDate(2024, 7, 1); // Start date is Jul 1, 2024
        const endDate = createUTCDate(2024, 7, 31); // End date is Jul 31, 2024
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );
        
        // Verify that both special damages get their own interest calculation rows
        expect(result.finalPeriodDamageInterestDetails.length).toBe(2);
        
        // Sort the details by principal to make testing easier
        const sortedDetails = [...result.finalPeriodDamageInterestDetails].sort((a, b) => a.principal - b.principal);
        
        // Check first day damage
        expect(sortedDetails[0].principal).toBe(100);
        expect(sortedDetails[0].description).toContain('First Day Damage');
        
        // Check mid-period damage
        expect(sortedDetails[1].principal).toBe(200);
        expect(sortedDetails[1].description).toContain('Mid Period Damage');
        
        // Verify the final principal is correct (includes both special damages)
        expect(result.principal).toBe(principal + 100 + 200);
    });
});
