# Firebase Deployment Guide

This document explains how to deploy the COI Calculator application to Firebase Hosting using the multi-site configuration.

## Overview

The application is configured to deploy to two different Firebase hosting sites:

- **Test Environment**: `test-courtorderinterestcalculator.web.app`
- **Production Environment**: `interestcalculator-7d80f.web.app`

## Set Up Hosting Targets

The first time you set up the project, run these commands to configure the hosting targets:

```bash
# Configure the targets
firebase target:apply hosting test test-courtorderinterestcalculator
firebase target:apply hosting production interestcalculator-7d80f
```

## Deployment Commands

### Deploy to Test Site (Default)

The `firebase.json` file is configured to deploy to the test site by default. Simply run:

```bash
firebase deploy
```

This command will deploy to the test site only, making it perfect for rapid iteration and testing.

### Deploy to Production Site

When you're ready to deploy to production, use:

```bash
firebase deploy --only hosting:production
```

Or use the alternate configuration file:

```bash
firebase deploy -c firebase.production.json
```

## Configuration Files

The setup uses two configuration files:

1. `firebase.json` - Default configuration that deploys to the test site
2. `firebase.production.json` - Alternative configuration for production deployments
3. `.firebaserc` - Defines the mapping between targets and Firebase hosting sites

## Troubleshooting

If you encounter issues with deployment:

1. Ensure you're logged into the correct Firebase account
   ```bash
   firebase login
   ```

2. Verify the correct project is selected
   ```bash
   firebase use interestcalculator-7d80f
   ```

3. Check that the hosting targets are correctly configured
   ```bash
   firebase target:list
   ```

4. If necessary, reconfigure the targets
   ```bash
   firebase target:apply hosting test test-courtorderinterestcalculator
   firebase target:apply hosting production interestcalculator-7d80f
   ```
