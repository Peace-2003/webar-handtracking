/**
 * Book Controller Module
 * Handles navigation controls and mode switching
 */

/**
 * Initialize book controller with navigation buttons
 */
function initBookController() {
    // AR mode buttons
    const prevBtnAR = document.getElementById('prev-btn-ar');
    const nextBtnAR = document.getElementById('next-btn-ar');
    const toggleModeBtn = document.getElementById('toggle-mode-btn');
    
    // Normal mode buttons
    const prevBtnNormal = document.getElementById('prev-btn-normal');
    const nextBtnNormal = document.getElementById('next-btn-normal');
    const toggleModeBtnNormal = document.getElementById('toggle-mode-btn-normal');
    
    // AR mode navigation
    prevBtnAR.addEventListener('click', () => {
        if (window.appState.currentPage > 0) {
            const newPage = window.appState.currentPage - 1;
            window.updateARBookPage(newPage);
        }
    });
    
    nextBtnAR.addEventListener('click', () => {
        if (window.appState.currentPage < window.appState.totalPages - 1) {
            const newPage = window.appState.currentPage + 1;
            window.updateARBookPage(newPage);
        }
    });
    
    // Toggle mode button in AR view
    toggleModeBtn.addEventListener('click', () => {
        window.appFunctions.toggleViewMode(false);
    });
    
    // Normal mode navigation
    prevBtnNormal.addEventListener('click', () => {
        $('#flipbook').turn('previous');
    });
    
    nextBtnNormal.addEventListener('click', () => {
        $('#flipbook').turn('next');
    });
    
    // Toggle mode button in normal view
    toggleModeBtnNormal.addEventListener('click', () => {
        window.appFunctions.toggleViewMode(true);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            if (window.appState.isARMode) {
                prevBtnAR.click();
            } else {
                prevBtnNormal.click();
            }
        } else if (event.key === 'ArrowRight') {
            if (window.appState.isARMode) {
                nextBtnAR.click();
            } else {
                nextBtnNormal.click();
            }
        }
    });
    
    // Add swipe gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', (event) => {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left (next page)
            if (window.appState.isARMode) {
                nextBtnAR.click();
            } else {
                nextBtnNormal.click();
            }
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right (previous page)
            if (window.appState.isARMode) {
                prevBtnAR.click();
            } else {
                prevBtnNormal.click();
            }
        }
    }
}
