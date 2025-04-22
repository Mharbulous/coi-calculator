# Task: Refactor State Management to Use Zustand

**Goal:** Replace the current custom `appState` object in `calculator.js` with Zustand for more robust, scalable, and maintainable state management.

**Tips:** Before you dive into implementing Zustand, here's what you need to know:

First, take a closer look at how this app is structured - it's a browser-based application using ES modules without a build tool. This means you can't just use bare import specifiers like import from 'zustand' and expect them to work.

Instead, do this right away:

Add an import map in index.html that maps 'zustand' to a CDN URL:

<script type="importmap">
{
  "imports": {
    "zustand": "https://esm.sh/zustand@4.4.1"
  }
}
</script>
Don't waste time trying to reference node_modules directly - browsers can't easily access that. Go straight to using a CDN for Zustand.

Before you implement the full refactoring, create a quick test to verify that your module resolution approach actually works in the browser.

Make sure you understand how the application is being served and accessed - this will save you a lot of troubleshooting later.


