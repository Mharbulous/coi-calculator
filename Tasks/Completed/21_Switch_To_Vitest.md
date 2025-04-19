# Task: Switch from Jest to Vitest for Testing

## Description
Migrate the project's testing framework from Jest to Vitest. Vitest offers better native support for ES modules, faster test execution, and an improved developer experience while maintaining compatibility with most Jest APIs.

Currently, the project uses Jest with the experimental VM modules flag to support ES modules. Switching to Vitest will eliminate the need for this experimental flag and provide a more modern testing experience.

## Requirements
1. Replace Jest with Vitest as the testing framework
2. Maintain all existing test functionality
3. Fix the 2 currently failing tests as part of the migration
4. Update the test command in package.json
5. Create appropriate Vitest configuration
6. Ensure all 130 tests pass after migration

## Implementation Details

### 1. Update Dependencies
- Remove Jest dependency
- Add Vitest as a dev dependency

### 2. Create Vitest Configuration
- Create a vitest.config.js file with appropriate settings
- Configure Vitest to use the Node.js environment
- Enable globals for Jest-compatible API

### 3. Update Package Scripts
- Replace the current Jest test command with Vitest
- Add a watch mode script for development

### 4. Update Test Files
- Replace Jest imports with Vitest equivalents
- Update any Jest-specific APIs to their Vitest counterparts:
  - Replace `jest.spyOn` with `vi.spyOn`
  - Update any other Jest-specific functions

### 5. Fix Failing Tests
- Address the 2 currently failing tests in calculations.test.js:
  - "should calculate interest separately for damages within the final period"
  - "should handle final period damages when the final period spans a rate change"

### 6. Test and Verify
- Run the full test suite to ensure all tests pass
- Verify that test output is clear and helpful
- Document any differences in behavior between Jest and Vitest

## Migration Steps

```bash
# 1. Install Vitest and remove Jest
npm uninstall jest
npm install -D vitest

# 2. Create Vitest configuration file
# Create vitest.config.js with appropriate settings

# 3. Update package.json scripts
# "test": "vitest run"
# "test:watch": "vitest"

# 4. Run tests to verify migration
npm test
```

## Expected Changes

### package.json
```diff
"scripts": {
-  "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
+  "test": "vitest run",
+  "test:watch": "vitest"
},
"devDependencies": {
-  "jest": "^29.7.0",
+  "vitest": "^1.x.x",
  "zustand": "^5.0.3"
}
```

### Test Files
```diff
- import { jest } from '@jest/globals';
+ import { vi } from 'vitest';

- jest.spyOn(console, 'warn')
+ vi.spyOn(console, 'warn')
```

## Benefits
- Native ES Module support without experimental flags
- Faster test execution
- Better developer experience with improved UI for test results
- Future compatibility with Vite-based build systems

## Testing Criteria
1. All 130 tests should pass after migration
2. Test output should be clear and helpful
3. Test execution should be at least as fast as with Jest
4. Developer experience should be improved
