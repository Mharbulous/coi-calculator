# Datepicker Implementation Diagrams

## System Interaction Diagram

```mermaid
graph TD
    subgraph "Date Input System"
        A[HTML Date Inputs] --> |initialized with| B[Flatpickr]
        
        subgraph "Flatpickr Configuration"
            B --> C1[onChange Event]
            B --> C2[onClose Event]
            B --> C3[onOpen Event]
            B --> C4[minDate/maxDate Constraints]
            B --> C5[allowInput: true]
        end
        
        subgraph "Custom Event Handlers"
            A --> D1[blur Event Listener]
            A --> D2[input Event Listener]
            A --> D3[keyup Event Listener]
        end
        
        subgraph "Date Validation"
            E1[validateDateFormat]
            E2[parseDateInput]
            E3[dateBefore/dateAfter]
            E4[dateOnOrBefore/dateOnOrAfter]
            E5[updateDateConstraints]
        end
        
        subgraph "UI Feedback"
            F1[showDateConstraintNotification]
            F2[Error Messages]
        end
        
        C1 --> E5
        C1 --> G[Recalculation]
        C2 -.-> E1
        D1 --> E1
        D1 --> E2
        D1 --> E3
        E5 --> C4
        E5 --> F1
    end
    
    subgraph "Date Relationships"
        H1[Judgment Date]
        H2[Prejudgment Start Date]
        H3[Postjudgment End Date]
        
        H1 -- "must be on/after" --> H2
        H1 -- "must be on/before" --> H3
    end
    
    subgraph "Conflict Points"
        I1["Dual Validation: Flatpickr + Custom"]
        I2["Value Setting: Flatpickr vs. direct"]
        I3["Event Timing: onChange vs. blur"]
    end
    
    D1 -.-> I1
    C1 -.-> I1
    D1 -.-> I2
    C1 -.-> I2
    D1 -.-> I3
    C1 -.-> I3
```

## Event Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant DateInput
    participant Flatpickr
    participant CustomHandlers
    participant ValidationUtils
    participant UI
    
    Note over User,UI: Calendar Selection Flow
    User->>DateInput: Clicks on input
    DateInput->>Flatpickr: Triggers onOpen
    Flatpickr->>UI: Positions calendar
    User->>Flatpickr: Selects date from calendar
    Flatpickr->>ValidationUtils: Calls onChange with selectedDates
    ValidationUtils->>ValidationUtils: Validates constraints
    alt Valid Date
        ValidationUtils->>DateInput: Updates input value
        ValidationUtils->>UI: Triggers recalculation
    else Invalid Date
        ValidationUtils->>DateInput: Clears input
        ValidationUtils->>UI: Shows constraint notification
    end
    
    Note over User,UI: Manual Input Flow
    User->>DateInput: Types date manually
    DateInput->>CustomHandlers: Triggers input event
    CustomHandlers->>DateInput: Auto-formats (adds hyphens)
    User->>DateInput: Leaves field (blur)
    DateInput->>Flatpickr: Triggers onClose
    Flatpickr->>ValidationUtils: Validates format & constraints
    alt Valid Format & Constraints
        ValidationUtils->>DateInput: Keeps/formats value
        ValidationUtils->>UI: Triggers recalculation
    else Invalid Format
        ValidationUtils->>DateInput: Clears input
        ValidationUtils->>UI: Shows format error
    else Invalid Constraint
        ValidationUtils->>DateInput: Clears input
        ValidationUtils->>UI: Shows constraint error
    end
    
    Note over User,UI: Judgment Date Change Flow
    User->>DateInput: Changes Judgment Date
    DateInput->>Flatpickr: Triggers onChange
    Flatpickr->>ValidationUtils: Calls updateDateConstraints
    ValidationUtils->>Flatpickr: Updates min/max dates for other pickers
    ValidationUtils->>ValidationUtils: Checks existing dates against new constraints
    alt Other Dates Now Invalid
        ValidationUtils->>DateInput: Clears affected inputs
        ValidationUtils->>UI: Shows constraint notifications
    end
    ValidationUtils->>UI: Triggers recalculation
