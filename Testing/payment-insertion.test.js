import { describe, it, expect, beforeEach } from 'vitest';
import { insertPaymentRecord, processMultiplePayments } from '../BC COIA calculator/payment-insertion.js';

// Mock dependencies
vi.mock('../BC COIA calculator/utils.date.js', () => {
    return {
        daysBetween: (start, end) => {
            // Simple implementation for testing
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffTime = Math.abs(endDate - startDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        },
        daysInYear: (year) => {
            // Simple implementation for testing
            return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
        },
        formatDateForDisplay: (date) => {
            // Simple implementation for testing
            const d = new Date(date);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        },
        parseDateInput: (dateStr) => {
            // Simple implementation for testing
            return new Date(dateStr);
        },
        normalizeDate: (date) => {
            // Simple implementation for testing
            const d = new Date(date);
            d.setUTCHours(0, 0, 0, 0);
            return d;
        },
        datesEqual: (date1, date2) => {
            // Simple implementation for testing
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            return d1.getUTCFullYear() === d2.getUTCFullYear() &&
                   d1.getUTCMonth() === d2.getUTCMonth() &&
                   d1.getUTCDate() === d2.getUTCDate();
        }
    };
});

vi.mock('../BC COIA calculator/calculations.js', () => {
    return {
        getInterestRateForDate: () => 0.8 // Mock a fixed rate for testing
    };
});

vi.mock('../BC COIA calculator/utils.currency.js', () => {
    return {
        formatCurrency: (amount) => `$${amount.toFixed(2)}`
    };
});

describe('Payment Insertion Module', () => {
    // Test state with simple interest periods
    let testState;
    let testRatesData;
    
    beforeEach(() => {
        // Reset the test state before each test
        testState = {
            inputs: {
                dateOfJudgment: new Date('2021-01-01'),
                jurisdiction: 'BC',
                prejudgmentStartDate: new Date('2020-07-01')
            },
            results: {
                prejudgmentResult: {
                    details: [
                        {
                            start: new Date('2020-07-01'),
                            end: new Date('2021-01-01'),
                            rate: 0.8,
                            principal: 10320.00,
                            interest: 41.73,
                            description: '184 days',
                            _days: 184
                        }
                    ],
                    total: 41.73,
                    principal: 10320.00
                },
                payments: []
            }
        };
        
        // Simple rates data for testing
        testRatesData = {
            BC: [
                {
                    start: new Date('2020-01-01'),
                    prejudgment: 0.8,
                    postjudgment: 0.8
                }
            ]
        };
    });
    
    describe('insertPaymentRecord', () => {
        it('should insert a payment record and split the calculation row correctly', () => {
            // Payment on 2020-10-13 of $500 (as in the example)
            const payment = {
                date: new Date('2020-10-13'),
                amount: 500
            };
            
            const updatedState = insertPaymentRecord(testState, payment, testRatesData);
            
            // Expectations:
            
            // 1. Should split the original row into two pieces
            expect(updatedState.results.prejudgmentResult.details.length).toBe(3); // 2 split rows + 1 payment row
            
            // 2. First period should be 2020-07-01 to 2020-10-12 with interest ~23.59
            const firstSplit = updatedState.results.prejudgmentResult.details[0];
            expect(firstSplit.start.toISOString().substring(0, 10)).toBe('2020-07-01');
            expect(firstSplit.end.toISOString().substring(0, 10)).toBe('2020-10-12');
            expect(firstSplit.interest).toBeCloseTo(23.59, 1);
            expect(firstSplit.principal).toBe(10320.00);
            
            // 3. Payment row should be inserted after first split
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.isPayment).toBe(true);
            expect(paymentRow.interest).toBeCloseTo(-23.59, 1); // Applied to interest
            expect(paymentRow.principal).toBeCloseTo(-476.41, 1); // Applied to principal
            
            // 4. Second period should be 2020-10-13 to 2021-01-01 with reduced principal
            const secondSplit = updatedState.results.prejudgmentResult.details[2];
            expect(secondSplit.start.toISOString().substring(0, 10)).toBe('2020-10-13');
            expect(secondSplit.end.toISOString().substring(0, 10)).toBe('2021-01-01');
            expect(secondSplit.principal).toBeCloseTo(10320 - 476.41, 1); // Reduced by principal payment
            expect(secondSplit.interest).toBeCloseTo(18.14, 1); // Recalculated interest based on new principal
            
            // 5. Payment should be added to the payments array
            expect(updatedState.results.payments.length).toBe(1);
            expect(updatedState.results.payments[0].amount).toBe(500);
            expect(updatedState.results.payments[0].interestApplied).toBeCloseTo(23.59, 1);
            expect(updatedState.results.payments[0].principalApplied).toBeCloseTo(476.41, 1);
            expect(updatedState.results.payments[0].remainingPrincipal).toBeCloseTo(9843.59, 1);
        });
        
        it('should handle payment larger than outstanding interest', () => {
            // Small interest amount, large payment
            testState.results.prejudgmentResult.details[0].interest = 10;
            
            const payment = {
                date: new Date('2020-10-13'),
                amount: 1000
            };
            
            const updatedState = insertPaymentRecord(testState, payment, testRatesData);
            
            // Payment should apply 10 to interest, 990 to principal
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.interest).toBeCloseTo(-10, 1);
            expect(paymentRow.principal).toBeCloseTo(-990, 1);
            
            // Remaining principal should be reduced accordingly
            expect(updatedState.results.payments[0].remainingPrincipal).toBeCloseTo(9330, 1);
        });
        
        it('should allow overpayment resulting in negative principal', () => {
            // Small principal, large payment
            testState.results.prejudgmentResult.details[0].principal = 400;
            testState.results.prejudgmentResult.details[0].interest = 10;
            
            const payment = {
                date: new Date('2020-10-13'),
                amount: 500
            };
            
            const updatedState = insertPaymentRecord(testState, payment, testRatesData);
            
            // Payment should apply 10 to interest, 490 to principal (creating negative principal)
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.interest).toBeCloseTo(-10, 1);
            expect(paymentRow.principal).toBeCloseTo(-490, 1);
            
            // Remaining principal should be negative (indicating refund)
            expect(updatedState.results.payments[0].remainingPrincipal).toBeCloseTo(-90, 1);
            
            // Subsequent interest calculations should be based on negative principal
            const secondSplit = updatedState.results.prejudgmentResult.details[2];
            expect(secondSplit.principal).toBeCloseTo(-90, 1);
        });
    });
    
    describe('processMultiplePayments', () => {
        it('should process multiple payments in chronological order', () => {
            // Two payments
            const payments = [
                {
                    date: new Date('2020-10-13'),
                    amount: 300
                },
                {
                    date: new Date('2020-12-15'),
                    amount: 200
                }
            ];
            
            const updatedState = processMultiplePayments(testState, payments, testRatesData);
            
            // Should have 5 rows: 
            // 1. First split (2020-07-01 to 2020-10-12)
            // 2. First payment (2020-10-13)
            // 3. Second split (2020-10-13 to 2020-12-14)
            // 4. Second payment (2020-12-15)
            // 5. Third split (2020-12-15 to 2021-01-01)
            expect(updatedState.results.prejudgmentResult.details.length).toBe(5);
            expect(updatedState.results.payments.length).toBe(2);
            
            // Verify payments are processed in order
            const firstPayment = updatedState.results.prejudgmentResult.details[1];
            const secondPayment = updatedState.results.prejudgmentResult.details[3];
            
            expect(firstPayment.isPayment).toBe(true);
            expect(firstPayment.description).toContain('$300.00');
            
            expect(secondPayment.isPayment).toBe(true);
            expect(secondPayment.description).toContain('$200.00');
            
            // Verify principal is correctly updated
            const finalPrincipal = updatedState.results.payments[1].remainingPrincipal;
            expect(finalPrincipal).toBeLessThan(testState.results.prejudgmentResult.principal);
        });
        
        it('should handle out-of-order payments by sorting them', () => {
            // Two payments in wrong order
            const payments = [
                {
                    date: new Date('2020-12-15'),
                    amount: 200
                },
                {
                    date: new Date('2020-10-13'),
                    amount: 300
                }
            ];
            
            const updatedState = processMultiplePayments(testState, payments, testRatesData);
            
            // Verify they're processed in chronological order regardless of input order
            const firstPayment = updatedState.results.prejudgmentResult.details[1];
            expect(firstPayment.description).toContain('$300.00');
            
            const secondPayment = updatedState.results.prejudgmentResult.details[3];
            expect(secondPayment.description).toContain('$200.00');
        });
    });
});
