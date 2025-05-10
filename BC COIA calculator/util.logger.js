// Enhanced logger utility for debugging

/**
 * Levels:
 * 0 = Off
 * 1 = Error only
 * 2 = Warning and Error
 * 3 = Info, Warning, and Error
 * 4 = Debug, Info, Warning, and Error
 * 5 = Trace, Debug, Info, Warning, and Error
 */
const logLevel = 5; // Set to highest level for debugging the payment issue

const logStyles = {
    error: 'color: red; font-weight: bold',
    warning: 'color: orange; font-weight: bold',
    info: 'color: blue',
    debug: 'color: green',
    trace: 'color: gray'
};

/**
 * Log an error message
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export function error(message, data = null) {
    if (logLevel >= 1) {
        if (data) {
            console.error(`%c${message}`, logStyles.error, data);
        } else {
            console.error(`%c${message}`, logStyles.error);
        }
    }
}

/**
 * Log a warning message
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export function warning(message, data = null) {
    if (logLevel >= 2) {
        if (data) {
            console.warn(`%c${message}`, logStyles.warning, data);
        } else {
            console.warn(`%c${message}`, logStyles.warning);
        }
    }
}

/**
 * Log an info message
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export function info(message, data = null) {
    if (logLevel >= 3) {
        if (data) {
            console.log(`%c${message}`, logStyles.info, data);
        } else {
            console.log(`%c${message}`, logStyles.info);
        }
    }
}

/**
 * Log a debug message
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export function debug(message, data = null) {
    if (logLevel >= 4) {
        if (data) {
            console.log(`%c${message}`, logStyles.debug, data);
        } else {
            console.log(`%c${message}`, logStyles.debug);
        }
    }
}

/**
 * Log a trace message
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
export function trace(message, data = null) {
    if (logLevel >= 5) {
        if (data) {
            console.log(`%c${message}`, logStyles.trace, data);
        } else {
            console.log(`%c${message}`, logStyles.trace);
        }
    }
}
