/**
 * DOM element selectors for the Court Order Interest Calculator.
 * Using data attributes for more robust selection.
 */

// DOM Element Selectors
const elements = {
    // Inputs
    jurisdictionSelect: document.querySelector('[data-input="jurisdictionSelect"]'),
    fileNoInput: document.querySelector('[data-input="fileNo"]'),
    registryInput: document.querySelector('[data-input="registry"]'),
    judgmentDateInput: document.querySelector('[data-input="judgmentDate"]'),
    showPrejudgmentCheckbox: document.querySelector('[data-input="showPrejudgmentCheckbox"]'),
    showPostjudgmentCheckbox: document.querySelector('[data-input="showPostjudgmentCheckbox"]'),
    showPerDiemCheckbox: document.querySelector('[data-input="showPerDiemCheckbox"]'),

    // Display Sections & Containers
    prejudgmentSection: document.querySelector('[data-display="prejudgmentSection"]'),
    postjudgmentSection: document.querySelector('[data-display="postjudgmentSection"]'),

    // Table Bodies
    prejudgmentTableBody: document.querySelector('[data-display="prejudgmentTableBody"]'),
    postjudgmentTableBody: document.querySelector('[data-display="postjudgmentTableBody"]'),
    summaryTableBody: document.querySelector('[data-display="summaryTableBody"]'),

    // Table Footers / Totals
    // prejudgmentTotalLabel has been removed from the HTML structure
    prejudgmentTotalLabel: null,
    prejudgmentPrincipalTotalEl: document.querySelector('[data-display="prejudgmentPrincipalTotal"]'),
    prejudgmentInterestTotalEl: document.querySelector('[data-display="prejudgmentInterestTotal"]'),
    postjudgmentInterestTotalEl: document.querySelector('[data-display="postjudgmentInterestTotal"]'),
    summaryTotalLabelEl: document.querySelector('[data-display="summaryTotalLabel"]'),
    summaryTotalEl: document.querySelector('[data-display="summaryTotal"]'),
    summaryPerDiemEl: document.querySelector('[data-display="summaryPerDiem"]'),

    // Containers (optional, if needed for broader manipulation)
    editableFieldsSection: document.querySelector('.editable-fields-section'),
    paperContainer: document.querySelector('.paper'),

    // Dynamically created inputs in summary table (will be selected after creation)
    pecuniaryJudgmentDateInput: null,
    pecuniaryJudgmentAmountInput: null,
    nonPecuniaryJudgmentDateInput: null,
    nonPecuniaryJudgmentAmountInput: null,
    costsAwardedDateInput: null,
    costsAwardedAmountInput: null,
    prejudgmentInterestDateInput: null,
    prejudgmentInterestAmountInput: null, // Added for editable prejudgment interest
    postjudgmentInterestDateInput: null,
};

export default elements;
