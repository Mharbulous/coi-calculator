# Task 35: Fix Special Damages Display On First Day Of Interest Period

## Issue Description

When special damages are added on the first day of the final interest period, they are not displayed with their own interest calculation row. Instead, the special damage amount is being added to the general total for that day.

## Current Behavior

Special damages added on dates _other than_ the first day of an interest period (e.g., 2024-07-02) are displayed correctly:

1.  A row showing the special damage description and amount (e.g., "test2" with $32.00)
2.  A separate row showing the interest calculation details (e.g., "test2 (107 days) @ 4.95%" with $0.46 interest)

Special damages added on the first day of an interest period (e.g., 2024-07-01):

1.  The row showing the special damage description and amount appears correctly (e.g., "test1" with $11.00)
2.  There is no separate row showing the interest calculation details for this special damage
3.  The special damage amount is incorrectly added to the general principal amount for that period (e.g., $10,011.00 includes the $11.00 special damage)

## Desired Behavior

Special damages added on the first day of an interest period should be handled consistently with special damages on other days:

1.  Show the special damage description and amount in its own row
2.  Show a separate row with the interest calculation details (days, rate, and interest amount)
3.  NOT add the special damage amount to the general principal amount

The second example with "Physiotherapy" illustrates the correct behavior - where the special damage has its own interest calculation row showing the number of days and interest amount.

## Implementation Notes

This issue likely involves how the interest calculation logic handles special damages that occur on the first day of an interest period. The fix should ensure consistent treatment of all special damages that occur in the final interest period regardless of when they occur within an interest period.  Note that special damages that occur within the final prejudgment interest period need to have their interest calculated individually.