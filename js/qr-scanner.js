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
    
    // Create scanner instance - direct approach without Html5QrcodeScanner
    const html5QrCode = new Html5Qrcode('qr-reader');
    
    // Configuration for scanner
    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
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
            startScanner();
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
            startScanner();
        });
    }
    
    // Success callback with proper validation
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`, decodedResult);
        
        // Validate QR code format
        if (isValidBookQR(decodedText)) {
            // Show success message
            qrResult.innerHTML = `<p class="success">Success! QR Code detected.</p>`;
            
            // Stop scanning to save resources
            html5QrCode.stop().then(() => {
                console.log("Scanner stopped after successful scan");
                document.getElementById('restart-scan-btn').style.display = 'block';
                
                // Call the success callback with the book ID
                const bookId = decodedText.split(':')[1];
                onSuccessCallback(bookId);
            }).catch(err => {
                console.error("Failed to stop scanner", err);
                showError("scanner_error");
            });
        } else {
            // Invalid format - show error but don't stop scanner
            showError("format_error");
        }
    };
    
    // Error callback - just log, don't show user error for every frame
    const qrCodeErrorCallback = (errorMessage) => {
        // Only log - don't show user error for every frame
        console.log(`QR scan frame error: ${errorMessage}`);
    };
    
    // Function to start scanner with back camera
    function startScanner() {
        // First try to stop any existing scanner instance
        if (html5QrCode) {
            html5QrCode.stop().catch(err => {
                console.log("No active scanner to stop");
            });
        }
        
        // Start scanner with back camera (environment) facing mode
        html5QrCode.start(
            { facingMode: "environment" }, // This forces the back camera
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
        ).catch(err => {
            console.error("Error starting scanner with back camera:", err);
            
            // If environment camera fails, try without specifying camera
            html5QrCode.start(
                { facingMode: { ideal: "environment" } }, // Less strict constraint
                config,
                qrCodeSuccessCallback,
                qrCodeErrorCallback
            ).catch(err => {
                console.error("Error starting scanner with any camera:", err);
                showError("camera_error");
            });
        });
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
            case "scanner_error":
                errorMessage = "Error with QR scanner. Please reload the page.";
                break;
            default:
                errorMessage = "Could not process QR, please try again with a valid QR code.";
        }
        
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
    
    // Start the scanner with back camera
    startScanner();
    
    // Return methods for external control
    return {
        restart: startScanner,
        showError: showError
    };
}
