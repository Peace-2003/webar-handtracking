const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('drawing-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('startBtn');

// Create debug elements
const debugContainer = document.createElement('div');
debugContainer.style.position = 'absolute';
debugContainer.style.top = '10px';
debugContainer.style.left = '10px';
debugContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
debugContainer.style.color = 'white';
debugContainer.style.padding = '10px';
debugContainer.style.fontFamily = 'monospace';
debugContainer.style.fontSize = '12px';
debugContainer.style.zIndex = '100';
debugContainer.style.maxWidth = '80%';
debugContainer.style.maxHeight = '30%';
debugContainer.style.overflow = 'auto';
document.body.appendChild(debugContainer);

// Log function that writes to both console and screen
function debugLog(message, color = 'white') {
    console.log(message);
    const logEntry = document.createElement('div');
    logEntry.style.color = color;
    logEntry.style.marginBottom = '5px';
    logEntry.textContent = typeof message === 'object' ? 
        JSON.stringify(message) : message;
    debugContainer.appendChild(logEntry);
    
    // Keep only the most recent 10 messages
    while (debugContainer.children.length > 10) {
        debugContainer.removeChild(debugContainer.firstChild);
    }
}

canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  }

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      });
      drawLandmarks(canvasCtx, landmarks, {
        color: '#FF0000',
        lineWidth: 1
      });

      const thumb = landmarks[4];
      const index = landmarks[8];
      const dx = thumb.x - index.x;
      const dy = thumb.y - index.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.05) {
        debugLog("👆 Pinch detected", "#ffcc00");
      }
    }
  }

  canvasCtx.restore();
});

// Function to get detailed camera information
async function getCameraInfo() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        debugLog(`Found ${videoDevices.length} camera(s):`, '#00ffff');
        videoDevices.forEach((device, index) => {
            debugLog(`${index}: ${device.label || 'unnamed camera'} (${device.deviceId.substring(0,8)}...)`, '#00ffff');
        });
        
        return videoDevices;
    } catch (error) {
        debugLog(`Error getting cameras: ${error}`, '#ff0000');
        return [];
    }
}

// Function to monitor video tracks for changes
function monitorVideoTrack(stream) {
    if (!stream) return;
    
    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) return;
    
    const track = tracks[0];
    debugLog(`Active track: ${track.label}`, '#00ff00');
    
    // Log track settings
    const settings = track.getSettings();
    debugLog(`Track settings: ${JSON.stringify({
        width: settings.width,
        height: settings.height,
        deviceId: settings.deviceId ? settings.deviceId.substring(0,8) + '...' : 'none',
        facingMode: settings.facingMode || 'unknown'
    })}`, '#00ff00');
    
    // Create observer to monitor track changes
    let lastCheck = settings;
    
    // Check for changes every second
    const trackMonitor = setInterval(() => {
        if (track.readyState !== 'live') {
            debugLog(`Track state changed: ${track.readyState}`, '#ff0000');
            clearInterval(trackMonitor);
            return;
        }
        
        const newSettings = track.getSettings();
        if (newSettings.deviceId !== lastCheck.deviceId ||
            newSettings.facingMode !== lastCheck.facingMode) {
            debugLog(`❗ CAMERA SWITCHED from ${lastCheck.facingMode || 'unknown'} to ${newSettings.facingMode || 'unknown'}`, '#ff0000');
            debugLog(`New camera: ${track.label}`, '#ff0000');
            lastCheck = newSettings;
        }
    }, 1000);
    
    // Listen for track ending
    track.addEventListener('ended', () => {
        debugLog(`❗ Track ended unexpectedly!`, '#ff0000');
        clearInterval(trackMonitor);
    });
    
    return trackMonitor;
}

// Camera initialization with troubleshooting
async function startCamera() {
    // First get all camera info
    debugLog("Starting camera initialization", '#ffff00');
    const videoDevices = await getCameraInfo();
    
    // Try 3 different methods to get the back camera:
    
    // METHOD 1: Using exact environment constraint
    try {
        debugLog("METHOD 1: Trying exact environment constraint", '#ffff00');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: 'environment' },
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        debugLog("SUCCESS: Got stream with exact environment", '#00ff00');
        videoElement.srcObject = stream;
        
        // Monitor this stream
        const trackMonitor = monitorVideoTrack(stream);
        
        // Verify we have the stream before continuing
        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                debugLog("Video metadata loaded", '#00ff00');
                resolve();
            };
        });
        
        // Continue with MediaPipe Camera initialization
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            }
        });
        
        debugLog("Starting MediaPipe Camera", '#ffff00');
        camera.start();
        
        // Check if camera is still using back camera after 3 seconds
        setTimeout(() => {
            const currentTrack = videoElement.srcObject.getVideoTracks()[0];
            const currentSettings = currentTrack.getSettings();
            debugLog(`Camera after 3s: ${currentTrack.label}`, '#ffff00');
            debugLog(`Settings after 3s: ${JSON.stringify({
                facingMode: currentSettings.facingMode || 'unknown',
                deviceId: currentSettings.deviceId ? currentSettings.deviceId.substring(0,8) + '...' : 'none'
            })}`, '#ffff00');
        }, 3000);
        
        return;  // Successfully set up camera
    } catch (error) {
        debugLog(`METHOD 1 FAILED: ${error.message}`, '#ff0000');
    }
    
    // METHOD 2: Try using the last video device in the list
    try {
        if (videoDevices.length > 1) {
            debugLog("METHOD 2: Trying last device in list (typically back camera)", '#ffff00');
            const backCamera = videoDevices[videoDevices.length - 1];
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: backCamera.deviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            debugLog(`SUCCESS: Got stream with device: ${backCamera.label}`, '#00ff00');
            videoElement.srcObject = stream;
            
            // Monitor this stream
            monitorVideoTrack(stream);
            
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    debugLog("Video metadata loaded", '#00ff00');
                    resolve();
                };
            });
            
            const camera = new Camera(videoElement, {
                onFrame: async () => {
                    await hands.send({ image: videoElement });
                }
            });
            
            debugLog("Starting MediaPipe Camera", '#ffff00');
            camera.start();
            return;  // Successfully set up camera
        } else {
            debugLog("METHOD 2 SKIPPED: Not enough video devices", '#ff0000');
        }
    } catch (error) {
        debugLog(`METHOD 2 FAILED: ${error.message}`, '#ff0000');
    }
    
    // METHOD 3: Last resort - try non-exact environment constraint
    try {
        debugLog("METHOD 3: Trying non-exact environment constraint", '#ffff00');
        
        // Create custom stream without using the Camera utility
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        debugLog("Got stream with environment", '#00ff00');
        videoElement.srcObject = stream;
        
        // Monitor this stream
        monitorVideoTrack(stream);
        
        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                debugLog("Video metadata loaded", '#00ff00');
                resolve();
            };
        });
        
        // Use already configured stream with MediaPipe
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            }
        });
        
        debugLog("Starting MediaPipe Camera", '#ffff00');
        camera.start();
        
    } catch (error) {
        debugLog(`METHOD 3 FAILED: ${error.message}`, '#ff0000');
        debugLog("All methods failed. Cannot access back camera.", '#ff0000');
        alert('Unable to access the back camera. Please check permissions.');
        startBtn.style.display = 'block';
    }
}

startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    startCamera();
});

videoElement.addEventListener('playing', () => {
    debugLog("Video started playing", '#00ff00');
});

window.addEventListener('resize', () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
});
