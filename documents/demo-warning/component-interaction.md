```mermaid
---
id: de071687-56b7-46e8-af4d-b64fecbd33b1
---
graph TD
    A[index.html Print Button] --> B[demo-mode.js handlePrintClick]
    B --> C{hasVerifiedPayment check}
    C -->|No: Demo Mode| D[showDemoModal]
    D --> E[User clicks Test Print]
    E --> F[printWarning.classList.add hide-for-print]
    F --> G[window.print]
    
    C -->|Yes: Paid Mode| H[window.print Directly]
    H -.->|Missing Step| F
    
    G --> I[@media print CSS]
    I --> J{print-warning.hide-for-print?}
    J -->|Yes| K[Warning Hidden]
    J -->|No| L[Warning Visible]
    
    style H fill:#ff9999
    style F fill:#99ff99
```