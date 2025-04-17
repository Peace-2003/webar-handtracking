/**
 * QR Scanner Module
 * Handles QR code scanning functionality
 */

/**
 * Initialize QR code scanner
 * @param {function} onSuccessCallback - Function to call when QR code is successfully scanned
 */
function initQRScanner(onSuccessCallback) {
    debugLog("Initializing QR scanner");
    const qrReader = document.getElementById('qr-reader');
    const qrResult = document.getElementById('qr-result');
    
    // Log browser and device information
    debugLog(`Browser: ${navigator.userAgent}`);
    debugLog(`Screen: ${window.innerWidth}x${window.innerHeight}`);
    
    // Create error container first
    createErrorContainer();
    
    // Create restart button
    createRestartButton();
    
    // Check if camera access is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        debugLog("Camera API not supported in this browser", new Error("getUserMedia not supported"));
        showError("browser_error");
        return {
            restart: () => { debugLog("Restart called but camera API not available"); },
            showError: (msg) => { debugLog(`showError called with: ${msg}`); }
        };
    }
    
    // Add manual camera permission button for better user experience
    const permissionButton = document.createElement('button');
    permissionButton.id = 'camera-permission-btn';
    permissionButton.innerText = 'Allow Camera Access';
    permissionButton.className = 'permission-btn';
    qrReader.innerHTML = ''; // Clear existing content
    qrReader.appendChild(permissionButton);
    
    // Handle permission button click
    permissionButton.addEventListener('click', function() {
        debugLog("Camera permission button clicked");
        this.disabled = true;
        this.textContent = 'Requesting Camera...';
        
        // Test camera access before initializing scanner
        debugLog("Testing camera access...");
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then(stream => {
                debugLog("Camera access test successful");
                
                // Stop all tracks to release camera
                stream.getTracks().forEach(track => {
                    debugLog(`Stopping track: ${track.kind}`);
                    track.stop();
                });
                
                // Remove permission button
                qrReader.innerHTML = '<div id="qr-reader-container"></div>';
                
                // Initialize scanner
                initializeScanner();
            })
            .catch(err => {
                debugLog("Camera access test failed", err);
                this.disabled = false;
                this.textContent = 'Retry Camera Access';
                showError("camera_permission");
            });
    });
    
    // Function to create error container
    function createErrorContainer() {
        if (!document.getElementById('error-container')) {
            const errorContainer = document.createElement('div');
            errorContainer.id = 'error-container';
            errorContainer.style.display = 'none';
            errorContainer.innerHTML = `
                <div class="error-message-box">
                    <p id="error-message">Error scanning QR code</p>
                    <button id="close-error-btn">Close</button>
                </div>
            `;
            qrReader.parentNode.insertBefore(errorContainer, qrReader.nextSibling);
            
            // Add event listener for close button
            document.getElementById('close-error-btn').addEventListener('click', function() {
                document.getElementById('error-container').style.display = 'none';
                debugLog("Error dialog closed by user");
            });
        }
    }
    
    // Function to create restart button
    function createRestartButton() {
        if (!document.getElementById('restart-scan-btn')) {
            const restartButton = document.createElement('button');
            restartButton.id = 'restart-scan-btn';
            restartButton.innerText = 'Restart Scanner';
            restartButton.style.display = 'none';
            qrReader.parentNode.insertBefore(restartButton, qrReader.nextSibling);
            
            // Add event listener for restart button
            restartButton.addEventListener('click', function() {
                qrResult.innerHTML = '';
                this.style.display = 'none';
                document.getElementById('camera-permission-btn').click();
                debugLog("Restart scan button clicked");
            });
        }
    }
    
    // Function to initialize scanner
    function initializeScanner() {
        debugLog("Creating Html5Qrcode instance");
        let html5QrCode;
        
        try {
            html5QrCode = new Html5Qrcode("qr-reader-container", { 
                formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
                verbose: true
            });
            debugLog("Html5Qrcode instance created successfully");
        } catch (error) {
            debugLog("Failed to create Html5Qrcode instance", error);
            showError("initialization_error");
            return {
                restart: () => { debugLog("Restart called but scanner initialization failed"); },
                showError: (msg) => { debugLog(`showError called with: ${msg}`); }
            };
        }
        
        // Configuration for scanner with dynamic QR box
        const config = { 
            fps: 15,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                debugLog(`Viewfinder dimensions: ${viewfinderWidth}x${viewfinderHeight}`);
                let minEdgePercentage = 0.7;
                let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                debugLog(`Setting QR box size to ${qrboxSize}x${qrboxSize}`);
                return {
                    width: qrboxSize,
                    height: qrboxSize
                };
            },
            aspectRatio: window.innerWidth > window.innerHeight ? 1.2 : 0.8,
            disableFlip: false
        };
        
        // Success callback with proper validation
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            debugLog(`QR Code detected: ${decodedText}`);
            
            // Validate QR code format
            if (isValidBookQR(decodedText)) {
                debugLog("Valid book QR code format");
                // Show success message
                qrResult.innerHTML = `<p class="success">Success! QR Code detected.</p>`;
                
                // Stop scanning to save resources
                html5QrCode.stop().then(() => {
                    debugLog("Scanner stopped after successful scan");
                    document.getElementById('restart-scan-btn').style.display = 'block';
                    
                    // Call the success callback with the book ID
                    const bookId = decodedText.split(':')[1];
                    onSuccessCallback(bookId);
                }).catch(err => {
                    debugLog("Failed to stop scanner", err);
                    showError("scanner_error");
                });
            } else {
                debugLog(`Invalid QR code format: ${decodedText}`);
                // Invalid format - show error but don't stop scanner
                showError("format_error");
            }
        };
        
        // Error callback - log all errors
        const qrCodeErrorCallback = (errorMessage) => {
            // Only log scanning errors, don't show to user
            console.log(`QR scan frame error: ${errorMessage}`);
        };
        
        // Try multiple camera starting approaches in sequence
        tryStartingCamera(html5QrCode, config, qrCodeSuccessCallback, qrCodeErrorCallback);
        
        // Return methods for external control
        return {
            restart: () => {
                debugLog("External restart requested");
                html5QrCode.stop().then(() => {
                    tryStartingCamera(html5QrCode, config, qrCodeSuccessCallback, qrCodeErrorCallback);
                }).catch(err => {
                    debugLog("Error stopping scanner for restart", err);
                    tryStartingCamera(html5QrCode, config, qrCodeSuccessCallback, qrCodeErrorCallback);
                });
            },
            showError: showError
        };
    }
    
    // Function to try different camera starting approaches
    function tryStartingCamera(html5QrCode, config, successCallback, errorCallback) {
        debugLog("Trying to start camera with preferred settings");
        
        // Approach 1: Try with environment facing mode (back camera)
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            successCallback,
            errorCallback
        ).then(() => {
            debugLog("Camera started successfully with environment facing mode");
            fixVideoDisplay();
        }).catch(err => {
            debugLog("Failed to start with environment facing mode", err);
            
            // Approach 2: Try with ideal environment facing mode
            html5QrCode.start(
                { facingMode: { ideal: "environment" } },
                config,
                successCallback,
                errorCallback
            ).then(() => {
                debugLog("Camera started successfully with ideal environment facing mode");
                fixVideoDisplay();
            }).catch(err => {
                debugLog("Failed to start with ideal environment facing mode", err);
                
                // Approach 3: Try with no specific camera constraints
                html5QrCode.start(
                    { facingMode: "user" }, // Try front camera as last resort
                    config,
                    successCallback,
                    errorCallback
                ).then(() => {
                    debugLog("Camera started successfully with user facing mode");
                    fixVideoDisplay();
                }).catch(err => {
                    debugLog("All camera start approaches failed", err);
                    
                    // Approach 4: Last resort - try with minimal configuration
                    const minimalConfig = {
                        fps: 10,
                        qrbox: 250
                    };
                    
                    html5QrCode.start(
                        undefined,
                        minimalConfig,
                        successCallback,
                        errorCallback
                    ).then(() => {
                        debugLog("Camera started with minimal configuration");
                        fixVideoDisplay();
                    }).catch(err => {
                        debugLog("Even minimal configuration failed", err);
                        showError("camera_error");
                    });
                });
            });
        });
    }
    
    /**
     * Function to fix video display issues
     */
    function fixVideoDisplay() {
        debugLog("Attempting to fix video display");
        setTimeout(() => {
            // Find and adjust the video element
            const videoElement = document.querySelector('#qr-reader-container video');
            if (videoElement) {
                debugLog(`Video element found with dimensions: ${videoElement.offsetWidth}x${videoElement.offsetHeight}`);
                
                // Apply multiple styles to ensure it works
                videoElement.style.cssText = `
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    transform: none !important;
                `;
                
                // Add a class for additional CSS targeting
                videoElement.classList.add('scanner-video');
                
                // Adjust scan region if present
                const scanRegion = document.querySelector('#qr-reader-container div');
                if (scanRegion) {
                    scanRegion.style.cssText = `
                        width: 100% !important;
                        height: 100% !important;
                        position: relative !important;
                    `;
                }
                
                // Create an overlay to show QR boundary
                const qrBoundary = document.createElement('div');
                qrBoundary.className = 'qr-boundary';
                document.getElementById('qr-reader-container').appendChild(qrBoundary);
                
                debugLog('Applied video element style fixes');
                
                // Schedule another fix attempt after short delay
                setTimeout(fixVideoDisplay, 2000);
            } else {
                debugLog('Video element not found in DOM');
                
                // Try to find any elements in the container
                const containerElements = document.querySelectorAll('#qr-reader-container *');
                debugLog(`Found ${containerElements.length} elements in container`);
                containerElements.forEach((el, i) => {
                    debugLog(`Element ${i+1}: ${el.tagName} (${el.className || 'no class'})`);
                });
            }
        }, 1000);
    }
    
    /**
     * Validate if QR code has correct book format
     * @param {string} qrData - QR code data
     * @returns {boolean} - True if valid book QR code
     */
    function isValidBookQR(qrData) {
        // Check if QR code has the expected format (book:id)
        const regex = /^book:[a-zA-Z0-9-_]+$/;
        return regex.test(qrData);
    }
    
    /**
     * Show error message
     * @param {string} errorCode - Type of error
     */
    function showError(errorCode) {
        let errorMessage = "Error scanning QR code. Please try again.";
        
        switch(errorCode) {
            case "format_error":
                errorMessage = "Invalid QR code format. Please scan a book QR code (should contain 'book:' prefix).";
                break;
            case "camera_error":
                errorMessage = "Camera access error. Please check permissions and try again.";
                break;
            case "camera_permission":
                errorMessage = "Camera permission denied. Please allow camera access and try again.";
                break;
            case "browser_error":
                errorMessage = "Your browser doesn't support camera access. Try a different browser.";
                break;
            case "initialization_error":
                errorMessage = "Failed to initialize QR scanner. Please refresh the page.";
                break;
            case "scanner_error":
                errorMessage = "Error with QR scanner. Please reload the page.";
                break;
            default:
                errorMessage = "Could not process QR, please try again with a valid QR code.";
        }
        
        debugLog(`Showing error: ${errorCode} - ${errorMessage}`);
        
        document.getElementById('error-message').textContent = errorMessage;
        document.getElementById('error-container').style.display = 'block';
    }
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'scanner-instructions';
    instructions.innerHTML = `
        <p>Point your camera at a book's QR code (format: book:id) to begin the AR experience.</p>
    `;
    qrReader.parentNode.insertBefore(instructions, qrReader);
    
    // Return placeholder functions until scanner is fully initialized
    return {
        restart: () => { 
            debugLog("Default restart called"); 
            // Try to click the permission button if it exists
            const permBtn = document.getElementById('camera-permission-btn');
            if (permBtn) permBtn.click();
        },
        showError: (msg) => { 
            debugLog(`Default showError called with: ${msg}`);
            showError(msg);
        }
    };
}
