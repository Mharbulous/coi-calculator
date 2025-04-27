# Pagination Utilities (utils.js)

This diagram illustrates the utility functions in the `utils.js` file and their relationships.

```mermaid
classDiagram
    class PaginationUtils {
        +SCREEN_ONLY_CLASS: string
        +getElementTopPadding(element): number
        +getElementOuterHeight(element): number
        +getElementAbsoluteTop(element): number
        +insertBlankRow(referenceRow, height): HTMLElement
        +insertHeaderRow(referenceRow, originalHeaderRow): number
        +insertBlankSpace(referenceElement, height): HTMLElement
        +clearScreenOnlyElements(): void
    }
    
    class MeasurementFunctions {
        +getElementTopPadding(element): number
        +getElementOuterHeight(element): number
        +getElementAbsoluteTop(element): number
    }
    
    class InsertionFunctions {
        +insertBlankRow(referenceRow, height): HTMLElement
        +insertHeaderRow(referenceRow, originalHeaderRow): number
        +insertBlankSpace(referenceElement, height): HTMLElement
    }
    
    class MaintenanceFunctions {
        +clearScreenOnlyElements(): void
    }
    
    PaginationUtils --|> MeasurementFunctions
    PaginationUtils --|> InsertionFunctions
    PaginationUtils --|> MaintenanceFunctions
    
    InsertionFunctions ..> MeasurementFunctions : uses
```

## Function Relationships

```mermaid
flowchart TD
    A["SCREEN_ONLY_CLASS"] -->|used by| B["insertBlankRow()"]
    A -->|used by| C["insertHeaderRow()"]
    A -->|used by| D["insertBlankSpace()"]
    A -->|used by| E["clearScreenOnlyElements()"]
    
    F["getElementOuterHeight()"] -->|used by| G["insertHeaderRow()"]
    
    subgraph "Measurement Functions"
        F
        H["getElementTopPadding()"]
        I["getElementAbsoluteTop()"]
    end
    
    subgraph "Insertion Functions"
        B
        C
        D
    end
    
    subgraph "Maintenance Functions"
        E
    end
```

## Description

The `utils.js` file provides utility functions for the pagination system, organized into three main categories:

1. **Measurement Functions**:
   - `getElementTopPadding()`: Gets the computed top padding of an element
   - `getElementOuterHeight()`: Gets the height of an element, including padding and border
   - `getElementAbsoluteTop()`: Gets the absolute vertical position of an element

2. **Insertion Functions**:
   - `insertBlankRow()`: Creates and inserts a blank table row for spacing
   - `insertHeaderRow()`: Creates and inserts a cloned table header row
   - `insertBlankSpace()`: Creates and inserts blank space (div) before an element

3. **Maintenance Functions**:
   - `clearScreenOnlyElements()`: Removes all elements with the screen-only class

These utility functions provide the foundation for the pagination system, handling DOM measurements and manipulations that are used by the higher-level processors.
