import { expect, test, describe } from 'vitest';
import { daysBetween, parseDateInput } from '../BC COIA calculator/utils.date.js';

describe('daysBetween function tests', () => {
    test('includes the first day but excludes the last day', () => {
        // Test case from UI example: 2019-06-30 to 2019-07-01 should be 1 day (just June 30)
        const date1 = parseDateInput('2019-06-30');
        const date2 = parseDateInput('2019-07-01');
        const result = daysBetween(date1, date2);
        expect(result).toBe(1);
    });

    test('properly counts multi-day periods', () => {
        // Test case from UI example: 2019-07-01 to 2020-01-01 should be 184 days
        // (July 1, 2019 through December 31, 2019)
        const date1 = parseDateInput('2019-07-01');
        const date2 = parseDateInput('2020-01-01');
        const result = daysBetween(date1, date2);
        expect(result).toBe(184);
    });

    test('returns 0 for same day', () => {
        // Test case from UI example: 2023-07-04 to 2023-07-04 should be 0 days
        const date1 = parseDateInput('2023-07-04');
        const date2 = parseDateInput('2023-07-04');
        const result = daysBetween(date1, date2);
        expect(result).toBe(0);
    });

    test('returns 0 when end date is before start date', () => {
        const date1 = parseDateInput('2023-07-04');
        const date2 = parseDateInput('2023-07-01');
        const result = daysBetween(date1, date2);
        expect(result).toBe(0);
    });

    test('handles invalid dates', () => {
        expect(daysBetween(null, parseDateInput('2023-07-04'))).toBe(0);
        expect(daysBetween(parseDateInput('2023-07-04'), null)).toBe(0);
        expect(daysBetween(null, null)).toBe(0);
    });
});
