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
    let arInitialized = false;
    
    // Initialize the AR book viewer
    function init(data) {
        debugLog('Initializing AR viewer...');
        bookData = data;
        totalPages = data.pages.length;
        
        // Wait for A-Frame to be ready
        document.addEventListener('DOMContentLoaded', function() {
            // Check if A-Frame is loaded
            if (typeof AFRAME !== 'undefined') {
                // Wait for scene to load
                const scene = document.querySelector('a-scene');
                if (scene.hasLoaded) {
                    initAR();
                } else {
                    scene.addEventListener('loaded', initAR);
                }
            } else {
                debugLog('A-Frame not loaded, waiting...');
                // Retry after a delay
                setTimeout(function() {
                    if (typeof AFRAME !== 'undefined') {
                        initAR();
                    } else {
                        debugLog('A-Frame failed to load');
                    }
                }, 2000);
            }
        });
        
        // Set up event listeners
        document.getElementById('next-btn-ar').addEventListener('click', nextPage);
        document.getElementById('prev-btn-ar').addEventListener('click', prevPage);
        document.getElementById('toggle-ar').addEventListener('click', function() {
            App.toggleView('book');
        });
    }
    
    // Initialize AR scene
    function initAR() {
        debugLog('Setting up AR book model');
        try {
            // Get book model entity
            bookEntity = document.getElementById('book-model');
            if (!bookEntity) {
                debugLog('Book model entity not found');
                return;
            }
            
            // Clear any existing content
            while (bookEntity.firstChild) {
                bookEntity.removeChild(bookEntity.firstChild);
            }
            
            // Create book cover entity
            const coverEntity = document.createElement('a-plane');
            coverEntity.setAttribute('width', 1);
            coverEntity.setAttribute('height', 1.4142); // A4 ratio
            coverEntity.setAttribute('position', '0 0 0');
            
            // Preload texture to avoid rendering issues
            const coverImg = new Image();
            coverImg.onload = function() {
                coverEntity.setAttribute('material', {
                    src: bookData.pages[0].imagePath,
                    transparent: true,
                    opacity: 1
                });
                debugLog('Cover texture loaded');
            };
            coverImg.onerror = function() {
                debugLog('Error loading cover texture');
                coverEntity.setAttribute('color', '#ffffff');
            };
            coverImg.src = bookData.pages[0].imagePath;
            
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
            arInitialized = true;
            debugLog('AR book initialized successfully');
        } catch (error) {
            debugLog('Error initializing AR book:', error);
        }
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
        try {
            if (pageNum >= 0 && pageNum < totalPages) {
                currentPage = pageNum;
                debugLog(`Setting AR book to page ${pageNum + 1}`);
                
                // Update page content in AR
                const pageEntity = document.getElementById('ar-page');
                if (pageEntity) {
                    pageEntity.setAttribute('visible', true);
                    
                    // Preload texture
                    const pageImg = new Image();
                    pageImg.onload = function() {
                        pageEntity.setAttribute('material', {
                            src: bookData.pages[pageNum].imagePath,
                            transparent: true,
                            opacity: 1
                        });
                    };
                    pageImg.onerror = function() {
                        debugLog('Error loading page texture');
                        pageEntity.setAttribute('color', '#ffffff');
                    };
                    
                    if (bookData.pages[pageNum].imagePath) {
                        pageImg.src = bookData.pages[pageNum].imagePath;
                    } else {
                        pageEntity.setAttribute('color', '#ffffff');
                    }
                }
                
                // Sync with book viewer if not already in sync
                if (BookViewer.getCurrentPage() !== currentPage) {
                    BookViewer.setPage(currentPage);
                }
            }
        } catch (error) {
            debugLog('Error setting AR page:', error);
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
