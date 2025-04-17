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
        debugLog('Initializing AR Book Experience app...');
        
        // Initialize debug panel toggle
        document.getElementById('debug-toggle').addEventListener('click', function() {
            const debugPanel = document.getElementById('debug-panel');
            const debugInfo = document.getElementById('debug-info');
            
            if (debugInfo.style.display === 'none') {
                debugInfo.style.display = 'block';
                this.textContent = 'Hide Debug';
            } else {
                debugInfo.style.display = 'none';
                this.textContent = 'Show Debug';
            }
        });
        
        // Log device info
        debugLog(`Device: ${navigator.userAgent}`);
        debugLog(`Screen: ${window.innerWidth}x${window.innerHeight}`);
        
        // Check if running on HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            debugLog('Warning: Running without HTTPS. AR features may not work.');
        }
        
        // Initialize scanner
        Scanner.init(handleBookScan);
        
        // Handle window resize
        window.addEventListener('resize', function() {
            debugLog(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
        });
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', function(e) {
            if (currentView === 'ar') {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Handle successful book scan
    function handleBookScan(bookId) {
        debugLog('Book scanned:', bookId);
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
                debugLog('Error loading book:', error);
                alert('Failed to load book. Please try again.');
                Scanner.restart();
                showLoading(false);
            });
    }
    
    // Load book data
    function loadBookData(bookId) {
        return new Promise(function(resolve, reject) {
            debugLog(`Loading book data for ID: ${bookId}`);
            
            // Simulate API call with setTimeout
            setTimeout(function() {
                try {
                    // For demo purposes, always return the same book data
                    const data = {
                        id: bookId,
                        title: 'Sample Book',
                        author: 'John Doe',
                        pages: [
                            { type: 'cover', imagePath: 'assets/books/book1/cover.png', content: '' },
                            { type: 'content', imagePath: 'assets/books/book1/page1.png', content: '<h1>Chapter 1</h1><p>This is the beginning of the story...</p>' },
                            { type: 'content', imagePath: 'assets/books/book1/page2.png', content: '<p>The journey continues...</p>' },
                            { type: 'back-cover', imagePath: 'assets/books/book1/back-cover.png', content: '' }
                        ]
                    };
                    
                    // Check if images exist by preloading cover
                    const coverImg = new Image();
                    coverImg.onload = function() {
                        debugLog('Book data loaded successfully');
                        resolve(data);
                    };
                    coverImg.onerror = function() {
                        debugLog('Error: Book assets not found');
                        reject(new Error('Book assets not found. Please check the book ID and try again.'));
                    };
                    coverImg.src = data.pages[0].imagePath;
                } catch (error) {
                    debugLog('Error creating book data:', error);
                    reject(error);
                }
            }, 1500);
        });
    }
    
    // Toggle between views
    function toggleView(viewName) {
        if (viewName === currentView) return;
        
        debugLog(`Switching view from ${currentView} to ${viewName}`);
        
        // Hide all views
        document.getElementById('scanner-view').style.display = 'none';
        document.getElementById('ar-view').style.display = 'none';
        document.getElementById('book-view').style.display = 'none';
        
        // Show selected view
        document.getElementById(`${viewName}-view`).style.display = 'block';
        currentView = viewName;
        
        // Special handling for views
        if (viewName === 'scanner') {
            Scanner.restart();
        } else if (viewName === 'ar') {
            // Stop scanner to save resources
            Scanner.stopScanning();
        }
    }
    
    // Show or hide loading indicator
    function showLoading(show) {
        document.getElementById('loading-indicator').style.display = show ? 'flex' : 'none';
        debugLog(show ? 'Loading indicator shown' : 'Loading indicator hidden');
    }
    
    // Get current book data
    function getBookData() {
        return bookData;
    }
    
    // Start the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        toggleView: toggleView,
        showLoading: showLoading,
        getBookData: getBookData
    };
})();
