/**
 * Main Application Controller
 * Initializes and coordinates the components of the AR Book Experience
 */
document.addEventListener('DOMContentLoaded', function() {
    // Application state
    const appState = {
        isARMode: true,
        currentBookId: null,
        currentPage: 0,
        totalPages: 0,
        isLoading: false,
        scanner: null
    };
    
    // Initialize QR scanner
    appState.scanner = initQRScanner(handleQRScanSuccess);
    
    // Expose app state to other modules
    window.appState = appState;
    
    // Disable scrolling
    disableScroll();
    
    /**
     * Disable scrolling completely
     */
    function disableScroll() {
        // Get current scroll position
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Prevent scrolling with arrow keys, space, page up/down
        window.onscroll = function() {
            window.scrollTo(scrollLeft, scrollTop);
        };
        
        // Disable keyboard scrolling
        window.addEventListener('keydown', function(e) {
            // Space, page up, page down, end, home, arrows
            if([32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
                return false;
            }
        }, false);
        
        // Disable touch scrolling
        document.body.addEventListener('touchmove', function(e) {
            e.preventDefault();
        }, { passive: false });
    }
    
    /**
     * Handle successful QR scan
     * @param {string} bookId - Book ID extracted from QR code
     */
    function handleQRScanSuccess(bookId) {
        try {
            // Validate book ID
            if (!bookId || bookId.trim() === '') {
                throw new Error('Invalid book ID');
            }
            
            // Load book experience
            loadBookExperience(bookId);
        } catch (error) {
            console.error('Error processing QR code:', error);
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
        
        console.log("Loading book experience for:", bookId);
        
        // Fetch book data
        fetchBookData(bookId)
            .then(bookData => {
                console.log("Book data loaded successfully:", bookData.id);
                
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
                console.error('Error loading book:', error);
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
        console.log("Attempting to load book with ID:", bookId);
        
        // Check if book assets exist before attempting to load
        function checkImageExists(url) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
            });
        }
        
        return new Promise((resolve, reject) => {
            // First check if cover image exists
            checkImageExists(`assets/books/${bookId}/cover.jpg`)
                .then(exists => {
                    if (!exists) {
                        console.error(`Cover image for book ${bookId} not found`);
                        reject(new Error(`Book assets not found for ${bookId}`));
                        return;
                    }
                    
                    // If cover exists, proceed with loading book data
                    setTimeout(() => {
                        try {
                            resolve({
                                id: bookId,
                                title: 'Sample Book',
                                author: 'John Doe',
                                pages: [
                                    { type: 'cover', imagePath: `assets/books/${bookId}/cover.jpg`, content: '' },
                                    { type: 'blank', imagePath: '', content: '' },
                                    { type: 'content', imagePath: `assets/books/${bookId}/page1.jpg`, content: '<h1>Chapter 1</h1><p>This is the beginning of our story. Once upon a time in a land far away...</p>' },
                                    { type: 'content', imagePath: `assets/books/${bookId}/page2.jpg`, content: '<p>The journey continued through the forest. The trees whispered secrets as the wind blew softly.</p>' },
                                    { type: 'content', imagePath: `assets/books/${bookId}/page3.jpg`, content: '<p>As night fell, stars illuminated the sky like diamonds scattered across black velvet.</p>' },
                                    { type: 'content', imagePath: `assets/books/${bookId}/page4.jpg`, content: '<h1>Chapter 2</h1><p>The morning brought new challenges and opportunities.</p>' },
                                    { type: 'blank', imagePath: '', content: '' },
                                    { type: 'back-cover', imagePath: `assets/books/${bookId}/back-cover.jpg`, content: '' }
                                ]
                            });
                        } catch (error) {
                            console.error("Error creating book data:", error);
                            reject(error);
                        }
                    }, 1500);
                });
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
        } else {
            document.getElementById('scanner-container').style.display = 'none';
            document.getElementById('ar-scene-container').style.display = 'none';
            document.getElementById('book-viewer-container').style.display = 'block';
            
            // Ensure the normal book viewer shows the same page as AR
            updateNormalBookPage(appState.currentPage);
        }
    }
    
    /**
     * Show or hide loading indicator
     * @param {boolean} show - Whether to show loading indicator
     */
    function showLoading(show) {
        appState.isLoading = show;
        document.getElementById('loading-container').style.display = show ? 'flex' : 'none';
    }
    
    // Expose necessary functions to window for access from other modules
    window.appFunctions = {
        toggleViewMode,
        showLoading,
        restartScanner: function() {
            if (appState.scanner) {
                appState.scanner.restart();
            }
            document.getElementById('scanner-container').style.display = 'block';
            document.getElementById('ar-scene-container').style.display = 'none';
            document.getElementById('book-viewer-container').style.display = 'none';
        }
    };
});
