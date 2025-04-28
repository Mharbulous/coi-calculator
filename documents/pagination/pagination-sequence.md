# Pagination Sequence Flow

This diagram illustrates the sequential flow of operations during pagination processing.

```mermaid
sequenceDiagram
    participant HTML as Static HTML
    participant Tables as tables.interest.js
    participant Pagination as pageBreaksCore.js
    participant Utils as utils.js
    
    Note over HTML: Static elements with<br>.breakable class
    Note over Tables: Dynamic elements with<br>.breakable class added
    
    activate Pagination
    Pagination->>Utils: clearScreenOnlyElements()
    Utils-->>Pagination: Elements cleared
    
    Pagination->>Pagination: Calculate page dimensions
    Pagination->>Pagination: Render page cards
    
    Pagination->>HTML: Query all .breakable elements
    HTML-->>Pagination: List of breakable elements
    
    loop For each breakable element
        Pagination->>Utils: Get element position
        Utils-->>Pagination: Position data
        
        Pagination->>Pagination: Calculate block height
        Pagination->>Pagination: Check if element overflows page
        
        alt Element overflows page
            Pagination->>Utils: insertPageBreakBeforeElement()
            
            alt Element is table row
                Utils->>Utils: insertBlankRow()
                Utils->>Utils: insertHeaderRow() if needed
            else Element is not table row
                Utils->>Utils: insertBlankSpace()
            end
            
            Utils-->>Pagination: Break inserted
        end
    end
    
    Pagination->>Pagination: Final page adjustments
    deactivate Pagination
    
    Note over Pagination: Event: content-changed
    activate Pagination
    Pagination->>Pagination: updatePagination()
    deactivate Pagination
```

## Key Sequence Points

1. **Initialization**
   - The process begins by clearing any previous pagination elements
   - Page dimensions are calculated and page cards are rendered
   - All elements with the `.breakable` class are collected

2. **Element Processing**
   - Each breakable element is examined in sequence
   - For each element, its position and the height of its "block" are calculated
   - If an element would overflow its current page, a page break is inserted before it

3. **Type-Specific Handling**
   - Table rows receive special treatment with blank rows and repeated headers
   - Non-table elements receive generic spacing divs

4. **Event-Based Updates**
   - When content changes (e.g., new data added, visibility changed), the pagination is recalculated
   - A 'content-changed' event triggers the entire process to run again

This unified approach simplifies pagination by focusing on the `.breakable` class rather than element-specific processing logic, making the system more maintainable and consistent.
