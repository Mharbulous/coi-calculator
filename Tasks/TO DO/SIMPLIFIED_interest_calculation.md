# Simplified Interest Calculation Flow

The following diagram illustrates the proposed simplified approach to interest calculations:

```mermaid
flowchart TD
    Start([Start calculateInterestPeriods]) --> Validate[Validate inputs]
    Validate --> ValidCheck{Valid inputs?}
    ValidCheck -->|No| ReturnEmpty[Return empty result]
    ValidCheck -->|Yes| GetRatePeriods[Get applicable rate periods]
    
    GetRatePeriods --> ProcessDamages[Process special damages]
    ProcessDamages --> CalculateSegments[Calculate interest for each segment]
    
    CalculateSegments --> SpecialDamagesCheck{Has special damages?}
    SpecialDamagesCheck -->|No| CompileResults[Compile results]
    SpecialDamagesCheck -->|Yes| InterestTypeCheck{Interest type?}
    
    InterestTypeCheck -->|postjudgment| CompileResults
    InterestTypeCheck -->|prejudgment| CalculateDamageInterest[Calculate special damage interest]
    
    CalculateDamageInterest --> CompileResults
    CompileResults --> End([End])
    
    subgraph "Get Applicable Rate Periods"
        GetRatePeriods --> FindAllRates[Find all rate periods between start and end dates]
        FindAllRates --> SplitIntoSegments[Split date range into segments by rate period]
        SplitIntoSegments --> ReturnSegments[Return array of segments with rates]
    end
    
    subgraph "Process Special Damages"
        ProcessDamages --> ValidateDamages[Validate damage dates and amounts]
        ValidateDamages --> SortDamages[Sort damages by date]
        SortDamages --> GroupDamages[Group damages by applicable segment]
        GroupDamages --> ReturnProcessedDamages[Return processed damages]
    end
    
    subgraph "Calculate Interest for Each Segment"
        CalculateSegments --> InitResults[Initialize results]
        InitResults --> LoopSegments[Loop through rate segments]
        LoopSegments --> GetSegmentPrincipal[Get principal for segment]
        GetSegmentPrincipal --> CalcSegmentInterest[Calculate interest for segment]
        CalcSegmentInterest --> AddToResults[Add to results]
        AddToResults --> UpdatePrincipal[Update principal for next segment]
        UpdatePrincipal --> ContinueLoop{More segments?}
        ContinueLoop -->|Yes| LoopSegments
        ContinueLoop -->|No| ReturnSegmentResults[Return segment results]
    end
    
    subgraph "Calculate Special Damage Interest"
        CalculateDamageInterest --> FilterDamages[Filter damages in final period]
        FilterDamages --> LoopDamages[Loop through final period damages]
        LoopDamages --> CalcDamageInterest[Calculate interest for each damage]
        CalcDamageInterest --> AddToDamageResults[Add to damage results]
        AddToDamageResults --> MoreDamages{More damages?}
        MoreDamages -->|Yes| LoopDamages
        MoreDamages -->|No| ReturnDamageResults[Return damage results]
    end
    
    subgraph "Compile Results"
        CompileResults --> CalculateTotals[Calculate total interest]
        CalculateTotals --> CalculateFinalPrincipal[Calculate final principal]
        CalculateFinalPrincipal --> FormatResults[Format results object]
        FormatResults --> ReturnFinalResults[Return final results]
    end
