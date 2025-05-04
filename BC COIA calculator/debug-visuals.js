// Debug script to output the positions of .page-card::before elements (margin guidelines)
// This file is preserved for debugging purposes but visuals are disabled in production

document.addEventListener('DOMContentLoaded', () => {
  // Debug functionality is disabled in production
  // Uncomment the code below to enable debug visuals during development

  /*
  // Wait a bit to ensure all styles are applied
  setTimeout(() => {
    // Helper function to convert pixels to inches (assuming 96px per inch)
    const pxToInches = (px) => (px / 96).toFixed(3) + 'in';
    
    // Get all page-card elements
    const pageCards = document.querySelectorAll('.page-card');
    
    pageCards.forEach((pageCard, index) => {
      // Get the position and dimensions of the page-card
      const cardRect = pageCard.getBoundingClientRect();
      
      // Calculate the absolute position by adding scroll position
      const cardAbsoluteTop = cardRect.top + window.scrollY;
      const cardAbsoluteBottom = cardRect.bottom + window.scrollY;
      
      // Get the ::before pseudo-element's computed style
      const beforeStyle = window.getComputedStyle(pageCard, '::before');
      
      // Get the top, bottom values from the computed style
      const beforeTop = beforeStyle.top;
      const beforeBottom = beforeStyle.bottom;
      
      // Calculate the absolute positions of the ::before element
      const beforeAbsoluteTop = cardAbsoluteTop + parseFloat(beforeTop);
      const beforeAbsoluteBottom = cardAbsoluteBottom - parseFloat(beforeBottom);
      
      // Create visual indicators for debugging
      createVisualIndicator(beforeAbsoluteTop, 'red', `Page ${index + 1} ::before top`);
      createVisualIndicator(beforeAbsoluteBottom, 'blue', `Page ${index + 1} ::before bottom`);
    });
  }, 500); // Wait 500ms to ensure everything is rendered
  */
});

// Function to create visual indicators at specific vertical positions
function createVisualIndicator(yPosition, color, label) {
  // Debug functionality is disabled in production
  // Function is kept for reference but does not create any visual elements
  
  /*
  const indicator = document.createElement('div');
  indicator.style.position = 'absolute';
  indicator.style.left = '0';
  indicator.style.right = '0';
  indicator.style.top = `${yPosition}px`;
  indicator.style.height = '2px';
  indicator.style.backgroundColor = color;
  indicator.style.zIndex = '1000';
  indicator.style.pointerEvents = 'none';
  indicator.className = 'debug-visual-indicator';
  
  // Add label
  const labelElement = document.createElement('span');
  labelElement.textContent = label;
  labelElement.style.position = 'absolute';
  labelElement.style.right = '10px';
  labelElement.style.backgroundColor = 'white';
  labelElement.style.padding = '2px 5px';
  labelElement.style.fontSize = '12px';
  labelElement.style.color = color;
  labelElement.style.border = `1px solid ${color}`;
  
  indicator.appendChild(labelElement);
  document.body.appendChild(indicator);
  */
}

// Add a style to hide debug visualizations when printing
// Keeping this in place in case debug visuals are re-enabled during development
(function addPrintStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      .debug-visual-indicator {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
