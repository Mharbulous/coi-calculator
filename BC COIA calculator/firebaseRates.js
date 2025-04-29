// Firebase Interest Rates Module
// This module fetches interest rates from Firebase and provides them in a format
// compatible with the application.

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

// Log module initialization
console.log("Firebase Rates module loaded");

// Helper function to parse date strings consistently to UTC Date objects
function parseUTCDate(dateString) {
    // Assumes YYYY-MM-DD format
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        // Create date in UTC
        const date = new Date(Date.UTC(year, month, day));
        // Basic validation
        if (!isNaN(date.getTime()) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
            return date;
        }
    }
    console.error(`Invalid date string format for UTC parsing: ${dateString}`);
    return null; // Or throw an error
}

// Helper function to set the time to the end of the day in UTC
function endOfDayUTC(date) {
    if (!date || isNaN(date.getTime())) return date;
    const newDate = new Date(date);
    newDate.setUTCHours(23, 59, 59, 999);
    return newDate;
}


// Function to fetch rates from Firebase
export async function fetchRatesFromFirebase() {
    try {
        console.log("Fetching interest rates from Firebase...");
        const ratesCollection = collection(db, "interestRates");
        
        // Get all jurisdiction documents
        const querySnapshot = await getDocs(ratesCollection);
        
        // Temporary storage for the fetched rates
        const fetchedRates = {};
        let fetchedLastUpdated = null;
        let fetchedValidUntil = null;
        
        // Process each jurisdiction document
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const jurisdictionCode = docSnapshot.id.split('-')[0]; // Extract BC from BC-COIA
            
            // Store the rates for this jurisdiction
            if (data.rates && Array.isArray(data.rates)) {
                fetchedRates[jurisdictionCode] = data.rates;
            }
            
            // Update lastUpdated and validUntil if available
            if (data.lastUpdated) {
                fetchedLastUpdated = parseUTCDate(data.lastUpdated);
            }
            
            if (data.validUntil) {
                fetchedValidUntil = parseUTCDate(data.validUntil);
            }
        });
        
        // If we got data from Firebase, process it
        if (Object.keys(fetchedRates).length > 0) {
            console.log("Successfully fetched rates from Firebase");
            
            // Process the fetched rates
            const processedFetchedRates = {};
            for (const jurisdiction in fetchedRates) {
                // Sort rates by start date to ensure proper order
                const sortedRates = [...fetchedRates[jurisdiction]]
                    .map(rate => ({
                        ...rate,
                        start: parseUTCDate(rate.start)
                    }))
                    .filter(rate => rate.start !== null) // Skip invalid entries
                    .sort((a, b) => a.start - b.start); // Ensure rates are sorted by start date
                
                // Calculate end dates dynamically
                processedFetchedRates[jurisdiction] = sortedRates.map((rate, index) => {
                    // If this is not the last rate period, the end date is the day before the next period starts
                    if (index < sortedRates.length - 1) {
                        const nextStartDate = new Date(sortedRates[index + 1].start);
                        // Set end date to the day before the next period starts
                        const endDate = new Date(nextStartDate);
                        endDate.setUTCDate(endDate.getUTCDate() - 1);
                        return {
                            ...rate,
                            end: endOfDayUTC(endDate) // Ensure end date includes the whole day
                        };
                    } 
                    // For the last rate period, use validUntil as the end date
                    else {
                        return {
                            ...rate,
                            end: endOfDayUTC(fetchedValidUntil) // Ensure end date includes the whole day
                        };
                    }
                });
            }
            
            // Return the processed rates with source information
            return {
                rates: processedFetchedRates,
                lastUpdated: fetchedLastUpdated,
                validUntil: fetchedValidUntil,
                source: 'firebase'
            };
        } else {
            // If no data was retrieved, throw an error
            throw new Error("No interest rate data retrieved from Firebase");
        }
    } catch (error) {
        console.error("Error fetching rates from Firebase:", error);
        // Throw the error to be handled by the caller
        throw error;
    }
}

// Export was already included in the function declaration (export async function fetchRatesFromFirebase)
// So no need to export it again
