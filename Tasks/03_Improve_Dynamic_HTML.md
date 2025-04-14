# Task: Improve Dynamic HTML Generation using Templates

**Goal:** Enhance the maintainability and readability of the summary table generation by using HTML `<template>` elements instead of constructing HTML entirely within JavaScript.

**Context:**
Currently, the `updateSummaryTable` function in `domUtils.js` dynamically creates HTML elements (inputs, cells, rows) for the summary table using `document.createElement`. This mixes HTML structure with JavaScript logic, making it harder to visualize and modify the table structure.

**Target Files:**
*   `BC COIA calculator/index.html`
*   `BC COIA calculator/domUtils.js`

**Requirements:**

1.  **Define HTML Templates in `index.html`:**
    *   Identify the different types of rows needed in the summary table (e.g., editable pecuniary row, editable amount-only row, editable date-only row, display-only row).
    *   For each distinct row type, create a corresponding `<template>` element within `index.html` (likely placed near the `summary-table` itself, but outside of it).
    *   Each template should contain the basic HTML structure for one table row (`<tr>`), including the necessary cells (`<td>`) and any placeholder elements (like `<span>` or `<input>`) with appropriate `data-display` or `data-input` attributes for targeting. Assign a unique ID to each template (e.g., `<template id="summary-row-editable-pecuniary">`).

2.  **Refactor `domUtils.js` (`updateSummaryTable` function):**
    *   Modify the function to stop using `document.createElement` for the main row/cell structure.
    *   Inside the loop that iterates through the `items` array:
        *   Determine the appropriate template ID based on the `item` properties (e.g., `isEditable`, `isDateEditable`, `item` name).
        *   Get the corresponding `<template>` element by its ID.
        *   Clone the template's content: `const rowClone = templateElement.content.cloneNode(true);`
        *   Find the necessary placeholder elements within the `rowClone` using `querySelector` (e.g., `rowClone.querySelector('[data-input="pecuniaryJudgmentAmount"]')`).
        *   Populate these elements with the data from the current `item` (setting `value`, `textContent`, `innerHTML` as needed).
        *   Add event listeners (like `change` for dates, `setupCurrencyInputListeners` for amounts) to the input elements within the `rowClone`. Remember to update the `elements` object references (e.g., `elements.pecuniaryJudgmentAmountInput = amountInputInClone;`).
        *   Append the populated `rowClone` to the `elements.summaryTableBody`.
    *   Remove the old `document.createElement` logic for rows and cells.

**Acceptance Criteria:**
*   `index.html` contains `<template>` elements defining the structure for different summary table row types.
*   `updateSummaryTable` in `domUtils.js` uses these templates (`template.content.cloneNode(true)`) to create and populate rows.
*   The dynamic creation of HTML via `document.createElement` for the main row/cell structure in `updateSummaryTable` is removed.
*   The summary table renders and functions identically to before the refactoring (including editable fields and event listeners).
*   The HTML structure is now primarily defined in `index.html`, making it easier to modify visually.

**Notes:**
*   Ensure the `data-input` and `data-display` attributes within the templates match those expected by the JavaScript code for selecting and populating elements.
*   Pay attention to correctly attaching event listeners to the elements within the cloned template content.
