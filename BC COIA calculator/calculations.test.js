import { calculateInterestPeriods, calculatePerDiem, getInterestRateForDate } from './calculations.js';
import { jest } from '@jest/globals';
// Assuming utils.js functions are implicitly tested via calculations.js,
// but we might need date parsing/creation helpers.

// Helper to create UTC date without time component
const createUTCDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

// Mock interest rates data for testing
const mockRatesData = {
    BC: [
        // Period 1: Jan 1, 2022 - Jun 30, 2022
        { start: createUTCDate(2022, 1, 1), end: createUTCDate(2022, 6, 30), prejudgment: 2.0, postjudgment: 3.0 },
        // Period 2: Jul 1, 2022 - Dec 31, 2022
        { start: createUTCDate(2022, 7, 1), end: createUTCDate(2022, 12, 31), prejudgment: 2.5, postjudgment: 3.5 },
        // Period 3: Jan 1, 2023 - Jun 30, 2023
        { start: createUTCDate(2023, 1, 1), end: createUTCDate(2023, 6, 30), prejudgment: 3.0, postjudgment: 4.0 },
        // Period 4: Jul 1, 2023 - Dec 31, 2023
        { start: createUTCDate(2023, 7, 1), end: createUTCDate(2023, 12, 31), prejudgment: 3.5, postjudgment: 4.5 },
        // Period 5: Jan 1, 2024 - Jun 30, 2024 (Leap Year)
        { start: createUTCDate(2024, 1, 1), end: createUTCDate(2024, 6, 30), prejudgment: 4.0, postjudgment: 5.0 },
        // Period 6: Jul 1, 2024 - Dec 31, 2024
        { start: createUTCDate(2024, 7, 1), end: createUTCDate(2024, 12, 31), prejudgment: 4.5, postjudgment: 5.5 },
    ],
    ON: [ // Ontario rates for testing jurisdiction switch
        { start: createUTCDate(2023, 1, 1), end: createUTCDate(2023, 12, 31), prejudgment: 5.0, postjudgment: 6.0 },
    ],
    // AB: Intentionally left empty to test missing jurisdiction
};

// Helper function for comparing floating point numbers
const expectToBeCloseTo = (actual, expected, precision = 2) => {
    expect(actual).toBeCloseTo(expected, precision);
};


describe('calculations.js', () => {

    describe('getInterestRateForDate', () => {
        it('should return the correct prejudgment rate for a date within a rate period', () => {
            const date = createUTCDate(2023, 3, 15); // March 15, 2023 (Period 3)
            const expectedRate = 3.0; // BC prejudgment rate for Period 3
            const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
            expect(result).toBe(expectedRate);
        });

        it('should return the correct postjudgment rate for a date within a rate period', () => {
            const date = createUTCDate(2023, 3, 15); // March 15, 2023 (Period 3)
            const expectedRate = 4.0; // BC postjudgment rate for Period 3
            const result = getInterestRateForDate(date, 'postjudgment', 'BC', mockRatesData);
            expect(result).toBe(expectedRate);
        });

        it('should return the correct rate for a date at the start of a rate period', () => {
            const date = createUTCDate(2023, 1, 1); // January 1, 2023 (Start of Period 3)
            const expectedRate = 3.0; // BC prejudgment rate for Period 3
            const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
            expect(result).toBe(expectedRate);
        });

        it('should return the correct rate for a date at the end of a rate period', () => {
            const date = createUTCDate(2023, 6, 30); // June 30, 2023 (End of Period 3)
            const expectedRate = 3.0; // BC prejudgment rate for Period 3
            const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
            expect(result).toBe(expectedRate);
        });

        it('should return the correct rate for a different jurisdiction', () => {
            const date = createUTCDate(2023, 3, 15); // March 15, 2023
            const expectedRate = 5.0; // ON prejudgment rate for 2023
            const result = getInterestRateForDate(date, 'prejudgment', 'ON', mockRatesData);
            expect(result).toBe(expectedRate);
        });

        it('should return 0 for a date before any rate period', () => {
            const date = createUTCDate(2021, 12, 31); // December 31, 2021 (before first period)
            const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
            expect(result).toBe(0);
        });

        it('should return 0 for a date after all rate periods', () => {
            const date = createUTCDate(2025, 1, 1); // January 1, 2025 (after last period)
            const result = getInterestRateForDate(date, 'prejudgment', 'BC', mockRatesData);
            expect(result).toBe(0);
        });

        it('should return 0 for a missing jurisdiction', () => {
            const date = createUTCDate(2023, 3, 15); // March 15, 2023
            const result = getInterestRateForDate(date, 'prejudgment', 'AB', mockRatesData);
            expect(result).toBe(0);
        });

        it('should return 0 for an invalid date', () => {
            const result = getInterestRateForDate(null, 'prejudgment', 'BC', mockRatesData);
            expect(result).toBe(0);
        });
    });

    describe('calculateInterestPeriods', () => {

        // --- Basic Cases ---
        it('should return 0 total interest for zero principal', () => {
            const result = calculateInterestPeriods(0, createUTCDate(2023, 1, 1), createUTCDate(2023, 1, 31), 'prejudgment', 'BC', mockRatesData);
            expect(result.total).toBe(0);
            expect(result.details).toEqual([]);
            expect(result.principal).toBe(0);
        });

        it('should return 0 total interest for negative principal', () => {
            const result = calculateInterestPeriods(-1000, createUTCDate(2023, 1, 1), createUTCDate(2023, 1, 31), 'prejudgment', 'BC', mockRatesData);
            expect(result.total).toBe(0);
            expect(result.details).toEqual([]);
            expect(result.principal).toBe(-1000); // Principal is returned as passed
        });

        it('should return 0 total interest if end date is before start date', () => {
            const result = calculateInterestPeriods(1000, createUTCDate(2023, 1, 31), createUTCDate(2023, 1, 1), 'prejudgment', 'BC', mockRatesData);
            expect(result.total).toBe(0);
            expect(result.details).toEqual([]);
            expect(result.principal).toBe(1000);
        });

        it('should return 0 total interest for missing jurisdiction data', () => {
            const result = calculateInterestPeriods(1000, createUTCDate(2023, 1, 1), createUTCDate(2023, 1, 31), 'prejudgment', 'AB', mockRatesData);
            expect(result.total).toBe(0);
            expect(result.details).toEqual([]);
            expect(result.principal).toBe(1000);
        });

        // --- Calculation within a single rate period ---
        it('should calculate prejudgment interest correctly within a single rate period (non-leap)', () => {
            const principal = 10000;
            const startDate = createUTCDate(2023, 2, 1); // Feb 1, 2023
            const endDate = createUTCDate(2023, 3, 31); // Mar 31, 2023 (59 days in Period 3 @ 3.0%)
            const expectedDays = 59; // Feb (28) + Mar (31)
            const expectedRate = 3.0;
            const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365; // 2023 is non-leap

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData);

            expect(result.details.length).toBe(1);
            expect(result.details[0].description).toBe(`${expectedDays} days`);
            expect(result.details[0].rate).toBe(expectedRate);
            expect(result.details[0].principal).toBe(principal);
            expectToBeCloseTo(result.details[0].interest, expectedInterest);
            expectToBeCloseTo(result.total, expectedInterest);
            expect(result.principal).toBe(principal);
        });

        it('should calculate postjudgment interest correctly within a single rate period (leap year)', () => {
            const principal = 5000;
            const startDate = createUTCDate(2024, 1, 15); // Jan 15, 2024
            const endDate = createUTCDate(2024, 3, 15); // Mar 15, 2024 (61 days in Period 5 @ 5.0%)
            const expectedDays = 61; // Jan (17) + Feb (29) + Mar (15)
            const expectedRate = 5.0;
            const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 366; // 2024 is leap

            const result = calculateInterestPeriods(principal, startDate, endDate, 'postjudgment', 'BC', mockRatesData);

            expect(result.details.length).toBe(1);
            expect(result.details[0].description).toBe(`${expectedDays} days`);
            expect(result.details[0].rate).toBe(expectedRate);
            expect(result.details[0].principal).toBe(principal);
            expectToBeCloseTo(result.details[0].interest, expectedInterest);
            expectToBeCloseTo(result.total, expectedInterest);
            expect(result.principal).toBe(principal);
        });

        // --- Calculation spanning multiple rate periods ---
        it('should calculate prejudgment interest correctly spanning two rate periods (non-leap)', () => {
            const principal = 20000;
            const startDate = createUTCDate(2023, 6, 1); // Jun 1, 2023 (Period 3 @ 3.0%)
            const endDate = createUTCDate(2023, 7, 31); // Jul 31, 2023 (Period 4 @ 3.5%)

            // Period 3: Jun 1 - Jun 30 (30 days @ 3.0%)
            const days1 = 30;
            const rate1 = 3.0;
            const interest1 = (principal * (rate1 / 100) * days1) / 365;

            // Period 4: Jul 1 - Jul 31 (31 days @ 3.5%)
            const days2 = 31;
            const rate2 = 3.5;
            const interest2 = (principal * (rate2 / 100) * days2) / 365;

            const expectedTotalInterest = interest1 + interest2;

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData);

            expect(result.details.length).toBe(2);
            // Check Period 3 segment
            expect(result.details[0].description).toBe(`${days1} days`);
            expect(result.details[0].rate).toBe(rate1);
            expectToBeCloseTo(result.details[0].interest, interest1);
            // Check Period 4 segment
            expect(result.details[1].description).toBe(`${days2} days`);
            expect(result.details[1].rate).toBe(rate2);
            expectToBeCloseTo(result.details[1].interest, interest2);

            expectToBeCloseTo(result.total, expectedTotalInterest);
            expect(result.principal).toBe(principal);
        });

         it('should calculate postjudgment interest correctly spanning multiple periods including a leap year', () => {
             const principal = 15000;
             const startDate = createUTCDate(2023, 12, 1); // Dec 1, 2023 (Period 4 @ 4.5%)
             const endDate = createUTCDate(2024, 2, 15);  // Feb 15, 2024 (Period 5 @ 5.0%)

             // Period 4 (2023 - non-leap): Dec 1 - Dec 31 (31 days @ 4.5%)
             const days1 = 31;
             const rate1 = 4.5;
             const interest1 = (principal * (rate1 / 100) * days1) / 365;

             // Period 5 (2024 - leap): Jan 1 - Feb 15 (31 + 15 = 46 days @ 5.0%)
             const days2 = 46;
             const rate2 = 5.0;
             const interest2 = (principal * (rate2 / 100) * days2) / 366; // Use 366 for leap year

             const expectedTotalInterest = interest1 + interest2;

             const result = calculateInterestPeriods(principal, startDate, endDate, 'postjudgment', 'BC', mockRatesData);

             expect(result.details.length).toBe(2);
             // Check Period 4 segment
             expect(result.details[0].description).toBe(`${days1} days`);
             expect(result.details[0].rate).toBe(rate1);
             expectToBeCloseTo(result.details[0].interest, interest1);
             // Check Period 5 segment
             expect(result.details[1].description).toBe(`${days2} days`);
             expect(result.details[1].rate).toBe(rate2);
             expectToBeCloseTo(result.details[1].interest, interest2);

             expectToBeCloseTo(result.total, expectedTotalInterest);
             expect(result.principal).toBe(principal);
         });

        // --- Edge Cases ---
        it('should handle start date exactly on a rate change date', () => {
            const principal = 1000;
            const startDate = createUTCDate(2023, 7, 1); // Start of Period 4
            const endDate = createUTCDate(2023, 7, 10); // 10 days in Period 4 @ 3.5%
            const expectedDays = 10;
            const expectedRate = 3.5;
            const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365;

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData);

            expect(result.details.length).toBe(1);
            expect(result.details[0].description).toBe(`${expectedDays} days`);
            expect(result.details[0].rate).toBe(expectedRate);
            expectToBeCloseTo(result.total, expectedInterest);
        });

        it('should handle end date exactly on a rate change date', () => {
            const principal = 1000;
            const startDate = createUTCDate(2023, 6, 21); // 10 days in Period 3 @ 3.0%
            const endDate = createUTCDate(2023, 6, 30); // End of Period 3
            const expectedDays = 10;
            const expectedRate = 3.0;
            const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365;

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData);

            expect(result.details.length).toBe(1);
            expect(result.details[0].description).toBe(`${expectedDays} days`);
            expect(result.details[0].rate).toBe(expectedRate);
            expectToBeCloseTo(result.total, expectedInterest);
        });

        it('should handle period spanning a rate change date exactly', () => {
            const principal = 5000;
            const startDate = createUTCDate(2022, 6, 21); // 10 days in Period 1 @ 2.0%
            const endDate = createUTCDate(2022, 7, 10); // 10 days in Period 2 @ 2.5%

            // Period 1: Jun 21 - Jun 30 (10 days @ 2.0%)
            const days1 = 10;
            const rate1 = 2.0;
            const interest1 = (principal * (rate1 / 100) * days1) / 365;

            // Period 2: Jul 1 - Jul 10 (10 days @ 2.5%)
            const days2 = 10;
            const rate2 = 2.5;
            const interest2 = (principal * (rate2 / 100) * days2) / 365;

            const expectedTotalInterest = interest1 + interest2;
            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData);

            expect(result.details.length).toBe(2);
            expect(result.details[0].description).toBe(`${days1} days`);
            expect(result.details[0].rate).toBe(rate1);
            expect(result.details[1].description).toBe(`${days2} days`);
            expect(result.details[1].rate).toBe(rate2);
            expectToBeCloseTo(result.total, expectedTotalInterest);
        });

        // --- Jurisdiction Test ---
        it('should use the correct rates for a different jurisdiction (ON)', () => {
            const principal = 10000;
            const startDate = createUTCDate(2023, 1, 1);
            const endDate = createUTCDate(2023, 12, 31); // Full year 2023
            const expectedDays = 365;
            const expectedRate = 5.0; // ON prejudgment rate
            const expectedInterest = (principal * (expectedRate / 100) * expectedDays) / 365;

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'ON', mockRatesData);

            expect(result.details.length).toBe(1);
            expect(result.details[0].description).toBe(`${expectedDays} days`);
            expect(result.details[0].rate).toBe(expectedRate);
            expectToBeCloseTo(result.total, expectedInterest);
        });

        // --- Missing Rate Test ---
        // Note: The current mock data doesn't have gaps, but the function should handle it.
        // If a gap existed, say no rates for 2025, a calculation spanning into 2025
        // should calculate interest up to the end of 2024 and then stop, logging warnings.
        // This test assumes the function skips days without rates.
        it('should handle periods where rates are missing (hypothetical gap)', () => {
             // Create a custom rates object with only Period 1
             const ratesWithGap = {
                BC: [
                    // Only include Period 1
                    { 
                        start: createUTCDate(2022, 1, 1), 
                        end: createUTCDate(2022, 6, 30), 
                        prejudgment: 2.0, 
                        postjudgment: 3.0 
                    }
                ],
                ON: mockRatesData.ON
             };

             const principal = 1000;
             const startDate = createUTCDate(2022, 6, 25); // Jun 25, 2022 (Period 1 @ 2.0%)
             const endDate = createUTCDate(2022, 6, 30);   // Jun 30, 2022 (End of Period 1)

             // Period 1: Jun 25 - Jun 30 (6 days @ 2.0%)
             const days1 = 6;
             const rate1 = 2.0;
             const interest1 = (principal * (rate1 / 100) * days1) / 365;

             // Expect only interest from Period 1
             const expectedTotalInterest = interest1;

             // Mock console.warn to check for warnings
             const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

             const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', ratesWithGap);

             expect(result.details.length).toBe(1); // Only the segment with a rate
             expect(result.details[0].description).toBe(`${days1} days`);
             expect(result.details[0].rate).toBe(rate1);
             expectToBeCloseTo(result.total, expectedTotalInterest);

             // We don't expect warnings for this test since we're staying within Period 1
             
             consoleWarnSpy.mockRestore(); // Clean up spy
        });

        // --- Special Damages Tests ---
        it('should correctly add special damages to principal for subsequent periods', () => {
            const principal = 10000;
            const startDate = createUTCDate(2023, 1, 1); // Start of Period 3
            const endDate = createUTCDate(2023, 12, 31); // End of Period 4
            const specialDamages = [
                { date: '2023-02-15', amount: 500, description: 'Damage 1' }, // During Period 3
                { date: '2023-08-01', amount: 1000, description: 'Damage 2' } // During Period 4
            ];

            // Period 3: Jan 1 - Jun 30 (181 days @ 3.0%) - Principal: 10000
            const days1 = 181;
            const rate1 = 3.0;
            const principal1 = 10000;
            const interest1 = (principal1 * (rate1 / 100) * days1) / 365;

            // Period 4: Jul 1 - Dec 31 (184 days @ 3.5%) - Principal: 10000 + 500 = 10500
            const days2 = 184;
            const rate2 = 3.5;
            const principal2 = 10500;
            const interest2 = (principal2 * (rate2 / 100) * days2) / 365;

            const expectedTotalInterest = interest1 + interest2;
            const expectedFinalPrincipal = 10000 + 500 + 1000; // Initial + Damage 1 + Damage 2

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData, specialDamages);

            expect(result.details.length).toBe(2);
            // Check Period 3 segment
            expect(result.details[0].principal).toBe(principal1);
            expectToBeCloseTo(result.details[0].interest, interest1);
            // Check Period 4 segment
            expect(result.details[1].principal).toBe(principal2); // Principal includes Damage 1
            expectToBeCloseTo(result.details[1].interest, interest2);

            expectToBeCloseTo(result.total, expectedTotalInterest);
            expect(result.principal).toBe(expectedFinalPrincipal); // Final principal includes all damages
        });

        it('should handle special damages occurring exactly on rate change dates', () => {
            const principal = 5000;
            const startDate = createUTCDate(2022, 1, 1); // Start of Period 1
            const endDate = createUTCDate(2022, 12, 31); // End of Period 2
            const specialDamages = [
                { date: '2022-06-30', amount: 200, description: 'End of P1' }, // End of Period 1
                { date: '2022-07-01', amount: 300, description: 'Start of P2' } // Start of Period 2
            ];

            // Period 1: Jan 1 - Jun 30 (181 days @ 2.0%) - Principal: 5000
            const days1 = 181;
            const rate1 = 2.0;
            const principal1 = 5000;
            const interest1 = (principal1 * (rate1 / 100) * days1) / 365;

            // Period 2: Jul 1 - Dec 31 (184 days @ 2.5%) - Principal: 5000 + 200 = 5200 (Damage from P1 end included)
            // Damage from Jul 1 is *not* included in principal for P2 calculation
            const days2 = 184;
            const rate2 = 2.5;
            const principal2 = 5200;
            const interest2 = (principal2 * (rate2 / 100) * days2) / 365;

            const expectedTotalInterest = interest1 + interest2;
            const expectedFinalPrincipal = 5000 + 200 + 300; // Initial + Damage 1 + Damage 2

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData, specialDamages);

            expect(result.details.length).toBe(2);
            // Check Period 1 segment
            expect(result.details[0].principal).toBe(principal1);
            expectToBeCloseTo(result.details[0].interest, interest1);
            // Check Period 2 segment
            expect(result.details[1].principal).toBe(principal2); // Includes damage from Jun 30
            expectToBeCloseTo(result.details[1].interest, interest2);

            expectToBeCloseTo(result.total, expectedTotalInterest);
            expect(result.principal).toBe(expectedFinalPrincipal);
        });

        it('should return correct final principal when damages occur on the end date (but not calculated separately)', () => {
            // This test verifies the final principal calculation, not the special final period interest calc
            const principal = 1000;
            const startDate = createUTCDate(2023, 1, 1);
            const endDate = createUTCDate(2023, 6, 30); // End of Period 3
            const specialDamages = [
                { date: '2023-06-30', amount: 50, description: 'On End Date' }
            ];

            // Period 3: Jan 1 - Jun 30 (181 days @ 3.0%) - Principal: 1000
            const days1 = 181;
            const rate1 = 3.0;
            const principal1 = 1000;
            const interest1 = (principal1 * (rate1 / 100) * days1) / 365;

            const expectedTotalInterest = interest1;
            const expectedFinalPrincipal = 1000 + 50; // Damage added to final principal

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData, specialDamages);

            expect(result.details.length).toBe(1); // Only the main period calculation
            expect(result.details[0].principal).toBe(principal1); // Damage doesn't affect interest calc within the period
            expectToBeCloseTo(result.total, expectedTotalInterest);
            expect(result.principal).toBe(expectedFinalPrincipal); // Final principal includes the damage
        });

        // --- Final Period Special Damages Calculation Tests ---
        it('should calculate interest separately for damages within the final period', () => {
            const principal = 10000;
            const startDate = createUTCDate(2023, 1, 1); // Start of Period 3
            const endDate = createUTCDate(2023, 5, 1);   // May 1, 2023 (within Period 3) - Judgment Date
            const specialDamages = [
                { date: '2023-01-03', amount: 300, description: 'Physio' }, // Within final period
                { date: '2023-03-01', amount: 50, description: 'Meds' }    // Within final period
            ];

            // Final Period (Period 3): Jan 1 - May 1 (121 days @ 3.0%) - Principal: 10000
            const finalSegmentDays = 121;
            const finalSegmentRate = 3.0;
            const finalSegmentPrincipal = 10000;
            const finalSegmentInterest = (finalSegmentPrincipal * (finalSegmentRate / 100) * finalSegmentDays) / 365;

            // Damage 1 (Physio): Jan 3 - May 1 (119 days @ 3.0%)
            const damage1Days = 119;
            const damage1Amount = 300;
            const damage1Interest = (damage1Amount * (finalSegmentRate / 100) * damage1Days) / 365;

            // Damage 2 (Meds): Mar 1 - May 1 (62 days @ 3.0%)
            const damage2Days = 62;
            const damage2Amount = 50;
            const damage2Interest = (damage2Amount * (finalSegmentRate / 100) * damage2Days) / 365;

            const expectedTotalInterest = finalSegmentInterest + damage1Interest + damage2Interest;
            const expectedFinalPrincipal = 10000 + 300 + 50;

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData, specialDamages);

            // With our new implementation, we expect 3 rows: 1 main segment + 2 special damage calcs
            expect(result.details.length).toBe(3);

            // Check main final segment
            const mainSegment = result.details.find(d => !d.isFinalPeriodDamage);
            expect(mainSegment).toBeDefined();
            expect(mainSegment.description).toBe(`${finalSegmentDays} days`);
            expect(mainSegment.principal).toBe(finalSegmentPrincipal);
            expectToBeCloseTo(mainSegment.interest, finalSegmentInterest);

            // Check Damage 1 segment
            const damage1Segment = result.details.find(d => d.isFinalPeriodDamage && d.principal === damage1Amount);
            expect(damage1Segment).toBeDefined();
            expect(damage1Segment.start).toBe('2023-01-03'); // Expect YYYY-MM-DD
            expect(damage1Segment.description).toContain(`(${damage1Days} days)`);
            expect(damage1Segment.rate).toBe(finalSegmentRate);
            expectToBeCloseTo(damage1Segment.interest, damage1Interest);

            // Check Damage 2 segment
            const damage2Segment = result.details.find(d => d.isFinalPeriodDamage && d.principal === damage2Amount);
            expect(damage2Segment).toBeDefined();
            expect(damage2Segment.start).toBe('2023-03-01'); // Expect YYYY-MM-DD
            expect(damage2Segment.description).toContain(`(${damage2Days} days)`);
            expect(damage2Segment.rate).toBe(finalSegmentRate);
            expectToBeCloseTo(damage2Segment.interest, damage2Interest);

            // Check totals
            expectToBeCloseTo(result.total, expectedTotalInterest);
            expect(result.principal).toBe(expectedFinalPrincipal);
        });

        it('should handle final period damages when the final period spans a rate change', () => {
            const principal = 20000;
            const startDate = createUTCDate(2023, 6, 1); // Start of Period 3
            const endDate = createUTCDate(2023, 8, 1);   // Aug 1, 2023 (within Period 4) - Judgment Date
            const specialDamages = [
                { date: '2023-06-15', amount: 100, description: 'Damage Before Rate Change' }, // Before rate change, handled normally
                { date: '2023-07-10', amount: 200, description: 'Damage After Rate Change' }  // After rate change, calculated separately
            ];

            // Period 3: Jun 1 - Jun 30 (30 days @ 3.0%) - Principal: 20000
            const days1 = 30;
            const rate1 = 3.0;
            const principal1 = 20000;
            const interest1 = (principal1 * (rate1 / 100) * days1) / 365;

            // Final Period (Period 4): Jul 1 - Aug 1 (32 days @ 3.5%) - Principal: 20000 + 100 = 20100
            const finalSegmentDays = 32;
            const finalSegmentRate = 3.5;
            const finalSegmentPrincipal = 20100; // Includes damage from Period 3
            const finalSegmentInterest = (finalSegmentPrincipal * (finalSegmentRate / 100) * finalSegmentDays) / 365;

            // Damage 2 (After Rate Change): Jul 10 - Aug 1 (23 days @ 3.5%)
            const damage2Days = 23;
            const damage2Amount = 200;
            const damage2Interest = (damage2Amount * (finalSegmentRate / 100) * damage2Days) / 365;

            const expectedTotalInterest = interest1 + finalSegmentInterest + damage2Interest;
            const expectedFinalPrincipal = 20000 + 100 + 200;

            const result = calculateInterestPeriods(principal, startDate, endDate, 'prejudgment', 'BC', mockRatesData, specialDamages);

            // With our new implementation, we expect 3 rows: 1 regular segment + 1 final segment + 1 special damage calc
            expect(result.details.length).toBe(3);

            // Check Period 3 segment
            const period3Segment = result.details.find(d => d.rate === rate1 && !d.isFinalPeriodDamage);
            expect(period3Segment).toBeDefined();
            expect(period3Segment.principal).toBe(principal1);
            expectToBeCloseTo(period3Segment.interest, interest1);

            // Check main final segment (Period 4)
            const mainFinalSegment = result.details.find(d => d.rate === finalSegmentRate && !d.isFinalPeriodDamage);
            expect(mainFinalSegment).toBeDefined();
            expect(mainFinalSegment.description).toBe(`${finalSegmentDays} days`);
            expect(mainFinalSegment.principal).toBe(finalSegmentPrincipal); // Includes damage 1
            expectToBeCloseTo(mainFinalSegment.interest, finalSegmentInterest);

            // Check Damage 2 segment (calculated separately)
            const damage2Segment = result.details.find(d => d.isFinalPeriodDamage && d.principal === damage2Amount);
            expect(damage2Segment).toBeDefined();
            expect(damage2Segment.start).toBe('2023-07-10'); // Expect YYYY-MM-DD
            expect(damage2Segment.description).toContain(`(${damage2Days} days)`);
            expect(damage2Segment.rate).toBe(finalSegmentRate);
            expectToBeCloseTo(damage2Segment.interest, damage2Interest);

            // Check totals
            expectToBeCloseTo(result.total, expectedTotalInterest);
            expect(result.principal).toBe(expectedFinalPrincipal);
        });

    });

    describe('calculatePerDiem', () => {
        it('should calculate per diem correctly based on postjudgment rate (non-leap year)', () => {
            const principal = 100000; // Total owing
            const calcDate = createUTCDate(2023, 8, 15); // Aug 15, 2023 (Period 4 @ 4.5% postjudgment)
            const expectedRate = 4.5;
            const expectedPerDiem = (principal * (expectedRate / 100)) / 365; // 2023 is non-leap

            const result = calculatePerDiem(principal, calcDate, 'BC', mockRatesData);
            expectToBeCloseTo(result, expectedPerDiem);
        });

        it('should calculate per diem correctly based on postjudgment rate (leap year)', () => {
            const principal = 50000; // Total owing
            const calcDate = createUTCDate(2024, 3, 1); // Mar 1, 2024 (Period 5 @ 5.0% postjudgment)
            const expectedRate = 5.0;
            const expectedPerDiem = (principal * (expectedRate / 100)) / 366; // 2024 is leap

            const result = calculatePerDiem(principal, calcDate, 'BC', mockRatesData);
            expectToBeCloseTo(result, expectedPerDiem);
        });

        it('should return 0 for zero principal', () => {
            const calcDate = createUTCDate(2023, 8, 15);
            expect(calculatePerDiem(0, calcDate, 'BC', mockRatesData)).toBe(0);
        });

        it('should return 0 for negative principal', () => {
            const calcDate = createUTCDate(2023, 8, 15);
            expect(calculatePerDiem(-1000, calcDate, 'BC', mockRatesData)).toBe(0);
        });

        it('should return 0 for invalid calculation date', () => {
            expect(calculatePerDiem(10000, null, 'BC', mockRatesData)).toBe(0);
            expect(calculatePerDiem(10000, new Date('invalid'), 'BC', mockRatesData)).toBe(0);
        });

        it('should return 0 if no postjudgment rate is found for the date', () => {
            const principal = 10000;
            const calcDate = createUTCDate(2021, 12, 31); // Date before first mock rate period
            // Mock console.warn to check for warnings
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(calculatePerDiem(principal, calcDate, 'BC', mockRatesData)).toBe(0);
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find a valid postjudgment rate'));
            consoleWarnSpy.mockRestore();
        });

        it('should return 0 for missing jurisdiction data', () => {
            const principal = 10000;
            const calcDate = createUTCDate(2023, 8, 15);
            expect(calculatePerDiem(principal, calcDate, 'AB', mockRatesData)).toBe(0);
        });

        it('should use the correct rate for a different jurisdiction (ON)', () => {
            const principal = 20000;
            const calcDate = createUTCDate(2023, 5, 1); // May 1, 2023
            const expectedRate = 6.0; // ON postjudgment rate for 2023
            const expectedPerDiem = (principal * (expectedRate / 100)) / 365;

            const result = calculatePerDiem(principal, calcDate, 'ON', mockRatesData);
            expectToBeCloseTo(result, expectedPerDiem);
        });
    });

});
