# Debugging Tips

## Purpose

This file serves as a collection of debugging tips for issues that took substantial time to diagnose but could have been solved faster if specific possibilities had been considered earlier. By documenting these hard-won insights, we can save future development time by quickly identifying common pitfalls that might not be immediately obvious.  If you're having trouble with code not doing what you expected, consider the debugging tips in this file.

## Format

When adding debugging tips to this file, strictly abide by the following format for tips

Tips should be listed in a numbered list, with each following this general format:

1.  **In bold text, a concise description of the possibility that you should consider when debugging.**

*   One or more bullet points of  specific real examples where this issue actually came up and could have been solved more quickly if we had considered this tip.  Use real examples only. Do not invent examples.  Examples should be described succintly in no more than one paragraph per example

## Tips

### **1\. If your issue relates to dates, consider the possibility that the unexpected behaviour is due to timezone issues.**

*   Example: When implementing the special damages datepicker, we encountered an issue where the prejudgment interest date (2024-04-21) was still selectable despite attempts to disable it. We initially used a Date object in the flatpickr 'disable' array: `disabledDates.push(new Date(prejudgmentDate))`. However, our console logs revealed the actual disabled date was showing as "2024-04-20" rather than the intended date. The solution was to use string dates instead: `disabledDates.push(formatDateForDisplay(prejudgmentDate))`. This immediately fixed the issue by avoiding timezone conversion problems that occur when creating new Date objects, which had shifted our date by one day.

### **2\. When debugging UI issues with date selection, check what the component actually receives versus what you expect it to receive.**

*   Example: Our date-related debugging could have been much faster if we had immediately checked what was actually being passed to the datepicker component through console logging. The logs showed `Explicitly disabled dates: ["2024-04-20"]` when we expected "2024-04-21", which immediately revealed the nature of the problem. Always log both what you're passing to a function and what that function or component actually received to quickly identify any transformation issues.

### **3\. When implementing print styling, be aware that browsers and printers interpret margins differently.**

*   Example: When implementing page break visualization for the interest tables, we encountered a significant discrepancy between how content appeared in the browser versus the printed output. Text that filled an entire row in the online version appeared much smaller in the printed version, despite using the same font size. The issue was that we were using `@page { margin: 0.75in; }` in print.css while using `padding: 0.75in;` for the .paper element in the online view. Printers interpret margins differently than browsers - printer margins actually reduce the content area. The solution was to use consistent padding (0.75in) for the paper element in both online and print modes, and remove the @page margins. This immediately fixed the scaling discrepancy and made the online preview accurately match the printed output.
