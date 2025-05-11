Zustand Store Structure:
├── inputs
│   ├── prejudgmentStartDate (Date | null)
│   ├── postjudgmentEndDate (Date | null)
│   ├── dateOfJudgment (Date | null)
│   ├── nonPecuniaryJudgmentDate (Date | null)
│   ├── costsAwardedDate (Date | null)
│   ├── judgmentAwarded (Number)
│   ├── nonPecuniaryAwarded (Number)
│   ├── costsAwarded (Number)
│   ├── jurisdiction (String, e.g., 'BC')
│   ├── showPrejudgment (Boolean)
│   ├── showPostjudgment (Boolean)
│   ├── showPerDiem (Boolean)
│   ├── userEnteredPrejudgmentInterest (Number)
│   ├── isValid (Boolean)
│   └── validationMessage (String)
│
├── savedPrejudgmentState
│   ├── prejudgmentStartDate (Date | null) - Copied from inputs
│   ├── specialDamages (Array of Objects)
│   │   └── {
│   │       date (String, e.g., 'YYYY-MM-DD'),
│   │       description (String),
│   │       amount (Number),
│   │       specialDamageId (String, unique)
│   │   }
│   ├── prejudgmentResult (Object)
│   │   ├── details (Array of Objects) - Structure for table rows
│   │   │   └── {
│   │   │       start (String, formatted date),
│   │   │       description (String, e.g., 'X days'),
│   │   │       rate (Number),
│   │   │       principal (Number),
│   │   │       interest (Number),
│   │   │       isFinalPeriodDamage (Boolean),
│   │   │       _endDate (String, formatted date),
│   │   │       _days (Number)
│   │   │       // For final period damages:
│   │   │       damageDate (Date Object),
│   │   │       endDate (String, formatted date), // for display
│   │   │       isFirstDayOfSegment (Boolean)
│   │   │   }
│   │   ├── total (Number) - Total prejudgment interest
│   │   ├── principal (Number) - Principal amount used for prejudgment calculation
│   │   └── finalPeriodDamageInterestDetails (Array of Objects) - Same structure as prejudgmentResult.details, specifically for damages in the final period
│   └── payments (Array of Objects)
│       └── {
│           date (String, e.g., 'YYYY-MM-DD' or Date Object),
│           amount (Number),
│           paymentId (String, unique),
│           interestApplied (Number, optional),
│           principalApplied (Number, optional)
│           // other properties from payment processing might be here
│       }
│
└── results
    ├── specialDamages (Array of Objects)
    │   └── {
    │       date (String, e.g., 'YYYY-MM-DD'),
    │       description (String),
    │       amount (Number),
    │       specialDamageId (String, unique)
    │   }
    ├── specialDamagesTotal (Number)
    │
    ├── prejudgmentResult (Object)
    │   ├── details (Array of Objects) - Structure for table rows (see savedPrejudgmentState.prejudgmentResult.details)
    │   ├── total (Number) - Total prejudgment interest
    │   ├── principal (Number) - Principal amount used for prejudgment calculation
    │   └── finalPeriodDamageInterestDetails (Array of Objects) - (see savedPrejudgmentState.prejudgmentResult.finalPeriodDamageInterestDetails)
    │
    ├── postjudgmentResult (Object)
    │   ├── details (Array of Objects) - Structure for table rows (similar to prejudgmentResult.details but without finalPeriodDamage specific fields)
    │   │   └── {
    │   │       start (String, formatted date),
    │   │       description (String, e.g., 'X days'),
    │   │       rate (Number),
    │   │       principal (Number),
    │   │       interest (Number),
    │   │       _endDate (String, formatted date),
    │   │       _days (Number)
    │   │   }
    │   └── total (Number) - Total postjudgment interest
    │
    ├── judgmentTotal (Number)
    ├── totalOwing (Number)
    ├── perDiem (Number)
    ├── finalCalculationDate (Date | null)
    │
    └── payments (Array of Objects)
        └── {
            date (String, e.g., 'YYYY-MM-DD' or Date Object),
            amount (Number),
            paymentId (String, unique),
            interestApplied (Number, optional), // Amount of payment applied to interest
            principalApplied (Number, optional), // Amount of payment applied to principal
            remainingPrincipal (Number, optional), // Principal after this payment
            dateStr (String, formatted date, optional),
            segmentIndex (Number, optional) // Index of the interest segment this payment falls into
        }

Actions (functions to modify state):
  - setInputs
  - setInput
  - setResults
  - setResult
  - setPrejudgmentResult
  - setPostjudgmentResult
  - setSpecialDamages
  - addSpecialDamage
  - updateSpecialDamage
  - removeSpecialDamage
  - addPayment
  - updatePayment
  - removePayment
  - calculatePaymentTotal (Note: this is a selector/getter, not a setter, but part of the store definition)
  - savePrejudgmentState
  - restorePrejudgmentState
  - resetStore
  - initializeStore
