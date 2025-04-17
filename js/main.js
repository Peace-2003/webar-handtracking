const App = (function() {
    // Private variables
    let currentView = 'scanner';
    let bookData = null;
    
    // Initialize application
    function init() {
        console.log('Initializing AR Book Experience app');
        
        // Initialize scanner
        Scanner.init(handleQRScan);
    }
    
    // Handle QR code scan
    function handleQRScan(bookId) {
        console.log('QR code scanned:', bookId);
        showLoading(true);
        
        // Load book data
        loadBookData(bookId)
            .then(function(data) {
                bookData = data;
                
                // Initialize viewers
                ARViewer.init(bookData);
                BookViewer.init(bookData);
                
                // Switch to AR view
                switchView('ar');
                showLoading(false);
            })
            .catch(function(error) {
                console.error('Error loading book:', error);
                alert('Failed to load book data. Please try again.');
                showLoading(false);
                Scanner.reset();
            });
    }
    
    // Load book data
    function loadBookData(bookId) {
        return new Promise((resolve, reject) => {
            console.log('Loading book data for:', bookId);
            
            // In a real application, this would be an API call
            // For demo purposes, we'll create mock data
            setTimeout(() => {
                try {
                    const data = {
                        id: bookId,
                        title: 'Demo Book',
                        pages: [
                            { 
                                type: 'cover',
                                imagePath: 'assets/books/book1/cover.jpg',
                                content: ''
                            },
                            { 
                                type: 'page',
                                imagePath: 'assets/books/book1/page1.jpg',
                                content: '<h2>Chapter 1</h2><p>This is the first page of our book.</p>'
                            },
                            { 
                                type: 'page',
                                imagePath: 'assets/books/book1/page2.jpg',
                                content: '<p>This is the second page with more content.</p>'
                            },
                            { 
                                type: 'back',
                                imagePath: 'assets/books/book1/back.jpg',
                                content: ''
                            }
                        ]
                    };
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            }, 1500);
        });
    }
    
    // Switch between views
    function switchView(viewName) {
        if (viewName === currentView) return;
        
        // Hide all views
        document.getElementById('scanner-view').style.display = 'none';
        document.getElementById('ar-view').style.display = 'none';
        document.getElementById('book-view').style.display = 'none';
        
        // Show selected view
        document.getElementById(`${viewName}-view`).style.display = 'block';
        
        // Update current view
        currentView = viewName;
        
        // Special handling for views
        if (viewName === 'scanner') {
            Scanner.reset();
        }
    }
    
    // Show/hide loading indicator
    function showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }
    
    // Initialize app when document is ready
    document.addEventListener('DOMContentLoaded', init);
    
    // Return public API
    return {
        switchView: switchView,
        showLoading: showLoading
    };
})();
