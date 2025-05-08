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
        formatCurrency: (amount) => `$${amount.toFixed(2)}`,
        formatCurrencyForInput: (amount) => `$${amount.toFixed(2)}`
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
            
            // 2. First period should be 2020-07-01 to 2020-10-13 with interest ~23.59
            const firstSplit = updatedState.results.prejudgmentResult.details[0];
            expect(firstSplit.start.toISOString().substring(0, 10)).toBe('2020-07-01');
            expect(firstSplit.end.toISOString().substring(0, 10)).toBe('2020-10-13');
            expect(firstSplit.interest).toBeCloseTo(23.46, 1);
            expect(firstSplit.principal).toBe(10320.00);
            
            // 3. Payment row should be inserted after first split
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.isPayment).toBe(true);
            expect(paymentRow.interest).toBeCloseTo(-23.46, 1); // Applied to interest
            expect(paymentRow.principal).toBeCloseTo(-476.54, 1); // Applied to principal
            
            // 4. Second period should be 2020-10-13 to 2021-01-01 with reduced principal
            const secondSplit = updatedState.results.prejudgmentResult.details[2];
            expect(secondSplit.start.toISOString().substring(0, 10)).toBe('2020-10-13');
            expect(secondSplit.end.toISOString().substring(0, 10)).toBe('2021-01-01');
            expect(secondSplit.principal).toBeCloseTo(9843.46, 0); // Reduced by principal payment
            expect(secondSplit.interest).toBeCloseTo(17.21, 0); // Recalculated interest based on new principal
            
            // 5. Payment should be added to the payments array
            expect(updatedState.results.payments.length).toBe(1);
            expect(updatedState.results.payments[0].amount).toBe(500);
            expect(updatedState.results.payments[0].interestApplied).toBeCloseTo(23.46, 1);
            expect(updatedState.results.payments[0].principalApplied).toBeCloseTo(476.54, 1);
            expect(updatedState.results.payments[0].remainingPrincipal).toBeCloseTo(9843.46, 0);
        });
        
        it('should handle payment on exact end date of a period', () => {
            // Payment on exactly the judgment date (end of period)
            const payment = {
                date: new Date('2021-01-01'),
                amount: 500
            };
            
            const updatedState = insertPaymentRecord(testState, payment, testRatesData);
            
            // Should not split the row but insert payment after it
            expect(updatedState.results.prejudgmentResult.details.length).toBe(2);
            
            // First row should be unchanged
            const firstRow = updatedState.results.prejudgmentResult.details[0];
            // Check start/end date - handle both Date objects and strings
            const startDate = typeof firstRow.start === 'string' ? 
                firstRow.start : firstRow.start.toISOString().substring(0, 10);
            const endDate = typeof firstRow.end === 'string' ? 
                firstRow.end : firstRow.end.toISOString().substring(0, 10);
                
            expect(startDate).toContain('2020-07-01');
            expect(endDate).toContain('2021-01-01');
            expect(firstRow.interest).toBeCloseTo(41.73, 1);
            
            // Payment row should be inserted after the period
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.isPayment).toBe(true);
            expect(paymentRow.interest).toBeCloseTo(-41.73, 1);
            expect(paymentRow.principal).toBeCloseTo(-458.27, 1);
        });
        
        it('should handle payment larger than outstanding interest', () => {
            // This test will use the calculated interest, not the interest we set
            const payment = {
                date: new Date('2020-10-13'),
                amount: 1000
            };
            
            const updatedState = insertPaymentRecord(testState, payment, testRatesData);
            
            // Payment should apply interest first, then principal
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.interest).toBeCloseTo(-23.46, 1);
            expect(paymentRow.principal).toBeCloseTo(-976.54, 1);
            
            // Remaining principal should be reduced accordingly
            expect(updatedState.results.payments[0].remainingPrincipal).toBeCloseTo(9343.46, 0);
        });
        
        it('should allow overpayment resulting in negative principal', () => {
            // Small principal test
            testState.results.prejudgmentResult.details[0].principal = 400;
            
            const payment = {
                date: new Date('2020-10-13'),
                amount: 500
            };
            
            const updatedState = insertPaymentRecord(testState, payment, testRatesData);
            
            // Payment should apply to interest first, then principal (creating negative principal)
            const paymentRow = updatedState.results.prejudgmentResult.details[1];
            expect(paymentRow.interest).toBeCloseTo(-0.91, 1);
            expect(paymentRow.principal).toBeCloseTo(-499.09, 1);
            
            // Remaining principal should be negative (indicating refund)
            expect(updatedState.results.payments[0].remainingPrincipal).toBeCloseTo(-99.09, 0);
            
            // Subsequent interest calculations should be based on negative principal
            const secondSplit = updatedState.results.prejudgmentResult.details[2];
            expect(secondSplit.principal).toBeCloseTo(-99.09, 0);
            
            // Interest on negative principal should be negative (crediting interest)
            expect(secondSplit.interest).toBeLessThan(0);
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
            expect(firstPayment.paymentAmount).toBe(300);
            
            expect(secondPayment.isPayment).toBe(true);
            expect(secondPayment.paymentAmount).toBe(200);
            
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
            expect(firstPayment.paymentAmount).toBe(300);
            
            const secondPayment = updatedState.results.prejudgmentResult.details[3];
            expect(secondPayment.paymentAmount).toBe(200);
        });
    });
});
