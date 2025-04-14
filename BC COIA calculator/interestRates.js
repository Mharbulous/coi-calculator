// Interest Rate Data Store
// Structure: { JurisdictionCode: [ { start: Date, end: Date, prejudgment: Number, postjudgment: Number }, ... ] }

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


const rates = {
    BC: [
        { start: "1993-01-01", end: "1993-06-30", prejudgment: 5.25, postjudgment: 7.25 },
        { start: "1993-07-01", end: "1993-12-31", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "1994-01-01", end: "1994-06-30", prejudgment: 3.50, postjudgment: 5.50 },
        { start: "1994-07-01", end: "1994-12-31", prejudgment: 6.00, postjudgment: 8.00 },
        { start: "1995-01-01", end: "1995-06-30", prejudgment: 6.00, postjudgment: 8.00 },
        { start: "1995-07-01", end: "1995-12-31", prejudgment: 6.75, postjudgment: 8.75 },
        { start: "1996-01-01", end: "1996-06-30", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "1996-07-01", end: "1996-12-31", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "1997-01-01", end: "1997-06-30", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "1997-07-01", end: "1997-12-31", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "1998-01-01", end: "1998-06-30", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "1998-07-01", end: "1998-12-31", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "1999-01-01", end: "1999-06-30", prejudgment: 4.75, postjudgment: 6.75 },
        { start: "1999-07-01", end: "1999-12-31", prejudgment: 4.25, postjudgment: 6.25 },
        { start: "2000-01-01", end: "2000-06-30", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "2000-07-01", end: "2000-12-31", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "2001-01-01", end: "2001-06-30", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "2001-07-01", end: "2001-12-31", prejudgment: 4.25, postjudgment: 6.25 },
        { start: "2002-01-01", end: "2002-06-30", prejudgment: 2.00, postjudgment: 4.00 },
        { start: "2002-07-01", end: "2002-12-31", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2003-01-01", end: "2003-06-30", prejudgment: 2.50, postjudgment: 4.50 },
        { start: "2003-07-01", end: "2003-12-31", prejudgment: 3.00, postjudgment: 5.00 },
        { start: "2004-01-01", end: "2004-06-30", prejudgment: 2.50, postjudgment: 4.50 },
        { start: "2004-07-01", end: "2004-12-31", prejudgment: 1.75, postjudgment: 3.75 },
        { start: "2005-01-01", end: "2005-06-30", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2005-07-01", end: "2005-12-31", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2006-01-01", end: "2006-06-30", prejudgment: 3.00, postjudgment: 5.00 },
        { start: "2006-07-01", end: "2006-12-31", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2007-01-01", end: "2007-06-30", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2007-07-01", end: "2007-12-31", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2008-01-01", end: "2008-06-30", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2008-07-01", end: "2008-12-31", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "2009-01-01", end: "2009-06-30", prejudgment: 1.50, postjudgment: 3.50 },
        { start: "2009-07-01", end: "2009-12-31", prejudgment: 0.25, postjudgment: 2.25 },
        { start: "2010-01-01", end: "2010-06-30", prejudgment: 0.25, postjudgment: 2.25 },
        { start: "2010-07-01", end: "2010-12-31", prejudgment: 0.50, postjudgment: 2.50 },
        { start: "2011-01-01", end: "2011-06-30", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2011-07-01", end: "2011-12-31", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2012-01-01", end: "2012-06-30", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2012-07-01", end: "2012-12-31", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2013-01-01", end: "2013-06-30", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2013-07-01", end: "2013-12-31", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2014-01-01", end: "2014-06-30", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2014-07-01", end: "2014-12-31", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2015-01-01", end: "2015-06-30", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2015-07-01", end: "2015-12-31", prejudgment: 0.85, postjudgment: 2.85 },
        { start: "2016-01-01", end: "2016-06-30", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2016-07-01", end: "2016-12-31", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2017-01-01", end: "2017-06-30", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2017-07-01", end: "2017-12-31", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2018-01-01", end: "2018-06-30", prejudgment: 1.20, postjudgment: 3.20 },
        { start: "2018-07-01", end: "2018-12-31", prejudgment: 1.45, postjudgment: 3.45 },
        { start: "2019-01-01", end: "2019-06-30", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2019-07-01", end: "2019-12-31", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2020-01-01", end: "2020-06-30", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2020-07-01", end: "2020-12-31", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2021-01-01", end: "2021-06-30", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2021-07-01", end: "2021-12-31", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2022-01-01", end: "2022-06-30", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2022-07-01", end: "2022-12-31", prejudgment: 1.70, postjudgment: 3.70 },
        { start: "2023-01-01", end: "2023-06-30", prejudgment: 4.45, postjudgment: 6.45 },
        { start: "2023-07-01", end: "2023-12-31", prejudgment: 4.95, postjudgment: 6.95 },
        { start: "2024-01-01", end: "2024-06-30", prejudgment: 5.20, postjudgment: 7.20 },
        { start: "2024-07-01", end: "2024-12-31", prejudgment: 4.95, postjudgment: 6.95 },
        { start: "2025-01-01", end: "2025-06-30", prejudgment: 3.45, postjudgment: 5.45 },
        // Add future rates here
    ],
    // Add AB rates here
    AB: [
        // Example: { start: "YYYY-MM-DD", end: "YYYY-MM-DD", rate: X.XX },
        // Note: Alberta might have different structures (e.g., single rate type)
        // This needs to be populated with actual AB data.
    ],
    // Add ON rates here
    ON: [
        // Example: { start: "YYYY-MM-DD", end: "YYYY-MM-DD", prejudgment: X.XX, postjudgment: Y.YY },
        // This needs to be populated with actual ON data.
    ]
};

// Process the raw rates into Date objects for easier comparison
const processedRates = {};
for (const jurisdiction in rates) {
    processedRates[jurisdiction] = rates[jurisdiction]
        .map(rate => {
            const startDate = parseUTCDate(rate.start);
            const endDate = parseUTCDate(rate.end);
            if (!startDate || !endDate) {
                console.error(`Skipping invalid rate period for ${jurisdiction}:`, rate);
                return null; // Skip invalid entries
            }
            return {
                ...rate,
                start: startDate,
                end: endOfDayUTC(endDate) // Ensure end date includes the whole day
            };
        })
        .filter(rate => rate !== null) // Remove skipped entries
        .sort((a, b) => a.start - b.start); // Ensure rates are sorted by start date
}

// Export the processed rates
export default processedRates;
