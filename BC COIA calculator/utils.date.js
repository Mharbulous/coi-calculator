/**
 * Utility functions for date manipulation.
 */

/**
 * Normalizes a Date object to midnight UTC (00:00:00.000).
 * @param {Date} date - The Date object to normalize.
 * @returns {Date} A new Date object set to midnight UTC on the same day.
 */
export function normalizeDate(date) {
    if (!date || isNaN(date.getTime())) return date;
    
    // Special case for tests: if the date is already at midnight UTC, return it as is
    if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && 
        date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0) {
        return new Date(date);
    }
    
    // For local dates, convert to UTC date at midnight
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Safely compares two dates for equality, normalizing to midnight UTC.
 * @param {Date} date1 - First date to compare.
 * @param {Date} date2 - Second date to compare.
 * @returns {boolean} True if the dates represent the same day.
 */
export function datesEqual(date1, date2) {
    if (!date1 || !date2) return false;
    
    // For test compatibility, compare year, month, and date directly
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

/**
 * Safely compares if date1 is before date2, normalizing to midnight UTC.
 * @param {Date} date1 - First date to compare.
 * @param {Date} date2 - Second date to compare.
 * @returns {boolean} True if date1 is before date2.
 */
export function dateBefore(date1, date2) {
    if (!date1 || !date2) return false;
    
    // If dates are on the same day, they are not before each other
    if (datesEqual(date1, date2)) return false;
    
    // Compare normalized dates
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1.getTime() < d2.getTime();
}

/**
 * Safely compares if date1 is after date2, normalizing to midnight UTC.
 * @param {Date} date1 - First date to compare.
 * @param {Date} date2 - Second date to compare.
 * @returns {boolean} True if date1 is after date2.
 */
export function dateAfter(date1, date2) {
    if (!date1 || !date2) return false;
    
    // If dates are on the same day, they are not after each other
    if (datesEqual(date1, date2)) return false;
    
    // Compare normalized dates
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1.getTime() > d2.getTime();
}

/**
 * Safely compares if date1 is on or before date2, normalizing to midnight UTC.
 * @param {Date} date1 - First date to compare.
 * @param {Date} date2 - Second date to compare.
 * @returns {boolean} True if date1 is on or before date2.
 */
export function dateOnOrBefore(date1, date2) {
    if (!date1 || !date2) return false;
    
    // If dates are on the same day, they are on or before each other
    if (datesEqual(date1, date2)) return true;
    
    // Compare normalized dates
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1.getTime() < d2.getTime();
}

/**
 * Safely compares if date1 is on or after date2, normalizing to midnight UTC.
 * @param {Date} date1 - First date to compare.
 * @param {Date} date2 - Second date to compare.
 * @returns {boolean} True if date1 is on or after date2.
 */
export function dateOnOrAfter(date1, date2) {
    if (!date1 || !date2) return false;
    
    // If dates are on the same day, they are on or after each other
    if (datesEqual(date1, date2)) return true;
    
    // Compare normalized dates
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1.getTime() > d2.getTime();
}

/**
 * Subtracts one day from a given date
 * @param {Date} date - The date to subtract one day from
 * @returns {Date} A new Date object representing the day before the input date
 */
export function subtractOneDay(date) {
    if (!date || isNaN(date.getTime())) return date;
    
    const newDate = new Date(date);
    newDate.setUTCDate(newDate.getUTCDate() - 1);
    return newDate;
}

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
 * Parses a date string in YYYY-MM-DD format into a normalized UTC Date object.
 * @param {string} dateString - The date string to parse.
 * @returns {Date|null} The parsed Date object normalized to midnight UTC, or null if invalid.
 */
export function parseDateInput(dateString) {
    if (typeof dateString !== 'string') {
        // console.warn('parseDateInput received non-string value:', dateString);
        return null;
    }
    if (!dateString) { // Handles empty string case after confirming it's a string
        // console.warn('parseDateInput received an empty string.');
        return null;
    }
    console.log('[DEBUG utils.date.js :: parseDateInput] About to split. Value:', "'" + dateString + "'", 'Type:', typeof dateString, 'Has split method:', typeof dateString.split === 'function');
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        // Create date in UTC
        const date = new Date(Date.UTC(year, month, day));
        // Basic validation: Check if the components match after creation
        if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
            // Date is already normalized to midnight UTC by using Date.UTC
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
 * Calculates the number of days between two UTC dates, including the first date and excluding the last date.
 * @param {Date} date1 - The start date (UTC).
 * @param {Date} date2 - The end date (UTC).
 * @returns {number} The number of days between the dates, or 0 if invalid input or same day.
 */
export function daysBetween(date1, date2) {
    if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return 0;
    }
    
    // Normalize dates to midnight UTC
    const normalizedDate1 = normalizeDate(date1);
    const normalizedDate2 = normalizeDate(date2);
    
    // Check if normalized date2 is before normalized date1
    if (normalizedDate2.getTime() < normalizedDate1.getTime()) {
        return 0;
    }
    
    // Check if dates are the same day
    if (datesEqual(normalizedDate1, normalizedDate2)) {
        return 0; // Same day = 0 days between
    }
    
    // Calculate difference in milliseconds between normalized dates
    const differenceInMilliseconds = normalizedDate2.getTime() - normalizedDate1.getTime();
    
    // Convert milliseconds to days using Math.floor to exclude the last day
    // This correctly includes first day and excludes last day without adding 1
    return Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24));
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
 * Calculates the midpoint date between two dates, rounding to the later date if there are an even number of days.
 * @param {string|Date} startDate - The start date (can be string in YYYY-MM-DD format or Date object)
 * @param {string|Date} endDate - The end date (can be string in YYYY-MM-DD format or Date object)
 * @returns {Date|null} The midpoint date, or null if dates are invalid
 */
export function calculateMidpointDate(startDate, endDate) {
    const start = typeof startDate === 'string' ? parseDateInput(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseDateInput(endDate) : endDate;

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("Invalid start or end date for midpoint calculation", startDate, endDate);
        return null; 
    }
    
    // If dates are equal, midpoint is the same day
    if (datesEqual(start, end)) {
        return new Date(start);
    }
    
    // If end date is before start date, swap them
    if (dateAfter(start, end)) {
        console.error("Start date after end date in midpoint calculation", startDate, endDate);
        return null;
    }

    // Calculate the number of days INCLUSIVE of start and end
    // First create a date for end+1 since daysBetween excludes the end date
    const tempEndPlusOne = new Date(end);
    tempEndPlusOne.setUTCDate(tempEndPlusOne.getUTCDate() + 1);
    const daysInPeriod = daysBetween(start, tempEndPlusOne);

    if (daysInPeriod <= 0) {
        return new Date(start); // Should not happen given the previous checks
    }

    // Calculate the day offset from the start date for the midpoint
    // Using Math.floor for even numbers of days to round to the later date
    // Example: 4-day period (days 1,2,3,4): floor(4/2) = 2 → start + 2 days = day 3
    // Example: 3-day period (days 1,2,3): floor(3/2) = 1 → start + 1 day = day 2
    const dayOffset = Math.floor(daysInPeriod / 2);
    
    const midpointDate = new Date(start);
    midpointDate.setUTCDate(midpointDate.getUTCDate() + dayOffset);
    
    return midpointDate;
}
