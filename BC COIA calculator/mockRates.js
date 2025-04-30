// MOCK Interest Rate Data Store - FOR DEMONSTRATION PURPOSES ONLY
// This file contains modified interest rates in 0.05% increments that approximate real rates
// Postjudgment rates are always higher than prejudgment rates for the same period
// DO NOT USE FOR ACTUAL CALCULATIONS - For demonstration and testing only
// Structure: { JurisdictionCode: [ { start: Date, prejudgment: Number, postjudgment: Number }, ... ] }

// Helper function to parse date strings consistently to UTC Date objects
function parseUTCDate(dateString) {
    // Assumes YYYY-MM-DD format
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        // Create date in UTC
        const date = new Date(Date.UTC(year, month, day));
        // Basic validation
        if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
            return date;
        }
    }
    console.error(`Invalid date string format for UTC parsing: ${dateString}`);
    return null; // Or throw an error
}

// Helper function to set the time to the end of the day in UTC
function endOfDayUTC(date) {
    if (!date || isNaN(date.getTime())) return date;
    const newDate = new Date(date);
    newDate.setUTCHours(23, 59, 59, 999);
    return newDate;
}

// Track when the rates were last updated
const lastUpdated = parseUTCDate("2025-04-19");

// Track until when the rates are valid
const validUntil = parseUTCDate("2025-06-30");

// Updated with more realistic interest rates in increments of 0.05%
// Ensuring postjudgment rates are always higher than prejudgment rates
const rates = {
    BC: [
        { start: "1993-01-01", prejudgment: 5.60, postjudgment: 7.65 },
        { start: "1993-07-01", prejudgment: 4.30, postjudgment: 6.35 },
        { start: "1994-01-01", prejudgment: 3.15, postjudgment: 5.20 },
        { start: "1994-07-01", prejudgment: 6.40, postjudgment: 8.45 },
        { start: "1995-01-01", prejudgment: 5.70, postjudgment: 7.60 },
        { start: "1995-07-01", prejudgment: 7.10, postjudgment: 9.20 },
        { start: "1996-01-01", prejudgment: 5.95, postjudgment: 7.85 },
        { start: "1996-07-01", prejudgment: 4.05, postjudgment: 6.10 },
        { start: "1997-01-01", prejudgment: 2.40, postjudgment: 4.35 },
        { start: "1997-07-01", prejudgment: 3.10, postjudgment: 5.20 },
        { start: "1998-01-01", prejudgment: 4.35, postjudgment: 6.30 },
        { start: "1998-07-01", prejudgment: 4.85, postjudgment: 6.95 },
        { start: "1999-01-01", prejudgment: 5.20, postjudgment: 7.15 },
        { start: "1999-07-01", prejudgment: 4.60, postjudgment: 6.70 },
        { start: "2000-01-01", prejudgment: 4.15, postjudgment: 6.05 },
        { start: "2000-07-01", prejudgment: 5.90, postjudgment: 7.95 },
        { start: "2001-01-01", prejudgment: 5.15, postjudgment: 7.05 },
        { start: "2001-07-01", prejudgment: 4.60, postjudgment: 6.70 },
        { start: "2002-01-01", prejudgment: 1.65, postjudgment: 3.55 },
        { start: "2002-07-01", prejudgment: 2.65, postjudgment: 4.70 },
        { start: "2003-01-01", prejudgment: 2.85, postjudgment: 4.95 },
        { start: "2003-07-01", prejudgment: 3.40, postjudgment: 5.35 },
        { start: "2004-01-01", prejudgment: 2.80, postjudgment: 4.85 },
        { start: "2004-07-01", prejudgment: 2.20, postjudgment: 4.10 },
        { start: "2005-01-01", prejudgment: 1.85, postjudgment: 3.80 },
        { start: "2005-07-01", prejudgment: 2.70, postjudgment: 4.60 },
        { start: "2006-01-01", prejudgment: 3.30, postjudgment: 5.40 },
        { start: "2006-07-01", prejudgment: 4.40, postjudgment: 6.45 },
        { start: "2007-01-01", prejudgment: 3.60, postjudgment: 5.60 },
        { start: "2007-07-01", prejudgment: 4.35, postjudgment: 6.45 },
        { start: "2008-01-01", prejudgment: 3.65, postjudgment: 5.65 },
        { start: "2008-07-01", prejudgment: 3.10, postjudgment: 5.15 },
        { start: "2009-01-01", prejudgment: 1.15, postjudgment: 3.05 },
        { start: "2009-07-01", prejudgment: 0.55, postjudgment: 2.70 },
        { start: "2010-01-01", prejudgment: 0.60, postjudgment: 2.70 },
        { start: "2010-07-01", prejudgment: 0.50, postjudgment: 2.10 },
        { start: "2011-01-01", prejudgment: 1.40, postjudgment: 3.40 },
        { start: "2011-07-01", prejudgment: 0.65, postjudgment: 2.60 },
        { start: "2012-01-01", prejudgment: 1.45, postjudgment: 3.45 },
        { start: "2012-07-01", prejudgment: 0.60, postjudgment: 2.65 },
        { start: "2013-01-01", prejudgment: 1.30, postjudgment: 3.35 },
        { start: "2013-07-01", prejudgment: 1.35, postjudgment: 3.40 },
        { start: "2014-01-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2014-07-01", prejudgment: 1.45, postjudgment: 3.45 },
        { start: "2015-01-01", prejudgment: 0.55, postjudgment: 2.55 },
        { start: "2015-07-01", prejudgment: 1.20, postjudgment: 3.25 },
        { start: "2016-01-01", prejudgment: 0.50, postjudgment: 2.30 },
        { start: "2016-07-01", prejudgment: 1.15, postjudgment: 3.15 },
        { start: "2017-01-01", prejudgment: 0.50, postjudgment: 2.25 },
        { start: "2017-07-01", prejudgment: 1.15, postjudgment: 3.20 },
        { start: "2018-01-01", prejudgment: 0.80, postjudgment: 2.75 },
        { start: "2018-07-01", prejudgment: 1.90, postjudgment: 3.90 },
        { start: "2019-01-01", prejudgment: 2.30, postjudgment: 4.40 },
        { start: "2019-07-01", prejudgment: 1.55, postjudgment: 3.45 },
        { start: "2020-01-01", prejudgment: 2.35, postjudgment: 4.30 },
        { start: "2020-07-01", prejudgment: 0.80, postjudgment: 2.85 },
        { start: "2021-01-01", prejudgment: 0.50, postjudgment: 2.05 },
        { start: "2021-07-01", prejudgment: 0.80, postjudgment: 2.90 },
        { start: "2022-01-01", prejudgment: 0.70, postjudgment: 2.75 },
        { start: "2022-07-01", prejudgment: 2.05, postjudgment: 4.15 },
        { start: "2023-01-01", prejudgment: 4.85, postjudgment: 6.90 },
        { start: "2023-07-01", prejudgment: 5.40, postjudgment: 7.25 },
        { start: "2024-01-01", prejudgment: 4.80, postjudgment: 6.85 },
        { start: "2024-07-01", prejudgment: 5.40, postjudgment: 7.30 },
        { start: "2025-01-01", prejudgment: 3.80, postjudgment: 5.90 },
        // Add future rates here
    ],
    // Add AB rates here
    AB: [
        // Example: { start: "YYYY-MM-DD", prejudgment: X.XX, postjudgment: Y.YY },
        // This needs to be populated with actual AB data.
    ],
    // Add ON rates here
    ON: [
        // Example: { start: "YYYY-MM-DD", prejudgment: X.XX, postjudgment: Y.YY },
        // This needs to be populated with actual ON data.
    ]
};

// Process the raw rates into Date objects for easier comparison
// and calculate end dates dynamically
const processedRates = {};
for (const jurisdiction in rates) {
    // Sort rates by start date to ensure proper order
    const sortedRates = [...rates[jurisdiction]]
        .map(rate => ({
            ...rate,
            start: parseUTCDate(rate.start)
        }))
        .filter(rate => rate.start !== null) // Skip invalid entries
        .sort((a, b) => a.start - b.start); // Ensure rates are sorted by start date
    
    // Calculate end dates dynamically
    processedRates[jurisdiction] = sortedRates.map((rate, index) => {
        // If this is not the last rate period, the end date is the day before the next period starts
        if (index < sortedRates.length - 1) {
            const nextStartDate = new Date(sortedRates[index + 1].start);
            // Set end date to the day before the next period starts
            const endDate = new Date(nextStartDate);
            endDate.setUTCDate(endDate.getUTCDate() - 1);
            return {
                ...rate,
                end: endOfDayUTC(endDate) // Ensure end date includes the whole day
            };
        } 
        // For the last rate period, use validUntil as the end date
        else {
            return {
                ...rate,
                end: endOfDayUTC(validUntil) // Ensure end date includes the whole day
            };
        }
    });
}

// Export the processed rates, lastUpdated date, and validUntil date
export { processedRates as default, lastUpdated, validUntil };
