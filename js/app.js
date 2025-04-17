/**
 * Main App Module
 * Coordinates all components of the AR Book Experience
 */
const App = (function() {
    // Private variables
    let currentView = 'scanner';
    let bookData = null;
    
    // Initialize the app
    function init() {
        console.log('Initializing AR Book Experience app...');
        
        // Initialize scanner
        Scanner.init(handleBookScan);
        
        // Handle window resize
        window.addEventListener('resize', function() {
            // Update view sizes if needed
        });
    }
    
    // Handle successful book scan
    function handleBookScan(bookId) {
        console.log('Book scanned:', bookId);
        showLoading(true);
        
        // Load book data
        loadBookData(bookId)
            .then(function(data) {
                bookData = data;
                
                // Initialize viewers
                BookViewer.init(bookData);
                ARViewer.init(bookData);
                
                // Switch to AR view
                toggleView('ar');
                showLoading(false);
            })
            .catch(function(error) {
                console.error('Error loading book:', error);
                alert('Failed to load book. Please try again.');
                Scanner.restart();
                showLoading(false);
            });
    }
    
    // Load book data
    function loadBookData(bookId) {
        return new Promise(function(resolve, reject) {
            // Simulate API call with setTimeout
            setTimeout(function() {
                // For demo purposes, always return the same book data
                const data = {
                    id: bookId,
                    title: 'Sample Book',
                    author: 'John Doe',
                    pages: [
                        { type: 'cover', imagePath: 'assets/books/book1/cover.jpg', content: '' },
                        { type: 'content', imagePath: 'assets/books/book1/page1.jpg', content: '<h1>Chapter 1</h1><p>This is the beginning of the story...</p>' },
                        { type: 'content', imagePath: 'assets/books/book1/page2.jpg', content: '<p>The journey continues...</p>' },
                        { type: 'back-cover', imagePath: 'assets/books/book1/back-cover.jpg', content: '' }
                    ]
                };
                
                resolve(data);
            }, 1500);
        });
    }
    
    // Toggle between views
    function toggleView(viewName) {
        if (viewName === currentView) return;
        
        // Hide all views
        document.getElementById('scanner-view').style.display = 'none';
        document.getElementById('ar-view').style.display = 'none';
        document.getElementById('book-view').style.display = 'none';
        
        // Show selected view
        document.getElementById(`${viewName}-view`).style.display = 'block';
        currentView = viewName;
        
        // Special handling for AR view - needs to restart camera
        if (viewName === 'scanner') {
            Scanner.restart();
        }
    }
    
    // Show or hide loading indicator
    function showLoading(show) {
        document.getElementById('loading-indicator').style.display = show ? 'flex' : 'none';
    }
    
    // Start the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        toggleView: toggleView,
        showLoading: showLoading
    };
})();
