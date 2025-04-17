/**
 * QR Scanner Module
 * Handles QR code scanning functionality
 */

/**
 * Initialize QR code scanner
 * @param {function} onSuccessCallback - Function to call when QR code is successfully scanned
 */
function initQRScanner(onSuccessCallback) {
    const qrReader = document.getElementById('qr-reader');
    const qrResult = document.getElementById('qr-result');
    
    // Create scanner instance
    let html5QrcodeScanner = null;
    
    // Add error display container if it doesn't exist
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
            // Restart scanner after closing error
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear();
                initializeScanner();
            }
        });
    }
    
    // Add restart button if it doesn't exist
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
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear();
                initializeScanner();
            }
        });
    }
    
    function initializeScanner() {
        // Clear any previous instances
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear scanner instance", error);
            });
        }
        
        html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: {width: 250, height: 250},
                aspectRatio: 1.0,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            },
            /* verbose= */ false
        );
        
        // Success callback with proper validation
        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            console.log(`QR Code detected: ${decodedText}`, decodedResult);
            
            // Validate QR code format
            if (isValidBookQR(decodedText)) {
                // Show success message
                qrResult.innerHTML = `<p class="success">Success! QR Code detected.</p>`;
                
                // Stop scanning to save resources
                html5QrcodeScanner.clear().then(() => {
                    console.log("Scanner stopped after successful scan");
                    document.getElementById('restart-scan-btn').style.display = 'block';
                    
                    // Call the success callback with the book ID
                    const bookId = decodedText.split(':')[1];
                    onSuccessCallback(bookId);
                }).catch(err => {
                    console.error("Failed to clear scanner", err);
                });
            } else {
                // Invalid format - show error but don't stop scanner
                showError("format_error");
            }
        };
        
        // Error callback - just log, don't stop scanner
        const qrCodeErrorCallback = (errorMessage) => {
            // Only log - don't show user error for every frame
            console.log(`QR scan frame error: ${errorMessage}`);
        };
        
        // Render the scanner
        html5QrcodeScanner.render(qrCodeSuccessCallback, qrCodeErrorCallback);
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
                errorMessage = "Camera access error. Please check permissions.";
                break;
            default:
                errorMessage = "Could not process QR, please try again with a valid QR code.";
        }
        
        document.getElementById('error-message').textContent = errorMessage;
        document.getElementById('error-container').style.display = 'block';
    }
    
    // Initialize the scanner when everything is ready
    initializeScanner();
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'scanner-instructions';
    instructions.innerHTML = `
        <p>Point your camera at a book's QR code (format: book:id) to begin the AR experience.</p>
    `;
    qrReader.parentNode.insertBefore(instructions, qrReader);
    
    // Return methods for external control
    return {
        restart: initializeScanner,
        showError: showError
    };
}
