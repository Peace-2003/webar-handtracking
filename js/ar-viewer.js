/**
 * AR Viewer Module
 * Handles the augmented reality book experience
 */
const ARViewer = (function() {
    // Private variables
    let currentPage = 0;
    let totalPages = 0;
    let bookData = null;
    let bookEntity = null;
    
    // Initialize the AR book viewer
    function init(data) {
        console.log('Initializing AR viewer...');
        bookData = data;
        totalPages = data.pages.length;
        
        // Wait for A-Frame to be ready
        if (document.readyState !== 'loading') {
            initAR();
        } else {
            document.addEventListener('DOMContentLoaded', initAR);
        }
        
        // Set up event listeners
        document.getElementById('next-btn-ar').addEventListener('click', nextPage);
        document.getElementById('prev-btn-ar').addEventListener('click', prevPage);
        document.getElementById('toggle-ar').addEventListener('click', function() {
            App.toggleView('book');
        });
    }
    
    // Initialize AR scene
    function initAR() {
        // Get book model entity
        bookEntity = document.getElementById('book-model');
        
        // Clear any existing content
        while (bookEntity.firstChild) {
            bookEntity.removeChild(bookEntity.firstChild);
        }
        
        // Create book cover entity
        const coverEntity = document.createElement('a-plane');
        coverEntity.setAttribute('width', 1);
        coverEntity.setAttribute('height', 1.4142); // A4 ratio
        coverEntity.setAttribute('position', '0 0 0');
        coverEntity.setAttribute('material', {
            src: bookData.pages[0].imagePath,
            transparent: true,
            opacity: 1
        });
        
        // Add book cover to scene
        bookEntity.appendChild(coverEntity);
        
        // Create page entities for turning animation
        const pageEntity = document.createElement('a-plane');
        pageEntity.setAttribute('width', 1);
        pageEntity.setAttribute('height', 1.4142);
        pageEntity.setAttribute('position', '0 0 0.01');
        pageEntity.setAttribute('visible', 'false');
        pageEntity.id = 'ar-page';
        
        bookEntity.appendChild(pageEntity);
        
        // Set initial page
        setPage(0);
    }
    
    // Navigate to next page
    function nextPage() {
        if (currentPage < totalPages - 1) {
            setPage(currentPage + 1);
        }
    }
    
    // Navigate to previous page
    function prevPage() {
        if (currentPage > 0) {
            setPage(currentPage - 1);
        }
    }
    
    // Set current page
    function setPage(pageNum) {
        if (pageNum >= 0 && pageNum < totalPages) {
            currentPage = pageNum;
            
            // Update page content in AR
            const pageEntity = document.getElementById('ar-page');
            if (pageEntity) {
                pageEntity.setAttribute('visible', true);
                pageEntity.setAttribute('material', {
                    src: bookData.pages[pageNum].imagePath,
                    transparent: true,
                    opacity: 1
                });
            }
            
            // Sync with book viewer
            BookViewer.setPage(currentPage);
        }
    }
    
    // Get current page
    function getCurrentPage() {
        return currentPage;
    }
    
    // Public API
    return {
        init: init,
        nextPage: nextPage,
        prevPage: prevPage,
        setPage: setPage,
        getCurrentPage: getCurrentPage
    };
})();
