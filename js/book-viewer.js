/**
 * Book Viewer Module
 * Handles the normal (non-AR) book viewing experience using Turn.js
 */

/**
 * Initialize the normal book viewer
 * @param {Object} bookData - Book data with pages information
 */
function initBookViewer(bookData) {
    const flipbook = $('#flipbook');
    
    // Clear any existing content
    flipbook.empty();
    
    // Add pages to the book
    bookData.pages.forEach((page, index) => {
        const pageElement = $('<div>');
        
        // Set page class based on type
        if (page.type === 'cover') {
            pageElement.addClass('hard cover');
        } else if (page.type === 'back-cover') {
            pageElement.addClass('hard back-cover');
        } else if (page.type === 'blank') {
            pageElement.addClass('hard');
        } else {
            pageElement.addClass('page');
        }
        
        // Add page content
        const contentDiv = $('<div>').addClass('page-content');
        
        if (page.content) {
            contentDiv.html(page.content);
        }
        
        if (page.imagePath && page.type !== 'cover' && page.type !== 'back-cover') {
            contentDiv.css('background-image', `url(${page.imagePath})`);
            contentDiv.css('background-size', 'cover');
            contentDiv.css('background-position', 'center');
        }
        
        // Add page number if appropriate
        if (page.type === 'content') {
            const pageNumber = $('<div>').addClass('page-number').text(index - 1); // Adjust for cover
            contentDiv.append(pageNumber);
        }
        
        pageElement.append(contentDiv);
        flipbook.append(pageElement);
    });
    
    // Initialize Turn.js
    flipbook.turn({
        width: 800,
        height: 600,
        elevation: 50,
        gradients: true,
        autoCenter: true,
        when: {
            turning: function(event, page, view) {
                // Update app state
                window.appState.currentPage = page - 1;
                
                // Update AR view if in AR mode
                if (window.appState.isARMode && window.updateARBookPage) {
                    window.updateARBookPage(page - 1);
                }
            }
        }
    });
    
    // Make responsive
    $(window).resize(function() {
        resizeBook();
    }).resize();
    
    // Function to resize book based on window
    function resizeBook() {
        const width = Math.min($(window).width() * 0.8, 800);
        const height = width * 0.75;
        
        flipbook.turn('size', width, height);
    }
    
    // Expose function to update page in normal view
    window.updateNormalBookPage = function(pageNum) {
        flipbook.turn('page', pageNum + 1);
    };
}
