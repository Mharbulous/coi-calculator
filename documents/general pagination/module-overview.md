# Page Breaks Module Overview

This diagram shows the structure of the new generalized pagination system using the `.breakable` class approach.

```mermaid
graph TD
    subgraph "Page Breaks Module Structure"
        A[index.js] --> B[pageBreaksCore.js]
        B --> C[utils.js]
        
        D[DOM Elements] -.-> B
        F[External module integration<br>tables.interest.js] -.-> |adds .breakable class to| G1[Dynamic elements]
        H[Static HTML elements] -.-> |have .breakable class| G2[Static .breakable elements]
        
        G1 -.-> B
        G2 -.-> B
    end
    
    classDef module fill:#f9f,stroke:#333,stroke-width:2px
    classDef utils fill:#bbf,stroke:#333,stroke-width:2px
    classDef external fill:#bfb,stroke:#333,stroke-width:1px
    
    class A,B module
    class C utils
    class F external
