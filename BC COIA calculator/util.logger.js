/**
 * Utility for managing console logging and suppressing third-party noise
 */

// Original console methods we'll restore if needed
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

// List of patterns for logs we want to suppress
const suppressPatterns = [
  // Stripe-related messages
  'r.stripe.com/b',
  'Failed to fetch',
  'ERR_BLOCKED_BY_CLIENT',
  'FetchError',
  
  // Third-party analytics messages
  'excerpt.js',
  'container root created',
  
  // General browser messages we don't need to see
  'moving towards a new experience',
  'third-party cookies',
  
  // Add more patterns as needed
];

/**
 * Filter function to determine if a log should be suppressed
 * @param {Array} args - Arguments passed to the console method
 * @returns {boolean} - True if the log should be suppressed
 */
function shouldSuppressLog(args) {
  // Convert all arguments to strings and check for our patterns
  const logString = Array.from(args).map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');
  
  return suppressPatterns.some(pattern => logString.includes(pattern));
}

/**
 * Override console methods to filter out noise from third-party scripts
 */
export function setupLogFiltering() {
  // Wrap console.log
  console.log = function(...args) {
    if (!shouldSuppressLog(args)) {
      originalConsole.log.apply(console, args);
    }
  };
  
  // Wrap console.warn
  console.warn = function(...args) {
    if (!shouldSuppressLog(args)) {
      originalConsole.warn.apply(console, args);
    }
  };
  
  // Wrap console.error - only suppress certain errors
  console.error = function(...args) {
    if (!shouldSuppressLog(args)) {
      originalConsole.error.apply(console, args);
    }
  };
  
  // Wrap console.info
  console.info = function(...args) {
    if (!shouldSuppressLog(args)) {
      originalConsole.info.apply(console, args);
    }
  };
}

/**
 * Restore original console behavior
 */
export function restoreConsole() {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
}

/**
 * Add a new pattern to suppress
 * @param {string} pattern - Text pattern to match for suppression
 */
export function addSuppressPattern(pattern) {
  if (!suppressPatterns.includes(pattern)) {
    suppressPatterns.push(pattern);
  }
}
