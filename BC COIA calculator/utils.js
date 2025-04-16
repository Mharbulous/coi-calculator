/**
 * Utility functions for date and currency manipulation.
 */

/**
 * Validates that a string is in the YYYY-MM-DD format.
 * @param {string} dateString - The date string to validate.
 * @returns {boolean} True if the string is in YYYY-MM-DD format, false otherwise.
 */
export function validateDateFormat(dateString) {
    if (!dateString) return false;
    // Regular expression to match YYYY-MM-DD format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // Further validate that it's a valid date
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // Check month and day ranges
    if (month < 1 || month > 12) return false;
    
    // Get the last day of the month for the given year/month
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day < 1 || day > lastDay) return false;
    
    return true;
}

/**
 * Parses a date string in YYYY-MM-DD format into a UTC Date object.
 * @param {string} dateString - The date string to parse.
 * @returns {Date|null} The parsed Date object in UTC, or null if invalid.
 */
export function parseDateInput(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        // Create date in UTC
        const date = new Date(Date.UTC(year, month, day));
        // Basic validation: Check if the components match after creation
        if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
            return date;
        }
    }
    console.warn("Invalid date string format for input:", dateString);
    return null;
}

/**
 * Formats a Date object into YYYY-MM-DD string (UTC).
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string, or '' if invalid.
 */
export function formatDateForDisplay(date) {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Changed format to YYYY-MM-DD
}

/**
 * Formats a Date object into YYYY-MM-DD string (UTC) for input fields.
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string, or '' if invalid.
 */
export function formatDateForInput(date) {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


/**
 * Formats a Date object into YYYY-MM-DD string (UTC).
 * @param {Date} date - The Date object to format.
 * @returns {string} The formatted date string, or '' if invalid.
 */
export function formatDateLong(date) {
    // Standardize to YYYY-MM-DD
    return formatDateForDisplay(date); 
}

/**
 * Calculates the number of days between two UTC dates, inclusive.
 * @param {Date} date1 - The start date (UTC).
 * @param {Date} date2 - The end date (UTC).
 * @returns {number} The number of days between the dates, or 0 if invalid input.
 */
export function daysBetween(date1, date2) {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime()) || date2 < date1) {
        return 0;
    }
    // Calculate difference in milliseconds at the start of each day in UTC
    const startOfDay1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
    const startOfDay2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
    const differenceInMilliseconds = startOfDay2 - startOfDay1;
    // Convert milliseconds to days and add 1 for inclusivity
    return Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Checks if a given year is a leap year.
 * @param {number} year - The year to check.
 * @returns {boolean} True if the year is a leap year, false otherwise.
 */
export function isLeap(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Gets the number of days in a given year.
 * @param {number} year - The year.
 * @returns {number} 366 if it's a leap year, 365 otherwise.
 */
export function daysInYear(year) {
    return isLeap(year) ? 366 : 365;
}

/**
 * Parses a currency string (potentially with $, commas) into a number.
 * @param {string|number} value - The currency string or number.
 * @returns {number} The parsed number, or 0 if invalid.
 */
export function parseCurrency(value) {
    if (typeof value !== 'string') {
        value = String(value);
    }
    // Remove currency symbols and commas, then parse as float
    const number = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(number) ? 0 : number;
}

// Intl.NumberFormat instance for Canadian currency formatting
const currencyFormatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/**
 * Formats a number into a currency string for input fields (e.g., "$1234.56").
 * Uses a simpler format without commas suitable for editing.
 * @param {number} value - The number to format.
 * @returns {string} The formatted currency string.
 */
export function formatCurrencyForInput(value) {
    if (isNaN(value) || value === null) return "$0.00";
    // Format with 2 decimal places, no commas.
    return '$' + value.toFixed(2);
}

/**
 * Formats a number into a currency string with commas for input fields (e.g., "1,234.56").
 * Suitable for display within an input field when not focused.
 * @param {number} value - The number to format.
 * @returns {string} The formatted currency string with commas, no symbol.
 */
export function formatCurrencyForInputWithCommas(value) {
    if (isNaN(value) || value === null) return "0.00";
    // Use Intl.NumberFormat but without currency style to get commas
    const formatter = new Intl.NumberFormat('en-CA', {
        minimumFractionDigits: 2,
         maximumFractionDigits: 2,
     });
     // Prepend the '$' symbol
     return '$' + formatter.format(value);
 }


/**
 * Formats a number into a currency string for display, including styling for negatives.
 * Uses Intl.NumberFormat for locale-aware formatting (e.g., commas).
 * @param {number} value - The number to format.
 * @returns {string} HTML string with formatted currency and appropriate class.
 */
export function formatCurrencyForDisplay(value) {
    if (isNaN(value) || value === null) {
        // Use the formatter even for zero to ensure consistent $ symbol and spacing
        return `<span class="currency">${currencyFormatter.format(0).replace('CA', '').trim()}</span>`;
    }

    const absValue = Math.abs(value);
    const className = value < 0 ? "currency negative" : "currency";
    // Format using Intl, remove the CAD symbol if present (optional, depends on desired display)
    const formattedNumber = currencyFormatter.format(absValue).replace('CA', '').trim();

    // Add negative sign manually if needed, as Intl might use parentheses for negatives
    const sign = value < 0 ? '-' : '';

    return `<span class="${className}">${sign}${formattedNumber}</span>`;
}
