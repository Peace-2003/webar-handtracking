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
    const html5QrCode = new Html5Qrcode('qr-reader');
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // Success callback
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Stop scanner
        html5QrCode.stop().then(() => {
            console.log('QR Code scanner stopped');
        }).catch((err) => {
            console.error('Error stopping QR Code scanner:', err);
        });
        
        // Show success message
        qrResult.innerHTML = `<p>Success! QR Code detected.</p>`;
        
        // Call provided success callback
        onSuccessCallback(decodedText);
    };
    
    // Error callback
    const qrCodeErrorCallback = (errorMessage) => {
        // Do nothing with the error in UI - scanner keeps trying
        console.log('QR scan error:', errorMessage);
    };
    
    // Start scanner
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
    ).catch(err => {
        qrResult.innerHTML = `<p class="error">Error starting scanner: ${err}</p>`;
        console.error('Error starting QR Code scanner:', err);
    });
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.className = 'scanner-instructions';
    instructions.innerHTML = `
        <p>Point your camera at a book's QR code to begin the AR experience.</p>
    `;
    qrReader.parentNode.insertBefore(instructions, qrReader);
}
