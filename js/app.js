/**
 * Main Application Controller
 * Initializes and coordinates the components of the AR Book Experience
 */
document.addEventListener('DOMContentLoaded', function() {
    // Debug logging system
    window.debugLog = function(message, error = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        console.log(logMessage);
        
        // Append to visible debug area
        const debugArea = document.getElementById('debug-area') || createDebugArea();
        const logEntry = document.createElement('div');
        logEntry.className = error ? 'log-error' : 'log-info';
        logEntry.textContent = error ? `${message}: ${error.message || error}` : message;
        debugArea.appendChild(logEntry);
        
        // Scroll to bottom
        debugArea.scrollTop = debugArea.scrollHeight;
        
        // If error, also log the stack trace
        if (error && error.stack) {
            console.error(error.stack);
        }
    }
    
    function createDebugArea() {
        const debugArea = document.createElement('div');
        debugArea.id = 'debug-area';
        debugArea.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 150px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            overflow-y: auto;
            z-index: 9999;
            display: none;
        `;
        
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Debug';
        toggleButton.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            z-index: 10000;
            padding: 5px 10px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
        `;
        toggleButton.addEventListener('click', function() {
            const debugArea = document.getElementById('debug-area');
            if (debugArea.style.display === 'none') {
                debugArea.style.display = 'block';
                this.textContent = 'Hide Debug';
            } else {
                debugArea.style.display = 'none';
                this.textContent = 'Show Debug';
            }
        });
        
        document.body.appendChild(debugArea);
        document.body.appendChild(toggleButton);
        return debugArea;
    }
    
    // Application state
    const appState = {
        isARMode: true,
        currentBookId: null,
        currentPage: 0,
        totalPages: 0,
        isLoading: false,
        scanner: null
    };
    
    debugLog("Application starting");
    debugLog(`Browser: ${navigator.userAgent}`);
    debugLog(`Screen: ${window.innerWidth}x${window.innerHeight}`);
    
    // Check camera capabilities
    checkCameraCapabilities();
    
    // Initialize QR scanner
    appState.scanner = initQRScanner(handleQRScanSuccess);
    
    // Expose app state to other modules
    window.appState = appState;
    
    // Disable scrolling
    disableScroll();
    
    /**
     * Check camera capabilities before initializing scanner
     */
    function checkCameraCapabilities() {
        debugLog("Checking camera capabilities");
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            debugLog("getUserMedia is not supported in this browser", new Error("API not available"));
            return false;
        }
        
        // List available media devices
        if (navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    debugLog(`Found ${videoDevices.length} video input devices`);
                    
                    videoDevices.forEach((device, index) => {
                        debugLog(`Camera ${index+1}: ${device.label || 'Unnamed camera'} (${device.deviceId.substring(0, 10)}...)`);
                    });
                })
                .catch(err => {
                    debugLog("Failed to enumerate devices", err);
                });
        } else {
            debugLog("enumerateDevices not supported");
        }
        
        return true;
    }
    
    /**
     * Disable scrolling completely
     */
    function disableScroll() {
        // Lock scroll position, but allow scroll events
        document.body.style.cssText = `
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
        `;
        
        // Prevent scrolling with arrow keys, space, page up/down
        window.addEventListener('keydown', function(e) {
            // Space, page up, page down, end, home, arrows
            if([32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
                return false;
            }
        }, false);
        
        // Disable touch scrolling
        document.addEventListener('touchmove', function(e) {
            if (e.target.className.indexOf('scrollable') === -1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        debugLog("Scroll disabled");
    }
    
    /**
     * Handle successful QR scan
     * @param {string} bookId - Book ID extracted from QR code
     */
    function handleQRScanSuccess(bookId) {
        try {
            // Log success
            debugLog("Successfully scanned QR code for book:", bookId);
            
            // Validate book ID
            if (!bookId || bookId.trim() === '') {
                throw new Error('Invalid book ID');
            }
            
            // Load book experience
            loadBookExperience(bookId);
        } catch (error) {
            debugLog('Error processing QR code:', error);
            appState.scanner.showError("processing_error");
            // Don't proceed to loading book experience
        }
    }
    
    /**
     * Load the book experience based on book ID
     * @param {string} bookId - ID of the book to load
     */
    function loadBookExperience(bookId) {
        showLoading(true);
        appState.currentBookId = bookId;
        
        debugLog("Loading book experience for:", bookId);
        
        // Use a fixed book ID for testing if needed
        const actualBookId = "book1"; // For testing, always load book1
        
        // Fetch book data
        fetchBookData(actualBookId)
            .then(bookData => {
                debugLog("Book data loaded successfully:", bookData.id);
                
                if (!bookData || !bookData.pages || bookData.pages.length === 0) {
                    throw new Error('Invalid book data structure');
                }
                
                appState.totalPages = bookData.pages.length;
                
                // Initialize AR book
                initARBook(bookData);
                
                // Initialize normal book viewer
                initBookViewer(bookData);
                
                // Initialize navigation controls
                initBookController();
                
                // Show AR scene by default
                toggleViewMode(true);
                
                showLoading(false);
            })
            .catch(error => {
                debugLog('Error loading book:', error);
                alert(`Failed to load book: ${error.message}. Please check your QR code and try again.`);
                showLoading(false);
                
                // Reset scanner to allow trying again
                appState.scanner.restart();
                document.getElementById('scanner-container').style.display = 'block';
                document.getElementById('qr-result').innerHTML = '';
            });
    }
    
    /**
     * Fetch book data from server or local storage
     * @param {string} bookId - ID of the book to fetch
     * @returns {Promise} - Promise resolving to book data
     */
    function fetchBookData(bookId) {
        // Log the book ID to help with debugging
        debugLog("Attempting to load book with ID:", bookId);
        
        // For demo/testing purposes, always return hardcoded data
        // In a real app, you would fetch this from a server
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    resolve({
                        id: bookId,
                        title: 'Sample Book',
                        author: 'John Doe',
                        pages: [
                            { type: 'cover', imagePath: `assets/books/book1/cover.jpg`, content: '' },
                            { type: 'blank', imagePath: '', content: '' },
                            { type: 'content', imagePath: `assets/books/book1/page1.jpg`, content: '<h1>Chapter 1</h1><p>This is the beginning of our story. Once upon a time in a land far away...</p>' },
                            { type: 'content', imagePath: `assets/books/book1/page2.jpg`, content: '<p>The journey continued through the forest. The trees whispered secrets as the wind blew softly.</p>' },
                            { type: 'content', imagePath: `assets/books/book1/page3.jpg`, content: '<p>As night fell, stars illuminated the sky like diamonds scattered across black velvet.</p>' },
                            { type: 'content', imagePath: `assets/books/book1/page4.jpg`, content: '<h1>Chapter 2</h1><p>The morning brought new challenges and opportunities.</p>' },
                            { type: 'blank', imagePath: '', content: '' },
                            { type: 'back-cover', imagePath: `assets/books/book1/back-cover.jpg`, content: '' }
                        ]
                    });
                } catch (error) {
                    debugLog("Error creating book data:", error);
                    throw error;
                }
            }, 1500);
        });
    }
    
    /**
     * Toggle between AR mode and normal book viewer
     * @param {boolean} showAR - Whether to show AR mode
     */
    function toggleViewMode(showAR) {
        appState.isARMode = showAR;
        
        if (showAR) {
            document.getElementById('scanner-container').style.display = 'none';
            document.getElementById('ar-scene-container').style.display = 'block';
            document.getElementById('book-viewer-container').style.display = 'none';
            debugLog("Switched to AR mode");
        } else {
            document.getElementById('scanner-container').style.display = 'none';
            document.getElementById('ar-scene-container').style.display = 'none';
            document.getElementById('book-viewer-container').style.display = 'block';
            debugLog("Switched to normal book view mode");
            
            // Ensure the normal book viewer shows the same page as AR
            if (typeof updateNormalBookPage === 'function') {
                updateNormalBookPage(appState.currentPage);
            }
        }
    }
    
    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show loading indicator
     */
    function showLoading(show) {
        appState.isLoading = show;
        document.getElementById('loading-container').style.display = show ? 'flex' : 'none';
        debugLog(show ? "Loading indicator shown" : "Loading indicator hidden");
    }
    
    // Expose necessary functions to window for access from other modules
    window.appFunctions = {
        toggleViewMode,
        showLoading,
        restartScanner: function() {
            debugLog("Restarting scanner");
            if (appState.scanner) {
                appState.scanner.restart();
            }
            document.getElementById('scanner-container').style.display = 'block';
            document.getElementById('ar-scene-container').style.display = 'none';
            document.getElementById('book-viewer-container').style.display = 'none';
        }
    };
});
