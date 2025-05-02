# Deployment Architecture

## Hybrid Firebase/Netlify Approach

This application uses a hybrid deployment architecture:

### Firebase

- **Firebase Hosting**: Primary platform for hosting the application frontend
- **Firebase Firestore**: Database for storing and retrieving interest rate data
- **Firebase Configuration**: `firebase.json` contains the hosting configuration

### Netlify

- **Netlify Functions**: Serverless functions for payment processing and verification
- **Netlify Configuration**: `netlify.toml` configures the serverless functions
- **NOT used for hosting**: Despite the presence of Netlify configuration, the application is hosted on Firebase

## Deployment Process

### Frontend (Firebase)

The frontend is deployed using Firebase Hosting:

```bash
# Deploy the application frontend to Firebase Hosting
firebase deploy --only hosting
```

This is handled by the `BC COIA calculator/deploy-test-mode.sh` script for test deployments.

### Serverless Functions (Netlify)

Serverless functions are deployed using Netlify:

```bash
# Deploy serverless functions to Netlify
netlify deploy --prod
```

This is handled by the `deploy-production.sh` script for production deployments.

## Why This Hybrid Approach?

This architecture leverages the strengths of both platforms:

1. **Firebase** provides robust hosting and database capabilities
2. **Netlify Functions** overcome limitations in Firebase's free tier for serverless functions
3. This separation of concerns allows for more flexible scaling and maintenance

## Directory Structure

- `/functions/` - Contains Netlify serverless functions
- `/BC COIA calculator/functions/` - Contains Firebase Cloud Functions (not currently used in production)
- `/BC COIA calculator/` - Contains the main application code deployed to Firebase Hosting

## Configuration Files

- `netlify.toml` - Configures Netlify Functions and redirects
- `BC COIA calculator/firebase.json` - Configures Firebase Hosting

## Common Misconceptions

- **Netlify is NOT used for hosting** the application frontend
- **Firebase Functions are NOT used** for payment processing
- The presence of `netlify.toml` might suggest Netlify hosting, but it's only for serverless functions

## Development Environment

For local development, you can run both Firebase and Netlify components:

```bash
# Run Netlify development server (for serverless functions)
netlify dev

# Run Firebase emulator (for hosting and Firestore)
firebase emulators:start
```

## Deployment Checklist

Before deploying to production:

1. Test all Netlify functions locally
2. Verify environment variables are set in Netlify
3. Deploy serverless functions to Netlify
4. Deploy frontend to Firebase Hosting
5. Verify cross-platform functionality
