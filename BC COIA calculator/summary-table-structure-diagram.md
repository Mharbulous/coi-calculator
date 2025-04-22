# Summary Table Structure and Layout Fix

## Problem Diagnosis

When toggling the prejudgment interest checkbox, the postjudgment interest date field wiggles because:

1. The toggle visibility function hides the entire date cell container in the prejudgment row
2. This causes the middle column width to fluctuate
3. When the column width changes, it shifts the postjudgment date field's position

## Table Structure

```
┌────────────────────────┬─────────────────────┬────────────┐
│ Item Name              │ Date Value          │ Amount     │
├────────────────────────┼─────────────────────┼────────────┤
│ General Damages & Debt │                     │ $10,000.00 │
├────────────────────────┼─────────────────────┼────────────┤
│ Special Damages        │                     │    $566.00 │
├────────────────────────┼─────────────────────┼────────────┤
│ Non-pecuniary Damages  │                     │      $0.00 │
├────────────────────────┼─────────────────────┼────────────┤
│ Costs & Disbursements  │                     │      $0.00 │
├────────────────────────┼─────────────────────┼────────────┤
│ Prejudgment Interest   │ from 2024-04-22     │    $256.61 │ ◄── This row changes
├────────────────────────┼─────────────────────┼────────────┤
│ Postjudgment Interest  │ until 2025-04-22    │    $332.97 │ ◄── This causes wiggling
└────────────────────────┴─────────────────────┴────────────┘
```

## Solution Approach

1. Added fixed minimum width to the middle column cells:
   ```css
   .summary-table tbody td:nth-child(2) {
       min-width: 150px;
       box-sizing: border-box;
   }
   ```

2. Ensured date cells maintain dimensions when empty or hidden:
   ```css
   .date-cell-container {
       min-width: 150px;
       min-height: 30px;
       display: inline-block;
       box-sizing: border-box;
   }
   ```

3. Added consistent dimensions for empty cells to prevent layout shifts:
   ```css
   .summary-table tr td:nth-child(2):empty {
       min-width: 150px;
       min-height: 30px;
   }
   ```

This ensures that regardless of whether a field is visible or not, the column maintains consistent width and prevents layout shifts.
