import { getInterestRateForDate } from './calculations.js';
import { describe, it, expect } from 'vitest';

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

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

describe('getInterestRateForDate', () => {
    it('should return the correct prejudgment rate for a date within a rate period', () => {
        const date = createUTCDate(2023, 3, 15); // March 15, 2023 (Period 3)
        const expectedRate = 3.0; // BC prejudgment rate for Period 3
        const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
        expect(result).toBe(expectedRate);
    });

    it('should return the correct postjudgment rate for a date within a rate period', () => {
        const date = createUTCDate(2023, 3, 15); // March 15, 2023 (Period 3)
        const expectedRate = 4.0; // BC postjudgment rate for Period 3
        const result = getInterestRateForDate(date, 'postjudgment', 'BC', mockRatesData);
        expect(result).toBe(expectedRate);
    });

    it('should return the correct rate for a date at the start of a rate period', () => {
        const date = createUTCDate(2023, 1, 1); // January 1, 2023 (Start of Period 3)
        const expectedRate = 3.0; // BC prejudgment rate for Period 3
        const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
        expect(result).toBe(expectedRate);
    });

    it('should return the correct rate for a date at the end of a rate period', () => {
        const date = createUTCDate(2023, 6, 30); // June 30, 2023 (End of Period 3)
        const expectedRate = 3.0; // BC prejudgment rate for Period 3
        const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
        expect(result).toBe(expectedRate);
    });

    it('should return the correct rate for a different jurisdiction', () => {
        const date = createUTCDate(2023, 3, 15); // March 15, 2023
        const expectedRate = 5.0; // ON prejudgment rate for 2023
        const result = getInterestRateForDate(date, 'prejudgment', 'ON', mockRatesData);
        expect(result).toBe(expectedRate);
    });

    it('should return 0 for a date before any rate period', () => {
        const date = createUTCDate(2021, 12, 31); // December 31, 2021 (before first period)
        const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
        expect(result).toBe(0);
    });

    it('should return 0 for a date after all rate periods', () => {
        const date = createUTCDate(2025, 1, 1); // January 1, 2025 (after last period)
        const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
        expect(result).toBe(0);
    });

    it('should return 0 for a missing jurisdiction', () => {
        const date = createUTCDate(2023, 3, 15); // March 15, 2023
        const result = getInterestRateForDate(date, 'prejudgment', 'AB', mockRatesData);
        expect(result).toBe(0);
    });

    it('should return 0 for an invalid date', () => {
        const result = getInterestRateForDate(null, 'prejudgment', 'BC', mockRatesData);
        expect(result).toBe(0);
    });
});
