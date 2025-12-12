# BC Court Order Interest Calculator

A web-based calculator for computing court order interest in British Columbia according to the Court Order Interest Act (COIA).

## Overview

This calculator computes prejudgment and postjudgment interest on court awards according to BC's Court Order Interest Act regulations. The calculator handles special damages, multiple interest rate periods, and generates detailed interest breakdowns for legal professionals.

## How Court Order Interest is Calculated in BC

### Interest Rate Periods

Interest rates in BC are set by regulation and change semi-annually in **6-month periods**:

- **January 1 to June 30** (first half of each year)
- **July 1 to December 31** (second half of each year)

Each period has separate rates for prejudgment and postjudgment interest (postjudgment rates are typically 2% higher than prejudgment rates).

### Simple Interest (Not Compound)

**Court order interest is calculated using simple interest, not compound interest.** This means:

- Interest accrued is **not** added to the principal for subsequent calculations
- Only the base principal amount (plus special damages) earns interest
- Interest accumulates linearly over time

The formula for each interest period is:

```
Interest = Principal × (Rate / 100) × (Days in Period / Days in Year)
```

### Special Damages Treatment

Special damages are out-of-pocket expenses (medical bills, prescriptions, physiotherapy, etc.) with specific dates and amounts. They are treated differently depending on when they occur:

#### During Regular Interest Periods

- Special damages are **added to the principal** as they occur
- The increased principal is used for calculating interest in subsequent periods
- Example: If a $500 physiotherapy bill occurs on March 1, 2023, then starting March 1, 2023, the principal increases by $500 for all future interest calculations

#### In the Final Period Before Judgment (Prejudgment Only)

Special damages occurring in the **final interest rate period before the judgment date** receive special treatment:

- Each special damage in the final period has its **interest calculated individually**
- Interest is calculated from the damage date to the day before judgment
- This ensures each expense earns the correct amount of interest based on when it was actually incurred
- Example: A $300 expense on April 1, 2023 with judgment on May 1, 2023 earns interest for exactly 30 days

#### Postjudgment Interest

For postjudgment interest:

- All special damages are simply added to the judgment total
- No separate calculation is performed
- They become part of the base principal earning postjudgment interest

### Calculation Process

1. **Prejudgment Interest** (if applicable):
   - Calculated from the prejudgment start date to the day before judgment
   - Based on the pecuniary damages amount
   - Special damages are incorporated as they occur
   - Final period special damages calculated individually

2. **Judgment Total**:
   - Pecuniary damages + Prejudgment interest + Non-pecuniary damages + Costs + Special damages

3. **Postjudgment Interest** (if applicable):
   - Calculated from judgment date to the accrual date
   - Based on the total judgment amount
   - Uses postjudgment interest rates (typically 2% higher)

### Example Calculation

**Scenario**: $10,000 award with judgment on May 1, 2023, special damage of $300 on April 1, 2023, rate 4.45%

**Prejudgment Calculation**:
- Base amount: $10,000 × 4.45% × (90 days / 365) = $109.93
- Special damage: $300 × 4.45% × (30 days / 365) = $1.10
- **Total Prejudgment Interest**: $111.03

**Judgment Total**: $10,000 + $300 + $111.03 = $10,411.03

**Postjudgment**: Based on $10,411.03 at postjudgment rates

## Technical Implementation

This directory contains serverless functions for the BC Court Order Interest Calculator, primarily for handling payment verification through Stripe.

The payment verification serverless function verifies Stripe payment sessions and issues tokens for authenticated users. This allows the COI Calculator to validate payments securely without exposing Stripe API keys in client-side code.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with your Stripe secret key:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

## Local Development

To run the serverless functions locally:

```bash
npm run dev
```

This will start the Netlify development server on port 8888. You can access the local serverless function at:

```
http://localhost:8888/.netlify/functions/verify-payment
```

Or via the redirect path:

```
http://localhost:8888/api/verify-payment
```

## Testing

To test the payment verification:

1. Use a Stripe test checkout session ID
2. Browse to the success.html page with a query parameter: `?session_id=cs_test_your_session_id`
3. The page will call the serverless function to verify the payment

For local testing without a real Stripe session, the success page will fall back to a test mode if no session_id is provided.

## Deployment

Deploy to Netlify using the Netlify CLI:

```bash
netlify login
netlify deploy --prod
```

Make sure to set up environment variables in the Netlify dashboard for production:

1. Go to your site settings in Netlify
2. Navigate to Settings > Build & deploy > Environment
3. Add the environment variable:
   - Key: STRIPE_SECRET_KEY
   - Value: Your production Stripe secret key

## Function Details

### verify-payment

**Purpose**: Verifies a Stripe checkout session and issues a verification token

**Parameters**:
- `session_id` (query parameter): The Stripe checkout session ID to verify

**Returns**:
- Success response: `{ verified: true, token: "...", customerId: "...", expiresAt: 123456789 }`
- Error response: `{ verified: false, error: "Error message" }`

## Security Considerations

- The Stripe secret key is stored as an environment variable and never exposed client-side
- CORS headers are configured to allow cross-origin requests
- Tokens expire after 24 hours by default (configurable)
- Error handling obscures sensitive details in responses
