/**
 * Utility functions for currency manipulation.
 */

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
