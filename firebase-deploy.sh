#!/bin/bash
# Firebase Deployment Script
# This script defaults to deploying to the test environment
# To deploy to production, pass "production" as an argument: ./firebase-deploy.sh production

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default to test environment
DEPLOY_TARGET="test"
SITE_NAME="test-courtorderinterestcalculator"
ENVIRONMENT="TEST"

# Check if argument provided to deploy to production
if [ "$1" == "production" ]; then
  DEPLOY_TARGET="production"
  SITE_NAME="courtorderinterestcalculator"
  ENVIRONMENT="PRODUCTION"
fi

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}== COI Calculator ${ENVIRONMENT} Deploy ==${NC}"
echo -e "${YELLOW}=======================================${NC}"

echo -e "\n${BLUE}Target: ${DEPLOY_TARGET}${NC}"
echo -e "${BLUE}Site: ${SITE_NAME}${NC}"

# Apply the hosting target
echo -e "\n${GREEN}Setting up the Firebase hosting target...${NC}"
firebase target:apply hosting ${DEPLOY_TARGET} ${SITE_NAME}
if [ $? -ne 0 ]; then
  echo -e "${RED}Error applying Firebase hosting target. Aborting.${NC}"
  exit 1
fi

# Deploy to the specified hosting target
echo -e "\n${GREEN}Deploying to Firebase Hosting (${ENVIRONMENT})...${NC}"
firebase deploy --only hosting:${DEPLOY_TARGET}
if [ $? -ne 0 ]; then
  echo -e "${RED}Error deploying to Firebase Hosting. Aborting.${NC}"
  exit 1
fi

echo -e "\n${GREEN}Firebase Hosting deployment successful!${NC}"

if [ "$DEPLOY_TARGET" == "test" ]; then
  echo -e "${YELLOW}You can now access the test site at: https://test-courtorderinterestcalculator.web.app${NC}"
else
  echo -e "${YELLOW}You can now access the production site at: https://courtorderinterestcalculator.com${NC}"
fi

echo -e "\n${GREEN}Deployment Completed Successfully!${NC}"
