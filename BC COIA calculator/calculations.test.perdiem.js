import { calculatePerDiem } from './calculations.js';
import { describe, it, expect, vi } from 'vitest';

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

describe('calculatePerDiem', () => {
    it('should calculate per diem correctly based on postjudgment rate (non-leap year)', () => {
        const totalOwing = 100000; // Total owing
        const finalCalculationDate = createUTCDate(2023, 8, 15); // Aug 15, 2023 (Period 4 @ 4.5% postjudgment)
        const expectedRate = 4.5;
        const expectedPerDiem = (totalOwing * (expectedRate / 100)) / 365; // 2023 is non-leap

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: totalOwing,
                finalCalculationDate: finalCalculationDate
            }
        };

        const result = calculatePerDiem(mockState, mockRatesData);
        expectToBeCloseTo(result, expectedPerDiem);
    });

    it('should calculate per diem correctly based on postjudgment rate (leap year)', () => {
        const totalOwing = 50000; // Total owing
        const finalCalculationDate = createUTCDate(2024, 3, 1); // Mar 1, 2024 (Period 5 @ 5.0% postjudgment)
        const expectedRate = 5.0;
        const expectedPerDiem = (totalOwing * (expectedRate / 100)) / 366; // 2024 is leap

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: totalOwing,
                finalCalculationDate: finalCalculationDate
            }
        };

        const result = calculatePerDiem(mockState, mockRatesData);
        expectToBeCloseTo(result, expectedPerDiem);
    });

    it('should return 0 for zero principal', () => {
        const finalCalculationDate = createUTCDate(2023, 8, 15);
        
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: 0,
                finalCalculationDate: finalCalculationDate
            }
        };
        
        expect(calculatePerDiem(mockState, mockRatesData)).toBe(0);
    });

    it('should return 0 for negative principal', () => {
        const finalCalculationDate = createUTCDate(2023, 8, 15);
        
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: -1000,
                finalCalculationDate: finalCalculationDate
            }
        };
        
        expect(calculatePerDiem(mockState, mockRatesData)).toBe(0);
    });

    it('should return 0 for invalid calculation date', () => {
        // Create a mock state object with null date
        const mockStateNullDate = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: 10000,
                finalCalculationDate: null
            }
        };
        
        // Create a mock state object with invalid date
        const mockStateInvalidDate = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: 10000,
                finalCalculationDate: new Date('invalid')
            }
        };
        
        expect(calculatePerDiem(mockStateNullDate, mockRatesData)).toBe(0);
        expect(calculatePerDiem(mockStateInvalidDate, mockRatesData)).toBe(0);
    });

    it('should return 0 if no postjudgment rate is found for the date', () => {
        const totalOwing = 10000;
        const finalCalculationDate = createUTCDate(2021, 12, 31); // Date before first mock rate period
        
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'BC' },
            results: { 
                totalOwing: totalOwing,
                finalCalculationDate: finalCalculationDate
            }
        };
        
        // Mock console.warn to check for warnings
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
        expect(calculatePerDiem(mockState, mockRatesData)).toBe(0);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find a valid postjudgment rate'));
        consoleWarnSpy.mockRestore();
    });

    it('should return 0 for missing jurisdiction data', () => {
        const totalOwing = 10000;
        const finalCalculationDate = createUTCDate(2023, 8, 15);
        
        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'AB' },
            results: { 
                totalOwing: totalOwing,
                finalCalculationDate: finalCalculationDate
            }
        };
        
        expect(calculatePerDiem(mockState, mockRatesData)).toBe(0);
    });

    it('should use the correct rate for a different jurisdiction (ON)', () => {
        const totalOwing = 20000;
        const finalCalculationDate = createUTCDate(2023, 5, 1); // May 1, 2023
        const expectedRate = 6.0; // ON postjudgment rate for 2023
        const expectedPerDiem = (totalOwing * (expectedRate / 100)) / 365;

        // Create a mock state object
        const mockState = {
            inputs: { jurisdiction: 'ON' },
            results: { 
                totalOwing: totalOwing,
                finalCalculationDate: finalCalculationDate
            }
        };

        const result = calculatePerDiem(mockState, mockRatesData);
        expectToBeCloseTo(result, expectedPerDiem);
    });
});
