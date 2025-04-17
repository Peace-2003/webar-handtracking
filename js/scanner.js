const Scanner = (function() {
    // Private variables
    let video = null;
    let canvas = null;
    let canvasContext = null;
    let scanning = false;
    let scanCallback = null;
    
    // Initialize scanner module
    function init(callback) {
        scanCallback = callback;
        
        // Create video and canvas elements for scanning
        video = document.createElement('video');
        canvas = document.createElement('canvas');
        canvasContext = canvas.getContext('2d');
        
        // Add video to scanner container
        const scannerContainer = document.getElementById('scanner');
        scannerContainer.appendChild(video);
        
        // Set up start button
        document.getElementById('start-scanner').addEventListener('click', startScanner);
    }
    
    // Start scanner camera
    function startScanner() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Hide start button
            document.getElementById('start-scanner').style.display = 'none';
            
            // Request camera access
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            })
            .then(function(stream) {
                video.srcObject = stream;
                video.setAttribute('playsinline', true); // Required for iOS
                video.play();
                
                document.getElementById('scanner-message').textContent = 'Scanning for QR code...';
                
                // Start looking for QR codes
                scanning = true;
                checkForQRCode();
            })
            .catch(function(error) {
                console.error('Camera error:', error);
                document.getElementById('scanner-message').textContent = 
                    'Camera access denied. Please allow camera access and try again.';
                document.getElementById('start-scanner').style.display = 'block';
            });
        } else {
            document.getElementById('scanner-message').textContent = 
                'Your browser does not support camera access.';
        }
    }
    
    // Check for QR codes in video feed
    function checkForQRCode() {
        if (!scanning) return;
        
        // Check if video is playing
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw current video frame to canvas
            canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Try to detect QR code
            // Note: We'll use a simple approach here for demo purposes
            // In a real app, you'd use a library like jsQR
            simulateQRCodeDetection();
        }
        
        // Continue checking for QR codes
        requestAnimationFrame(checkForQRCode);
    }
    
    // Simulate QR code detection (for demo purposes)
    // In a real app, replace this with actual QR code detection
    function simulateQRCodeDetection() {
        // For demo purposes, we'll use a button to simulate QR code detection
        const scanButton = document.createElement('button');
        scanButton.textContent = 'Simulate QR Scan';
        scanButton.className = 'btn';
        scanButton.style.position = 'absolute';
        scanButton.style.bottom = '10px';
        scanButton.style.left = '50%';
        scanButton.style.transform = 'translateX(-50%)';
        scanButton.style.zIndex = '5';
        
        document.getElementById('scanner').appendChild(scanButton);
        
        scanButton.addEventListener('click', function() {
            // Stop scanning
            stopScanner();
            
            // Call the callback with book ID
            if (scanCallback) {
                scanCallback('book1');
            }
            
            // Remove the button
            scanButton.remove();
        });
        
        // Stop the simulation after we've added the button
        scanning = false;
    }
    
    // Stop scanner
    function stopScanner() {
        scanning = false;
        
        // Stop all video tracks to release camera
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    }
    
    // Reset scanner
    function reset() {
        stopScanner();
        document.getElementById('start-scanner').style.display = 'block';
        document.getElementById('scanner-message').textContent = 'Position QR Code in the scanner';
    }
    
    // Return public API
    return {
        init: init,
        reset: reset,
        stop: stopScanner
    };
})();
