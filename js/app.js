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
        
        // Handle window resize and orientation changes
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', function(e) {
            if (currentView === 'ar') {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Handle window resize events
    function handleResize() {
        debugLog(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
        if (currentView === 'ar') {
            resetARView();
        }
    }
    
    // Reset AR view to fix camera issues
    function resetARView() {
        debugLog('Resetting AR view');
        // Get the AR scene element
        const arScene = document.querySelector('a-scene');
        
        if (arScene) {
            // Force redraw of AR scene
            arScene.style.display = 'none';
            setTimeout(() => {
                arScene.style.display = 'block';
                
                // Ensure camera entity is properly initialized
                const cameraEntity = document.querySelector('a-entity[camera]');
                if (cameraEntity) {
                    // Reset camera position if needed
                    cameraEntity.setAttribute('position', '0 0 0');
                    debugLog('Camera position reset');
                }
                
                // Make sure the canvas is full screen
                const canvas = document.querySelector('.a-canvas');
                if (canvas) {
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                    canvas.style.position = 'absolute';
                    canvas.style.left = '0';
                    canvas.style.top = '0';
                    canvas.style.zIndex = '0';
                    debugLog('Canvas style enforced');
                }
            }, 100);
        }
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
                            { type: 'cover', imagePath: 'assets/books/book1/cover.jpg', content: '' },
                            { type: 'content', imagePath: 'assets/books/book1/page1.jpg', content: '<h1>Chapter 1</h1><p>This is the beginning of the story...</p>' },
                            { type: 'content', imagePath: 'assets/books/book1/page2.jpg', content: '<p>The journey continues...</p>' },
                            { type: 'back-cover', imagePath: 'assets/books/book1/back-cover.jpg', content: '' }
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
            // Reset AR view to fix camera issues
            setTimeout(resetARView, 300);
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
        getBookData: getBookData,
        resetARView: resetARView
    };
})();
