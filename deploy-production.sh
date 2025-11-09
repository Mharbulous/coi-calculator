#!/bin/bash
# Production Deployment Script for Court Order Interest Calculator
# This script automates the deployment process for the production environment
# 
# DEPLOYMENT ARCHITECTURE NOTE:
# This script handles the Netlify Functions deployment and Firebase hosting deployment
# We use a hybrid approach where:
#  - Firebase hosts the application frontend
#  - Netlify provides serverless functions for payment processing
# See firebase.json for the hosting configuration.

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}== COI Calculator Production Deploy ==${NC}"
echo -e "${YELLOW}=======================================${NC}"

# Step 1: Create backup
echo -e "\n${GREEN}Step 1: Creating backup of production environment...${NC}"
BACKUP_DIR="BC COIA calculator_backup_$(date +%Y%m%d)"
if [ -d "$BACKUP_DIR" ]; then
  echo "Backup directory already exists. Appending timestamp."
  BACKUP_DIR="${BACKUP_DIR}_$(date +%H%M%S)"
fi

cp -r "BC COIA calculator" "$BACKUP_DIR"
echo "Backup created at: $BACKUP_DIR"

# Step 2: Verify environment variables are set in Netlify
echo -e "\n${GREEN}Step 2: Please verify you've set the following environment variables in Netlify:${NC}"
echo -e "${YELLOW}- STRIPE_PUBLISHABLE_KEY${NC} (starts with pk_live_) - already set in stripeIntegration.js"
echo -e "${YELLOW}- STRIPE_SECRET_KEY${NC} (starts with sk_live_) - need to set this in Netlify"
echo -e "${YELLOW}- STRIPE_WEBHOOK_SECRET${NC} (whsec_3KFGGruau5fsW2RYum5NCjVh4ZwR18fC) - already obtained"

read -p "Have you set these environment variables in Netlify? (y/n): " env_vars_set

if [ "$env_vars_set" != "y" ]; then
  echo -e "${RED}Please set the environment variables in Netlify before continuing.${NC}"
  echo "1. Log in to your Netlify dashboard"
  echo "2. Go to your site settings"
  echo "3. Find the 'Environment variables' section"
  echo "4. Add the variables listed above with their values"
  exit 1
fi

# Step 3: Build the project for production
echo -e "\n${GREEN}Step 3: Building project for production...${NC}"
# Add your build commands here if needed
# For example:
# cd "BC COIA calculator" && npm run build

# Step 4: Deploy to Firebase Hosting
echo -e "\n${GREEN}Step 4: Deploying to Firebase Hosting...${NC}"
echo -e "${YELLOW}Setting up the production target...${NC}"
firebase target:apply hosting production courtorderinterestcalculator
firebase deploy --only hosting:production
if [ $? -ne 0 ]; then
  echo -e "${RED}Error deploying to Firebase Hosting. Aborting.${NC}"
  exit 1
fi
echo -e "${GREEN}Firebase Hosting deployment successful.${NC}"

# Step 5: Deploy to Netlify (for serverless functions)
echo -e "\n${GREEN}Step 5: Deploying serverless functions to Netlify...${NC}"
echo "Select your deployment method:"
echo "1. Deploy via Netlify CLI (if installed)"
echo "2. Deploy through Netlify dashboard (manual)"
read -p "Select option (1-2): " deploy_option

if [ "$deploy_option" = "1" ]; then
  # Check if Netlify CLI is installed
  if command -v netlify &> /dev/null; then
    echo "Deploying using Netlify CLI..."
    netlify deploy --prod
  else
    echo -e "${RED}Netlify CLI not found. Please install it or use the dashboard option.${NC}"
    echo "To install Netlify CLI: npm install netlify-cli -g"
    exit 1
  fi
else
  echo -e "${YELLOW}Please follow these steps to deploy manually:${NC}"
  echo "1. Commit your changes to Git"
  echo "2. Push your changes to your production branch"
  echo "3. Wait for Netlify to auto-deploy, or trigger a manual deploy from the Netlify dashboard"
  read -p "Press Enter when deployment is complete..." deploy_complete
fi

# Step 6: Post-deployment verification checklist
echo -e "\n${GREEN}Step 6: Post-deployment verification checklist${NC}"
echo -e "${YELLOW}Please complete the following verification steps:${NC}"
echo "1. Load the production site in a private/incognito browser window"
echo "2. Verify demo mode works correctly"
echo "3. Click 'Get Accurate Results' to test the payment flow"
echo "4. Use a Stripe test card to make a payment:"
echo "   - Test card: 4242 4242 4242 4242"
echo "   - Any future expiration date"
echo "   - Any 3-digit CVC"
echo "   - Any postal code"
echo "5. Verify the success page correctly processes the session"
echo "6. Check that the calculator loads with real interest rates after payment"
echo "7. Test the payment flow on both desktop and mobile devices"
echo "8. Check the Stripe dashboard to confirm test payments are recorded"

echo -e "\n${GREEN}Deployment script completed.${NC}"
echo -e "${YELLOW}If you encounter any issues, refer to the troubleshooting section in the deployment checklist.${NC}"
echo -e "${YELLOW}Rollback procedure: If needed, restore from backup using:${NC}"
echo "rm -rf BC\ COIA\ calculator/"
echo "cp -r $BACKUP_DIR/ BC\ COIA\ calculator/"

echo -e "\n${GREEN}Deployment Successful!${NC}"
