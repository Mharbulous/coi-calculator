// --- Interest Rate Data ---
const interestRates = { BC: [ { start: "1993-01-01", end: "1993-06-30", prejudgment: 5.25, postjudgment: 7.25 },{ start: "1993-07-01", end: "1993-12-31", prejudgment: 4.00, postjudgment: 6.00 },{ start: "1994-01-01", end: "1994-06-30", prejudgment: 3.50, postjudgment: 5.50 },{ start: "1994-07-01", end: "1995-06-30", prejudgment: 6.00, postjudgment: 8.00 },{ start: "1995-07-01", end: "1995-12-31", prejudgment: 6.75, postjudgment: 8.75 },{ start: "1996-01-01", end: "1996-06-30", prejudgment: 5.50, postjudgment: 7.50 },{ start: "1996-07-01", end: "1996-12-31", prejudgment: 4.50, postjudgment: 6.50 },{ start: "1997-01-01", end: "1997-12-31", prejudgment: 2.75, postjudgment: 4.75 },{ start: "1998-01-01", end: "1998-06-30", prejudgment: 4.00, postjudgment: 6.00 },{ start: "1998-07-01", end: "1998-12-31", prejudgment: 4.50, postjudgment: 6.50 },{ start: "1999-01-01", end: "1999-06-30", prejudgment: 4.75, postjudgment: 6.75 },{ start: "1999-07-01", end: "1999-12-31", prejudgment: 4.25, postjudgment: 6.25 },{ start: "2000-01-01", end: "2000-06-30", prejudgment: 4.50, postjudgment: 6.50 },{ start: "2000-07-01", end: "2000-12-31", prejudgment: 5.50, postjudgment: 7.50 },{ start: "2001-01-01", end: "2001-06-30", prejudgment: 5.50, postjudgment: 7.50 },{ start: "2001-07-01", end: "2001-12-31", prejudgment: 4.25, postjudgment: 6.25 },{ start: "2002-01-01", end: "2002-06-30", prejudgment: 2.00, postjudgment: 4.00 },{ start: "2002-07-01", end: "2002-12-31", prejudgment: 2.25, postjudgment: 4.25 },{ start: "2003-01-01", end: "2003-06-30", prejudgment: 2.50, postjudgment: 4.50 },{ start: "2003-07-01", end: "2003-12-31", prejudgment: 3.00, postjudgment: 5.00 },{ start: "2004-01-01", end: "2004-06-30", prejudgment: 2.50, postjudgment: 4.50 },{ start: "2004-07-01", end: "2004-12-31", prejudgment: 1.75, postjudgment: 3.75 },{ start: "2005-01-01", end: "2005-12-31", prejudgment: 2.25, postjudgment: 4.25 },{ start: "2006-01-01", end: "2006-06-30", prejudgment: 3.00, postjudgment: 5.00 },{ start: "2006-07-01", end: "2008-06-30", prejudgment: 4.00, postjudgment: 6.00 },{ start: "2008-07-01", end: "2008-12-31", prejudgment: 2.75, postjudgment: 4.75 },{ start: "2009-01-01", end: "2009-06-30", prejudgment: 1.50, postjudgment: 3.50 },{ start: "2009-07-01", end: "2010-06-30", prejudgment: 0.25, postjudgment: 2.25 },{ start: "2010-07-01", end: "2010-12-31", prejudgment: 0.50, postjudgment: 2.50 },{ start: "2011-01-01", end: "2015-06-30", prejudgment: 1.00, postjudgment: 3.00 },{ start: "2015-07-01", end: "2015-12-31", prejudgment: 0.85, postjudgment: 2.85 },{ start: "2016-01-01", end: "2017-12-31", prejudgment: 0.70, postjudgment: 2.70 },{ start: "2018-01-01", end: "2018-06-30", prejudgment: 1.20, postjudgment: 3.20 },{ start: "2018-07-01", end: "2018-12-31", prejudgment: 1.45, postjudgment: 3.45 },{ start: "2019-01-01", end: "2020-06-30", prejudgment: 1.95, postjudgment: 3.95 },{ start: "2020-07-01", end: "2022-06-30", prejudgment: 0.45, postjudgment: 2.45 },{ start: "2022-07-01", end: "2022-12-31", prejudgment: 1.70, postjudgment: 3.70 },{ start: "2023-01-01", end: "2023-06-30", prejudgment: 4.45, postjudgment: 6.45 },{ start: "2023-07-01", end: "2023-12-31", prejudgment: 4.95, postjudgment: 6.95 },{ start: "2024-01-01", end: "2024-06-30", prejudgment: 5.20, postjudgment: 7.20 },{ start: "2024-07-01", end: "2024-12-31", prejudgment: 4.95, postjudgment: 6.95 },{ start: "2025-01-01", end: "2025-06-30", prejudgment: 3.45, postjudgment: 5.45 }, ] }.BC.map(rate => ({ start: new Date(rate.start + 'T00:00:00Z'), end: new Date(rate.end + 'T23:59:59Z'), prejudgment: rate.prejudgment, postjudgment: rate.postjudgment }));
let currentJurisdiction = 'BC';

// --- DOM Element References ---
const causeOfActionDateInput = document.getElementById('causeOfActionDate');
const dateOfJudgmentInput = document.getElementById('dateOfJudgment');
const dateOfCalculationInput = document.getElementById('dateOfCalculation');
const judgmentAwardedInput = document.getElementById('judgmentAwarded');
const costsAwardedInput = document.getElementById('costsAwarded');
const showPostjudgmentCheckbox = document.getElementById('showPostjudgmentCheckbox');
const accrualDateRow = document.getElementById('accrualDateRow');
const postjudgmentSection = document.getElementById('postjudgmentSection');
const prejudgmentTableBody = document.querySelector('#prejudgmentTable tbody');
const prejudgmentSubtotalEl = document.getElementById('prejudgmentSubtotal');
const postjudgmentTableBody = document.querySelector('#postjudgmentTable tbody');
const postjudgmentSubtotalEl = document.getElementById('postjudgmentSubtotal');
const summaryTotalLabelEl = document.getElementById('summaryTotalLabel');
const summaryTotalEl = document.getElementById('summaryTotal');
const jurisdictionSelect = document.getElementById('jurisdictionSelect');

// --- Helper Functions ---
function parseDate(dateString) { if (!dateString) return null; const parts = dateString.split('-'); if (parts.length === 3) { const year = parseInt(parts[0], 10); const month = parseInt(parts[1], 10) - 1; const day = parseInt(parts[2], 10); const date = new Date(Date.UTC(year, month, day)); if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) { return date; } } console.warn("Invalid date string format:", dateString); return null; }
function formatDate(date) { if (!date || isNaN(date.getTime())) return ''; const day = date.getUTCDate().toString().padStart(2, '0'); const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); const year = date.getUTCFullYear(); return `${day}/${month}/${year}`; }
function formatDateLong(date) { if (!date || isNaN(date.getTime())) return ''; const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }; return date.toLocaleDateString('en-CA', options); }
function daysBetween(date1, date2) { if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime()) || date2 < date1) return 0; const startOfDay1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate()); const startOfDay2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate()); const differenceInMilliseconds = startOfDay2 - startOfDay1; return Math.round(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1; }
function isLeap(year) { return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0); }
function daysInYear(year) { return isLeap(year) ? 366 : 365; }
function parseCurrency(value) { if (typeof value !== 'string') { value = String(value); } const number = parseFloat(value.replace(/[$,]/g, '')); return isNaN(number) ? 0 : number; }
function formatCurrencyInput(value) { if (isNaN(value) || value === null) return "$0.00"; return '$' + value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatCurrencyForDisplay(value) { if (isNaN(value) || value === null) return '<span class="currency">0.00</span>'; const absValue = Math.abs(value); const className = value < 0 ? "currency negative" : "currency"; const formattedNumber = absValue.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return `<span class="${className}">${formattedNumber}</span>`; }
function getInterestRate(date, type) { if (!(date instanceof Date) || isNaN(date.getTime())) { console.warn("Invalid date passed to getInterestRate:", date); return 0; } const targetTime = date.getTime(); const ratePeriod = interestRates.find(rate => targetTime >= rate.start.getTime() && targetTime <= rate.end.getTime()); return ratePeriod ? ratePeriod[type] : 0; }

// --- Calculation Logic ---
function calculateInterest(principal, startDate, endDate, interestType) { if (!principal || principal <= 0 || !startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) { return { details: [], total: 0 }; } let currentCalcDate = new Date(startDate); let totalInterest = 0; const details = []; while (currentCalcDate <= endDate) { const currentCalcTime = currentCalcDate.getTime(); const ratePeriod = interestRates.find(rate => currentCalcTime >= rate.start.getTime() && currentCalcTime <= rate.end.getTime()); if (!ratePeriod) { console.warn("No rate found for date:", formatDate(currentCalcDate)); currentCalcDate.setUTCDate(currentCalcDate.getUTCDate() + 1); continue; } const segmentEndDate = ratePeriod.end < endDate ? new Date(ratePeriod.end) : new Date(endDate); const daysInSegment = daysBetween(currentCalcDate, segmentEndDate); const rate = ratePeriod[interestType]; const year = currentCalcDate.getUTCFullYear(); const days_in_year = daysInYear(year); if (daysInSegment > 0 && rate !== undefined && days_in_year > 0) { const interestForSegment = (principal * (rate / 100) * daysInSegment) / days_in_year; details.push({ start: formatDate(currentCalcDate), end: formatDate(segmentEndDate), rate: rate, days: daysInSegment, interest: interestForSegment }); totalInterest += interestForSegment; } else if (rate === undefined) { console.warn(`Interest type '${interestType}' not found for period starting ${formatDate(ratePeriod.start)}`); } currentCalcDate = new Date(segmentEndDate); currentCalcDate.setUTCDate(currentCalcDate.getUTCDate() + 1); } return { details, total: totalInterest }; }

// --- UI Update Functions ---
function updateInterestTable(tableBody, subtotalElement, details, totalInterest) { if (!tableBody || !subtotalElement) { console.error("Missing table elements for update"); return; } tableBody.innerHTML = ''; details.forEach(item => { const row = tableBody.insertRow(); row.insertCell().textContent = item.start; row.insertCell().textContent = item.end; row.insertCell().textContent = item.rate.toFixed(2) + '%'; row.insertCell().textContent = item.days; row.insertCell().innerHTML = formatCurrencyForDisplay(item.interest); row.cells[2].style.textAlign = 'center'; row.cells[3].style.textAlign = 'center'; row.cells[4].style.textAlign = 'right'; }); subtotalElement.innerHTML = formatCurrencyForDisplay(totalInterest); }

function togglePostjudgmentVisibility(isInitializing = false) {
    // Check elements exist before accessing properties
    if (!showPostjudgmentCheckbox || !accrualDateRow || !postjudgmentSection) {
        console.error("Required elements for toggling visibility not found.");
        return;
    }
    const isChecked = showPostjudgmentCheckbox.checked;

    if (isChecked) {
        accrualDateRow.style.display = '';
        postjudgmentSection.style.display = '';
    } else {
        accrualDateRow.style.display = 'none';
        postjudgmentSection.style.display = 'none';

        if (dateOfJudgmentInput && dateOfCalculationInput) {
             dateOfCalculationInput.value = dateOfJudgmentInput.value;
        }
    }

    if (!isInitializing) {
         recalculate();
    }
 }

// --- Recalculate Function ---
 function recalculate() {
    // Check elements exist before accessing properties/values
    if (!showPostjudgmentCheckbox || !causeOfActionDateInput || !dateOfJudgmentInput || !dateOfCalculationInput || !judgmentAwardedInput || !costsAwardedInput || !prejudgmentTableBody || !prejudgmentSubtotalEl || !postjudgmentTableBody || !postjudgmentSubtotalEl || !summaryTotalLabelEl || !summaryTotalEl) {
         console.error("One or more required elements for recalculation not found.");
         return; // Exit if essential elements are missing
     }

     const showPostjudgment = showPostjudgmentCheckbox.checked;
     const causeOfActionDateStr = causeOfActionDateInput.value;
     const dateOfJudgmentStr = dateOfJudgmentInput.value;
     const dateOfCalculationStr = dateOfCalculationInput.value;
     const judgmentAwardedStr = judgmentAwardedInput.value;
     const costsAwardedStr = costsAwardedInput.value;

     const causeOfActionDate = parseDate(causeOfActionDateStr);
     const dateOfJudgment = parseDate(dateOfJudgmentStr);
     const dateOfCalculation = parseDate(dateOfCalculationStr);
     const judgmentAwarded = parseCurrency(judgmentAwardedStr);
     const costsAwarded = parseCurrency(costsAwardedStr);

     // --- Input Validation ---
     let isValid = true;
     if (!causeOfActionDate || !dateOfJudgment || !dateOfCalculation) {
         console.warn("One or more dates are invalid.");
         isValid = false;
     } else {
         if (dateOfJudgment < causeOfActionDate) {
             alert("Date of Judgment cannot be before Cause of Action Date.");
             isValid = false;
         }
         if (dateOfCalculation < dateOfJudgment) {
            // This check should use the actual value which might be the judgment date if hidden
             console.warn("Date of Calculation is before Date of Judgment. This might occur if dates were manually set incorrectly while hidden.");
             // Optionally, reset dateOfCalculationInput.value = dateOfJudgmentInput.value;
             isValid = false; // Treat as invalid state for calculation
         }
     }
     if (!interestRates || interestRates.length === 0) {
         console.error(`Interest rates are not available.`);
         alert(`Interest rates are not loaded or available.`);
         isValid = false;
     }

     // --- Clear Results and Set Base Total if Invalid ---
     if (!isValid) {
         updateInterestTable(prejudgmentTableBody, prejudgmentSubtotalEl, [], 0);
         updateInterestTable(postjudgmentTableBody, postjudgmentSubtotalEl, [], 0);
         summaryTotalLabelEl.textContent = 'TOTAL OWING';
         summaryTotalEl.innerHTML = formatCurrencyForDisplay(judgmentAwarded + costsAwarded); // Show base total
         return;
     }

     // --- Calculate Prejudgment Interest ---
     const prejudgmentEndDate = new Date(dateOfJudgment);
     prejudgmentEndDate.setUTCDate(prejudgmentEndDate.getUTCDate() - 1);
     let prejudgmentResult = { details: [], total: 0 };
     if (prejudgmentEndDate >= causeOfActionDate) {
         prejudgmentResult = calculateInterest(judgmentAwarded, causeOfActionDate, prejudgmentEndDate, 'prejudgment');
     }
     updateInterestTable(prejudgmentTableBody, prejudgmentSubtotalEl, prejudgmentResult.details, prejudgmentResult.total);

     // --- Calculate Postjudgment Interest (Conditional) ---
     let postjudgmentResult = { details: [], total: 0 };
     if (showPostjudgment) {
         const postjudgmentStartDate = new Date(dateOfJudgment);
         // Ensure dateOfCalculation is valid and >= postjudgmentStartDate
         if (dateOfCalculation && dateOfCalculation >= postjudgmentStartDate) {
             const postjudgmentPrincipal = judgmentAwarded + prejudgmentResult.total + costsAwarded;
             postjudgmentResult = calculateInterest(postjudgmentPrincipal, postjudgmentStartDate, dateOfCalculation, 'postjudgment');
         }
     }
     updateInterestTable(postjudgmentTableBody, postjudgmentSubtotalEl, postjudgmentResult.details, postjudgmentResult.total);

     // --- Update Summary ---
     const prejudgmentTotal = prejudgmentResult.total;
     const postjudgmentTotal = postjudgmentResult.total;
     const totalOwing = judgmentAwarded + prejudgmentTotal + costsAwarded + postjudgmentTotal;

     summaryTotalEl.innerHTML = formatCurrencyForDisplay(totalOwing);
     // Use the effective date for the label (judgment date if postjudgment is hidden/off)
     const finalCalculationDate = showPostjudgment ? dateOfCalculation : dateOfJudgment;
     const formattedAccrualDate = formatDateLong(finalCalculationDate);
     summaryTotalLabelEl.textContent = `TOTAL OWING as of ${formattedAccrualDate}`;
 }

// --- Event Listeners ---
function setupListeners() {
    // Add checks to ensure elements exist before adding listeners
    [causeOfActionDateInput, dateOfJudgmentInput, dateOfCalculationInput].forEach(input => {
        if (input) { input.addEventListener('change', recalculate); }
        else { console.warn("Date input element not found during listener setup."); }
    });
    [judgmentAwardedInput, costsAwardedInput].forEach(input => {
        if (input) {
            input.addEventListener('blur', (event) => { let value = parseCurrency(event.target.value); event.target.value = formatCurrencyInput(value); recalculate(); });
            input.addEventListener('focus', (event) => { event.target.select(); });
            input.addEventListener('keyup', (event) => { if (event.key === 'Enter') { let value = parseCurrency(event.target.value); event.target.value = formatCurrencyInput(value); recalculate(); event.target.blur(); } });
        } else { console.warn("Currency input element not found during listener setup."); }
    });
    if (jurisdictionSelect) { jurisdictionSelect.addEventListener('change', (event) => { currentJurisdiction = event.target.value; console.log(`Jurisdiction changed to ${currentJurisdiction}. Recalculating...`); recalculate(); }); }
    else { console.warn("Jurisdiction select element not found during listener setup."); }

    if (showPostjudgmentCheckbox) { showPostjudgmentCheckbox.addEventListener('change', () => { togglePostjudgmentVisibility(false); }); }
    else { console.warn("Show postjudgment checkbox element not found during listener setup."); }
}

// --- Initial Setup on Load ---
 document.addEventListener('DOMContentLoaded', () => {
    // Set default Accrual Date to today if empty
    if (dateOfCalculationInput && !dateOfCalculationInput.value) {
        const today = new Date(); // Local time for today's date string
        const todayStr = today.getFullYear() + '-' + (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
       dateOfCalculationInput.value = todayStr;
    }

    // Format initial currency fields
    [judgmentAwardedInput, costsAwardedInput].forEach(input => {
         if (input) { // Check if element exists before accessing value
             const value = parseCurrency(input.value);
             input.value = formatCurrencyInput(value);
         }
     });

    // Setup all event listeners
    setupListeners();

    // Initialize Visibility based on initial checkbox state
    if (showPostjudgmentCheckbox) {
        togglePostjudgmentVisibility(true); // Pass true for initialization phase
    }

    // Perform initial calculation AFTER setting up everything
    recalculate();
 });