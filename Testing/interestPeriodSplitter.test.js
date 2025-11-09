import { describe, it, expect } from 'vitest';
import { splitInterestPeriod, applyPaymentsToInterestPeriods, splitInterestPeriodsWithPayments } from '../BC COIA calculator/interestPeriodSplitter.js';
import { parseDateInput, formatDateForDisplay } from '../BC COIA calculator/utils.date.js';

// Mock rates data for testing
const mockRatesData = {
    'BC': [
        { start: new Date('2019-01-01'), end: new Date('2019-06-30'), prejudgment: 2.30, postjudgment: 8.00 },
        { start: new Date('2019-07-01'), end: new Date('2019-12-31'), prejudgment: 1.55, postjudgment: 8.00 },
        { start: new Date('2020-01-01'), end: new Date('2020-06-30'), prejudgment: 2.35, postjudgment: 8.00 },
        { start: new Date('2020-07-01'), end: new Date('2020-12-31'), prejudgment: 0.80, postjudgment: 5.00 },
        { start: new Date('2021-01-01'), end: new Date('2021-06-30'), prejudgment: 0.50, postjudgment: 5.00 },
        { start: new Date('2021-07-01'), end: new Date('2021-12-31'), prejudgment: 0.80, postjudgment: 5.00 },
        { start: new Date('2022-01-01'), end: new Date('2022-06-30'), prejudgment: 0.70, postjudgment: 5.00 },
        { start: new Date('2022-07-01'), end: new Date('2022-12-31'), prejudgment: 2.05, postjudgment: 7.00 }
    ]
};

// Helper function to create test periods
function createTestPeriod(start, end, principal, rate, isFinalSegment = false) {
    const startDate = typeof start === 'string' ? parseDateInput(start) : start;
    const endDate = typeof end === 'string' ? parseDateInput(end) : end;
    
    // Calculate days between dates (using a simple implementation for tests)
    const days = Math.round((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    // Calculate interest (simplified calculation for tests)
    const yearDays = 365;
    const interest = (principal * (rate / 100) * days) / yearDays;
    
    return {
        start: new Date(startDate),
        end: new Date(endDate),
        rate: rate,
        principal: principal,
        interest: interest,
        isFinalSegment: isFinalSegment,
        _days: days,
        _endDate: formatDateForDisplay(endDate),
        description: `${days} days (from ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)})`
    };
}

// Helper function to create test payments
function createTestPayment(date, amount, interestApplied, principalApplied) {
    const dateObj = typeof date === 'string' ? parseDateInput(date) : date;
    
    return {
        date: dateObj,
        dateStr: formatDateForDisplay(dateObj),
        amount: amount,
        interestApplied: interestApplied,
        principalApplied: principalApplied,
        remainingPrincipal: amount - interestApplied - principalApplied
    };
}

// Create mock state for testing
const mockState = {
    inputs: {
        jurisdiction: 'BC',
        prejudgmentStartDate: parseDateInput('2019-04-14'),
        dateOfJudgment: parseDateInput('2024-11-01')
    },
    results: {
        specialDamages: []
    }
};

describe('Interest Period Splitter - Core Functions', () => {
    describe('splitInterestPeriod', () => {
        it('should not split when payment is on the first day of the period', () => {
            // Arrange
            const period = createTestPeriod('2022-01-01', '2022-06-30', 10000, 0.70);
            const paymentDate = parseDateInput('2022-01-01');
            const originalPrincipal = 10000;
            const reducedPrincipal = 9500;
            
            // Act
            const result = splitInterestPeriod(
                period, 
                paymentDate, 
                originalPrincipal, 
                reducedPrincipal, 
                'BC', 
                mockRatesData, 
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(1);
            expect(result[0].principal).toBe(reducedPrincipal);
            expect(result[0].isModifiedByPayment).toBe(true);
        });
        
        it('should not split when payment is on the last day of the period', () => {
            // Arrange
            const period = createTestPeriod('2022-01-01', '2022-06-30', 10000, 0.70);
            const paymentDate = parseDateInput('2022-06-30');
            const originalPrincipal = 10000;
            const reducedPrincipal = 9500;
            
            // Act
            const result = splitInterestPeriod(
                period, 
                paymentDate, 
                originalPrincipal, 
                reducedPrincipal, 
                'BC', 
                mockRatesData, 
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(1);
            expect(result[0].principal).toBe(originalPrincipal); // Principal shouldn't change
            expect(result[0].isModifiedByPayment).toBeUndefined(); // No modification flag
        });
        
        it('should split when payment is in the middle of the period', () => {
            // Arrange
            const period = createTestPeriod('2022-01-01', '2022-06-30', 10000, 0.70);
            const paymentDate = parseDateInput('2022-03-20');
            const originalPrincipal = 10000;
            const reducedPrincipal = 9500;
            
            // Act
            const result = splitInterestPeriod(
                period, 
                paymentDate, 
                originalPrincipal, 
                reducedPrincipal, 
                'BC', 
                mockRatesData, 
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(2);
            
            // First segment should use original principal
            expect(result[0].principal).toBe(originalPrincipal);
            expect(result[0].start).toEqual(period.start);
            expect(result[0].isSplitSegment).toBe(true);
            
            // Second segment should use reduced principal
            expect(result[1].principal).toBe(reducedPrincipal);
            expect(result[1].start).toEqual(paymentDate);
            expect(result[1].end).toEqual(period.end);
            expect(result[1].isSplitSegment).toBe(true);
            
            // Interest should be calculated correctly for both segments
            expect(result[0].interest).toBeGreaterThan(0);
            expect(result[1].interest).toBeGreaterThan(0);
            expect(result[0].interest + result[1].interest).toBeLessThan(period.interest);
        });
        
        it('should return the original period when payment is outside the period', () => {
            // Arrange
            const period = createTestPeriod('2022-01-01', '2022-06-30', 10000, 0.70);
            const paymentDate = parseDateInput('2021-12-15'); // Before period
            const originalPrincipal = 10000;
            const reducedPrincipal = 9500;
            
            // Act
            const result = splitInterestPeriod(
                period, 
                paymentDate, 
                originalPrincipal, 
                reducedPrincipal, 
                'BC', 
                mockRatesData, 
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(1);
            expect(result[0]).toEqual(period);
        });
    });
    
    describe('applyPaymentsToInterestPeriods', () => {
        it('should split a single period for a payment in the middle', () => {
            // Arrange
            const periods = [
                createTestPeriod('2022-01-01', '2022-06-30', 10000, 0.70, false)
            ];
            
            const payments = [
                createTestPayment('2022-03-20', 500, 400, 100)
            ];
            
            // Act
            const result = applyPaymentsToInterestPeriods(
                periods,
                payments,
                mockState,
                mockRatesData,
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(2); // One period should be split into two
            expect(result[0].principal).toBe(10000); // First segment uses original principal
            expect(result[1].principal).toBe(9900); // Second segment uses reduced principal
        });
        
        it('should handle multiple payments in different periods', () => {
            // Arrange
            const periods = [
                createTestPeriod('2020-01-01', '2020-06-30', 10000, 2.35, false),
                createTestPeriod('2020-07-01', '2020-12-31', 10000, 0.80, false),
                createTestPeriod('2021-01-01', '2021-06-30', 10000, 0.50, true)
            ];
            
            const payments = [
                createTestPayment('2020-03-01', 200, 150, 50), // First period
                createTestPayment('2020-10-15', 300, 200, 100) // Second period
            ];
            
            // Act
            const result = applyPaymentsToInterestPeriods(
                periods,
                payments,
                mockState,
                mockRatesData,
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(5); // 2 splits should create 5 total segments
            
            // Check first period (should be split)
            expect(result[0].start).toEqual(periods[0].start);
            expect(result[0].principal).toBe(10000);
            
            // Check segment after first payment
            expect(result[1].principal).toBe(9950);
            
            // Check second period (should be split)
            expect(result[2].principal).toBe(9950);
            
            // Check segment after second payment
            expect(result[3].principal).toBe(9850);
            
            // Check third period (should use final reduced principal)
            expect(result[4].principal).toBe(9850);
        });
        
        it('should handle payment on rate change date', () => {
            // Arrange
            const periods = [
                createTestPeriod('2020-01-01', '2020-06-30', 10000, 2.35, false),
                createTestPeriod('2020-07-01', '2020-12-31', 10000, 0.80, false)
            ];
            
            const payments = [
                createTestPayment('2020-06-30', 500, 400, 100) // On rate change date
            ];
            
            // Act
            const result = applyPaymentsToInterestPeriods(
                periods,
                payments,
                mockState,
                mockRatesData,
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(2); // No splits, but principal updated for second period
            expect(result[0].principal).toBe(10000); // First period unchanged
            expect(result[1].principal).toBe(9900); // Second period uses reduced principal
            expect(result[1].isModifiedByPayment).toBe(true);
        });
    });
    
    describe('splitInterestPeriodsWithPayments', () => {
        it('should generate the correct result structure with payment rows', () => {
            // Arrange
            const periods = [
                createTestPeriod('2022-01-01', '2022-06-30', 10000, 0.70, false),
                createTestPeriod('2022-07-01', '2022-12-31', 10000, 2.05, true)
            ];
            
            const payments = [
                createTestPayment('2022-03-20', 500, 400, 100)
            ];
            
            // Act
            const result = splitInterestPeriodsWithPayments(
                periods,
                payments,
                mockState,
                mockRatesData,
                'prejudgment'
            );
            
            // Assert
            expect(result.length).toBe(4); // 2 periods + 1 split + 1 payment row
            
            // Check payment row
            const paymentRow = result.find(row => row.isPayment);
            expect(paymentRow).toBeDefined();
            expect(paymentRow.principal).toBe(-100); // Negative for payment
            expect(paymentRow.interest).toBe(-400); // Negative for payment
            expect(paymentRow.description).toContain('Payment received');
            
            // Check that periods after payment have reduced principal
            const periodsAfterPayment = result.filter(
                row => !row.isPayment && 
                new Date(row.start) >= new Date(payments[0].date)
            );
            
            for (const period of periodsAfterPayment) {
                if (!period.isPayment) {
                    expect(period.principal).toBe(9900);
                }
            }
        });
        
        it('should handle multiple payments including one on a period boundary', () => {
            // Arrange
            const periods = [
                createTestPeriod('2020-01-01', '2020-06-30', 10000, 2.35, false),
                createTestPeriod('2020-07-01', '2020-12-31', 10000, 0.80, false),
                createTestPeriod('2021-01-01', '2021-06-30', 10000, 0.50, true)
            ];
            
            const payments = [
                createTestPayment('2020-03-01', 200, 150, 50), // Middle of first period
                createTestPayment('2020-07-01', 300, 200, 100), // Rate change boundary
                createTestPayment('2021-02-15', 100, 50, 50) // Middle of last period
            ];
            
            // Act
            const result = splitInterestPeriodsWithPayments(
                periods,
                payments,
                mockState,
                mockRatesData,
                'prejudgment'
            );
            
            // Assert
            // Expected structure:
            // 1. First segment of first period (before first payment)
            // 2. First payment
            // 3. Second segment of first period (after first payment)
            // 4. Second payment (at boundary)
            // 5. Second period (with reduced principal)
            // 6. First segment of third period (before third payment)
            // 7. Third payment
            // 8. Second segment of third period (after third payment)
            const paymentRows = result.filter(row => row.isPayment);
            expect(paymentRows.length).toBe(3); // Should include all three payment rows
            
            // Order of segments and payments should be chronological
            for (let i = 1; i < result.length; i++) {
                if (!result[i].isPayment && !result[i-1].isPayment) {
                    // If this and previous are periods, start date should be increasing
                    expect(new Date(result[i].start) >= new Date(result[i-1].end)).toBe(true);
                }
            }
        });
    });
});
