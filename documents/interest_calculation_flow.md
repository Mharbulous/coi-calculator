# Interest Calculation Logic Flow

The following mermaid diagram illustrates the prejudgment and postjudgment interest calculation logic flow in the COI Calculator:

```mermaid
flowchart TD
    Start([Start Interest Calculation]) --> InputCollection[Collect Input Values]
    InputCollection --> ValidationCheck{Inputs Valid?}
    ValidationCheck -->|No| HandleInvalid[Handle Invalid Inputs]
    ValidationCheck -->|Yes| JurisdictionCheck{Rates Available for Jurisdiction?}
    JurisdictionCheck -->|No| HandleMissingRates[Handle Missing Rates]
    JurisdictionCheck -->|Yes| CollectSpecialDamages[Collect Special Damages]
    
    CollectSpecialDamages --> PrejudgmentCheck{Show Prejudgment?}
    PrejudgmentCheck -->|No| SkipPrejudgment[Skip Prejudgment Calculation]
    PrejudgmentCheck -->|Yes| CalculatePrejudgment[Show prejudgment interest]
    
    SkipPrejudgment --> CalculateJudgmentTotal[Calculate Judgment Total]
    CalculatePrejudgment --> CalculateJudgmentTotal
    
    CalculateJudgmentTotal --> PostjudgmentCheck{Show Postjudgment?}
    PostjudgmentCheck -->|No| SkipPostjudgment[Skip Postjudgment Calculation]
    PostjudgmentCheck -->|Yes| CalculatePostjudgment[Calculate Postjudgment Interest]
    
    SkipPostjudgment --> CalculateFinalTotals[Calculate Final Totals]
    CalculatePostjudgment --> CalculateFinalTotals
    
    CalculateFinalTotals --> UpdateUI[Update UI with Results]
    UpdateUI --> End([End Interest Calculation])
    
    %% Prejudgment Interest Calculation Subgraph
    subgraph "Prejudgment Interest Calculation"
        CalculatePrejudgment --> PrejudgmentValidation{Valid Period & Amount > 0?}
        PrejudgmentValidation -->|No| ReturnEmptyPrejudgment[Return Empty Result]
        PrejudgmentValidation -->|Yes| GetPrejudgmentRatePeriods[Get Applicable Rate Periods]
        
        GetPrejudgmentRatePeriods --> PrejudgmentSDCheck{Has Special Damages?}
        PrejudgmentSDCheck -->|No| CalculatePrejudgmentSimple[Calculate Interest Without Special Damages]
        PrejudgmentSDCheck -->|Yes| ProcessPrejudgmentDamages[Process Special Damages]
        
        ProcessPrejudgmentDamages --> CalculatePrejudgmentWithSD[Calculate Interest With Special Damages]
        CalculatePrejudgmentWithSD --> CalculateFinalPeriodDamages[Calculate Final Period Damage Interest]
        CalculatePrejudgmentSimple --> CompilePrejudgmentResults[Compile Prejudgment Results]
        CalculateFinalPeriodDamages --> CompilePrejudgmentResults
    end
    
    %% Postjudgment Interest Calculation Subgraph
    subgraph "Postjudgment Interest Calculation"
        CalculatePostjudgment --> PostjudgmentValidation{Valid Period & Amount > 0?}
        PostjudgmentValidation -->|No| ReturnEmptyPostjudgment[Return Empty Result]
        PostjudgmentValidation -->|Yes| GetPostjudgmentRatePeriods[Get Applicable Rate Periods]
        
        GetPostjudgmentRatePeriods --> PostjudgmentSDCheck{Has Special Damages?}
        PostjudgmentSDCheck -->|No| CalculatePostjudgmentSimple[Calculate Interest Without Special Damages]
        PostjudgmentSDCheck -->|Yes| ProcessPostjudgmentDamages[Process Special Damages]
        
        ProcessPostjudgmentDamages --> CalculatePostjudgmentWithSD[Calculate Interest With Special Damages]
        CalculatePostjudgmentWithSD --> CompilePostjudgmentResults[Compile Postjudgment Results]
        CalculatePostjudgmentSimple --> CompilePostjudgmentResults
    end
    
    %% Special Damages Processing Subgraph
    subgraph "Special Damages Processing"
        ProcessPrejudgmentDamages & ProcessPostjudgmentDamages --> ValidateDamages[Validate Damage Dates]
        ValidateDamages --> SortDamages[Sort Damages by Date]
        SortDamages --> GroupDamages[Group Damages by Segment]
        GroupDamages --> MarkFinalSegment[Mark Damages in Final Segment]
    end
    
    %% Segment Interest Calculation Subgraph
    subgraph "Segment Interest Calculation"
        CalculatePrejudgmentSimple & CalculatePostjudgmentSimple & CalculatePrejudgmentWithSD & CalculatePostjudgmentWithSD --> LoopSegments[Loop Through Rate Segments]
        LoopSegments --> GetSegmentPrincipal[Get Principal for Segment]
        GetSegmentPrincipal --> CalculateDays[Calculate Days in Segment]
        CalculateDays --> ApplyRate[Apply Interest Rate]
        ApplyRate --> AddToResults[Add to Results]
        AddToResults --> UpdatePrincipal[Update Principal for Next Segment]
        UpdatePrincipal --> MoreSegments{More Segments?}
        MoreSegments -->|Yes| LoopSegments
        MoreSegments -->|No| SegmentCalcComplete[Segment Calculation Complete]
    end
    
    %% Final Period Special Damages Calculation Subgraph
    subgraph "Final Period Special Damages Calculation"
        CalculateFinalPeriodDamages --> FilterFinalDamages[Filter Damages in Final Period]
        FilterFinalDamages --> LoopFinalDamages[Loop Through Each Damage]
        LoopFinalDamages --> CalculateDamageInterest[Calculate Interest for Individual Damage]
        CalculateDamageInterest --> AddToDamageResults[Add to Damage Results]
        AddToDamageResults --> MoreDamages{More Damages?}
        MoreDamages -->|Yes| LoopFinalDamages
        MoreDamages -->|No| FinalDamageCalcComplete[Final Damage Calculation Complete]
    end
    
    %% Key Differences Between Prejudgment and Postjudgment
    classDef prejudgmentClass fill:#d4f1f9,stroke:#05a8e6
    classDef postjudgmentClass fill:#ffe6cc,stroke:#ff9933
    classDef specialDamagesClass fill:#e6ffcc,stroke:#99cc00
    
    class CalculatePrejudgment,PrejudgmentValidation,GetPrejudgmentRatePeriods,PrejudgmentSDCheck,CalculatePrejudgmentSimple,ProcessPrejudgmentDamages,CalculatePrejudgmentWithSD,CalculateFinalPeriodDamages,CompilePrejudgmentResults prejudgmentClass
    class CalculatePostjudgment,PostjudgmentValidation,GetPostjudgmentRatePeriods,PostjudgmentSDCheck,CalculatePostjudgmentSimple,ProcessPostjudgmentDamages,CalculatePostjudgmentWithSD,CompilePostjudgmentResults postjudgmentClass
    class CollectSpecialDamages,ValidateDamages,SortDamages,GroupDamages,MarkFinalSegment,FilterFinalDamages,LoopFinalDamages,CalculateDamageInterest,AddToDamageResults,MoreDamages,FinalDamageCalcComplete specialDamagesClass
```

## Key Differences Between Prejudgment and Postjudgment Interest

1. **Date Ranges**:
   - **Prejudgment**: From prejudgment start date to the day before judgment date
   - **Postjudgment**: From the latest judgment date to the postjudgment end date

2. **Principal Amounts**:
   - **Prejudgment**: Based on pecuniary damages only (judgmentAwarded)
   - **Postjudgment**: Based on total judgment (including prejudgment interest, non-pecuniary damages, costs, and special damages)

3. **Special Damages Handling**:
   - **Prejudgment**: Special damages in the final period have interest calculated individually
   - **Postjudgment**: All special damages are incorporated into the principal

4. **Interest Rates**:
   - Different rates apply for prejudgment vs. postjudgment periods (typically postjudgment rates are 2% higher)

## Special Damages Handling

Special damages are handled differently depending on when they occur:

1. **Regular Periods**: Special damages are added to the principal for the next segment
2. **Final Period Before Judgment**: For special damages in the final period before judgment, interest is calculated separately for each damage

This distinction is crucial for accurate interest calculations and reflects the business rule that special damages in the final period are treated differently from those in earlier periods.
