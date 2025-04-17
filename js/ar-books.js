/**
 * AR Book Module
 * Handles the augmented reality book experience
 */

/**
 * Initialize AR book experience
 * @param {Object} bookData - Book data with pages information
 */
function initARBook(bookData) {
    const bookModel = document.getElementById('book-model');
    
    // Clear any existing content
    while (bookModel.firstChild) {
        bookModel.removeChild(bookModel.firstChild);
    }
    
    // Create book entity
    const bookEntity = document.createElement('a-entity');
    bookEntity.id = 'ar-book';
    bookEntity.setAttribute('position', '0 0 0');
    
    // Register custom component for page turning if not already registered
    if (!AFRAME.components['page-turner']) {
        AFRAME.registerComponent('page-turner', {
            schema: {
                totalPages: {type: 'number', default: 0},
                currentPage: {type: 'number', default: 0}
            },
            
            init: function() {
                this.lastPage = this.data.currentPage;
            },
            
            update: function() {
                if (this.data.currentPage !== this.lastPage) {
                    this.turnPage(this.data.currentPage);
                    this.lastPage = this.data.currentPage;
                }
            },
            
            turnPage: function(pageNum) {
                // Animation logic for page turning
                const pageElements = this.el.querySelectorAll('.ar-page');
                
                pageElements.forEach((page, index) => {
                    const isVisible = index === pageNum || index === pageNum + 1;
                    const rotationY = index <= pageNum ? -180 : 0;
                    
                    // Set visibility
                    page.setAttribute('visible', isVisible);
                    
                    // Animate page turning
                    if (index === pageNum || index === pageNum - 1) {
                        page.setAttribute('animation', {
                            property: 'rotation',
                            to: `0 ${rotationY} 0`,
                            dur: 1000,
                            easing: 'easeOutQuad'
                        });
                    } else {
                        page.setAttribute('rotation', `0 ${rotationY} 0`);
                    }
                });
            }
        });
    }
    
    // Add page-turner component to book entity
    bookEntity.setAttribute('page-turner', {
        totalPages: bookData.pages.length,
        currentPage: 0
    });
    
    // Create pages
    bookData.pages.forEach((page, index) => {
        const pageEntity = document.createElement('a-plane');
        pageEntity.classList.add('ar-page');
        
        // Set page properties
        pageEntity.setAttribute('width', 1);
        pageEntity.setAttribute('height', 1.4142); // Approximation of A4 ratio
        pageEntity.setAttribute('position', `0 0 ${0.005 * index}`); // Slight z-offset for pages
        pageEntity.setAttribute('rotation', `0 ${index > 0 ? 0 : -180} 0`);
        pageEntity.setAttribute('visible', index < 2); // Only first two pages visible initially
        
        // Set page material
        if (page.imagePath) {
            pageEntity.setAttribute('material', {
                src: page.imagePath,
                transparent: true,
                opacity: 1,
                side: 'double'
            });
        } else {
            // For pages without images, use a plain color
            pageEntity.setAttribute('color', '#FFFFFF');
            pageEntity.setAttribute('material', {
                side: 'double'
            });
            
            // Add text if there's content
            if (page.content) {
                // For simplicity, we're not rendering HTML in AR
                // In a real app, you'd convert HTML to texture or use a canvas
                const textEntity = document.createElement('a-text');
                textEntity.setAttribute('value', stripHTML(page.content));
                textEntity.setAttribute('width', 0.9);
                textEntity.setAttribute('color', '#000000');
                textEntity.setAttribute('align', 'center');
                textEntity.setAttribute('position', '0 0 0.001');
                pageEntity.appendChild(textEntity);
            }
        }
        
        // Add page to book
        bookEntity.appendChild(pageEntity);
    });
    
    // Add book to scene
    bookModel.appendChild(bookEntity);
    
    // Function to update page in AR view
    window.updateARBookPage = function(pageNum) {
        bookEntity.setAttribute('page-turner', {
            totalPages: bookData.pages.length,
            currentPage: pageNum
        });
        
        // Update app state
        window.appState.currentPage = pageNum;
    };
}

/**
 * Utility function to strip HTML for text display
 * @param {string} html - HTML string to strip
 * @returns {string} - Plain text
 */
function stripHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
}
