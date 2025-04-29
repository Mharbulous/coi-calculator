// Data Migration Script for Interest Rates
// This script uploads all historical interest rate data to Firebase Firestore

import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig.js";

// Define the last updated and valid until dates
const lastUpdated = new Date(Date.UTC(2025, 3, 19)); // 2025-04-19
const validUntil = new Date(Date.UTC(2025, 5, 30));  // 2025-06-30

// The raw rates are defined directly in this file for migration purposes
const rates = {
    BC: [
        { start: "1993-01-01", prejudgment: 5.25, postjudgment: 7.25 },
        { start: "1993-07-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "1994-01-01", prejudgment: 3.50, postjudgment: 5.50 },
        { start: "1994-07-01", prejudgment: 6.00, postjudgment: 8.00 },
        { start: "1995-01-01", prejudgment: 6.00, postjudgment: 8.00 },
        { start: "1995-07-01", prejudgment: 6.75, postjudgment: 8.75 },
        { start: "1996-01-01", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "1996-07-01", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "1997-01-01", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "1997-07-01", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "1998-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "1998-07-01", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "1999-01-01", prejudgment: 4.75, postjudgment: 6.75 },
        { start: "1999-07-01", prejudgment: 4.25, postjudgment: 6.25 },
        { start: "2000-01-01", prejudgment: 4.50, postjudgment: 6.50 },
        { start: "2000-07-01", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "2001-01-01", prejudgment: 5.50, postjudgment: 7.50 },
        { start: "2001-07-01", prejudgment: 4.25, postjudgment: 6.25 },
        { start: "2002-01-01", prejudgment: 2.00, postjudgment: 4.00 },
        { start: "2002-07-01", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2003-01-01", prejudgment: 2.50, postjudgment: 4.50 },
        { start: "2003-07-01", prejudgment: 3.00, postjudgment: 5.00 },
        { start: "2004-01-01", prejudgment: 2.50, postjudgment: 4.50 },
        { start: "2004-07-01", prejudgment: 1.75, postjudgment: 3.75 },
        { start: "2005-01-01", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2005-07-01", prejudgment: 2.25, postjudgment: 4.25 },
        { start: "2006-01-01", prejudgment: 3.00, postjudgment: 5.00 },
        { start: "2006-07-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2007-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2007-07-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2008-01-01", prejudgment: 4.00, postjudgment: 6.00 },
        { start: "2008-07-01", prejudgment: 2.75, postjudgment: 4.75 },
        { start: "2009-01-01", prejudgment: 1.50, postjudgment: 3.50 },
        { start: "2009-07-01", prejudgment: 0.25, postjudgment: 2.25 },
        { start: "2010-01-01", prejudgment: 0.25, postjudgment: 2.25 },
        { start: "2010-07-01", prejudgment: 0.50, postjudgment: 2.50 },
        { start: "2011-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2011-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2012-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2012-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2013-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2013-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2014-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2014-07-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2015-01-01", prejudgment: 1.00, postjudgment: 3.00 },
        { start: "2015-07-01", prejudgment: 0.85, postjudgment: 2.85 },
        { start: "2016-01-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2016-07-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2017-01-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2017-07-01", prejudgment: 0.70, postjudgment: 2.70 },
        { start: "2018-01-01", prejudgment: 1.20, postjudgment: 3.20 },
        { start: "2018-07-01", prejudgment: 1.45, postjudgment: 3.45 },
        { start: "2019-01-01", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2019-07-01", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2020-01-01", prejudgment: 1.95, postjudgment: 3.95 },
        { start: "2020-07-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2021-01-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2021-07-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2022-01-01", prejudgment: 0.45, postjudgment: 2.45 },
        { start: "2022-07-01", prejudgment: 1.70, postjudgment: 3.70 },
        { start: "2023-01-01", prejudgment: 4.45, postjudgment: 6.45 },
        { start: "2023-07-01", prejudgment: 4.95, postjudgment: 6.95 },
        { start: "2024-01-01", prejudgment: 5.20, postjudgment: 7.20 },
        { start: "2024-07-01", prejudgment: 4.95, postjudgment: 6.95 },
        { start: "2025-01-01", prejudgment: 3.45, postjudgment: 5.45 },
    ],
    // Empty placeholders for other jurisdictions
    AB: [],
    ON: []
};

// Function to migrate rates to Firebase
async function migrateRatesToFirebase() {
  try {
    // Reference to the interestRates collection
    const ratesCollection = collection(db, "interestRates");
    
    // For each jurisdiction (BC, AB, ON)
    for (const jurisdiction in rates) {
      // Create a document for this jurisdiction
      const jurisdictionDoc = doc(ratesCollection, `${jurisdiction}-COIA`);
      
      // Prepare the data to upload
      const data = {
        rates: rates[jurisdiction].map(rate => ({
          start: rate.start, // Keep as string for simplicity
          prejudgment: rate.prejudgment,
          postjudgment: rate.postjudgment
        })),
        lastUpdated: lastUpdated.toISOString().split('T')[0], // Format as YYYY-MM-DD
        validUntil: validUntil.toISOString().split('T')[0]    // Format as YYYY-MM-DD
      };
      
      // Upload to Firestore
      await setDoc(jurisdictionDoc, data);
    }
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

// Run the migration
migrateRatesToFirebase();
