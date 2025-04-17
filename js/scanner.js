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
    let cameraStream = null;
    let availableCameras = [];
    let currentCamera = 0;
    
    // Initialize the scanner
    function init(callback) {
        debugLog('Initializing scanner...');
        onScanSuccess = callback;
        
        // Get elements
        video = document.getElementById('camera-feed');
        canvas = document.getElementById('camera-canvas');
        canvasContext = canvas.getContext('2d');
        
        // Set up permission button
        const permissionButton = document.getElementById('camera-permission');
        permissionButton.addEventListener('click', startCamera);
        
        // Set up camera selection
        const cameraSelect = document.getElementById('camera-select');
        cameraSelect.addEventListener('change', function() {
            if (this.value) {
                switchCamera(this.value);
            }
        });
        
        // Set up camera switch button
        document.getElementById('switch-camera').addEventListener('click', function() {
            if (availableCameras.length > 1) {
                currentCamera = (currentCamera + 1) % availableCameras.length;
                switchCamera(availableCameras[currentCamera].deviceId);
            }
        });
        
        // Set up error dialog close button
        document.getElementById('error-close').addEventListener('click', function() {
            document.getElementById('error-dialog').style.display = 'none';
        });
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', adjustCameraView);
        window.addEventListener('resize', adjustCameraView);
    }
    
    // Adjust camera view on orientation/resize
    function adjustCameraView() {
        debugLog('Adjusting camera view for orientation change');
        if (video) {
            // Force redraw of video container
            const container = document.getElementById('camera-container');
            container.style.width = '100%';
            container.style.height = '60vh';
        }
    }
    
    // Start the camera
    function startCamera() {
        debugLog('Requesting camera permission...');
        document.getElementById('camera-permission').style.display = 'none';
        document.getElementById('scanner-message').textContent = 'Requesting camera access...';
        
        // Check for camera support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && navigator.mediaDevices.enumerateDevices) {
            // First enumerate all video devices to get ID of back camera if available
            navigator.mediaDevices.enumerateDevices()
                .then(function(devices) {
                    debugLog(`Found ${devices.length} media devices`);
                    
                    // Filter to only video input devices (cameras)
                    availableCameras = devices.filter(device => device.kind === 'videoinput');
                    debugLog(`Found ${availableCameras.length} cameras`);
                    
                    if (availableCameras.length === 0) {
                        showError('No cameras found on your device.');
                        return;
                    }
                    
                    // Populate camera select dropdown
                    const cameraSelect = document.getElementById('camera-select');
                    cameraSelect.innerHTML = '<option value="">Select Camera</option>';
                    
                    availableCameras.forEach((camera, index) => {
                        const option = document.createElement('option');
                        option.value = camera.deviceId;
                        option.text = camera.label || `Camera ${index + 1}`;
                        cameraSelect.appendChild(option);
                    });
                    
                    // Show camera options if more than one camera
                    if (availableCameras.length > 1) {
                        document.getElementById('camera-options').style.display = 'block';
                    }
                    
                    // Try to find back camera
                    let backCameraId = '';
                    for (const camera of availableCameras) {
                        if (camera.label && camera.label.toLowerCase().includes('back')) {
                            backCameraId = camera.deviceId;
                            break;
                        }
                    }
                    
                    // If no camera labeled as "back" found, use the last one (often the back camera on mobile)
                    if (!backCameraId && availableCameras.length > 1) {
                        backCameraId = availableCameras[availableCameras.length - 1].deviceId;
                    }
                    
                    // Start camera stream with appropriate constraints
                    return startCameraStream(backCameraId);
                })
                .catch(function(error) {
                    debugLog('Device enumeration error:', error);
                    // Fallback to simple camera request
                    startCameraStream('');
                });
        } else {
            debugLog('getUserMedia or enumerateDevices not supported');
            showError('Your browser does not support camera access. Please use a modern browser like Chrome or Firefox.');
        }
    }
    
    // Start camera stream with specific device ID if available
    function startCameraStream(deviceId) {
        debugLog(`Starting camera stream${deviceId ? ' with device ID: ' + deviceId : ''}`);
        
        // Prepare constraints - try to use back camera if available
        const constraints = { 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        };
        
        // Add device ID if available
        if (deviceId) {
            constraints.video.deviceId = { exact: deviceId };
        } else {
            // No specific device, try to use environment facing camera
            constraints.video.facingMode = { ideal: 'environment' };
        }
        
        // Request camera stream
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                debugLog('Camera access granted');
                
                // Store the stream for later stopping
                cameraStream = stream;
                
                // Connect camera stream to video element
                video.srcObject = stream;
                video.setAttribute('playsinline', true); // Required for iOS
                
                // Start scanning when video is playing
                video.onloadedmetadata = function() {
                    debugLog('Video metadata loaded, starting playback');
                    video.play()
                        .then(() => {
                            debugLog('Video playback started');
                            document.getElementById('scanner-message').textContent = 'Scanning for QR code...';
                            setTimeout(startScanning, 1000); // Give it a second to stabilize
                        })
                        .catch(err => {
                            debugLog('Video playback error:', err);
                            showError('Error starting video playback. Please reload the page and try again.');
                        });
                };
            })
            .catch(function(error) {
                debugLog('Camera access error:', error);
                
                // Show appropriate error message based on error type
                if (error.name === 'NotAllowedError') {
                    showError('Camera access denied. Please allow camera access in your browser settings and try again.');
                } else if (error.name === 'NotFoundError') {
                    showError('No camera found. Please connect a camera and reload the page.');
                } else if (error.name === 'NotReadableError') {
                    showError('Camera is in use by another application. Please close other applications using the camera.');
                } else {
                    showError(`Camera error: ${error.message}`);
                }
                
                // Show permission button again
                document.getElementById('camera-permission').style.display = 'block';
            });
    }
    
    // Switch to a different camera
    function switchCamera(deviceId) {
        debugLog(`Switching to camera with ID: ${deviceId}`);
        
        // Stop current camera stream
        stopScanning();
        
        // Start new camera stream
        startCameraStream(deviceId);
    }
    
    // Start scanning for QR codes
    function startScanning() {
        debugLog('Starting QR code scanning...');
        
        // Update canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        debugLog(`Canvas size set to ${canvas.width}x${canvas.height}`);
        
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
            
            try {
                // Scan for QR code
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });
                
                // Check if a QR code was found
                if (code) {
                    debugLog('QR code detected:', code.data);
                    
                    // Only accept codes starting with "book:"
                    if (code.data.startsWith('book:')) {
                        // Stop scanning
                        stopScanning();
                        
                        // Extract book ID
                        const bookId = code.data.split(':')[1];
                        
                        // Show success message
                        document.getElementById('scanner-message').textContent = 'QR code detected! Loading book...';
                        
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
            } catch (error) {
                debugLog('Error scanning QR code:', error);
                // Continue scanning despite errors
            }
        }
        
        // Continue scanning
        if (scanning) {
            requestAnimationFrame(scanFrame);
        }
    }
    
    // Stop scanning
    function stopScanning() {
        debugLog('Stopping QR scanner...');
        scanning = false;
        
        // Stop all tracks to release camera
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => {
                debugLog(`Stopping track: ${track.kind}`);
                track.stop();
            });
            cameraStream = null;
        }
    }
    
    // Restart scanning
    function restart() {
        debugLog('Restarting QR scanner...');
        stopScanning();
        document.getElementById('camera-permission').style.display = 'block';
        document.getElementById('scanner-message').textContent = 'Click button below to start camera';
    }
    
    // Show error message in dialog
    function showError(message) {
        debugLog('Error:', message);
        document.getElementById('error-message').textContent = message;
        document.getElementById('error-dialog').style.display = 'flex';
    }
    
    // Public API
    return {
        init: init,
        restart: restart,
        stopScanning: stopScanning
    };
})();

// Helper function for logging
function debugLog(message, error) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    if (error) {
        console.error(error);
    }
    
    // Update debug panel if it exists
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.textContent = logMessage;
    }
}
