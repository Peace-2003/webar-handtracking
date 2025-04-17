/**
 * Scanner Module
 * Handles QR code scanning functionality using jsQR library
 */
const Scanner = (function() {
    // Private variables
    let video = null;
    let canvas = null;
    let canvasContext = null;
    let scanning = false;
    let onScanSuccess = null;
    
    // Initialize the scanner
    function init(callback) {
        console.log('Initializing scanner...');
        onScanSuccess = callback;
        
        // Get elements
        video = document.getElementById('camera-feed');
        canvas = document.getElementById('camera-canvas');
        canvasContext = canvas.getContext('2d');
        
        // Set up permission button
        const permissionButton = document.getElementById('camera-permission');
        permissionButton.addEventListener('click', startCamera);
    }
    
    // Start the camera
    function startCamera() {
        console.log('Requesting camera permission...');
        document.getElementById('camera-permission').style.display = 'none';
        
        // Check for camera support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Request back camera if possible
            const constraints = { 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(stream) {
                    console.log('Camera access granted');
                    
                    // Connect camera stream to video element
                    video.srcObject = stream;
                    video.setAttribute('playsinline', true); // Required for iOS
                    
                    // Start scanning when video is playing
                    video.onloadedmetadata = function() {
                        video.play();
                        startScanning();
                    };
                })
                .catch(function(error) {
                    console.error('Camera access error:', error);
                    
                    // Show error message
                    document.getElementById('scanner-message').textContent = 
                        'Camera access denied. Please allow camera access and try again.';
                    document.getElementById('camera-permission').style.display = 'block';
                });
        } else {
            console.error('getUserMedia not supported');
            document.getElementById('scanner-message').textContent = 
                'Your browser does not support camera access.';
        }
    }
    
    // Start scanning for QR codes
    function startScanning() {
        console.log('Starting QR code scanning...');
        
        // Update canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        scanning = true;
        requestAnimationFrame(scanFrame);
    }
    
    // Scan each frame for QR codes
    function scanFrame() {
        if (!scanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Draw video frame to canvas
            canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get image data for QR code detection
            const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
            
            // Scan for QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            // Check if a QR code was found
            if (code) {
                console.log('QR code detected:', code.data);
                
                // Only accept codes starting with "book:"
                if (code.data.startsWith('book:')) {
                    // Stop scanning
                    stopScanning();
                    
                    // Extract book ID
                    const bookId = code.data.split(':')[1];
                    
                    // Call success callback
                    if (onScanSuccess) {
                        onScanSuccess(bookId);
                    }
                } else {
                    // Invalid format
                    document.getElementById('scanner-message').textContent = 
                        'Invalid QR code format. Please scan a book QR code.';
                }
            }
        }
        
        // Continue scanning
        if (scanning) {
            requestAnimationFrame(scanFrame);
        }
    }
    
    // Stop scanning
    function stopScanning() {
        console.log('Stopping QR scanner...');
        scanning = false;
        
        // Stop all tracks to release camera
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
    }
    
    // Restart scanning
    function restart() {
        stopScanning();
        document.getElementById('camera-permission').style.display = 'block';
        document.getElementById('scanner-message').textContent = 'Position the QR code in the center';
    }
    
    // Public API
    return {
        init: init,
        restart: restart,
        stopScanning: stopScanning
    };
})();
