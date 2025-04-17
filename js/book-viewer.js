/**
 * Book Viewer Module
 * Handles the normal (non-AR) book viewing experience using Turn.js
 */
const BookViewer = (function() {
    // Private variables
    let currentPage = 0;
    let totalPages = 0;
    let bookInitialized = false;
    
    // Initialize the book viewer
    function init(bookData) {
        console.log('Initializing book viewer...');
        
        const flipbook = $('#flipbook');
        flipbook.empty();
        
        // Create book pages
        bookData.pages.forEach((page, index) => {
            const pageElement = $('<div>');
            
            // Set page class based on type
            if (page.type === 'cover') {
                pageElement.addClass('hard cover');
            } else if (page.type === 'back-cover') {
                pageElement.addClass('hard back-cover');
            } else {
                pageElement.addClass('page');
            }
            
            // Set background image if available
            if (page.imagePath) {
                pageElement.css({
                    backgroundImage: `url(${page.imagePath})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                });
            }
            
            // Add content if available
            if (page.content) {
                const contentDiv = $('<div>').addClass('page-content').html(page.content);
                pageElement.append(contentDiv);
            }
            
            flipbook.append(pageElement);
        });
        
        // Initialize Turn.js
        flipbook.turn({
            width: window.innerWidth * 0.9,
            height: window.innerHeight * 0.8,
            autoCenter: true,
            when: {
                turning: function(event, page, view) {
                    currentPage = page - 1;
                }
            }
        });
        
        // Set total pages
        totalPages = bookData.pages.length;
        bookInitialized = true;
        
        // Set up event listeners
        document.getElementById('next-btn-book').addEventListener('click', nextPage);
        document.getElementById('prev-btn-book').addEventListener('click', prevPage);
        document.getElementById('toggle-book').addEventListener('click', function() {
            App.toggleView('ar');
        });
        
        // Window resize handler
        window.addEventListener('resize', function() {
            if (bookInitialized) {
                flipbook.turn('size', window.innerWidth * 0.9, window.innerHeight * 0.8);
            }
        });
    }
    
    // Navigate to next page
    function nextPage() {
        if (bookInitialized) {
            $('#flipbook').turn('next');
            currentPage = $('#flipbook').turn('page') - 1;
            // Sync with AR view
            ARViewer.setPage(currentPage);
        }
    }
    
    // Navigate to previous page
    function prevPage() {
        if (bookInitialized) {
            $('#flipbook').turn('previous');
            currentPage = $('#flipbook').turn('page') - 1;
            // Sync with AR view
            ARViewer.setPage(currentPage);
        }
    }
    
    // Set current page
    function setPage(pageNum) {
        if (bookInitialized && pageNum >= 0 && pageNum < totalPages) {
            $('#flipbook').turn('page', pageNum + 1);
            currentPage = pageNum;
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
