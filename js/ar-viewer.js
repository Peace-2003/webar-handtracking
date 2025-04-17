const ARViewer = (function() {
    // Private variables
    let currentPage = 0;
    let totalPages = 0;
    let bookData = null;
    let arScene = null;
    
    // Initialize AR viewer
    function init(data) {
        bookData = data;
        totalPages = data.pages.length;
        
        // Create AR scene
        createARScene();
        
        // Set up controls
        document.getElementById('prev-page-ar').addEventListener('click', prevPage);
        document.getElementById('next-page-ar').addEventListener('click', nextPage);
        document.getElementById('toggle-mode-ar').addEventListener('click', function() {
            App.switchView('book');
        });
    }
    
    // Create AR scene
    function createARScene() {
        // Clear previous AR scene if exists
        const arView = document.getElementById('ar-view');
        if (arScene) {
            arView.removeChild(arScene);
        }
        
        // Create new AR scene
        arScene = document.createElement('a-scene');
        arScene.setAttribute('embedded', '');
        arScene.setAttribute('arjs', 'trackingMethod: best; sourceType: webcam; debugUIEnabled: false;');
        
        // Create marker
        const marker = document.createElement('a-marker');
        marker.setAttribute('type', 'pattern');
        marker.setAttribute('url', 'assets/markers/pattern.patt');
        
        // Create book model
        const bookEntity = document.createElement('a-entity');
        bookEntity.setAttribute('id', 'book-model');
        bookEntity.setAttribute('position', '0 0.5 0');
        bookEntity.setAttribute('rotation', '-90 0 0');
        
        // Add book cover plane
        const coverPlane = document.createElement('a-plane');
        coverPlane.setAttribute('width', '1');
        coverPlane.setAttribute('height', '1.4');
        coverPlane.setAttribute('position', '0 0 0');
        coverPlane.setAttribute('material', `src: ${bookData.pages[0].imagePath}; transparent: true`);
        
        // Add page plane (will be updated when turning pages)
        const pagePlane = document.createElement('a-plane');
        pagePlane.setAttribute('id', 'current-page');
        pagePlane.setAttribute('width', '1');
        pagePlane.setAttribute('height', '1.4');
        pagePlane.setAttribute('position', '0 0 0.01');
        pagePlane.setAttribute('material', `src: ${bookData.pages[0].imagePath}; transparent: true`);
        
        // Add entities to scene
        bookEntity.appendChild(coverPlane);
        bookEntity.appendChild(pagePlane);
        marker.appendChild(bookEntity);
        
        // Add camera
        const camera = document.createElement('a-entity');
        camera.setAttribute('camera', '');
        
        // Add all elements to scene
        arScene.appendChild(marker);
        arScene.appendChild(camera);
        
        // Add scene to view
        arView.insertBefore(arScene, arView.firstChild);
        
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
    function setPage(pageIndex) {
        if (pageIndex >= 0 && pageIndex < totalPages) {
            currentPage = pageIndex;
            
            // Update page in AR view
            const pagePlane = document.getElementById('current-page');
            if (pagePlane) {
                pagePlane.setAttribute('material', `src: ${bookData.pages[pageIndex].imagePath}; transparent: true`);
            }
            
            // Keep book viewer in sync
            BookViewer.setPage(pageIndex);
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
