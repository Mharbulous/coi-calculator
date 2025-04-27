import useStore from './store.js';
import { describe, test, expect, beforeEach } from 'vitest';

describe('Zustand Store - Basic', () => {
  // Reset the store before each test
  beforeEach(() => {
    useStore.getState().resetStore();
  });

  describe('Initial State', () => {
    test('should have the correct initial state structure', () => {
      const state = useStore.getState();
      
      // Check inputs structure
      expect(state.inputs).toEqual({
        prejudgmentStartDate: null,
        postjudgmentEndDate: null,
        dateOfJudgment: null,
        nonPecuniaryJudgmentDate: null,
        costsAwardedDate: null,
        judgmentAwarded: 0,
        nonPecuniaryAwarded: 0,
        costsAwarded: 0,
        jurisdiction: 'BC',
        showPrejudgment: true,
        showPostjudgment: true,
        showPerDiem: true,
        isValid: true,
        validationMessage: ''
      });
      
      // Check results structure
      expect(state.results).toEqual({
        specialDamages: [],
        specialDamagesTotal: 0,
        prejudgmentResult: {
          details: [],
          total: 0,
          principal: 0,
          finalPeriodDamageInterestDetails: []
        },
        postjudgmentResult: {
          details: [],
          total: 0
        },
        judgmentTotal: 0,
        totalOwing: 0,
        perDiem: 0,
        finalCalculationDate: null
      });
      
      // Check that all actions are functions
      expect(typeof state.setInputs).toBe('function');
      expect(typeof state.setInput).toBe('function');
      expect(typeof state.setResults).toBe('function');
      expect(typeof state.setResult).toBe('function');
      expect(typeof state.setPrejudgmentResult).toBe('function');
      expect(typeof state.setPostjudgmentResult).toBe('function');
      expect(typeof state.setSpecialDamages).toBe('function');
      expect(typeof state.addSpecialDamage).toBe('function');
      expect(typeof state.updateSpecialDamage).toBe('function');
      expect(typeof state.removeSpecialDamage).toBe('function');
      expect(typeof state.resetStore).toBe('function');
      expect(typeof state.initializeStore).toBe('function');
    });
  });

  describe('Input Actions', () => {
    test('setInputs should update multiple input values', () => {
      const newInputs = {
        judgmentAwarded: 10000,
        nonPecuniaryAwarded: 5000,
        jurisdiction: 'ON'
      };
      
      useStore.getState().setInputs(newInputs);
      
      const state = useStore.getState();
      expect(state.inputs.judgmentAwarded).toBe(10000);
      expect(state.inputs.nonPecuniaryAwarded).toBe(5000);
      expect(state.inputs.jurisdiction).toBe('ON');
      
      // Other values should remain unchanged
      expect(state.inputs.costsAwarded).toBe(0);
      expect(state.inputs.showPrejudgment).toBe(true);
    });
    
    test('setInput should update a single input value', () => {
      useStore.getState().setInput('judgmentAwarded', 15000);
      
      const state = useStore.getState();
      expect(state.inputs.judgmentAwarded).toBe(15000);
      
      // Other values should remain unchanged
      expect(state.inputs.nonPecuniaryAwarded).toBe(0);
    });
    
    test('setInput should handle date objects correctly', () => {
      const testDate = new Date(2023, 0, 15); // Jan 15, 2023
      
      useStore.getState().setInput('dateOfJudgment', testDate);
      
      const state = useStore.getState();
      expect(state.inputs.dateOfJudgment).toEqual(testDate);
    });
    
    test('setInput should handle boolean values correctly', () => {
      useStore.getState().setInput('showPrejudgment', false);
      
      const state = useStore.getState();
      expect(state.inputs.showPrejudgment).toBe(false);
    });
  });

  describe('Result Actions', () => {
    test('setResults should update multiple result values', () => {
      const newResults = {
        judgmentTotal: 15000,
        totalOwing: 16500,
        perDiem: 2.5
      };
      
      useStore.getState().setResults(newResults);
      
      const state = useStore.getState();
      expect(state.results.judgmentTotal).toBe(15000);
      expect(state.results.totalOwing).toBe(16500);
      expect(state.results.perDiem).toBe(2.5);
      
      // Other values should remain unchanged
      expect(state.results.specialDamagesTotal).toBe(0);
    });
    
    test('setResult should update a single result value', () => {
      useStore.getState().setResult('judgmentTotal', 20000);
      
      const state = useStore.getState();
      expect(state.results.judgmentTotal).toBe(20000);
      
      // Other values should remain unchanged
      expect(state.results.totalOwing).toBe(0);
    });
    
    test('setPrejudgmentResult should update prejudgment result', () => {
      const prejudgmentResult = {
        details: [{ start: '2023-01-01', description: 'Test', rate: 5, principal: 10000, interest: 500 }],
        total: 500,
        principal: 10000
      };
      
      useStore.getState().setPrejudgmentResult(prejudgmentResult);
      
      const state = useStore.getState();
      expect(state.results.prejudgmentResult.total).toBe(500);
      expect(state.results.prejudgmentResult.principal).toBe(10000);
      expect(state.results.prejudgmentResult.details).toHaveLength(1);
      expect(state.results.prejudgmentResult.details[0].interest).toBe(500);
      
      // finalPeriodDamageInterestDetails should remain unchanged
      expect(state.results.prejudgmentResult.finalPeriodDamageInterestDetails).toEqual([]);
    });
    
    test('setPostjudgmentResult should update postjudgment result', () => {
      const postjudgmentResult = {
        details: [{ start: '2023-06-01', description: 'Test', rate: 7, principal: 15000, interest: 700 }],
        total: 700
      };
      
      useStore.getState().setPostjudgmentResult(postjudgmentResult);
      
      const state = useStore.getState();
      expect(state.results.postjudgmentResult.total).toBe(700);
      expect(state.results.postjudgmentResult.details).toHaveLength(1);
      expect(state.results.postjudgmentResult.details[0].interest).toBe(700);
    });
  });
});
