// Interest calculation verification script

// Helper function to check if a year is a leap year
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// Helper function to get days in year
function getDaysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

// Function to calculate interest
function calculateInterest(principal, rate, days, year) {
    const daysInYear = getDaysInYear(year);
    return (principal * (rate / 100) * days) / daysInYear;
}

// Test cases from the mockup
const testCases = [
    {
        description: "2019-03-01 to 2019-06-30 (122 days)",
        principal: 10000.00,
        rate: 1.95,
        days: 122,
        year: 2019,
        expectedInterest: 64.64
    },
    {
        description: "2019-07-01 to 2019-12-31 (184 days)",
        principal: 10225.50,
        rate: 1.95,
        days: 184,
        year: 2019,
        expectedInterest: 99.97
    },
    {
        description: "2020-01-01 to 2020-06-30 (182 days)",
        principal: 10565.00,
        rate: 1.95,
        days: 182,
        year: 2020,
        expectedInterest: 102.16
    },
    {
        description: "2020-07-01 to 2020-12-31 (184 days)",
        principal: 15165.50,
        rate: 0.45,
        days: 184,
        year: 2020,
        expectedInterest: 34.86
    },
    {
        description: "2021-01-01 to 2021-06-30 (181 days)",
        principal: 15505.00,
        rate: 0.45,
        days: 181,
        year: 2021,
        expectedInterest: 34.45
    },
    {
        description: "2021-07-01 to 2021-12-31 (184 days)",
        principal: 15844.50,
        rate: 0.45,
        days: 184,
        year: 2021,
        expectedInterest: 36.42
    },
    {
        description: "2022-01-01 to 2022-06-30 (181 days)",
        principal: 16184.00,
        rate: 0.45,
        days: 181,
        year: 2022,
        expectedInterest: 35.96
    },
    {
        description: "2022-07-01 to 2022-12-31 (184 days)",
        principal: 16523.50,
        rate: 1.70,
        days: 184,
        year: 2022,
        expectedInterest: 142.74
    },
    {
        description: "2023-01-01 to 2023-05-01 (121 days)",
        principal: 16863.00,
        rate: 4.45,
        days: 121,
        year: 2023,
        expectedInterest: 246.77
    },
    // Post-judgment interest tests
    {
        description: "2023-05-01 to 2023-06-30 (61 days)",
        principal: 39000.47,
        rate: 6.95,
        days: 61,
        year: 2023,
        expectedInterest: 261.60
    },
    {
        description: "2023-07-01 to 2023-12-31 (184 days)",
        principal: 39000.47,
        rate: 6.95,
        days: 184,
        year: 2023,
        expectedInterest: 789.41
    },
    {
        description: "2024-01-01 to 2024-06-30 (182 days)",
        principal: 39000.47,
        rate: 7.20,
        days: 182,
        year: 2024,
        expectedInterest: 972.35
    },
    {
        description: "2024-07-01 to 2024-12-31 (184 days)",
        principal: 39000.47,
        rate: 6.95,
        days: 184,
        year: 2024,
        expectedInterest: 589.82
    },
    {
        description: "2025-01-01 to 2025-06-30 (181 days)",
        principal: 39000.47,
        rate: 5.45,
        days: 181,
        year: 2025,
        expectedInterest: 676.88
    }
];

// Run the tests
console.log("Interest Calculation Verification");
console.log("================================\n");

let totalDifference = 0;

testCases.forEach(test => {
    const calculatedInterest = calculateInterest(test.principal, test.rate, test.days, test.year);
    const difference = Math.abs(calculatedInterest - test.expectedInterest);
    const isCorrect = difference < 0.01; // Allow for small rounding differences
    
    console.log(`Test: ${test.description}`);
    console.log(`Principal: $${test.principal.toFixed(2)}`);
    console.log(`Rate: ${test.rate}%`);
    console.log(`Days: ${test.days}`);
    console.log(`Year: ${test.year} (${getDaysInYear(test.year)} days)`);
    console.log(`Expected Interest: $${test.expectedInterest.toFixed(2)}`);
    console.log(`Calculated Interest: $${calculatedInterest.toFixed(2)}`);
    console.log(`Difference: $${difference.toFixed(2)}`);
    console.log(`Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    console.log("--------------------------------\n");
    
    totalDifference += difference;
});

console.log(`Total Difference: $${totalDifference.toFixed(2)}`);

// Check if there might be a rounding issue
console.log("\nRounding Analysis");
console.log("================\n");

// Test different rounding methods for the first case
const firstCase = testCases[0];
const rawInterest = (firstCase.principal * (firstCase.rate / 100) * firstCase.days) / getDaysInYear(firstCase.year);

console.log(`Raw calculated interest: ${rawInterest}`);
console.log(`Math.round(rawInterest * 100) / 100: ${Math.round(rawInterest * 100) / 100}`);
console.log(`Math.floor(rawInterest * 100) / 100: ${Math.floor(rawInterest * 100) / 100}`);
console.log(`Math.ceil(rawInterest * 100) / 100: ${Math.ceil(rawInterest * 100) / 100}`);
console.log(`parseInt(rawInterest * 100) / 100: ${parseInt(rawInterest * 100) / 100}`);
console.log(`Number(rawInterest.toFixed(2)): ${Number(rawInterest.toFixed(2))}`);
