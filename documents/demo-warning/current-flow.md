
```mermaid
graph TD
    A[User clicks Print button] --> B{Check if user has paid?}
    B -->|No: Demo Mode| C[Show demo modal]
    B -->|Yes: Paid Mode| D[Print directly]
    C --> E[User clicks Test Print]
    E --> F[Add hide-for-print class to warning]
    F --> G[Call window.print()]
    D --> G[Call window.print()]
    G --> H[Print process completes]
    H --> I[Remove hide-for-print class]
        
    D -.->|Missing step| F
```
