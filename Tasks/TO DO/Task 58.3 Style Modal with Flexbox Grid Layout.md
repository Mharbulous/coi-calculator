# Task 58.3: Style Modal with Flexbox/Grid Layout

**Objective:** Apply comprehensive CSS styling to the base modal structure created in the previous task, focusing on creating a visually appealing and structurally robust layout using Flexbox or Grid.

**Prerequisites:** Task 58.2 completed (base modal structure exists and is displayed).

**Steps:**

1.  **Enhance CSS File:** Open the `BC COIA calculator/styles/components/record-payment-modal.css` file.
2.  **Implement Form Group Layout:** Target the `.form-group` class. Apply `display: flex` and `flex-direction: column` (or use CSS Grid) to ensure the label, input, and validation message within each group are stacked vertically and aligned properly. Adjust margins or add `gap` for appropriate spacing between these elements.
3.  **Style Validation Placeholders:** Target the `.validation-message` class. Set a specific `min-height` (e.g., 16px or equivalent to one line of text) to ensure this element occupies vertical space even when it contains no text. This prevents the layout from shifting when validation messages appear or disappear. Also, set the text color (e.g., red) and font size.
4.  **Style Labels and Inputs:** Apply styling to the `label` elements (font weight, color, margin). Apply styling to the `input` elements, matching the application's existing input styles (padding, border, border-radius, background color). Define distinct `:focus` styles for the inputs (e.g., border color change, box-shadow).
5.  **Style Buttons:** Apply specific styling to the "Cancel" (`.modal-btn-cancel`) and "Confirm" (`.modal-btn-confirm`) buttons. Define their background colors, text colors, padding, and borders. Implement `:hover` styles for visual feedback. Crucially, define styles for the `:disabled` state of the Confirm button (e.g., a lighter background color, reduced opacity, `cursor: not-allowed`) so its inactive state is clear. Ensure consistent spacing between the buttons in the footer.

**Acceptance Criteria:**

*   The modal dialog is visually styled, aligning with the application's overall design language (colors, fonts, spacing).
*   The "Date of Payment" and "Amount of Payment" sections (label, input, validation area) are correctly aligned vertically using Flexbox or Grid.
*   The space for validation messages is reserved, preventing layout jumps when messages are shown or hidden.
*   Input fields look consistent with other inputs in the application and provide visual feedback on focus.
*   Buttons are styled correctly, with clear hover states and a distinct visual appearance when the Confirm button is disabled.
*   The overall layout of the modal appears stable and well-organized.