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
        isLoading: false
    };
    
    // Initialize QR scanner
    initQRScanner(handleQRScanSuccess);
    
    // Expose app state to other modules
    window.appState = appState;
    
    /**
     * Handle successful QR scan
     * @param {string} qrData - Data encoded in QR code
     */
    function handleQRScanSuccess(qrData) {
        try {
            // Parse QR data (expects format: "book:bookId")
            const dataParts = qrData.split(':');
            if (dataParts[0] === 'book' && dataParts[1]) {
                const bookId = dataParts[1];
                loadBookExperience(bookId);
            } else {
                throw new Error('Invalid QR code format');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            alert('Could not process QR code. Please try again with a valid book QR code.');
        }
    }
    
    /**
     * Load the book experience based on book ID
     * @param {string} bookId - ID of the book to load
     */
    function loadBookExperience(bookId) {
        showLoading(true);
        appState.currentBookId = bookId;
        
        // Fetch book data
        fetchBookData(bookId)
            .then(bookData => {
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
                alert('Failed to load book. Please try again.');
                showLoading(false);
            });
    }
    
    /**
     * Fetch book data from server or local storage
     * @param {string} bookId - ID of the book to fetch
     * @returns {Promise} - Promise resolving to book data
     */
    function fetchBookData(bookId) {
        // For demo purposes, return mock data
        // In a real app, this would be a fetch request to an API
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: bookId,
                    title: 'Sample Book',
                    author: 'John Doe',
                    pages: [
                        { type: 'cover', imagePath: 'assets/books/book1/cover.jpg', content: '' },
                        { type: 'blank', imagePath: '', content: '' },
                        { type: 'content', imagePath: 'assets/books/book1/page1.jpg', content: '<h1>Chapter 1</h1><p>This is the beginning of our story. Once upon a time in a land far away...</p>' },
                        { type: 'content', imagePath: 'assets/books/book1/page2.jpg', content: '<p>The journey continued through the forest. The trees whispered secrets as the wind blew softly.</p>' },
                        { type: 'content', imagePath: 'assets/books/book1/page3.jpg', content: '<p>As night fell, stars illuminated the sky like diamonds scattered across black velvet.</p>' },
                        { type: 'content', imagePath: 'assets/books/book1/page4.jpg', content: '<h1>Chapter 2</h1><p>The morning brought new challenges and opportunities.</p>' },
                        { type: 'blank', imagePath: '', content: '' },
                        { type: 'back-cover', imagePath: 'assets/books/book1/back-cover.jpg', content: '' }
                    ]
                });
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
        showLoading
    };
});
