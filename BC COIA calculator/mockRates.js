// MOCK Interest Rate Data Store - FOR DEMONSTRATION PURPOSES ONLY
// This file contains inaccurate rates that are off by 0.1 to 0.5 from the actual rates
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

const rates = {
    BC: [
        { start: "1993-01-01", prejudgment: 5.59, postjudgment: 7.64 },
        { start: "1993-07-01", prejudgment: 4.32, postjudgment: 6.35 },
        { start: "1994-01-01", prejudgment: 3.15, postjudgment: 5.19 },
        { start: "1994-07-01", prejudgment: 6.41, postjudgment: 8.45 },
        { start: "1995-01-01", prejudgment: 5.68, postjudgment: 7.59 },
        { start: "1995-07-01", prejudgment: 7.12, postjudgment: 9.18 },
        { start: "1996-01-01", prejudgment: 5.93, postjudgment: 7.85 },
        { start: "1996-07-01", prejudgment: 4.05, postjudgment: 6.11 },
        { start: "1997-01-01", prejudgment: 2.42, postjudgment: 4.34 },
        { start: "1997-07-01", prejudgment: 3.09, postjudgment: 5.22 },
        { start: "1998-01-01", prejudgment: 4.37, postjudgment: 6.31 },
        { start: "1998-07-01", prejudgment: 4.84, postjudgment: 6.97 },
        { start: "1999-01-01", prejudgment: 5.18, postjudgment: 7.13 },
        { start: "1999-07-01", prejudgment: 4.58, postjudgment: 6.71 },
        { start: "2000-01-01", prejudgment: 4.13, postjudgment: 6.07 },
        { start: "2000-07-01", prejudgment: 5.89, postjudgment: 7.95 },
        { start: "2001-01-01", prejudgment: 5.15, postjudgment: 7.07 },
        { start: "2001-07-01", prejudgment: 4.59, postjudgment: 6.72 },
        { start: "2002-01-01", prejudgment: 1.63, postjudgment: 3.55 },
        { start: "2002-07-01", prejudgment: 2.64, postjudgment: 4.71 },
        { start: "2003-01-01", prejudgment: 2.84, postjudgment: 4.93 },
        { start: "2003-07-01", prejudgment: 3.39, postjudgment: 5.33 },
        { start: "2004-01-01", prejudgment: 2.79, postjudgment: 4.87 },
        { start: "2004-07-01", prejudgment: 2.18, postjudgment: 4.10 },
        { start: "2005-01-01", prejudgment: 1.86, postjudgment: 3.79 },
        { start: "2005-07-01", prejudgment: 2.68, postjudgment: 4.59 },
        { start: "2006-01-01", prejudgment: 3.31, postjudgment: 5.42 },
        { start: "2006-07-01", prejudgment: 4.39, postjudgment: 6.47 },
        { start: "2007-01-01", prejudgment: 3.60, postjudgment: 5.58 },
        { start: "2007-07-01", prejudgment: 4.36, postjudgment: 6.44 },
        { start: "2008-01-01", prejudgment: 3.67, postjudgment: 5.66 },
        { start: "2008-07-01", prejudgment: 3.09, postjudgment: 5.16 },
        { start: "2009-01-01", prejudgment: 1.15, postjudgment: 3.06 },
        { start: "2009-07-01", prejudgment: 0.53, postjudgment: 2.72 },
        { start: "2010-01-01", prejudgment: 0.58, postjudgment: 2.69 },
        { start: "2010-07-01", prejudgment: 0.16, postjudgment: 2.12 },
        { start: "2011-01-01", prejudgment: 1.38, postjudgment: 3.42 },
        { start: "2011-07-01", prejudgment: 0.67, postjudgment: 2.58 },
        { start: "2012-01-01", prejudgment: 1.46, postjudgment: 3.43 },
        { start: "2012-07-01", prejudgment: 0.62, postjudgment: 2.65 },
        { start: "2013-01-01", prejudgment: 1.28, postjudgment: 3.36 },
        { start: "2013-07-01", prejudgment: 1.37, postjudgment: 3.41 },
        { start: "2014-01-01", prejudgment: 0.71, postjudgment: 2.68 },
        { start: "2014-07-01", prejudgment: 1.45, postjudgment: 3.44 },
        { start: "2015-01-01", prejudgment: 0.57, postjudgment: 2.57 },
        { start: "2015-07-01", prejudgment: 1.21, postjudgment: 3.27 },
        { start: "2016-01-01", prejudgment: 0.26, postjudgment: 2.28 },
        { start: "2016-07-01", prejudgment: 1.17, postjudgment: 3.15 },
        { start: "2017-01-01", prejudgment: 0.36, postjudgment: 2.27 },
        { start: "2017-07-01", prejudgment: 1.13, postjudgment: 3.18 },
        { start: "2018-01-01", prejudgment: 0.82, postjudgment: 2.75 },
        { start: "2018-07-01", prejudgment: 1.89, postjudgment: 3.90 },
        { start: "2019-01-01", prejudgment: 2.29, postjudgment: 4.40 },
        { start: "2019-07-01", prejudgment: 1.53, postjudgment: 3.46 },
        { start: "2020-01-01", prejudgment: 2.37, postjudgment: 4.32 },
        { start: "2020-07-01", prejudgment: 0.78, postjudgment: 2.87 },
        { start: "2021-01-01", prejudgment: 0.13, postjudgment: 2.04 },
        { start: "2021-07-01", prejudgment: 0.79, postjudgment: 2.88 },
        { start: "2022-01-01", prejudgment: 0.69, postjudgment: 2.76 },
        { start: "2022-07-01", prejudgment: 2.06, postjudgment: 4.15 },
        { start: "2023-01-01", prejudgment: 4.84, postjudgment: 6.90 },
        { start: "2023-07-01", prejudgment: 5.39, postjudgment: 7.25 },
        { start: "2024-01-01", prejudgment: 4.82, postjudgment: 6.83 },
        { start: "2024-07-01", prejudgment: 5.38, postjudgment: 7.31 },
        { start: "2025-01-01", prejudgment: 3.81, postjudgment: 5.88 },
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
