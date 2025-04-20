// Interest Rate Data Store
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
        { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 },
        { start: "1993-07-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "1994-01-01", prejudgment: 3.50, postjudgment: 5.50 },
        { start: "1994-07-01", prejudgment: 6.00, postjudgment: 8.00 },
        { start: "1995-01-01", prejudgment: 6.00, postjudgment: 8.00 },
        { start: "1995-07-01", prejudgment: 6.75, postjudgment: 8.75 },
        { start: "1996-01-01", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "1996-07-01", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "1997-01-01", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "1997-07-01", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "1998-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "1998-07-01", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "1999-01-01", prejudgment: 4.75, postjudgment: 6.75 },
        { start: "1999-07-01", prejudgment: 4.25, postjudgment: 6.25 },
        { start: "2000-01-01", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "2000-07-01", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "2001-01-01", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "2001-07-01", prejudgment: 4.25, postjudgment: 6.25 },
        { start: "2002-01-01", prejudgment: 2.00, postjudgment: 4.00 },
        { start: "2002-07-01", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2003-01-01", prejudgment: 2.50, postjudgment: 4.50 },
        { start: "2003-07-01", prejudgment: 3.00, postjudgment: 5.00 },
        { start: "2004-01-01", prejudgment: 2.50, postjudgment: 4.50 },
        { start: "2004-07-01", prejudgment: 1.75, postjudgment: 3.75 },
        { start: "2005-01-01", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2005-07-01", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2006-01-01", prejudgment: 3.00, postjudgment: 5.00 },
        { start: "2006-07-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2007-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2007-07-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2008-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2008-07-01", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "2009-01-01", prejudgment: 1.50, postjudgment: 3.50 },
        { start: "2009-07-01", prejudgment: 0.25, postjudgment: 2.25 },
        { start: "2010-01-01", prejudgment: 0.25, postjudgment: 2.25 },
        { start: "2010-07-01", prejudgment: 0.50, postjudgment: 2.50 },
        { start: "2011-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2011-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2012-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2012-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2013-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2013-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2014-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2014-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2015-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2015-07-01", prejudgment: 0.85, postjudgment: 2.85 },
        { start: "2016-01-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2016-07-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2017-01-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2017-07-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2018-01-01", prejudgment: 1.20, postjudgment: 3.20 },
        { start: "2018-07-01", prejudgment: 1.45, postjudgment: 3.45 },
        { start: "2019-01-01", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2019-07-01", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2020-01-01", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2020-07-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2021-01-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2021-07-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2022-01-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2022-07-01", prejudgment: 1.70, postjudgment: 3.70 },
        { start: "2023-01-01", prejudgment: 4.45, postjudgment: 6.45 },
        { start: "2023-07-01", prejudgment: 4.95, postjudgment: 6.95 },
        { start: "2024-01-01", prejudgment: 5.20, postjudgment: 7.20 },
        { start: "2024-07-01", prejudgment: 4.95, postjudgment: 6.95 },
        { start: "2025-01-01", prejudgment: 3.45, postjudgment: 5.45 },
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
