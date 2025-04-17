// Add this function to your existing toggleView function in app.js
function toggleView(viewName) {
    if (viewName === currentView) return;
    
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
        
        // Simple AR fix - force redraw of AR scene
        setTimeout(function() {
            const arScene = document.querySelector('a-scene');
            if (arScene) {
                arScene.style.width = '100%';
                arScene.style.height = '100%';
            }
            
            // Force canvas size
            const canvas = document.querySelector('.a-canvas');
            if (canvas) {
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.left = '0';
                canvas.style.top = '0';
            }
        }, 300);
    } else if (viewName === 'book') {
        // Fix for book view
        setTimeout(function() {
            const flipbook = document.getElementById('flipbook');
            if (flipbook) {
                flipbook.style.margin = '0 auto';
                flipbook.style.width = '90%';
            }
        }, 300);
    }
}
