# Chapter 7: Calculation Engine

Welcome back! In [Chapter 6: Interest Rate Data Management](06_interest_rate_data_management_.md), we saw how the `coi-calculator` project fetches and manages the crucial interest rate data, deciding whether to use built-in mock rates or accurate rates from Firebase based on payment status.

Now that the application knows *which* rates to use, it's time for the main event: performing the actual calculations! This is the heart of the calculator, the part that takes all your inputs and the historical rates and crunches the numbers to tell you exactly how much interest has accrued.

Think of the **Calculation Engine** as the application's dedicated math teacher or forensic accountant. Its job is to apply the correct interest rate rules step-by-step over the specified time period, carefully accounting for changing rates and any additional amounts (like special damages) that might be added to the principal amount over time.

The main goal of this chapter is to understand how the calculator uses your inputs and the rate data to perform these calculations and produce the detailed results you see on the screen.

### The Math Teacher: `calculator.core.js` and `calculations.js`

The core logic for calculating interest lives primarily in two files:

1.  **`calculator.core.js`**: This file contains the main `recalculate` function that gets triggered whenever something important changes (like an input value or a rate being loaded). It orchestrates the entire calculation process – getting inputs, calling the functions that do the math, and saving the results back to the central state.
2.  **`calculations.js`**: This file is the math teacher's textbook and set of tools. It contains all the specific functions needed to perform interest calculations: finding rates, calculating days between dates, calculating interest for specific periods, and handling special damages.

Let's focus on the journey from inputs to results, largely powered by functions within `calculations.js` and orchestrated by `calculator.core.js`.

### Getting Started: The `recalculate` Function

The calculation process starts when the `recalculate` function in `calculator.core.js` is called. As we saw in previous chapters, this happens during application initialization (when the page first loads) and whenever a relevant input changes in the UI.

This function first grabs all the necessary information from the application's central storage ([State Management (Zustand Store)](04_state_management__zustand_store__.md)).

```javascript
// Inside calculator.core.js (Simplified recalculate function)

import useStore from './store.js'; // From Chapter 4
import { calculateInterestPeriods, calculatePerDiem } from './calculations.js'; // The math functions
import { getInterestRates } from './firebaseIntegration.js'; // From Chapter 6
import { parseDateInput, daysBetween, formatDateForDisplay } from './utils.date.js'; // From Chapter 3
import { parseCurrency } from './utils.currency.js'; // From Chapter 3

export function recalculate() {
    // Get all current inputs and results from the central store (Chapter 4)
    const state = useStore.getState();
    const inputs = state.inputs;
    const ratesData = getInterestRates(); // Get the available rates (Chapter 6)

    // Important Check: Make sure rates are loaded before proceeding!
    // This happens automatically when getInterestRates() returns, but good to be aware.
    // (The loadRatesFromFirebase in core.js handles waiting and triggering recalculate)
    if (ratesData.source === 'mock' && Object.keys(ratesData.rates).length === 0) {
        console.warn("Rates not yet loaded, skipping recalculation.");
        // Update UI to show loading state or error if needed
        return; // Stop if rates aren't ready
    }
    
    // 1. Parse and prepare inputs
    const prejudgmentStartDate = parseDateInput(inputs.prejudgmentStartDateInput);
    const dateOfJudgment = parseDateInput(inputs.dateOfJudgmentInput);
    const postjudgmentEndDate = parseDateInput(inputs.postjudgmentEndDateInput);
    const judgmentAwarded = parseCurrency(inputs.judgmentAwardedInput);
    const specialDamages = inputs.specialDamages; // Array of special damage objects
    
    // ... (parse other inputs like visibility flags) ...

    // 2. Determine the relevant dates for calculations
    // The logic here gets complex (e.g., using judgment date or postjudgment end date)
    const prejudgmentEndDate = dateOfJudgment; // Prejudgment usually ends on judgment date
    const postjudgmentStartDate = dateOfJudgment; // Postjudgment usually starts on judgment date
    const finalCalculationDate = postjudgmentEndDate || dateOfJudgment; // Last day of calc period

    // 3. Calculate Prejudgment Interest (if enabled)
    let prejudgmentResult = { total: 0, details: [], principal: 0, finalPeriodDamageInterestDetails: [] };
    if (inputs.showPrejudgment && prejudgmentStartDate && prejudgmentEndDate && judgmentAwarded >= 0) {
        prejudgmentResult = calculateInterestPeriods(
            state, // Pass the whole state to access special damages
            'prejudgment',
            prejudgmentStartDate,
            prejudgmentEndDate,
            judgmentAwarded, // Initial principal for prejudgment
            ratesData.rates // Pass the actual rates data
        );
    }

    // 4. Calculate Postjudgment Interest (if enabled)
    // Postjudgment principal is the sum of judgmentAwarded + prejudgment total + special damages up to judgment date
    // The 'calculateInterestPeriods' function handles principal tracking internally,
    // so we pass the 'finalPrincipal' from the prejudgment step as the starting principal for postjudgment
    let postjudgmentResult = { total: 0, details: [], principal: 0 };
    // Need to determine the correct start date for postjudgment.
    // This is usually the day *after* the judgment date if it exists, or the prejudgment end date.
    // Let's assume for simplicity it's the judgment date here (real code is more precise).
    const postjudgmentCalcStartDate = dateOfJudgment;

    if (inputs.showPostjudgment && postjudgmentCalcStartDate && postjudgmentEndDate && postjudgmentCalcStartDate <= postjudgmentEndDate) {
         // Need to pass the total judgment + damages + prejudgment interest as the starting principal
         // The `calculateInterestPeriods` function for postjudgment receives the final principal *after* prejudgment
         const initialPostjudgmentPrincipal = prejudgmentResult.principal + prejudgmentResult.total; // This is simplified; actual logic is more complex depending on how damages are applied

         postjudgmentResult = calculateInterestPeriods(
             state,
             'postjudgment',
             postjudgmentCalcStartDate,
             postjudgmentEndDate,
             initialPostjudgmentPrincipal,
             ratesData.rates
         );
    }


    // 5. Calculate Totals
    const totalOwing = prejudgmentResult.total + postjudgmentResult.total + (prejudgmentResult.principal || 0); // Add initial principal

    // 6. Calculate Per Diem (daily interest rate)
    const perDiem = calculatePerDiem(state, ratesData.rates);

    // 7. Update the central store with the results (Chapter 4)
    useStore.getState().setResults({
        prejudgmentResult: prejudgmentResult,
        postjudgmentResult: postjudgmentResult,
        specialDamagesTotal: prejudgmentResult.principal - judgmentAwarded, // Total of damages added
        totalOwing: totalOwing,
        perDiem: perDiem,
        finalCalculationDate: finalCalculationDate // Store the final date used for calc
        // ... other results ...
    });

    // 8. Trigger UI updates to display results (Chapter 2)
    // This is handled elsewhere, triggered by the store update or a separate event.
    // e.g., updateSummaryTable(state.inputs, useStore.getState().results);
}
```

This shows the high-level flow:
1.  Get inputs and rates from the store.
2.  Determine the time periods for prejudgment and postjudgment calculations.
3.  Call `calculateInterestPeriods` for prejudgment.
4.  Call `calculateInterestPeriods` for postjudgment, passing the outcome (principal + interest) of the prejudgment step as the starting principal.
5.  Calculate the grand total.
6.  Calculate the per diem.
7.  Save all results back into the store.
8.  The UI (covered in [Chapter 2: UI Display and DOM Interaction](02_ui_display_and_dom_interaction_.md)) then reads the updated results from the store and refreshes the display.

The real heavy lifting happens inside the functions in `calculations.js`.

### Breaking Down the Calculation: `calculateInterestPeriods`

The core function `calculateInterestPeriods` is responsible for calculating the total interest over a given start and end date for a specific type (prejudgment or postjudgment). It needs to handle the fact that the interest rate might change multiple times within that period, and that special damages might be added, increasing the principal amount.

Here's a simplified look at what `calculateInterestPeriods` (and the helper functions it calls) does internally:

```mermaid
sequenceDiagram
    participant Caller as calculator.core.js
    participant CalcEngine as calculations.js
    participant DateUtils as utils.date.js
    participant RateIntegr as firebaseIntegration.js (via getInterestRateForDate)

    Caller->>CalcEngine: calculateInterestPeriods(state, type, startDate, endDate, initialPrincipal, ratesData)
    CalcEngine->>CalcEngine: Validate inputs
    CalcEngine->>CalcEngine: Initialize totalInterest = 0, details = []
    CalcEngine->>CalcEngine: Determine rate segments within startDate to endDate

    loop For each segment found
        CalcEngine->>CalcEngine: Determine segment start/end dates
        CalcEngine->>RateIntegr: getInterestRateForDate(segment.start, type, jurisdiction, ratesData)
        RateIntegr-->>CalcEngine: Get applicable rate for segment
        CalcEngine->>DateUtils: daysBetween(segment.start, segment.end)
        DateUtils-->>CalcEngine: Get number of days in segment

        CalcEngine->>CalcEngine: Calculate interest for segment: principal * rate * days / days_in_year
        CalcEngine->>CalcEngine: Add segment interest to total
        CalcEngine->>CalcEngine: Create detail object for segment
        CalcEngine->>CalcEngine: Add detail object to details list

        alt If processing Special Damages (Prejudgment only)
            CalcEngine->>CalcEngine: Add special damages that occurred *within* this segment to a running principal for the *next* segment calculation
        end
    end

    alt If Prejudgment Calculation AND Special Damages exist
        CalcEngine->>CalcEngine: calculateFinalPeriodDamageInterest(...)
        CalcEngine->>CalcEngine: For each damage in the *final* segment:
        CalcEngine->>CalcEngine:   Calculate interest from damage date to endDate
        CalcEngine->>CalcEngine:   Add to damageInterestTotal
        CalcEngine->>CalcEngine:   Create detail object
        CalcEngine->>CalcEngine: Add damage details to finalPeriodDamageInterestDetails list
    end

    CalcEngine->>CalcEngine: Calculate final principal (initial + ALL damages <= endDate)
    CalcEngine->>CalcEngine: Compile final result object (total interest, details, final principal)
    CalcEngine-->>Caller: Return final result object
```

This diagram shows the core loop: iterating through periods where the interest rate is constant. Inside the loop, it calculates the interest for that specific period using the principal active during that time and the rate for that period.

Let's look at some of the helper functions involved:

#### `getApplicableRatePeriods(startDate, endDate, interestType, jurisdiction, ratesData)`

This function identifies all the distinct date ranges between `startDate` and `endDate` where the interest rate (`prejudgment` or `postjudgment`) remains constant for the given `jurisdiction`. It does this by looking at the `start` and `end` dates provided in the `ratesData` from [Chapter 6](06_interest_rate_data_management_.md) and finding where those rate periods overlap with the requested `startDate` to `endDate` range. It splits the overall calculation range into smaller "segments" based on these rate change dates.

```javascript
// Inside calculations.js (Simplified getApplicableRatePeriods logic)

function getApplicableRatePeriods(startDate, endDate, interestType, jurisdiction, ratesData) {
    const jurisdictionRates = ratesData[jurisdiction];
    const segments = [];
    let currentDate = new Date(startDate);

    // Loop day by day (simplified) or jump by rate period start dates
    while (currentDate <= endDate) {
        // Find the rate applicable to currentDate (using getInterestRateForDate internally)
        const applicableRate = getInterestRateForDate(currentDate, interestType, jurisdiction, ratesData);

        // Find the end date of this current rate period within the overall range
        // This involves checking the start date of the *next* rate period
        // that falls within our overall endDate.
        let segmentEndDate = new Date(endDate); // Default end is calculation end date

        // ... (Logic to find the actual end of this rate segment based on next rate change) ...
        // Example: If current rate period ends on Jan 31 and next starts Feb 1,
        // and our overall calc ends on Mar 15, segmentEndDate might become Feb 1.

        segments.push({
            start: new Date(currentDate),
            end: segmentEndDate,
            rate: applicableRate,
            // ... other segment info like isFinalSegment ...
        });

        // Move to the start of the next segment for the next loop iteration
        currentDate = new Date(segmentEndDate); // Note: Real code might add 1 day or handle boundaries carefully
    }

    return segments; // Returns array like [{start: Date, end: Date, rate: Number}, ...]
}
```

This function ensures that the calculation process deals with periods where the rate is constant, simplifying the math for each step.

#### `calculateSegmentInterest(segment, principal, rate, year)`

This is where the daily interest formula is applied for a single segment.

```javascript
// Inside calculations.js (Simplified calculateSegmentInterest)

function calculateSegmentInterest(segment, principal, rate, year) {
    // How many days are we calculating for in this segment?
    const daysInSegment = daysBetween(segment.start, segment.end); // From utils.date.js

    // How many days are in the year the segment starts in? (Handles leap years)
    const days_in_year = daysInYear(year); // From utils.date.js

    if (principal <= 0 || rate <= 0 || daysInSegment <= 0 || days_in_year <= 0) {
        return { interest: 0, details: null }; // No interest if principal/rate/days are zero/negative
    }

    // The Formula: Principal * (Annual Rate / 100) * (Days in Segment / Days in Year)
    const interestAmount = (principal * (rate / 100) * daysInSegment) / days_in_year;

    const details = {
        start: formatDateForDisplay(segment.start), // From utils.date.js
        // ... description, principal, rate, interest amount ...
        interest: interestAmount,
        // ... internal helper properties ...
    };

    return {
        interest: interestAmount,
        details: details
    };
}
```

This function takes a specific time segment, the principal amount *at the start of that segment*, the applicable annual rate, and the year (to handle leap years) and calculates the precise interest accrued *just for that segment*.

#### Handling Special Damages

Special damages complicate things because they add to the principal *on a specific date* within the calculation period. The engine needs to make sure that interest starts accruing on a special damage amount only *from the date it was incurred*.

The provided code includes logic to handle this:
*   `processSpecialDamages`: This function takes the raw special damage data from the state, parses their dates, sorts them, and figures out which rate segment each damage falls into.
*   `calculateSegmentsInterestWithDamages`: When special damages exist, this variation of the segment calculation function tracks the `currentPrincipal`. It calculates interest for a segment using the principal *at the start of that segment*, but crucially, it updates the `currentPrincipal` by adding any special damages whose date falls within that segment *after* calculating the interest for the current segment. This ensures the added damages affect the principal for the *next* segment's calculation onwards.
*   `calculateFinalPeriodDamageInterest`: This is a specific calculation needed for *prejudgment* interest when special damages exist. Because damages only accrue interest from their specific date, the interest for damages that fall into the *final* rate period needs to be calculated individually *from the date of the damage* to the end date, rather than just applying the final period's rate to the cumulative principal for the entire final segment. This function calculates the interest for each damage in the final segment separately using the final period's rate.

This breakdown shows how the engine manages the principal amount carefully when special damages are involved, ensuring interest is calculated accurately from the correct dates.

#### `calculatePerDiem(state, ratesData)`

The per diem calculation is simpler. It figures out the daily interest amount based on the *final total owing* and the *current postjudgment interest rate* on the *final calculation date*.

```javascript
// Inside calculations.js (Simplified calculatePerDiem)

function calculatePerDiem(state, ratesData) {
    const { totalOwing, finalCalculationDate } = state.results;
    const { jurisdiction } = state.inputs;

    if (totalOwing <= 0 || !finalCalculationDate || isNaN(finalCalculationDate.getTime())) {
        return 0; // No per diem if total is zero or date is invalid
    }

    // Get the postjudgment rate for the final calculation date
    const rate = getInterestRateForDate(finalCalculationDate, 'postjudgment', jurisdiction, ratesData);

    if (rate === undefined || rate <= 0) {
        return 0; // Cannot calculate per diem without a valid rate
    }

    const year = finalCalculationDate.getUTCFullYear();
    const days_in_year = daysInYear(year); // Handle leap year

    if (days_in_year <= 0) {
        return 0; // Cannot calculate per diem without days in year
    }

    // Formula: Final Total Owing * (Annual Rate / 100) / Days in Year
    const perDiemAmount = (totalOwing * (rate / 100)) / days_in_year;

    return perDiemAmount;
}
```

This function provides the user with a useful figure: how much interest is accumulating *each day* based on the current total and rate.

### Outputting the Results

After `calculateInterestPeriods` and `calculatePerDiem` have completed their work, the `recalculate` function in `calculator.core.js` collects all the results.

These results include:
*   The total prejudgment interest.
*   A detailed breakdown of how the prejudgment interest was calculated across different rate periods.
*   Optionally, a separate breakdown of interest on special damages in the final prejudgment period.
*   The total postjudgment interest.
*   A detailed breakdown of the postjudgment interest.
*   The final total amount owing (initial principal + prejudgment interest + postjudgment interest).
*   The calculated per diem amount.

All this data is then saved back into the `results` section of the application's state ([State Management (Zustand Store)](04_state_management__zustand_store__.md)) using `useStore.getState().setResults(...)`.

Once the state is updated, the UI components that are "listening" to the state (as described in [Chapter 2: UI Display and DOM Interaction](02_ui_display_and_dom_interaction_.md)) will detect the changes in the `results` section and update the tables and display areas on the web page to show you the calculated numbers. The [Date and Currency Utilities](03_date_and_currency_utilities_.md) are used here to format the dates and money amounts nicely for display.

### Putting it all Together: The Core Calculation Loop

The full calculation cycle triggered by `recalculate` involves:
1.  Reading inputs from the **Store** (Chapter 4).
2.  Getting rate data from the **Interest Rate Data Management** (Chapter 6), checking payment status.
3.  Using **Date and Currency Utilities** (Chapter 3) to parse inputs.
4.  Calling the core math functions in `calculations.js`.
5.  Inside `calculations.js`:
    *   Using **Date Utilities** for date comparisons, differences, and days in year.
    *   Using `getInterestRateForDate` (which uses **Interest Rate Data Management**) to find rates.
    *   Iterating through date segments.
    *   Applying the daily interest formula.
    *   Handling special damages by updating principal and potentially calculating interest individually in the final period.
6.  Calculating per diem using final total and rate.
7.  Saving results back to the **Store** (Chapter 4).
8.  The **UI** (Chapter 2) reading the results from the **Store** and using **Date and Currency Utilities** to display them.

This shows how the Calculation Engine relies heavily on other parts of the application to function correctly.

### Conclusion

In this chapter, we've delved into the heart of the `coi-calculator`: the Calculation Engine. We learned that the `recalculate` function orchestrates the process, pulling data from the central state and rates management. We explored how the `calculations.js` file contains the specific math, breaking the calculation down into segments based on rate changes and carefully handling special damages. We saw how the daily interest formula is applied and how the per diem is calculated. Finally, we understood how the results are saved back to the state, triggering UI updates.

With the core calculation logic now clear, the next important topic is what happens when something goes wrong – inputs are invalid, rates fail to load, etc. In the next chapter, we'll look at [Error Handling](08_error_handling_.md), understanding how the application anticipates and manages potential issues.

[Error Handling](08_error_handling_.md)