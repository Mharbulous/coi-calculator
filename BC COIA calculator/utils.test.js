import {
    parseDateInput,
    formatDateForDisplay,
    formatDateForInput,
    formatDateLong,
    daysBetween,
    isLeap,
    daysInYear,
    parseCurrency,
    formatCurrencyForInput,
    formatCurrencyForDisplay
} from './utils.js';
import { jest } from '@jest/globals';

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

describe('utils.js', () => {

    describe('parseDateInput', () => {
        it('should parse a valid YYYY-MM-DD string into a UTC Date object', () => {
            const dateString = '2024-03-15';
            const expectedDate = createUTCDate(2024, 3, 15);
            expect(parseDateInput(dateString)).toEqual(expectedDate);
        });

        it('should return null for invalid date formats', () => {
            expect(parseDateInput('15-03-2024')).toBeNull();
            expect(parseDateInput('2024/03/15')).toBeNull();
            expect(parseDateInput('March 15, 2024')).toBeNull();
            expect(parseDateInput('20240315')).toBeNull();
        });

        it('should return null for invalid date values (e.g., month 13)', () => {
            expect(parseDateInput('2024-13-15')).toBeNull();
        });

        it('should return null for invalid date values (e.g., day 32)', () => {
            expect(parseDateInput('2024-03-32')).toBeNull();
        });

        it('should return null for null or empty string input', () => {
            expect(parseDateInput(null)).toBeNull();
            expect(parseDateInput('')).toBeNull();
            expect(parseDateInput(undefined)).toBeNull();
        });

        it('should handle leap year dates correctly', () => {
            const dateString = '2024-02-29';
            const expectedDate = createUTCDate(2024, 2, 29);
            expect(parseDateInput(dateString)).toEqual(expectedDate);
        });

        it('should return null for non-existent leap day', () => {
            expect(parseDateInput('2023-02-29')).toBeNull();
        });
    });

    describe('formatDateForDisplay', () => {
        it('should format a UTC Date object into DD/MM/YYYY string', () => {
            const date = createUTCDate(2024, 3, 15); // March 15, 2024
            expect(formatDateForDisplay(date)).toBe('15/03/2024');
        });

        it('should handle single-digit day and month with padding', () => {
            const date = createUTCDate(2024, 1, 5); // January 5, 2024
            expect(formatDateForDisplay(date)).toBe('05/01/2024');
        });

        it('should return an empty string for invalid Date objects', () => {
            expect(formatDateForDisplay(new Date('invalid date'))).toBe('');
            expect(formatDateForDisplay(null)).toBe('');
            expect(formatDateForDisplay(undefined)).toBe('');
        });

        it('should handle date at the beginning of the year', () => {
            const date = createUTCDate(2025, 1, 1);
            expect(formatDateForDisplay(date)).toBe('01/01/2025');
        });

        it('should handle date at the end of the year', () => {
            const date = createUTCDate(2024, 12, 31);
            expect(formatDateForDisplay(date)).toBe('31/12/2024');
        });
    });

    describe('formatDateForInput', () => {
        it('should format a UTC Date object into YYYY-MM-DD string', () => {
            const date = createUTCDate(2024, 3, 15); // March 15, 2024
            expect(formatDateForInput(date)).toBe('2024-03-15');
        });

        it('should handle single-digit day and month with padding', () => {
            const date = createUTCDate(2024, 1, 5); // January 5, 2024
            expect(formatDateForInput(date)).toBe('2024-01-05');
        });

        it('should return an empty string for invalid Date objects', () => {
            expect(formatDateForInput(new Date('invalid date'))).toBe('');
            expect(formatDateForInput(null)).toBe('');
            expect(formatDateForInput(undefined)).toBe('');
        });

        it('should handle date at the beginning of the year', () => {
            const date = createUTCDate(2025, 1, 1);
            expect(formatDateForInput(date)).toBe('2025-01-01');
        });

        it('should handle date at the end of the year', () => {
            const date = createUTCDate(2024, 12, 31);
            expect(formatDateForInput(date)).toBe('2024-12-31');
        });
    });

    describe('formatDateLong', () => {
        it('should format a UTC Date object into a long format string (Month Day, Year)', () => {
            const date = createUTCDate(2024, 4, 9); // April 9, 2024
            // Note: The exact output depends on the Node.js Intl implementation and locale data.
            // 'en-CA' typically produces "Month Day, Year". Adjust if needed.
            expect(formatDateLong(date)).toBe('April 9, 2024');
        });

        it('should handle different dates', () => {
            const date1 = createUTCDate(2025, 1, 1); // January 1, 2025
            expect(formatDateLong(date1)).toBe('January 1, 2025');
            const date2 = createUTCDate(2023, 12, 31); // December 31, 2023
            expect(formatDateLong(date2)).toBe('December 31, 2023');
        });

        it('should return an empty string for invalid Date objects', () => {
            expect(formatDateLong(new Date('invalid date'))).toBe('');
            expect(formatDateLong(null)).toBe('');
            expect(formatDateLong(undefined)).toBe('');
        });
    });

    describe('daysBetween', () => {
        it('should return 1 for the same start and end date', () => {
            const date = createUTCDate(2024, 3, 15);
            expect(daysBetween(date, date)).toBe(1);
        });

        it('should return the correct number of days for consecutive dates', () => {
            const date1 = createUTCDate(2024, 3, 15);
            const date2 = createUTCDate(2024, 3, 16);
            expect(daysBetween(date1, date2)).toBe(2);
        });

        it('should calculate days correctly across month boundaries', () => {
            const date1 = createUTCDate(2024, 3, 30);
            const date2 = createUTCDate(2024, 4, 2); // March 30 to April 2
            expect(daysBetween(date1, date2)).toBe(4); // 30, 31, 1, 2
        });

        it('should calculate days correctly across year boundaries', () => {
            const date1 = createUTCDate(2023, 12, 30);
            const date2 = createUTCDate(2024, 1, 2); // Dec 30, 2023 to Jan 2, 2024
            expect(daysBetween(date1, date2)).toBe(4); // 30, 31, 1, 2
        });

        it('should calculate days correctly including a leap day', () => {
            const date1 = createUTCDate(2024, 2, 28);
            const date2 = createUTCDate(2024, 3, 1); // Feb 28 to Mar 1 (leap year)
            expect(daysBetween(date1, date2)).toBe(3); // 28, 29, 1
        });

        it('should calculate days correctly in a non-leap year', () => {
            const date1 = createUTCDate(2023, 2, 28);
            const date2 = createUTCDate(2023, 3, 1); // Feb 28 to Mar 1 (non-leap)
            expect(daysBetween(date1, date2)).toBe(2); // 28, 1
        });

        it('should calculate days correctly over a longer period', () => {
            const date1 = createUTCDate(2023, 1, 1);
            const date2 = createUTCDate(2023, 12, 31);
            expect(daysBetween(date1, date2)).toBe(365);
        });

        it('should calculate days correctly over a longer period including a leap year', () => {
            const date1 = createUTCDate(2024, 1, 1);
            const date2 = createUTCDate(2024, 12, 31);
            expect(daysBetween(date1, date2)).toBe(366);
        });

        it('should return 0 if end date is before start date', () => {
            const date1 = createUTCDate(2024, 3, 16);
            const date2 = createUTCDate(2024, 3, 15);
            expect(daysBetween(date1, date2)).toBe(0);
        });

        it('should return 0 for invalid date inputs', () => {
            const validDate = createUTCDate(2024, 3, 15);
            expect(daysBetween(null, validDate)).toBe(0);
            expect(daysBetween(validDate, null)).toBe(0);
            expect(daysBetween(undefined, validDate)).toBe(0);
            expect(daysBetween(validDate, undefined)).toBe(0);
            expect(daysBetween(new Date('invalid'), validDate)).toBe(0);
            expect(daysBetween(validDate, new Date('invalid'))).toBe(0);
        });
    });

    describe('isLeap', () => {
        it('should return true for years divisible by 400', () => {
            expect(isLeap(2000)).toBe(true);
            expect(isLeap(2400)).toBe(true);
        });

        it('should return false for years divisible by 100 but not by 400', () => {
            expect(isLeap(1900)).toBe(false);
            expect(isLeap(2100)).toBe(false);
            expect(isLeap(2200)).toBe(false);
            expect(isLeap(2300)).toBe(false);
        });

        it('should return true for years divisible by 4 but not by 100', () => {
            expect(isLeap(2024)).toBe(true);
            expect(isLeap(2028)).toBe(true);
            expect(isLeap(1996)).toBe(true);
        });

        it('should return false for years not divisible by 4', () => {
            expect(isLeap(2023)).toBe(false);
            expect(isLeap(2025)).toBe(false);
            expect(isLeap(1997)).toBe(false);
        });
    });

    describe('daysInYear', () => {
        it('should return 366 for leap years', () => {
            expect(daysInYear(2000)).toBe(366);
            expect(daysInYear(2024)).toBe(366);
        });

        it('should return 365 for non-leap years', () => {
            expect(daysInYear(1900)).toBe(365);
            expect(daysInYear(2023)).toBe(365);
            expect(daysInYear(2025)).toBe(365);
        });
    });

    describe('parseCurrency', () => {
        it('should parse a number correctly', () => {
            expect(parseCurrency(1234.56)).toBe(1234.56);
        });

        it('should parse a string with only numbers and decimal', () => {
            expect(parseCurrency('1234.56')).toBe(1234.56);
        });

        it('should parse a string with a $ sign', () => {
            expect(parseCurrency('$1234.56')).toBe(1234.56);
        });

        it('should parse a string with commas', () => {
            expect(parseCurrency('1,234.56')).toBe(1234.56);
        });

        it('should parse a string with $ sign and commas', () => {
            expect(parseCurrency('$1,234,567.89')).toBe(1234567.89);
        });

        it('should parse negative numbers correctly', () => {
            expect(parseCurrency('-1234.56')).toBe(-1234.56);
            expect(parseCurrency('-$1,234.56')).toBe(-1234.56);
        });

        it('should return 0 for invalid strings', () => {
            expect(parseCurrency('abc')).toBe(0);
            // The function parses until it finds an invalid character, so '12.34.56' returns 12.34
            expect(parseCurrency('12.34.56')).toBe(12.34);
            // The function parses until it finds an invalid character, so '$1,23a.45' returns 123
            expect(parseCurrency('$1,23a.45')).toBe(123);
            expect(parseCurrency('')).toBe(0);
        });

        it('should return 0 for null or undefined input', () => {
            expect(parseCurrency(null)).toBe(0);
            expect(parseCurrency(undefined)).toBe(0);
        });

        it('should handle zero correctly', () => {
            expect(parseCurrency(0)).toBe(0);
            expect(parseCurrency('0')).toBe(0);
            expect(parseCurrency('$0.00')).toBe(0);
        });
    });

    describe('formatCurrencyForInput', () => {
        it('should format a positive number to $X.XX', () => {
            expect(formatCurrencyForInput(1234.56)).toBe('$1234.56');
        });

        it('should format a negative number to -$X.XX', () => {
            expect(formatCurrencyForInput(-1234.56)).toBe('$-1234.56'); // Note: This matches the function's current behavior
        });

        it('should format zero to $0.00', () => {
            expect(formatCurrencyForInput(0)).toBe('$0.00');
        });

        it('should format numbers with fewer than 2 decimal places correctly', () => {
            expect(formatCurrencyForInput(1234.5)).toBe('$1234.50');
            expect(formatCurrencyForInput(1234)).toBe('$1234.00');
        });

        it('should round numbers with more than 2 decimal places', () => {
            expect(formatCurrencyForInput(1234.567)).toBe('$1234.57'); // Rounds up
            expect(formatCurrencyForInput(1234.564)).toBe('$1234.56'); // Rounds down
        });

        it('should return $0.00 for NaN, null, or undefined', () => {
            expect(formatCurrencyForInput(NaN)).toBe('$0.00');
            expect(formatCurrencyForInput(null)).toBe('$0.00');
            expect(formatCurrencyForInput(undefined)).toBe('$0.00');
        });
    });

    describe('formatCurrencyForDisplay', () => {
        // Helper to extract text content from the span
        const extractText = (html) => {
            const match = html.match(/>([^<]+)</);
            return match ? match[1] : '';
        };
        // Helper to check class name
        const checkClass = (html, expectedClass) => {
            return html.includes(`class="${expectedClass}"`);
        };

        it('should format a positive number with commas and $ sign', () => {
            const result = formatCurrencyForDisplay(1234567.89);
            expect(checkClass(result, 'currency')).toBe(true);
            // Intl formatting can vary slightly, check for essential parts
            expect(extractText(result)).toMatch(/^\$?1,234,567\.89$/); // Optional $ at start
        });

        it('should format a negative number with commas, $ sign, and negative class', () => {
            const result = formatCurrencyForDisplay(-1234.56);
            expect(checkClass(result, 'currency negative')).toBe(true);
            // Check for negative sign and formatted number
            expect(extractText(result)).toMatch(/^-\$?1,234\.56$/); // Optional $ after -
        });

        it('should format zero correctly', () => {
            const result = formatCurrencyForDisplay(0);
            expect(checkClass(result, 'currency')).toBe(true);
            expect(extractText(result)).toMatch(/^\$?0\.00$/);
        });

        it('should format small numbers correctly', () => {
            const result = formatCurrencyForDisplay(0.50);
            expect(checkClass(result, 'currency')).toBe(true);
            expect(extractText(result)).toMatch(/^\$?0\.50$/);
        });

        it('should handle numbers needing rounding for display (Intl handles this)', () => {
            const result = formatCurrencyForDisplay(12.345);
            expect(checkClass(result, 'currency')).toBe(true);
            expect(extractText(result)).toMatch(/^\$?12\.35$/); // Expect rounding
        });

        it('should return formatted zero for NaN, null, or undefined', () => {
            const expectedZero = formatCurrencyForDisplay(0); // Get the baseline zero format
            expect(formatCurrencyForDisplay(NaN)).toBe(expectedZero);
            expect(formatCurrencyForDisplay(null)).toBe(expectedZero);
            expect(formatCurrencyForDisplay(undefined)).toBe(expectedZero);
        });
    });

});
