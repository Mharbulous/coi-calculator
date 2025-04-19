flowchart TD
    Start([Start calculateInterestPeriods]) --> Validate[Validate inputs]
    Validate --> ValidCheck{Valid inputs?}
    ValidCheck -->|No| ReturnEmpty[Return empty result]
    ValidCheck -->|Yes| InitVars[Initialize variables]
    
    InitVars --> ProcessDamages[Process and sort special damages]
    ProcessDamages --> StartLoop[Set currentCalcDate to startDate]
    
    StartLoop --> LoopCheck{currentCalcDate <= endDate?}
    LoopCheck -->|No| CalculateFinalPrincipal[Calculate final principal]
    LoopCheck -->|Yes| SetSegmentStart[Set segment calculation start date]
    
    SetSegmentStart --> SetPrincipal[Set principal for this segment]
    SetPrincipal --> FindRatePeriod[Find applicable rate period]
    
    FindRatePeriod --> RateCheck{Rate period found?}
    RateCheck -->|No| SkipDay[Skip day and continue]
    RateCheck -->|Yes| DetermineEndDate[Determine segment end date]
    
    SkipDay --> IncrementDate[Increment currentCalcDate]
    IncrementDate --> LoopCheck
    
    DetermineEndDate --> CalculateInterest[Calculate interest for segment]
    CalculateInterest --> UpdatePrincipal[Update principal for next segment]
    
    UpdatePrincipal --> FinalSegmentCheck{Is final segment?}
    FinalSegmentCheck -->|No| IncrementDate
    FinalSegmentCheck -->|Yes| ProcessFinalPeriodDamages[Process special damages in final period]
    
    ProcessFinalPeriodDamages --> IncrementDate
    
    CalculateFinalPrincipal --> InterestTypeCheck{Interest type?}
    InterestTypeCheck -->|prejudgment| ReturnPrejudgment[Return prejudgment result with finalPeriodDamageInterestDetails]
    InterestTypeCheck -->|postjudgment| ReturnPostjudgment[Return postjudgment result]
    
    ReturnPrejudgment --> End([End])
    ReturnPostjudgment --> End
    ReturnEmpty --> End

    subgraph "Calculate Interest for Segment"
        CalculateInterest --> DaysCheck{daysInSegment > 0 and rate defined and principal > 0?}
        DaysCheck -->|Yes| CalcInterestAmount[Calculate interest amount]
        DaysCheck -->|No| SkipCalc[Skip calculation]
        CalcInterestAmount --> AddToDetails[Add to details array]
        AddToDetails --> AddToTotal[Add to total interest]
        SkipCalc --> ExitCalc[Exit calculation]
        AddToTotal --> ExitCalc
    end

    subgraph "Update Principal for Next Segment"
        UpdatePrincipal --> InitNextPrincipal[Initialize updated principal]
        InitNextPrincipal --> LoopDamages[Loop through damages]
        LoopDamages --> DamageCheck{Damage date <= segment end date?}
        DamageCheck -->|Yes| AddDamageToPrincipal[Add damage amount to principal]
        DamageCheck -->|No| BreakLoop[Break loop]
        AddDamageToPrincipal --> UpdateDamageIndex[Update damage index]
        UpdateDamageIndex --> ContinueLoop[Continue loop]
        ContinueLoop --> LoopDamages
        BreakLoop --> SetFinalPrincipal[Set principal for next segment]
    end

    subgraph "Process Special Damages in Final Period"
        ProcessFinalPeriodDamages --> GetFinalRate[Get rate for final period]
        GetFinalRate --> RateValidCheck{Rate valid?}
        RateValidCheck -->|No| SkipFinalCalc[Skip final period calculation]
        RateValidCheck -->|Yes| LoopFinalDamages[Loop through all damages]
        LoopFinalDamages --> DamageInFinalPeriodCheck{Damage in final period?}
        DamageInFinalPeriodCheck -->|No| ContinueFinalLoop[Continue loop]
        DamageInFinalPeriodCheck -->|Yes| DaysInFinalPeriodCheck{Days > 0 and amount > 0?}
        DaysInFinalPeriodCheck -->|No| ContinueFinalLoop
        DaysInFinalPeriodCheck -->|Yes| CalcDamageInterest[Calculate interest for damage]
        CalcDamageInterest --> AddToDamageDetails[Add to finalPeriodDamageInterestDetails]
        AddToDamageDetails --> AddToDamageTotal[Add to total interest]
        AddToDamageTotal --> ContinueFinalLoop
        ContinueFinalLoop --> LoopFinalDamages
    end
