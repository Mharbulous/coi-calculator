# Simplified Interest Calculation Flow

The following diagram illustrates the proposed simplified approach to interest calculations:

```mermaid
flowchart TD
    Start([Start calculateInterestPeriods]) --> Validate[Validate inputs]
    Validate --> ValidCheck{Valid inputs?}
    ValidCheck -->|No| ReturnEmpty[Return empty result]
    ValidCheck -->|Yes| GetRatePeriods[Get applicable rate periods]
    
    GetRatePeriods --> SpecialDamagesCheck{Has special damages?}
    SpecialDamagesCheck -->|No| CalculateSegmentsNoSD[Calculate interest for each segment without special damages]
    SpecialDamagesCheck -->|Yes| ProcessDamages[Process special damages]
    
    ProcessDamages --> CalculateSegmentsWithSD[Calculate interest for each segment with special damages]
    CalculateSegmentsWithSD --> InterestTypeCheck{Interest type?}
    CalculateSegmentsNoSD --> CompileResults[Compile results]
    
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
    
    subgraph "Calculate Interest for Each Segment (With Special Damages)"
        CalculateSegmentsWithSD --> InitResultsWithSD[Initialize results]
        InitResultsWithSD --> LoopSegmentsWithSD[Loop through rate segments]
        LoopSegmentsWithSD --> GetSegmentPrincipalWithSD[Get principal for segment]
        GetSegmentPrincipalWithSD --> CalcSegmentInterestWithSD[Calculate interest for segment]
        CalcSegmentInterestWithSD --> AddToResultsWithSD[Add to results]
        AddToResultsWithSD --> UpdatePrincipalWithSD[Update principal for next segment with damages]
        UpdatePrincipalWithSD --> ContinueLoopWithSD{More segments?}
        ContinueLoopWithSD -->|Yes| LoopSegmentsWithSD
        ContinueLoopWithSD -->|No| ReturnSegmentResultsWithSD[Return segment results]
    end
    
    subgraph "Calculate Interest for Each Segment (Without Special Damages)"
        CalculateSegmentsNoSD --> InitResultsNoSD[Initialize results]
        InitResultsNoSD --> LoopSegmentsNoSD[Loop through rate segments]
        LoopSegmentsNoSD --> GetSegmentPrincipalNoSD[Get principal for segment]
        GetSegmentPrincipalNoSD --> CalcSegmentInterestNoSD[Calculate interest for segment]
        CalcSegmentInterestNoSD --> AddToResultsNoSD[Add to results]
        AddToResultsNoSD --> ContinueLoopNoSD{More segments?}
        ContinueLoopNoSD -->|Yes| LoopSegmentsNoSD
        ContinueLoopNoSD -->|No| ReturnSegmentResultsNoSD[Return segment results]
    end
    
    subgraph "Calculate Special Damage Interest (Final Period Only)"
        CalculateDamageInterest --> FilterDamages[Filter damages in final period]
        FilterDamages --> LoopDamages[Loop through each damage individually]
        LoopDamages --> CalcDamageInterest[Calculate interest for each damage separately]
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
