// Debug script to output the positions of .page-card::before elements

document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure all styles are applied
  setTimeout(() => {
    console.log('Debugging .page-card::before positions:');
    
    // Helper function to convert pixels to inches (assuming 96px per inch)
    const pxToInches = (px) => (px / 96).toFixed(3) + 'in';
    
    // Get all CSS variables that might be relevant
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const paperWidth = computedStyle.getPropertyValue('--paper-width');
    const paperHeight = computedStyle.getPropertyValue('--paper-height');
    const paperPadding = computedStyle.getPropertyValue('--paper-padding');
    
    console.log('CSS Variables:');
    console.log(`  --paper-width: ${paperWidth}`);
    console.log(`  --paper-height: ${paperHeight}`);
    console.log(`  --paper-padding: ${paperPadding}`);
    console.log('---');
    
    // Get all page-card elements
    const pageCards = document.querySelectorAll('.page-card');
    
    pageCards.forEach((pageCard, index) => {
      // Get the computed style of the page-card
      const cardStyle = window.getComputedStyle(pageCard);
      
      // Get the position and dimensions of the page-card
      const cardRect = pageCard.getBoundingClientRect();
      
      // Calculate the absolute position by adding scroll position
      const cardAbsoluteTop = cardRect.top + window.scrollY;
      const cardAbsoluteBottom = cardRect.bottom + window.scrollY;
      
      // Get the ::before pseudo-element's computed style
      // Note: We can't directly access pseudo-elements with getBoundingClientRect
      // So we'll use the computed style properties
      const beforeStyle = window.getComputedStyle(pageCard, '::before');
      
      // Get the top, bottom, left, right values from the computed style
      const beforeTop = beforeStyle.top;
      const beforeBottom = beforeStyle.bottom;
      const beforeLeft = beforeStyle.left;
      const beforeRight = beforeStyle.right;
      
      // Calculate the absolute positions of the ::before element
      // This is an approximation based on the parent's position and the ::before's position
      const beforeAbsoluteTop = cardAbsoluteTop + parseFloat(beforeTop);
      const beforeAbsoluteBottom = cardAbsoluteBottom - parseFloat(beforeBottom);
      
      console.log(`Page Card ${index + 1}:`);
      console.log(`  Card dimensions: width=${cardRect.width}px (${pxToInches(cardRect.width)}), height=${cardRect.height}px (${pxToInches(cardRect.height)})`);
      console.log(`  Card position: top=${cardAbsoluteTop}px (${pxToInches(cardAbsoluteTop)}), bottom=${cardAbsoluteBottom}px (${pxToInches(cardAbsoluteBottom)})`);
      console.log(`  ::before style: top=${beforeTop}, bottom=${beforeBottom}, left=${beforeLeft}, right=${beforeRight}`);
      console.log(`  ::before absolute position: top=${beforeAbsoluteTop}px (${pxToInches(beforeAbsoluteTop)}), bottom=${beforeAbsoluteBottom}px (${pxToInches(beforeAbsoluteBottom)})`);
      
      // Calculate the height of the ::before element
      const beforeHeight = beforeAbsoluteBottom - beforeAbsoluteTop;
      console.log(`  ::before height: ${beforeHeight}px (${pxToInches(beforeHeight)})`);
      console.log('---');
      
      // Create visual indicators for debugging (optional)
      createVisualIndicator(beforeAbsoluteTop, 'red', `Page ${index + 1} ::before top`);
      createVisualIndicator(beforeAbsoluteBottom, 'blue', `Page ${index + 1} ::before bottom`);
    });
    
    // Additional debugging for the paper-layer
    const paperLayer = document.querySelector('.paper-layer');
    if (paperLayer) {
      const paperLayerStyle = window.getComputedStyle(paperLayer);
      const paperLayerRect = paperLayer.getBoundingClientRect();
      const paperLayerTop = paperLayerRect.top + window.scrollY;
      const paperLayerBottom = paperLayerRect.bottom + window.scrollY;
      
      console.log('Paper Layer:');
      console.log(`  Position: top=${paperLayerTop}px (${pxToInches(paperLayerTop)}), bottom=${paperLayerBottom}px (${pxToInches(paperLayerBottom)})`);
      console.log(`  Style - position: ${paperLayerStyle.position}, display: ${paperLayerStyle.display}, gap: ${paperLayerStyle.gap}`);
    }
  }, 500); // Wait 500ms to ensure everything is rendered
});

// Function to create visual indicators at specific vertical positions
function createVisualIndicator(yPosition, color, label) {
  const indicator = document.createElement('div');
  indicator.style.position = 'absolute';
  indicator.style.left = '0';
  indicator.style.right = '0';
  indicator.style.top = `${yPosition}px`;
  indicator.style.height = '2px';
  indicator.style.backgroundColor = color;
  indicator.style.zIndex = '1000';
  indicator.style.pointerEvents = 'none';
  
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
}
