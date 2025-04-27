import useStore from './store.js';
import { describe, test, expect, beforeEach } from 'vitest';

describe('Zustand Store - Advanced', () => {
  // Reset the store before each test
  beforeEach(() => {
    useStore.getState().resetStore();
  });

  describe('Special Damages Actions', () => {
    test('setSpecialDamages should update special damages array and total', () => {
      const specialDamages = [
        { date: '2023-01-15', description: 'Damage 1', amount: 1000 },
        { date: '2023-02-20', description: 'Damage 2', amount: 2000 }
      ];
      
      useStore.getState().setSpecialDamages(specialDamages);
      
      const state = useStore.getState();
      expect(state.results.specialDamages).toEqual(specialDamages);
      expect(state.results.specialDamagesTotal).toBe(3000);
    });
    
    test('addSpecialDamage should add a damage and update total', () => {
      const damage1 = { date: '2023-01-15', description: 'Damage 1', amount: 1000 };
      const damage2 = { date: '2023-02-20', description: 'Damage 2', amount: 2000 };
      
      useStore.getState().addSpecialDamage(damage1);
      
      let state = useStore.getState();
      expect(state.results.specialDamages).toHaveLength(1);
      expect(state.results.specialDamagesTotal).toBe(1000);
      
      useStore.getState().addSpecialDamage(damage2);
      
      state = useStore.getState();
      expect(state.results.specialDamages).toHaveLength(2);
      expect(state.results.specialDamagesTotal).toBe(3000);
    });
    
    test('updateSpecialDamage should update a damage and recalculate total', () => {
      // Add two damages first
      useStore.getState().setSpecialDamages([
        { date: '2023-01-15', description: 'Damage 1', amount: 1000 },
        { date: '2023-02-20', description: 'Damage 2', amount: 2000 }
      ]);
      
      // Update the first damage
      const updatedDamage = { date: '2023-01-15', description: 'Updated Damage', amount: 1500 };
      useStore.getState().updateSpecialDamage(0, updatedDamage);
      
      const state = useStore.getState();
      expect(state.results.specialDamages[0]).toEqual(updatedDamage);
      expect(state.results.specialDamagesTotal).toBe(3500);
    });
    
    test('removeSpecialDamage should remove a damage and recalculate total', () => {
      // Add two damages first
      useStore.getState().setSpecialDamages([
        { date: '2023-01-15', description: 'Damage 1', amount: 1000 },
        { date: '2023-02-20', description: 'Damage 2', amount: 2000 }
      ]);
      
      // Remove the first damage
      useStore.getState().removeSpecialDamage(0);
      
      const state = useStore.getState();
      expect(state.results.specialDamages).toHaveLength(1);
      expect(state.results.specialDamages[0].description).toBe('Damage 2');
      expect(state.results.specialDamagesTotal).toBe(2000);
    });
  });

  describe('Store Management Actions', () => {
    test('resetStore should reset the store to initial state', () => {
      // First, modify the store
      useStore.getState().setInput('judgmentAwarded', 10000);
      useStore.getState().setResult('judgmentTotal', 12000);
      useStore.getState().addSpecialDamage({ date: '2023-01-15', description: 'Damage', amount: 1000 });
      
      // Then reset
      useStore.getState().resetStore();
      
      const state = useStore.getState();
      expect(state.inputs.judgmentAwarded).toBe(0);
      expect(state.results.judgmentTotal).toBe(0);
      expect(state.results.specialDamages).toEqual([]);
    });
    
    test('initializeStore should set default values', () => {
      const defaultValues = {
        inputs: {
          judgmentAwarded: 10000,
          dateOfJudgment: new Date(2023, 0, 15)
        },
        results: {
          judgmentTotal: 10000,
          finalCalculationDate: new Date(2023, 5, 15)
        }
      };
      
      useStore.getState().initializeStore(defaultValues);
      
      const state = useStore.getState();
      expect(state.inputs.judgmentAwarded).toBe(10000);
      expect(state.inputs.dateOfJudgment).toEqual(new Date(2023, 0, 15));
      expect(state.results.judgmentTotal).toBe(10000);
      expect(state.results.finalCalculationDate).toEqual(new Date(2023, 5, 15));
      
      // Other values should remain at defaults
      expect(state.inputs.nonPecuniaryAwarded).toBe(0);
      expect(state.results.perDiem).toBe(0);
    });
  });

  describe('Complex Interactions', () => {
    test('should handle a complete calculation flow', () => {
      // Set up inputs
      const today = new Date();
      const judgmentDate = new Date(today);
      judgmentDate.setFullYear(judgmentDate.getFullYear() - 1);
      
      const prejudgmentStartDate = new Date(judgmentDate);
      prejudgmentStartDate.setFullYear(prejudgmentStartDate.getFullYear() - 2);
      
      useStore.getState().setInputs({
        prejudgmentStartDate,
        dateOfJudgment: judgmentDate,
        nonPecuniaryJudgmentDate: judgmentDate,
        costsAwardedDate: judgmentDate,
        postjudgmentEndDate: today,
        judgmentAwarded: 10000,
        nonPecuniaryAwarded: 5000,
        costsAwarded: 2000
      });
      
      // Add special damages
      useStore.getState().addSpecialDamage({
        date: '2022-01-15',
        description: 'Medical Expenses',
        amount: 3000
      });
      
      // Set prejudgment result
      useStore.getState().setPrejudgmentResult({
        details: [{ start: '2022-01-01', description: 'Test', rate: 5, principal: 10000, interest: 500 }],
        total: 500,
        principal: 10000
      });
      
      // Set postjudgment result
      useStore.getState().setPostjudgmentResult({
        details: [{ start: '2023-01-01', description: 'Test', rate: 7, principal: 15500, interest: 700 }],
        total: 700
      });
      
      // Update judgment total and total owing
      useStore.getState().setResults({
        judgmentTotal: 15500, // 10000 + 500 + 5000 + 0 (no costs interest)
        totalOwing: 16200,    // 15500 + 700
        perDiem: 3.0,
        finalCalculationDate: today
      });
      
      // Verify final state
      const state = useStore.getState();
      expect(state.inputs.judgmentAwarded).toBe(10000);
      expect(state.results.specialDamagesTotal).toBe(3000);
      expect(state.results.prejudgmentResult.total).toBe(500);
      expect(state.results.postjudgmentResult.total).toBe(700);
      expect(state.results.judgmentTotal).toBe(15500);
      expect(state.results.totalOwing).toBe(16200);
      expect(state.results.perDiem).toBe(3.0);
    });
  });
});
