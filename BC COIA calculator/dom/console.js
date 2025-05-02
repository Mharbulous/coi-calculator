/**
 * Console layer utility functions
 */

/**
 * Add an element to the console layer
 * @param {HTMLElement|string} element - The element or HTML string to add
 * @param {Object} options - Options for positioning and behavior
 * @returns {HTMLElement} The added element
 */
export function addToConsoleLayer(element, options = {}) {
    const consoleLayer = document.querySelector('.console-layer');
    
    if (!consoleLayer) {
        console.error('Console layer not found');
        return null;
    }
    
    let el;
    if (typeof element === 'string') {
        // Create element from HTML string
        const temp = document.createElement('div');
        temp.innerHTML = element.trim();
        el = temp.firstChild;
    } else {
        el = element;
    }
    
    // Apply positioning options
    if (options.position) {
        el.style.position = options.position;
    }
    
    if (options.top !== undefined) {
        el.style.top = typeof options.top === 'number' ? `${options.top}px` : options.top;
    }
    
    if (options.left !== undefined) {
        el.style.left = typeof options.left === 'number' ? `${options.left}px` : options.left;
    }
    
    // Add to console layer
    consoleLayer.appendChild(el);
    
    return el;
}

/**
 * Remove an element from the console layer
 * @param {HTMLElement|string} element - The element or element ID to remove
 */
export function removeFromConsoleLayer(element) {
    const consoleLayer = document.querySelector('.console-layer');
    
    if (!consoleLayer) {
        console.error('Console layer not found');
        return;
    }
    
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    
    if (el && el.parentNode === consoleLayer) {
        consoleLayer.removeChild(el);
    }
}

/**
 * Clear all elements from the console layer
 */
export function clearConsoleLayer() {
    const consoleLayer = document.querySelector('.console-layer');
    
    if (!consoleLayer) {
        console.error('Console layer not found');
        return;
    }
    
    while (consoleLayer.firstChild) {
        consoleLayer.removeChild(consoleLayer.firstChild);
    }
}
