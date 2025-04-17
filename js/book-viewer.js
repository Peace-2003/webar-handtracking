const BookViewer = (function() {
    // Private variables
    let currentPage = 0;
    let totalPages = 0;
    let bookData = null;
    let bookElement = null;
    
    // Initialize book viewer
    function init(data) {
        bookData = data;
        totalPages = data.pages.length;
        bookElement = document.getElementById('book');
        
        // Create book
        createBook();
        
        // Set up controls
        document.getElementById('prev-page-book').addEventListener('click', prevPage);
        document.getElementById('next-page-book').addEventListener('click', nextPage);
        document.getElementById('toggle-mode-book').addEventListener('click', function() {
            App.switchView('ar');
        });
    }
    
    // Create book
    function createBook() {
        // Clear previous book if exists
        bookElement.innerHTML = '';
        
        try {
            // Try to initialize book with Turn.js
            initTurnJsBook();
        } catch (error) {
            console.error('Turn.js initialization failed:', error);
            // Fallback to simple book viewer
            initSimpleBook();
        }
    }
    
    // Initialize book with Turn.js
    function initTurnJsBook() {
        // Create book structure
        const flipbook = document.createElement('div');
        flipbook.id = 'flipbook';
        bookElement.appendChild(flipbook);
        
        // Add pages
        bookData.pages.forEach((page) => {
            const pageElement = document.createElement('div');
            
            // Set background image
            if (page.imagePath) {
                pageElement.style.backgroundImage = `url(${page.imagePath})`;
                pageElement.style.backgroundSize = 'cover';
                pageElement.style.backgroundPosition = 'center';
            }
            
            // Add page content if any
            if (page.content) {
                const contentElement = document.createElement('div');
                contentElement.className = 'page-content';
                contentElement.innerHTML = page.content;
                pageElement.appendChild(contentElement);
            }
            
            // Add page to flipbook
            flipbook.appendChild(pageElement);
        });
        
        // Initialize Turn.js
        $(flipbook).turn({
            width: Math.min(window.innerWidth * 0.9, 800),
            height: Math.min(window.innerHeight * 0.8, 600),
            autoCenter: true,
            when: {
                turning: function(event, page, view) {
                    // Page is 1-based in Turn.js
                    setPage(page - 1, false);
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            $(flipbook).turn('size', 
                Math.min(window.innerWidth * 0.9, 800),
                Math.min(window.innerHeight * 0.8, 600)
            );
        });
        
        // Set initial page
        setPage(0);
    }
    
    // Initialize simple book (fallback)
    function initSimpleBook() {
        // Create simple book viewer
        const simpleBook = document.createElement('div');
        simpleBook.className = 'simple-book';
        simpleBook.style.width = '100%';
        simpleBook.style.height = '100%';
        simpleBook.style.display = 'flex';
        simpleBook.style.justifyContent = 'center';
        simpleBook.style.alignItems = 'center';
        
        // Create page container
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        pageContainer.style.width = '80%';
        pageContainer.style.height = '80%';
        pageContainer.style.backgroundColor = 'white';
        pageContainer.style.backgroundSize = 'contain';
        pageContainer.style.backgroundPosition = 'center';
        pageContainer.style.backgroundRepeat = 'no-repeat';
        
        simpleBook.appendChild(pageContainer);
        bookElement.appendChild(simpleBook);
        
        // Set initial page
        setPage(0);
    }
    
    // Go to previous page
    function prevPage() {
        if (currentPage > 0) {
            setPage(currentPage - 1);
        }
    }
    
    // Go to next page
    function nextPage() {
        if (currentPage < totalPages - 1) {
            setPage(currentPage + 1);
        }
    }
    
    // Set current page
    function setPage(pageIndex, updateAR = true) {
        if (pageIndex >= 0 && pageIndex < totalPages) {
            currentPage = pageIndex;
            
            // Update Turn.js book if it exists
            const flipbook = document.getElementById('flipbook');
            if (flipbook && $(flipbook).turn) {
                // Page is 1-based in Turn.js
                $(flipbook).turn('page', pageIndex + 1);
            }
            
            // Update simple book if it exists
            const pageContainer = document.querySelector('.page-container');
            if (pageContainer) {
                pageContainer.style.backgroundImage = `url(${bookData.pages[pageIndex].imagePath})`;
                
                // Add content if any
                if (bookData.pages[pageIndex].content) {
                    pageContainer.innerHTML = bookData.pages[pageIndex].content;
                } else {
                    pageContainer.innerHTML = '';
                }
            }
            
            // Keep AR viewer in sync if needed
            if (updateAR) {
                ARViewer.setPage(pageIndex);
            }
        }
    }
    
    // Get current page index
    function getCurrentPage() {
        return currentPage;
    }
    
    // Return public API
    return {
        init: init,
        prevPage: prevPage,
        nextPage: nextPage,
        setPage: setPage,
        getCurrentPage: getCurrentPage
    };
})();
