#!/bin/bash
# Deploy script for test mode functionality

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of test mode functionality...${NC}"

# Deploy Firebase Hosting configuration
echo -e "${YELLOW}Deploying Firebase Hosting configuration...${NC}"
firebase deploy --only hosting
if [ $? -ne 0 ]; then
  echo -e "${RED}Error deploying Firebase Hosting configuration. Aborting.${NC}"
  exit 1
fi
echo -e "${GREEN}Firebase Hosting configuration deployed successfully.${NC}"

echo -e "${GREEN}Test mode functionality deployed successfully!${NC}"
echo -e "${YELLOW}You can now access the test mode at: https://courtorderinterestcalculator.com/test${NC}"
echo -e "${YELLOW}Note: Test mode is only accessible from IP address: 207.6.212.70${NC}"
echo -e "${YELLOW}Or by using the URL parameter: ?key=coi-test-mode-2025${NC}"
