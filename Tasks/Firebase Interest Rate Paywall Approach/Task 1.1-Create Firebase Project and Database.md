# Task 1.1: Create Firebase Project and Database

## Overview
This subtask involves setting up the Firebase project infrastructure and creating a Firestore database to store interest rate data. This is the foundation for our cloud-based interest rate storage solution.

## Complexity
Simple

## Estimated Time
30 minutes

## Implementation Steps

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Name the project (e.g., "COI-Calculator")
4. Configure Google Analytics (optional but recommended for future user analytics)
5. Create the project

### 2. Choose and Configure Database
1. In the Firebase Console, navigate to "Build > Firestore Database"
2. Click "Create database"
3. Start in test mode initially for easier development
   - We'll tighten security rules in Task 1.6
4. Choose a database location close to your target users (e.g., us-west2 for North American users)

## Testing Steps
1. Verify you can access the newly created Firebase project in the console
2. Confirm that the Firestore database has been created successfully
3. Take a screenshot of the Firebase project dashboard for documentation

## Expected Outcome
By the end of this subtask, you should have:
1. A new Firebase project created and accessible via the Firebase Console
2. A Firestore database initialized in test mode
3. Project credentials and details documented for use in subsequent tasks

## Notes
- Keep track of the project ID and region as they will be needed in later steps
- The Firebase project name can be changed later if needed
- No code changes to the application will be made in this subtask
