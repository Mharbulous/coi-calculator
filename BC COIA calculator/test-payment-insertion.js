/**
 * Test script for payment insertion functionality
 * This script will test our enhanced row finding and splitting logic
 */

import { insertPaymentRecord } from './payment-insertion.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Testing payment insertion functionality...");
    
    // Add a test button to the page
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Payment Insertion';
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '8px 12px';
    testButton.style.backgroundColor = '#4CAF50';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    // Add click event listener
    testButton.addEventListener('click', function() {
        console.log("Running enhanced payment insertion test...");
        
        // Create a mock state with interest calculation rows
        const mockState = {
            inputs: {
                dateOfJudgment: new Date('2021-07-01'),
                jurisdiction: 'BC'
            },
            results: {
                prejudgmentResult: {
                    details: [
                        {
                            start: new Date('2020-07-01'),
                            end: new Date('2021-01-01'),
                            rate: 0.8,
                            principal: 10320,
                            interest: 41.73,
                            _days: 184,
                            description: '184 days'
                        }
                    ],
                    total: 41.73,
                    principal: 10320
                },
                postjudgmentResult: {
                    details: [],
                    total: 0,
                    principal: 0
                }
            }
        };
        
        // Create a mock payment
        const mockPayment = {
            date: new Date('2020-10-13'),
            amount: 500
        };
        
        // Create mock interest rates
        const mockRatesData = {
            rates: [
                { effectiveDate: '2020-01-01', rate: 0.8 }
            ]
        };
        
        // Run payment insertion with our mock data
        const updatedState = insertPaymentRecord(mockState, mockPayment, mockRatesData);
        
        // Log the result
        console.log("Payment insertion complete. Updated state:", updatedState);
        
        // Display the result on the page
        const resultDiv = document.createElement('div');
        resultDiv.style.position = 'fixed';
        resultDiv.style.top = '50px';
        resultDiv.style.right = '10px';
        resultDiv.style.zIndex = '9999';
        resultDiv.style.padding = '10px';
        resultDiv.style.backgroundColor = '#f8f8f8';
        resultDiv.style.border = '1px solid #ccc';
        resultDiv.style.borderRadius = '4px';
        resultDiv.style.maxWidth = '400px';
        resultDiv.style.maxHeight = '80vh';
        resultDiv.style.overflow = 'auto';
        
        // Find the payment row for detailed breakdown
        const paymentRow = updatedState.results.prejudgmentResult.details.find(row => row.isPayment);
        const interestApplied = paymentRow ? paymentRow.interestApplied : 0;
        const principalApplied = paymentRow ? paymentRow.principalApplied : 0;
        
        // Create a summary of the changes
        resultDiv.innerHTML = `
            <h3>Payment Insertion Test Results</h3>
            <p>Original principal: $10,320.00</p>
            <p>Payment amount: $500.00</p>
            <p><strong>Interest-First Payment Application:</strong></p>
            <p>- Applied to interest: $${interestApplied.toFixed(2)}</p>
            <p>- Applied to principal: $${principalApplied.toFixed(2)}</p>
            <p>New principal: $${updatedState.results.prejudgmentResult.principal.toFixed(2)}</p>
            <p>Interest before split: $41.73</p>
            <p>Total interest after payment: $${updatedState.results.prejudgmentResult.total.toFixed(2)}</p>
            <h4>Split Rows:</h4>
            <pre>${JSON.stringify(updatedState.results.prejudgmentResult.details, null, 2)}</pre>
        `;
        
        document.body.appendChild(resultDiv);
    });
    
    document.body.appendChild(testButton);
});
