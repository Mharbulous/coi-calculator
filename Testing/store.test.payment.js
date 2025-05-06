// Import the store for testing
import useStore from '../BC COIA calculator/store.js';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Store Payment Tracking Tests', () => {
  // Reset the store before each test
  beforeEach(() => {
    useStore.getState().resetStore();
  });

  afterEach(() => {
    useStore.getState().resetStore();
  });

  it('should add a payment to the payments array', () => {
    const store = useStore.getState();
    const payment = {
      date: new Date('2025-01-15'),
      dateStr: '2025-01-15',
      amount: 1000,
      interestApplied: 250,
      principalApplied: 750,
      remainingPrincipal: 9250,
      segmentIndex: 2
    };

    store.addPayment(payment);
    
    // Get the state after adding payment
    const state = useStore.getState();
    console.log('State after adding payment:', state.results.payments);
    
    const { payments } = state.results;
    expect(payments.length).toBe(1);
    expect(payments[0]).toEqual(payment);
  });

  it('should update a payment at the specified index', () => {
    const store = useStore.getState();
    const payment1 = {
      date: new Date('2025-01-15'),
      dateStr: '2025-01-15',
      amount: 1000,
      interestApplied: 250,
      principalApplied: 750,
      remainingPrincipal: 9250,
      segmentIndex: 2
    };
    const payment2 = {
      date: new Date('2025-02-15'),
      dateStr: '2025-02-15',
      amount: 2000,
      interestApplied: 300,
      principalApplied: 1700,
      remainingPrincipal: 7550,
      segmentIndex: 3
    };

    store.addPayment(payment1);
    store.updatePayment(0, payment2);
    
    // Get the state after updating payment
    const state = useStore.getState();
    console.log('State after updating payment:', state.results.payments);
    
    const { payments } = state.results;
    expect(payments.length).toBe(1);
    expect(payments[0]).toEqual(payment2);
  });

  it('should remove a payment at the specified index', () => {
    const store = useStore.getState();
    const payment1 = {
      date: new Date('2025-01-15'),
      dateStr: '2025-01-15',
      amount: 1000,
      interestApplied: 250,
      principalApplied: 750,
      remainingPrincipal: 9250,
      segmentIndex: 2
    };
    const payment2 = {
      date: new Date('2025-02-15'),
      dateStr: '2025-02-15',
      amount: 2000,
      interestApplied: 300,
      principalApplied: 1700,
      remainingPrincipal: 7550,
      segmentIndex: 3
    };

    store.addPayment(payment1);
    store.addPayment(payment2);
    store.removePayment(0);
    
    // Get the state after removing payment
    const state = useStore.getState();
    console.log('State after removing payment:', state.results.payments);
    
    const { payments } = state.results;
    expect(payments.length).toBe(1);
    expect(payments[0]).toEqual(payment2);
  });

  it('should calculate the total amount of all payments', () => {
    const store = useStore.getState();
    const payment1 = {
      date: new Date('2025-01-15'),
      dateStr: '2025-01-15',
      amount: 1000,
      interestApplied: 250,
      principalApplied: 750,
      remainingPrincipal: 9250,
      segmentIndex: 2
    };
    const payment2 = {
      date: new Date('2025-02-15'),
      dateStr: '2025-02-15',
      amount: 2000,
      interestApplied: 300,
      principalApplied: 1700,
      remainingPrincipal: 7550,
      segmentIndex: 3
    };

    store.addPayment(payment1);
    store.addPayment(payment2);
    
    const total = store.calculatePaymentTotal();
    expect(total).toBe(3000);
  });

  it('should save and restore payments when toggling prejudgment interest', () => {
    const store = useStore.getState();
    const payment = {
      date: new Date('2025-01-15'),
      dateStr: '2025-01-15',
      amount: 1000,
      interestApplied: 250,
      principalApplied: 750,
      remainingPrincipal: 9250,
      segmentIndex: 2
    };

    // Add a payment
    store.addPayment(payment);
    
    // Save the state (simulating turning off prejudgment interest)
    store.savePrejudgmentState();
    
    // Clear the payments from results to simulate toggling off
    store.setResult('payments', []);
    const stateAfterClearing = useStore.getState();
    expect(stateAfterClearing.results.payments.length).toBe(0);
    
    // Restore the state (simulating turning prejudgment interest back on)
    store.restorePrejudgmentState();
    
    // Get state after restoring
    const state = useStore.getState();
    console.log('State after restoring prejudgment state:', state.results.payments);
    
    // Verify the payment was restored
    const { payments } = state.results;
    expect(payments.length).toBe(1);
    expect(payments[0]).toEqual(payment);
  });

  it('should clear payments when resetting the store', () => {
    const store = useStore.getState();
    const payment = {
      date: new Date('2025-01-15'),
      dateStr: '2025-01-15',
      amount: 1000,
      interestApplied: 250,
      principalApplied: 750,
      remainingPrincipal: 9250,
      segmentIndex: 2
    };

    // Add a payment
    store.addPayment(payment);
    
    // Get state after adding
    const stateAfterAdding = useStore.getState();
    console.log('State after adding payment (reset test):', stateAfterAdding.results.payments);
    expect(stateAfterAdding.results.payments.length).toBe(1);
    
    // Reset the store
    store.resetStore();
    
    // Get state after resetting
    const stateAfterReset = useStore.getState();
    console.log('State after reset:', stateAfterReset.results.payments);
    
    // Verify payments are empty
    expect(stateAfterReset.results.payments.length).toBe(0);
  });
});
