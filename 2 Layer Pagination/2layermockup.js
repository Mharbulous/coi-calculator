document.addEventListener('DOMContentLoaded', function() {
    // Print preview button
    const printPreviewButton = document.getElementById('print-preview');
    printPreviewButton.addEventListener('click', function() {
        window.print();
    });
    
    // Calculate page boundary positions
    function updatePageBoundaries() {
        const paperLayer = document.getElementById('paper-layer');
        const inkLayer = document.getElementById('ink-layer');
        const pageCards = paperLayer.querySelectorAll('.page-card');
        const pageSpacers = inkLayer.querySelectorAll('.page-boundary-spacer');
        
        // Remove existing spacers
        pageSpacers.forEach(spacer => {
            spacer.style.height = '0px';
        });
        
        // Calculate positions
        for (let i = 1; i < pageCards.length; i++) {
            const card = pageCards[i];
            const prevCard = pageCards[i-1];
            const spacer = pageSpacers[i-1];
            
            if (spacer) {
                const cardTop = card.getBoundingClientRect().top;
                const prevCardBottom = prevCard.getBoundingClientRect().bottom;
                const gap = cardTop - prevCardBottom;
                
                spacer.style.height = gap + 'px';
            }
        }
    }
    
    // Initial update and listen for window resize
    setTimeout(updatePageBoundaries, 100);
    window.addEventListener('resize', updatePageBoundaries);
});
