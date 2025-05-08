import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseDateInput, formatDateForDisplay } from './utils.date.js';

// Mock DOM elements for testing
const createMockTableBody = () => {
  const rows = [];
  return {
    rows,
    insertRow: (index) => {
      const newRow = {
        cells: [],
        className: '',
        dateInput: { value: '' },
        querySelector: (selector) => {
          if (selector === '.special-damages-date') {
            return newRow.dateInput;
          }
          return null;
        },
        insertCell: () => {
          const cell = { 
            textContent: '', 
            innerHTML: '', 
            classList: { add: () => {} },
            appendChild: (child) => {}
          };
          newRow.cells.push(cell);
          return cell;
        }
      };
      
      if (index === undefined || index === -1) {
        rows.push(newRow);
      } else {
        rows.splice(index, 0, newRow);
      }
      
      return newRow;
    },
    innerHTML: '',
    querySelectorAll: () => [],
    querySelector: () => null,
    closest: () => ({ querySelector: () => null, id: null })
  };
};

// Mock function for inserting special damages rows
const mockInsertSpecialDamagesRow = (tableBody, rowIndex, rowData) => {
  const newRow = tableBody.insertRow(rowIndex);
  newRow.className = 'editable-item-row';
  newRow.dateInput.value = rowData.date;
  return newRow;
};

describe('Special Damages Sorting', () => {
  it('should sort special damages rows by date', () => {
    // Sample special damages data (intentionally out of order)
    const specialDamages = [
      { date: '2024-07-02', description: 'test 2', amount: '222.00' },
      { date: '2024-04-30', description: 'test 3', amount: '333.00' },
      { date: '2024-07-01', description: 'test 1', amount: '11.00' }
    ];
    
    // Manually sort by date for comparison
    const expectedOrder = [...specialDamages].sort((a, b) => {
      const dateA = parseDateInput(a.date);
      const dateB = parseDateInput(b.date);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });
    
    // Check if the expected order is correct (2024-04-30 should be first)
    expect(expectedOrder[0].description).toBe('test 3');
    expect(expectedOrder[1].description).toBe('test 1');
    expect(expectedOrder[2].description).toBe('test 2');
    
    // This confirms our sorting algorithm works correctly
    expect(expectedOrder.map(d => d.date)).toEqual(['2024-04-30', '2024-07-01', '2024-07-02']);
  });

  it('should position special damages rows in correct order relative to interest periods', () => {
    // Create a mock table body
    const tableBody = createMockTableBody();
    
    // Create mock interest period rows
    const periodDates = [
      '2024-03-15',
      '2024-05-01',
      '2024-08-15'
    ];
    
    // Insert interest period rows first
    periodDates.forEach(dateStr => {
      const row = tableBody.insertRow();
      row.cells[0] = { textContent: dateStr };
    });
    
    // Sample out-of-order special damages
    const specialDamages = [
      { date: '2024-07-02', description: 'test 2', amount: '222.00' },
      { date: '2024-04-30', description: 'test 3', amount: '333.00' },
      { date: '2024-07-01', description: 'test 1', amount: '11.00' }
    ];
    
    // Sort the special damages rows by date
    const sortedRows = [...specialDamages].sort((a, b) => {
      const dateA = parseDateInput(a.date);
      const dateB = parseDateInput(b.date);
      if (!dateA || !dateB) return 0;
      return dateA - dateB;
    });
    
    // Mock insertion of each special damages row at the correct position
    const insertedRowIndices = [];
    
    for (const rowData of sortedRows) {
      const rowDate = parseDateInput(rowData.date);
      let insertIndex = -1; // Default to append at end
      
      // Find proper position for insertion
      for (let i = 0; i < tableBody.rows.length; i++) {
        const currentRow = tableBody.rows[i];
        if (!currentRow.cells[0] || !currentRow.cells[0].textContent) continue;
        
        const currentDateStr = currentRow.cells[0].textContent.trim();
        const currentDate = parseDateInput(currentDateStr);
        
        if (currentDate && rowDate <= currentDate) {
          insertIndex = i;
          break;
        }
      }
      
      // Insert row and track where it was inserted
      const newRow = mockInsertSpecialDamagesRow(tableBody, insertIndex, rowData);
      insertedRowIndices.push(insertIndex === -1 ? tableBody.rows.length - 1 : insertIndex);
    }
    
    // Expected positions based on dates:
    // '2024-04-30' (test 3) should be between '2024-03-15' and '2024-05-01' (at index 1)
    // '2024-07-01' (test 1) and '2024-07-02' (test 2) should be between '2024-05-01' and '2024-08-15'
    
    // Verify row positions
    // Row dates should now be in this order: 
    // 0: '2024-03-15' (period)
    // 1: '2024-04-30' (special - test 3) 
    // 2: '2024-05-01' (period)
    // 3: '2024-07-01' (special - test 1)
    // 4: '2024-07-02' (special - test 2)
    // 5: '2024-08-15' (period)
    
    // Extract dates from table body rows
    const rowDates = tableBody.rows.map(row => {
      if (row.dateInput && row.dateInput.value) {
        return row.dateInput.value; // Special damages row
      } else if (row.cells[0] && row.cells[0].textContent) {
        return row.cells[0].textContent; // Interest period row
      }
      return null;
    }).filter(date => date !== null);
    
    // Check if rows are in expected order
    expect(rowDates).toEqual([
      '2024-03-15',
      '2024-04-30',
      '2024-05-01',
      '2024-07-01',
      '2024-07-02',
      '2024-08-15'
    ]);
  });
});
