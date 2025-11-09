// Import getInterestRates function from Firebase integration instead of using local rates
import { getInterestRates } from './firebaseIntegration.js';

let interestRatesData = {};
let ratesLoaded = false;

async function loadRatesFromFirebase() {
    try {
        const result = await getInterestRates();
        interestRatesData = result.rates;
        ratesLoaded = true;
        if (typeof window !== 'undefined') {
            setTimeout(() => { recalculate(); }, 100);
        }
        return true;
    } catch (error) {
        console.error("Error loading Firebase rates in calculator core:", error);
        throw error;
    }
}

loadRatesFromFirebase().catch(error => {
    console.error("Failed to load interest rates from Firebase:", error);
    alert("Error: Could not load interest rates from Firebase. Please check your internet connection and try again.");
});

import { logger } from './util.logger.js';
import { processPayment } from './payment-processor.js';
// Import the base calculator and rename it to avoid conflict
import { calculateInterestPeriods as baseCalculateInterestPeriods, calculatePerDiem } from './calculations.js';
import {
    elements, getInputValues, updateInterestTable, updateSummaryTable, clearResults
} from './domUtils.js';
import { 
    formatDateForInput, formatDateForDisplay, parseDateInput,
    dateOnOrAfter, datesEqual, normalizeDate 
} from './utils.date.js';
import {
    parseCurrency, formatCurrencyForDisplay
} from './utils.currency.js';
import useStore from './store.js';
import { destroyAllSpecialDamagesDatePickers, destroyAllPaymentDatePickers } from './dom/datepickers.js';
// REMOVED: import { splitInterestPeriodsWithPayments } from './interestPeriodSplitter.js';

function collectPayments() {
    const currentState = useStore.getState();
    if (!currentState.inputs.showPrejudgment && currentState.savedPrejudgmentState && currentState.savedPrejudgmentState.payments) {
        return currentState.savedPrejudgmentState.payments;
    }
    return currentState.results.payments || [];
}

function collectSpecialDamages() {
    const currentState = useStore.getState();
    if (!currentState.inputs.showPrejudgment && currentState.savedPrejudgmentState && currentState.savedPrejudgmentState.specialDamages) {
        return currentState.savedPrejudgmentState.specialDamages;
    }
    return currentState.results.specialDamages || [];
}

function logValidationError(message) { /* Silently handled */ }

function handleInvalidInputs(inputs, validationMessage) {
    logValidationError(validationMessage || "Please check the input values.");
    clearResults();
    const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.nonPecuniaryAwarded || 0) + (inputs.costsAwarded || 0);
    const today = new Date();
    const defaultPostjudgmentEndDate = inputs.postjudgmentEndDate || today;
    
    useStore.getState().setResults({
        specialDamages: [], specialDamagesTotal: 0,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: baseTotal, totalOwing: baseTotal, perDiem: 0,
        finalCalculationDate: defaultPostjudgmentEndDate,
        validationError: true, 
        validationMessage: validationMessage || "One or more required dates are missing or invalid."
    });
    updateSummaryTable(useStore, recalculate);
}

function handleMissingRates(inputs, jurisdiction) {
    const message = `Interest rates are not available for the selected jurisdiction: ${jurisdiction}.`;
    logValidationError(message);
    clearResults();
    const baseTotal = (inputs.judgmentAwarded || 0) + (inputs.nonPecuniaryAwarded || 0) + (inputs.costsAwarded || 0);
    useStore.getState().setResults({
        specialDamages: [], specialDamagesTotal: 0,
        prejudgmentResult: { details: [], total: 0, principal: 0, finalPeriodDamageInterestDetails: [] },
        postjudgmentResult: { details: [], total: 0 },
        judgmentTotal: baseTotal, totalOwing: baseTotal, perDiem: 0,
        finalCalculationDate: inputs.postjudgmentEndDate,
        validationError: true,
        validationMessage: message
    });
    updateSummaryTable(useStore, recalculate);
}

// Helper to get unique sorted dates for timeline events
function getTimelineEventDates(periodStartDate, periodEndDate, specialDamages, payments, interestRatesDataForJurisdiction, interestType) {
    const dates = new Set();
    if (periodStartDate) dates.add(normalizeDate(periodStartDate).getTime());
    if (periodEndDate) dates.add(normalizeDate(periodEndDate).getTime());

    (specialDamages || []).forEach(sd => {
        const sdDate = typeof sd.date === 'string' ? parseDateInput(sd.date) : sd.date; // sd.date could be string or Date
        const sdDateNorm = normalizeDate(sdDate);
        if (sdDateNorm && sdDateNorm >= normalizeDate(periodStartDate) && sdDateNorm <= normalizeDate(periodEndDate)) {
            dates.add(sdDateNorm.getTime());
        }
    });
    (payments || []).forEach(p => {
        const pDateNorm = normalizeDate(p.date); // p.date is a Date object from allTrulyProcessedPayments
        if (pDateNorm && pDateNorm >= normalizeDate(periodStartDate) && pDateNorm <= normalizeDate(periodEndDate)) {
            dates.add(pDateNorm.getTime());
        }
    });
    
    (interestRatesDataForJurisdiction || []).forEach(rateChange => {
        const rateDateNorm = normalizeDate(parseDateInput(rateChange.start)); // rateChange.start is string "YYYY-MM-DD"
        if (rateDateNorm && rateDateNorm >= normalizeDate(periodStartDate) && rateDateNorm <= normalizeDate(periodEndDate)) {
            if ((interestType === 'prejudgment' && rateChange.prejudgment !== undefined) ||
                (interestType === 'postjudgment' && rateChange.postjudgment !== undefined)) {
                dates.add(rateDateNorm.getTime());
            }
        }
    });
    return Array.from(dates).map(time => new Date(time)).sort((a, b) => a - b);
}

// New function to manage timeline and calculate interest segments
function calculateInterestSegmentsForTimeline(inputs, initialPrincipal, periodStartDate, periodEndDate, interestType, interestRatesData, relevantPayments, relevantSpecialDamages) {
    const details = [];
    let netInterestTotal = 0;
    let currentRunningPrincipal = initialPrincipal;
    const state = useStore.getState(); // For full state context if needed by baseCalculateInterestPeriods

    const eventDates = getTimelineEventDates(
        periodStartDate, periodEndDate, 
        relevantSpecialDamages, relevantPayments, 
        interestRatesData[inputs.jurisdiction], 
        interestType
    );
    
    logger.debug(`[calculateInterestSegmentsForTimeline for ${interestType}] Event Dates:`, eventDates.map(d => formatDateForDisplay(d)));
    logger.debug(`[calculateInterestSegmentsForTimeline for ${interestType}] Initial Principal for timeline: ${currentRunningPrincipal}`);

    for (let i = 0; i < eventDates.length - 1; i++) {
        let segmentStartDate = eventDates[i];
        let segmentEndDate = eventDates[i + 1];

        if (datesEqual(normalizeDate(segmentStartDate), normalizeDate(segmentEndDate))) continue; 

        // Apply SDs and Payment Principal adjustments that occur *exactly on segmentStartDate*
        // This ensures the principal for the segment [segmentStartDate, segmentEndDate) is correct.
        relevantSpecialDamages.forEach(sd => {
            const sdDate = typeof sd.date === 'string' ? parseDateInput(sd.date) : sd.date;
            if (datesEqual(normalizeDate(sdDate), normalizeDate(segmentStartDate))) {
                currentRunningPrincipal += (parseFloat(sd.amount) || 0);
                logger.debug(`[Timeline ${interestType}] SD on ${formatDateForDisplay(segmentStartDate)}: +${sd.amount}. New Principal: ${currentRunningPrincipal}`);
            }
        });
        relevantPayments.forEach(p => {
            // Payments are applied at the END of the day they occur.
            // So, for a segment [StartDate, EndDate), a payment on StartDate affects this segment's principal.
            if (datesEqual(normalizeDate(p.date), normalizeDate(segmentStartDate))) {
                currentRunningPrincipal -= (p.principalApplied || 0);
                logger.debug(`[Timeline ${interestType}] Payment on ${formatDateForDisplay(segmentStartDate)}: -${p.principalApplied}. New Principal: ${currentRunningPrincipal}`);
            }
        });
        
        const principalForSegmentCalculation = Math.max(0, currentRunningPrincipal);

        // Filter SDs for those strictly within this segment (not on start date, as already applied)
        const sdsForThisBaseCalcSegment = relevantSpecialDamages.filter(sd => {
            const sdDateNorm = normalizeDate(parseDateInput(sd.date));
            const segmentStartDateNorm = normalizeDate(segmentStartDate);
            const segmentEndDateNorm = normalizeDate(segmentEndDate);
            return sdDateNorm > segmentStartDateNorm && sdDateNorm < segmentEndDateNorm;
        });
        const stateForCalcSegment = { inputs, results: { specialDamages: sdsForThisBaseCalcSegment } };
        
        const segmentInterestResult = baseCalculateInterestPeriods(
            stateForCalcSegment, 
            interestType, segmentStartDate, segmentEndDate,
            principalForSegmentCalculation, 
            interestRatesData
        );
        
        // The details from baseCalculateInterestPeriods are sub-segments due to rate changes within [segmentStartDate, segmentEndDate)
        // Each of these sub-segments should use principalForSegmentCalculation as their base,
        // unless a new SD (from sdsForThisBaseCalcSegment) further modified it within baseCalculateInterestPeriods.
        // The .principal on details from baseCalculateInterestPeriods should reflect this.
        segmentInterestResult.details.forEach(detail => {
            // If baseCalculateInterestPeriods correctly sets principal for its sub-segments considering sdsForThisBaseCalcSegment,
            // we should use detail.principal. If not, we use principalForSegmentCalculation.
            // For now, let's assume baseCalculateInterestPeriods's detail.principal is the one to use for its sub-segments.
            details.push({ ...detail }); // Use principal from baseCalculateInterestPeriods' detail
            netInterestTotal += detail.interest;
        });
        logger.debug(`[Timeline ${interestType}] Segment [${formatDateForDisplay(segmentStartDate)} to ${formatDateForDisplay(segmentEndDate)}]: InitialPrincipalForSegment=${principalForSegmentCalculation}, TotalInterestForBaseCalc=${segmentInterestResult.total.toFixed(2)}, FinalPrincipalFromBaseCalc=${segmentInterestResult.principal.toFixed(2)}`);
    }
    // The final currentRunningPrincipal is the principal at periodEndDate after all events.
    return { details, total: netInterestTotal, principal: currentRunningPrincipal };
}

function calculatePrejudgmentInterest(inputs, specialDamagesTotal, interestRatesData, allTrulyProcessedPayments) {
    console.log('[DEBUG calculator.core.js :: calculatePrejudgmentInterest] Entry. Received allTrulyProcessedPayments:', (allTrulyProcessedPayments || []).length);

    let prejudgmentResult = { details: [], total: 0, principal: inputs.judgmentAwarded, finalPeriodDamageInterestDetails: [] };
    const state = useStore.getState();

    if (inputs.showPrejudgment) {
        const prejudgmentEndDate = new Date(inputs.dateOfJudgment);
        if (dateOnOrAfter(prejudgmentEndDate, inputs.prejudgmentStartDate) && inputs.judgmentAwarded >= 0) {
            const relevantPrejudgmentPayments = (allTrulyProcessedPayments || [])
                .filter(p => p.date && normalizeDate(p.date) <= normalizeDate(prejudgmentEndDate) && normalizeDate(p.date) >= normalizeDate(inputs.prejudgmentStartDate));
            
            const result = calculateInterestSegmentsForTimeline(
                inputs, inputs.judgmentAwarded, inputs.prejudgmentStartDate, prejudgmentEndDate, 
                'prejudgment', interestRatesData, 
                relevantPrejudgmentPayments, 
                state.results.specialDamages || []
            );
            prejudgmentResult = { ...result, finalPeriodDamageInterestDetails: [] };
        }
    } else {
        const currentState = useStore.getState();
        if (currentState.savedPrejudgmentState && currentState.savedPrejudgmentState.prejudgmentResult) {
            prejudgmentResult = { 
                ...currentState.savedPrejudgmentState.prejudgmentResult,
                total: inputs.userEnteredPrejudgmentInterest || 0
            };
        } else {
            if (inputs.userEnteredPrejudgmentInterest !== undefined) {
                prejudgmentResult.total = inputs.userEnteredPrejudgmentInterest;
            }
            prejudgmentResult.principal = inputs.judgmentAwarded + specialDamagesTotal;
        }
    }
    console.log('[DEBUG calculator.core.js :: calculatePrejudgmentInterest] Returning details count:', prejudgmentResult.details.length);
    return prejudgmentResult;
}

function calculatePostjudgmentInterest(inputs, principalAtStartOfPostjudgment, interestRatesData, allTrulyProcessedPayments) {
    console.log('[DEBUG calculator.core.js :: calculatePostjudgmentInterest] Entry. Received allTrulyProcessedPayments:', (allTrulyProcessedPayments || []).length, 'PrincipalAtStart:', principalAtStartOfPostjudgment);
    
    let postjudgmentResult = { details: [], total: 0, principal: principalAtStartOfPostjudgment };
    const state = useStore.getState();
    const latestJudgmentDate = new Date(Math.max(inputs.dateOfJudgment, inputs.nonPecuniaryJudgmentDate, inputs.costsAwardedDate));
    let finalCalculationDate = latestJudgmentDate;

    if (inputs.showPostjudgment) {
        const postjudgmentStartDate = new Date(latestJudgmentDate);
        if (inputs.postjudgmentEndDate && dateOnOrAfter(inputs.postjudgmentEndDate, postjudgmentStartDate)) {
            finalCalculationDate = inputs.postjudgmentEndDate;
            if (principalAtStartOfPostjudgment >= 0) {
                const relevantPostjudgmentPayments = (allTrulyProcessedPayments || [])
                    .filter(p => p.date && normalizeDate(p.date) > normalizeDate(postjudgmentStartDate) && normalizeDate(p.date) <= normalizeDate(finalCalculationDate));

                 const result = calculateInterestSegmentsForTimeline(
                    inputs, principalAtStartOfPostjudgment, postjudgmentStartDate, finalCalculationDate,
                    'postjudgment', interestRatesData, 
                    relevantPostjudgmentPayments, 
                    state.results.specialDamages || []
                );
                postjudgmentResult = result;
            }
        } else {
            finalCalculationDate = latestJudgmentDate;
        }
    }
    console.log('[DEBUG calculator.core.js :: calculatePostjudgmentInterest] Returning details count:', postjudgmentResult.details.length);
    return { postjudgmentResult, finalCalculationDate };
}

function calculateJudgmentTotal(inputs, prejudgmentResult, specialDamagesTotal) {
    let prejudgmentInterestAmount = inputs.showPrejudgment ? prejudgmentResult.total : (inputs.userEnteredPrejudgmentInterest || 0);
    return inputs.judgmentAwarded + prejudgmentInterestAmount + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;
}

function calculateFinalTotals(judgmentTotal, postjudgmentResult, finalCalculationDate, interestRatesData) {
    const totalOwing = judgmentTotal + postjudgmentResult.total;
    const stateForCalc = {
        inputs: useStore.getState().inputs,
        results: { ...useStore.getState().results, totalOwing, finalCalculationDate }
    };
    const perDiem = calculatePerDiem(stateForCalc, interestRatesData);
    return { totalOwing, perDiem };
}

function recalculate() {
    let eventSource = 'unknown';
    try { if (window.event && typeof window.event.type === 'string') eventSource = window.event.type; } catch (e) {}
    
    const inputs = getInputValues();
    if (!inputs.isValid) {
        handleInvalidInputs(inputs, inputs.validationMessage); return;
    }
    if (!ratesLoaded || !interestRatesData[inputs.jurisdiction] || interestRatesData[inputs.jurisdiction].length === 0) {
        if (ratesLoaded) handleMissingRates(inputs, inputs.jurisdiction);
        return;
    }

    const stateForPaymentProcessing = useStore.getState();
    const rawPaymentsFromStore = [...(stateForPaymentProcessing.results.payments || [])]
        .map(p => ({ 
            ...p, 
            date: (typeof p.date === 'string' ? parseDateInput(p.date) : p.date) 
        }))
        .sort((a, b) => { 
            const dateA = a.date instanceof Date ? a.date : (a.date ? parseDateInput(a.date) : null);
            const dateB = b.date instanceof Date ? b.date : (b.date ? parseDateInput(b.date) : null);
            if (!dateA || !dateB) return 0;
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            return 0;
        });

    const allTrulyProcessedPayments = [];
    console.log('[DEBUG calculator.core.js :: recalculate] Initialized allTrulyProcessedPayments = []');
    const tempPriorProcessedForCalc = [];

    for (const rawPayment of rawPaymentsFromStore) {
        const processedPayment = processPayment(
            stateForPaymentProcessing, rawPayment, interestRatesData, [...tempPriorProcessedForCalc]
        ); 
        if (processedPayment) {
            allTrulyProcessedPayments.push(processedPayment);
            tempPriorProcessedForCalc.push(processedPayment);
        } else {
            logger.error(`Failed to process payment during recalculate: ${JSON.stringify(rawPayment)}`);
        }
    }
    console.log('[DEBUG calculator.core.js :: recalculate] Populated allTrulyProcessedPayments. Length:', allTrulyProcessedPayments.length, 'Content:', JSON.stringify(allTrulyProcessedPayments.slice(0,3)));

    const specialDamages = collectSpecialDamages();
    const specialDamagesTotal = specialDamages.reduce((total, damage) => total + (parseFloat(damage.amount) || 0), 0);
    stateForPaymentProcessing.setResult('specialDamagesTotal', specialDamagesTotal);

    console.log('[DEBUG calculator.core.js :: recalculate] Calling calculatePrejudgmentInterest with allTrulyProcessedPayments. Length:', allTrulyProcessedPayments.length);
    const prejudgmentResult = calculatePrejudgmentInterest(inputs, specialDamagesTotal, interestRatesData, allTrulyProcessedPayments);
    stateForPaymentProcessing.setPrejudgmentResult(prejudgmentResult);

    const totalPrincipalForFooter = inputs.judgmentAwarded + specialDamagesTotal;
    destroyAllSpecialDamagesDatePickers(); 
    destroyAllPaymentDatePickers();
    // Fetch the latest results from the store for rendering
    updateInterestTable(
        elements.prejudgmentTableBody, elements.prejudgmentPrincipalTotalEl, elements.prejudgmentInterestTotalEl,
        useStore.getState().results.prejudgmentResult, // Get latest from store
        totalPrincipalForFooter, 
        interestRatesData
    );

    const currentResultsAfterPreJ = useStore.getState().results; // Get fresh state
    const judgmentTotal = calculateJudgmentTotal(inputs, currentResultsAfterPreJ.prejudgmentResult, specialDamagesTotal);
    useStore.getState().setResult('judgmentTotal', judgmentTotal); // Update store

    const principalAtStartOfPostjudgment = currentResultsAfterPreJ.prejudgmentResult.principal; 
    console.log('[DEBUG calculator.core.js :: recalculate] Calling calculatePostjudgmentInterest with allTrulyProcessedPayments. Length:', allTrulyProcessedPayments.length, 'and principalAtStartOfPostjudgment:', principalAtStartOfPostjudgment);
    const { postjudgmentResult, finalCalculationDate } = calculatePostjudgmentInterest(inputs, principalAtStartOfPostjudgment, interestRatesData, allTrulyProcessedPayments);
    useStore.getState().setPostjudgmentResult(postjudgmentResult); // Update store
    useStore.getState().setResult('finalCalculationDate', finalCalculationDate); // Update store
    
    const displayPostjudgmentPrincipalBase = inputs.judgmentAwarded + inputs.nonPecuniaryAwarded + inputs.costsAwarded + specialDamagesTotal;
    // Fetch the latest results from the store for rendering
    updateInterestTable(
        elements.postjudgmentTableBody, null, elements.postjudgmentInterestTotalEl,
        useStore.getState().results.postjudgmentResult, // Get latest from store
        displayPostjudgmentPrincipalBase, 
        interestRatesData
    );

    const currentResultsAfterPostJ = useStore.getState().results; // Get fresh state
    const { totalOwing, perDiem } = calculateFinalTotals(
        currentResultsAfterPostJ.judgmentTotal, 
        currentResultsAfterPostJ.postjudgmentResult, 
        currentResultsAfterPostJ.finalCalculationDate, 
        interestRatesData
    );
    useStore.getState().setResults({ totalOwing, perDiem }); // Update store
    updateSummaryTable(useStore, recalculate);
}

export { recalculate };
