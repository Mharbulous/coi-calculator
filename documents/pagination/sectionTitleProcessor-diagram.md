# Section Title Processor (sectionTitleProcessor.js)

This diagram illustrates the decision flow in the `processSectionTitle()` function from the `sectionTitleProcessor.js` file.

```mermaid
flowchart TD
    A["Start: processSectionTitle()"] --> B{"Title Element Exists?"}
    B -->|No| C["Return null"]
    B -->|Yes| D["Get Title Dimensions"]
    
    D --> E["Initialize Variables:\n- breakInserted = false\n- heightAdded = 0\n- newPageIndex = currentPageIndex"]
    
    E --> F["Loop Through Pages"]
    F --> G{"Title Too Close to\nBottom of Page?"}
    G -->|Yes| H{"Next Page Exists?"}
    H -->|Yes| I["Calculate Blank Space Height"]
    I --> J["Insert Blank Space"]
    J --> K["Add Debug Styling"]
    K --> L["Update heightAdded"]
    L --> M["Update newPageIndex"]
    M --> N["Set breakInserted = true"]
    N --> O["Break Loop"]
    H -->|No| P["Continue Loop"]
    G -->|No| Q{"Title + Header\nWould Overflow?"}
    
    Q -->|Yes| R{"Next Page Exists?"}
    R -->|Yes| S["Calculate Blank Space Height"]
    S --> T["Insert Blank Space"]
    T --> U["Add Debug Styling"]
    U --> V["Update heightAdded"]
    V --> W["Update newPageIndex"]
    W --> X["Set breakInserted = true"]
    X --> Y["Break Loop"]
    R -->|No| Z["Continue Loop"]
    Q -->|No| Z
    
    O --> AA{"More Pages?"}
    P --> AA
    Y --> AA
    Z --> AA
    
    AA -->|Yes| F
    AA -->|No| AB{"Break Inserted?"}
    
    AB -->|No| AC["Try Original Logic"]
    AC --> AD["Loop Through Pages"]
    AD --> AE{"Title Near Bottom\n(Original Threshold)?"}
    AE -->|Yes| AF{"Next Page Exists?"}
    AF -->|Yes| AG["Calculate Blank Space Height"]
    AG --> AH["Insert Blank Space"]
    AH --> AI["Add Debug Styling"]
    AI --> AJ["Update heightAdded"]
    AJ --> AK["Update newPageIndex"]
    AK --> AL["Set breakInserted = true"]
    AL --> AM["Break Loop"]
    AF -->|No| AN["Log Warning"]
    AN --> AO["Continue Loop"]
    AE -->|No| AO
    
    AM --> AP{"More Pages?"}
    AO --> AP
    
    AP -->|Yes| AD
    AP -->|No| AQ{"Break Inserted?"}
    
    AB -->|Yes| AR["Return Break Information"]
    AQ -->|Yes| AR
    AQ -->|No| C
    
    classDef current fill:#f9f,stroke:#333,stroke-width:2px;
    class A current;
```

## Description

The `sectionTitleProcessor.js` file contains the `processSectionTitle()` function, which determines if a section title needs to be pushed to the next page. The function:

1. **Initial Checks**:
   - Validates the title element exists
   - Gets the title's dimensions

2. **Primary Logic**:
   - Checks if the title is too close to the bottom of any page
   - Checks if the title plus header would overflow the page

3. **Fallback Logic**:
   - If no break was inserted by the primary logic, tries the original logic
   - Uses a different threshold for determining if the title is near the bottom

4. **Result**:
   - Returns break information if a break was inserted
   - Returns null if no break was needed

The function uses multiple strategies to determine if a title needs pagination, ensuring that titles are properly positioned on pages.
