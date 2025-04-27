# CSS Class Summary

## base.css

*   `.currency`: Base style for currency spans, prevents wrapping
*   `.currency.negative`: Styles for negative currency values in red
*   `.text-right`: Forces right text alignment
*   `.text-center`: Forces center text alignment
*   `.text-left`: Forces left text alignment
*   `.bold`: Forces bold font weight
*   `.hidden`: Hides elements with !important flag

Note: base.css also contains important global styles for the body and typography, including page setup for printing, but these are not class-based styles.

## forms.css

*   `.right-info-block`: Container for right-aligned information blocks
*   `.right-field`: Flex container for right-aligned form fields
*   `.field-pair`: Flex container for label-value pairs within right-info-block
*   `.label`: Bold, right-aligned labels in form fields
*   `.value`: Container for form field values with fixed width
*   `.registry-row`: Row for registry information
*   `.judgment-amount-row`: Row for judgment amount with top margin
*   `.non-pecuniary-row`: Row for non-pecuniary damages
*   `.costs-row`: Row for costs information
*   `.checkbox-container`: Flex container for checkbox and label
    *   `.left`: Modifier for left-aligned checkbox containers
*   `.editable-fields-section`: Section containing editable form fields with custom checkbox styling

Note: forms.css also includes specific styling for form elements like inputs, selects, and checkboxes using attribute selectors and pseudo-classes.

## layout.css

*   `.ink-layer`: Main container for paper-like layout with background, dimensions, and shadow
*   `.editable-fields-section`: Container for editable form fields with margin spacing
*   `.field-row`: Flex container for form fields with space-between alignment
*   `.section-title`: Bold section headings with specific margins

Note: layout.css also includes styling for h1 elements and table cell combinations using multiple classes.

## main.css

*   No classes defined directly in this file
*   Serves as the main import file that loads all other CSS files

Note: main.css is responsible for importing all other CSS files in the correct order, including variables, base styles, layout, forms, tables, components, page breaks, and print styles.

## page-breaks.css

*   `.screen-only`: Base class for elements inserted by JavaScript for pagination spacing, visible only on screen

Note: page-breaks.css contains minimal styling as most of the pagination functionality is handled by JavaScript. Print styles for these elements are defined in print.css.

## page-cards.css

*   `.pages-container`: Flex container for all page cards with vertical column layout
*   `.page-card`: Individual page card with letter size dimensions and styling
*   `.page-number`: Page number indicator positioned at the bottom of each page

Note: page-cards.css includes print media queries that adjust the page card styling for printing, including removing shadows, adjusting margins, and handling page breaks.

## print.css

*   `.page-break-indicator`: Element that indicates where page breaks should occur
    *   `.table-boundary`: Modifier for page breaks at table boundaries
    *   `.footer-break`: Modifier for page breaks at footers
    *   `.last-row-break`: Modifier for page breaks after last rows
*   `.interest-calculation-details`: Container for interest calculation information
    *   `.days-only`: Modifier for displaying only days count
*   `.days-count`: Element displaying the number of days
*   `.end-date`: Element displaying the end date
*   `.per-diem-row`: Row displaying per diem information
*   `.total-row`: Row displaying totals with bold styling

Note: print.css is entirely wrapped in a @media print query and contains extensive print-specific styling for various elements, including form inputs, tables, and layout adjustments. It handles page break behavior, element visibility, and ensures proper formatting when printed.

## two-layer.css

*   `.two-layer-container`: Main container for the two-layer paper implementation
*   `.paper-layer`: Bottom layer that represents the paper sheets
*   `.page-card`: Individual paper card with styling (also defined in page-cards.css)
*   `.page-number`: Page number indicator at the bottom of each page

Note: two-layer.css implements a skeuomorphic paper design with two layers - a paper layer and an ink layer. It includes visual elements like dashed margin guidelines and proper z-index positioning. It also contains print media queries to adjust the layout for printing.

## variables.css

*   No classes defined in this file

Note: variables.css defines CSS custom properties (variables) used throughout the application. It includes color definitions, font settings, sizing variables, spacing units, and other design constants. These variables ensure consistent styling across the application and make it easier to update the design system.

## components/date-inputs.css

*   `.custom-date-input`: Styling for custom date input fields
*   `.flatpickr-calendar`: Container for the Flatpickr date picker
*   `.flatpickr-month`: Month header in the date picker
*   `.flatpickr-current-month`: Current month display in the date picker
*   `.flatpickr-monthDropdown-months`: Month dropdown in the date picker
*   `.flatpickr-day`: Individual day in the date picker
    *   `.selected`, `.startRange`, `.endRange`: States for selected days
    *   `.today`: Styling for the current day

Note: date-inputs.css contains extensive styling for the Flatpickr date picker component, including its various states and sub-elements. It also includes print media queries to hide the date picker when printing.

## components/modal.css

*   `.modal-overlay`: Full-screen overlay that darkens the background when a modal is open
*   `.modal`: Container for the modal dialog box
*   `.modal-header`: Header section of the modal with title
*   `.modal-body`: Content section of the modal
*   `.modal-footer`: Footer section of the modal with action buttons
*   `.modal-btn`: Button styling for modal actions

Note: modal.css provides styling for modal dialogs with a clean, modern appearance. It includes a print media query to hide modals when printing.

## components/special-damages.css

*   `.delete-icon`: Icon button for deleting special damages entries
*   `.trash-icon-container`: Container for positioning the delete icon
*   `.description-container`: Flex container for special damages description and add button
*   `.add-special-damages-btn`: Button for adding new special damages entries
*   `.special-damages-row`: Row containing special damages information
    *   `.highlight-new-row`: Animation state for newly added rows
*   `.special-damages-date`: Input field for special damages date
*   `.special-damages-description`: Input field for special damages description
*   `.special-damages-amount`: Input field for special damages amount
*   `.end-date`: Element displaying the end date in special damages

Note: special-damages.css provides styling for the special damages section, including input fields, delete functionality, and the add button. It includes animations for highlighting new rows and print media queries to hide interactive elements when printing.

## components/tooltips.css

*   `.help-icon`: Circular blue icon with a question mark for displaying help information
*   `.amount-help-container`: Flex container for displaying amount and help icon together
*   `.tooltip`: Popup box containing help text that appears on hover

Note: tooltips.css provides styling for help icons and their associated tooltips. The tooltips appear when hovering over help icons and provide contextual information to users.

## tables/common.css

*   `.interest-table`: Base class for interest calculation tables
    *   `.total`: Row displaying totals in the table footer

Note: tables/common.css provides base styling for all tables in the application, with specific focus on interest tables. It defines common properties like borders, padding, alignment, and special styling for total rows in the footer.

## tables/interest-tables.css

*   `#prejudgmentTable`, `#postjudgmentTable`: Specific styling for prejudgment and postjudgment interest tables
*   `.judgment-table`: Styling for judgment tables with specific column widths
*   `.interest-calculation-details`: Container for interest calculation information
    *   `.days-only`: Modifier for displaying only days count
*   `.days-count`: Element displaying the number of days

Note: interest-tables.css provides specific styling for interest calculation tables, including column widths, text alignment, and special formatting for interest calculation details. It uses ID selectors for precise targeting of specific tables.

## tables/summary-tables.css

*   `.summary-table`: Main class for summary tables with fixed layout
*   `.date-label-wrapper`: Flex container for date labels and inputs
*   `.date-prefix-label`: Label preceding date inputs
*   `.date-cell-container`: Container for date cells with consistent dimensions
*   `.total-row`: Row displaying totals with bold styling
*   `.per-diem-row`: Row displaying per diem information with italic styling

Note: summary-tables.css provides styling for summary tables that display calculation results. It includes fixed column widths, alignment rules, and special formatting for different types of rows. It also contains styling for date inputs and their containers.