import { calculateInterestPeriods } from './calculations.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

// Helper function for comparing floating point numbers
const expectToBeCloseTo = (actual, expected, precision = 2) => {
    expect(actual).toBeCloseTo(expected, precision);
};

// Mock interest rates data for testing
const mockRatesData = {
    BC: [
        // Period 1: Jan 1, 2022 - Jun 30, 2022
        { start: createUTCDate(2022, 1, 1), end: createUTCDate(2022, 6, 30), prejudgment: 2.0, postjudgment: 3.0 },
        // Period 2: Jul 1, 2022 - Dec 31, 2022
        { start: createUTCDate(2022, 7, 1), end: createUTCDate(2022, 12, 31), prejudgment: 2.5, postjudgment: 3.5 },
        // Period 3: Jan 1, 2023 - Jun 30, 2023
        { start: createUTCDate(2023, 1, 1), end: createUTCDate(2023, 6, 30), prejudgment: 3.0, postjudgment: 4.0 },
        // Period 4: Jul 1, 2023 - Dec 31, 2023
        { start: createUTCDate(2023, 7, 1), end: createUTCDate(2023, 12, 31), prejudgment: 3.5, postjudgment: 4.5 },
        // Period 5: Jan 1, 2024 - Jun 30, 2024 (Leap Year)
        { start: createUTCDate(2024, 1, 1), end: createUTCDate(2024, 6, 30), prejudgment: 4.0, postjudgment: 5.0 },
        // Period 6: Jul 1, 2024 - Dec 31, 2024
        { start: createUTCDate(2024, 7, 1), end: createUTCDate(2024, 12, 31), prejudgment: 4.5, postjudgment: 5.5 },
    ],
    ON: [ // Ontario rates for testing jurisdiction switch
        { start: createUTCDate(2023, 1, 1), end: createUTCDate(2023, 12, 31), prejudgment: 5.0, postjudgment: 6.0 },
    ],
    // AB: Intentionally left empty to test missing jurisdiction
};

describe('calculateInterestPeriods', () => {
    // --- Basic Cases ---
    it('should return 0 total interest for zero principal', () => {
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            createUTCDate(2023, 1, 1),
            createUTCDate(2023, 1, 31),
            0,
            mockRatesData
        );
        expect(result.total).toBe(0);
        expect(result.details).toEqual([]);
        expect(result.principal).toBe(0);
    });

    it('should return 0 total interest for negative principal', () => {
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            createUTCDate(2023, 1, 1),
            createUTCDate(2023, 1, 31),
            -1000,
            mockRatesData
        );
        expect(result.total).toBe(0);
        expect(result.details).toEqual([]);
        expect(result.principal).toBe(-1000); // Principal is returned as passed
    });

    it('should return 0 total interest if end date is before start date', () => {
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            createUTCDate(2023, 1, 31),
            createUTCDate(2023, 1, 1),
            1000,
            mockRatesData
        );
        expect(result.total).toBe(0);
        expect(result.details).toEqual([]);
        expect(result.principal).toBe(1000);
    });

    it('should return 0 total interest for missing jurisdiction data', () => {
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'AB' },
            results: { specialDamages: [] }
        };
        
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            createUTCDate(2023, 1, 1),
            createUTCDate(2023, 1, 31),
            1000,
            mockRatesData
        );
        expect(result.total).toBe(0);
        expect(result.details).toEqual([]);
        expect(result.principal).toBe(1000);
    });

    // --- Calculation within a single rate period ---
    it('should calculate prejudgment interest correctly within a single rate period (non-leap)', () => {
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const principal = 10000;
        const startDate = createUTCDate(2023, 2, 1); // Feb 1, 2023
        const endDate = createUTCDate(2023, 3, 31); // Mar 31, 2023 (59 days in Period 3 @ 3.0%)
        const expectedDays = 58; // Feb (28) + Mar (31) - 1 for excluding Feb 1
        const expectedRate = 3.0;
        const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365; // 2023 is non-leap

        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(1);
        expect(result.details[0].description).toBe(`${expectedDays} days`);
        expect(result.details[0].rate).toBe(expectedRate);
        expect(result.details[0].principal).toBe(principal);
        expectToBeCloseTo(result.details[0].interest, expectedInterest);
        expectToBeCloseTo(result.total, expectedInterest);
        expect(result.principal).toBe(principal);
    });

    it('should calculate postjudgment interest correctly within a single rate period (leap year)', () => {
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };
        
        const principal = 5000;
        const startDate = createUTCDate(2024, 1, 15); // Jan 15, 2024
        const endDate = createUTCDate(2024, 3, 15); // Mar 15, 2024 (61 days in Period 5 @ 5.0%)
        const expectedDays = 60; // Jan (17) + Feb (29) + Mar (15) - 1 for excluding Jan 15
        const expectedRate = 5.0;
        const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 366; // 2024 is leap

        const result = calculateInterestPeriods(
            mockState,
            'postjudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(1);
        expect(result.details[0].description).toBe(`${expectedDays} days`);
        expect(result.details[0].rate).toBe(expectedRate);
        expect(result.details[0].principal).toBe(principal);
        expectToBeCloseTo(result.details[0].interest, expectedInterest);
        expectToBeCloseTo(result.total, expectedInterest);
        expect(result.principal).toBe(principal);
    });

    // --- Edge Cases ---
    it('should handle start date exactly on a rate change date', () => {
        const principal = 1000;
        const startDate = createUTCDate(2023, 7, 1); // Start of Period 4
        const endDate = createUTCDate(2023, 7, 10); // 10 days in Period 4 @ 3.5%
        const expectedDays = 9; // 10 days - 1 for excluding the first day
        const expectedRate = 3.5;
        const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365;

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };

        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(1);
        expect(result.details[0].description).toBe(`${expectedDays} days`);
        expect(result.details[0].rate).toBe(expectedRate);
        expectToBeCloseTo(result.total, expectedInterest);
    });

    it('should handle end date exactly on a rate change date', () => {
        const principal = 1000;
        const startDate = createUTCDate(2023, 6, 21); // 10 days in Period 3 @ 3.0%
        const endDate = createUTCDate(2023, 6, 30); // End of Period 3
        const expectedDays = 9; // 10 days - 1 for excluding the first day
        const expectedRate = 3.0;
        const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365;

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };

        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(1);
        expect(result.details[0].description).toBe(`${expectedDays} days`);
        expect(result.details[0].rate).toBe(expectedRate);
        expectToBeCloseTo(result.total, expectedInterest);
    });

    it('should handle period spanning a rate change date exactly', () => {
        const principal = 5000;
        const startDate = createUTCDate(2022, 6, 21); // 10 days in Period 1 @ 2.0%
        const endDate = createUTCDate(2022, 7, 10); // 10 days in Period 2 @ 2.5%

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: [] }
        };

        // Period 1: Jun 21 - Jun 30 (9 days @ 2.0%)
        const days1 = 9; // 10 days - 1 for excluding Jun 21
        const rate1 = 2.0;
        const interest1 = (principal * (rate1 / 100) * days1) / 365;

        // Period 2: Jul 1 - Jul 10 (9 days @ 2.5%)
        const days2 = 9; // 10 days - 1 for excluding Jul 1
        const rate2 = 2.5;
        const interest2 = (principal * (rate2 / 100) * days2) / 365;

        const expectedTotalInterest = interest1 + interest2;
        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(2);
        expect(result.details[0].description).toBe(`${days1} days`);
        expect(result.details[0].rate).toBe(rate1);
        expect(result.details[1].description).toBe(`${days2} days`);
        expect(result.details[1].rate).toBe(rate2);
        expectToBeCloseTo(result.total, expectedTotalInterest);
    });

    // --- Jurisdiction Test ---
    it('should use the correct rates for a different jurisdiction (ON)', () => {
        const principal = 10000;
        const startDate = createUTCDate(2023, 1, 1);
        const endDate = createUTCDate(2023, 12, 31); // Full year 2023
        const expectedDays = 364; // 365 days - 1 for excluding Jan 1
        const expectedRate = 5.0; // ON prejudgment rate
        const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365;

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'ON' },
            results: { specialDamages: [] }
        };

        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(1);
        expect(result.details[0].description).toBe(`${expectedDays} days`);
        expect(result.details[0].rate).toBe(expectedRate);
        expectToBeCloseTo(result.total, expectedInterest);
    });

    // --- Missing Rate Test ---
    it('should handle periods where rates are missing (hypothetical gap)', () => {
         // Create a custom rates object with only Period 1
         const ratesWithGap = {
            BC: [
                // Only include Period 1
                { 
                    start: createUTCDate(2022, 1, 1), 
                    end: createUTCDate(2022, 6, 30), 
                    prejudgment: 2.0, 
                    postjudgment: 3.0 
                }
            ],
            ON: mockRatesData.ON
         };

         const principal = 1000;
         const startDate = createUTCDate(2022, 6, 25); // Jun 25, 2022 (Period 1 @ 2.0%)
         const endDate = createUTCDate(2022, 6, 30);   // Jun 30, 2022 (End of Period 1)

         // Create a mock state object
         const mockState = {
             inputs: { jurisdiction: 'BC' },
             results: { specialDamages: [] }
         };

         // Period 1: Jun 25 - Jun 30 (5 days @ 2.0%)
         const days1 = 5; // 6 days - 1 for excluding Jun 25
         const rate1 = 2.0;
         const interest1 = (principal * (rate1 / 100) * days1) / 365;

         // Expect only interest from Period 1
         const expectedTotalInterest = interest1;

         // Mock console.warn to check for warnings
         const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

         const result = calculateInterestPeriods(
             mockState,
             'prejudgment',
             startDate,
             endDate,
             principal,
             ratesWithGap
         );

         expect(result.details.length).toBe(1); // Only the segment with a rate
         expect(result.details[0].description).toBe(`${days1} days`);
         expect(result.details[0].rate).toBe(rate1);
         expectToBeCloseTo(result.total, expectedTotalInterest);

         // We don't expect warnings for this test since we're staying within Period 1
         
         consoleWarnSpy.mockRestore(); // Clean up spy
    });

    it('should return correct final principal when damages occur on the end date (but not calculated separately)', () => {
        // This test verifies the final principal calculation, not the special final period interest calc
        const principal = 1000;
        const startDate = createUTCDate(2023, 1, 1);
        const endDate = createUTCDate(2023, 6, 30); // End of Period 3
        const specialDamages = [
            { date: '2023-06-30', amount: 50, description: 'On End Date' }
        ];

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { specialDamages: specialDamages }
        };

        // Period 3: Jan 1 - Jun 30 (180 days @ 3.0%) - Principal: 1000
        const days1 = 180; // 181 days - 1 for excluding Jan 1
        const rate1 = 3.0;
        const principal1 = 1000;
        const interest1 = (principal1 * (rate1 / 100) * days1) / 365;

        const expectedTotalInterest = interest1;
        const expectedFinalPrincipal = 1000 + 50; // Damage added to final principal

        const result = calculateInterestPeriods(
            mockState,
            'prejudgment',
            startDate,
            endDate,
            principal,
            mockRatesData
        );

        expect(result.details.length).toBe(1); // Only the main period calculation
        expect(result.details[0].principal).toBe(principal1); // Damage doesn't affect interest calc within the period
        expectToBeCloseTo(result.total, expectedTotalInterest);
        expect(result.principal).toBe(expectedFinalPrincipal); // Final principal includes the damage
    });
});
