// DOM elements
const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('drawing-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('startBtn');
const gestureOutput = document.getElementById('gesture-output');
const debugPanel = document.getElementById('debug-panel');

// Canvas setup
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

// Debug logging function
function debugLog(message, color = 'white') {
  console.log(message);
  const logEntry = document.createElement('div');
  logEntry.style.color = color;
  logEntry.style.marginBottom = '5px';
  logEntry.textContent = typeof message === 'object' ? 
    JSON.stringify(message) : message;
  debugPanel.appendChild(logEntry);
  
  // Keep only the most recent 10 messages
  while (debugPanel.children.length > 10) {
    debugPanel.removeChild(debugPanel.firstChild);
  }
}

// Initialize MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

// Configure hand tracking settings
hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

// Storage for gesture tracking
let lastGesture = '';
let gestureHistory = [];
const HISTORY_LENGTH = 10;
let lastLandmarks = null;

// Calculate distance between two landmarks
function calculateDistance(landmark1, landmark2) {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Detect static hand gestures based on finger positions
function detectCustomGestures(landmarks) {
  if (!landmarks) return null;
  
  // Get key landmarks
  const wrist = landmarks[0];
  const thumb_cmc = landmarks[1];
  const thumb_mcp = landmarks[2];
  const thumb_ip = landmarks[3];
  const thumb_tip = landmarks[4];
  
  const index_mcp = landmarks[5];
  const index_pip = landmarks[6];
  const index_dip = landmarks[7];
  const index_tip = landmarks[8];
  
  const middle_mcp = landmarks[9];
  const middle_pip = landmarks[10];
  const middle_tip = landmarks[12];
  
  const ring_mcp = landmarks[13];
  const ring_tip = landmarks[16];
  
  const pinky_mcp = landmarks[17];
  const pinky_tip = landmarks[20];
  
  // 1. Pinch gesture (thumb and index finger close together)
  const pinchDistance = calculateDistance(thumb_tip, index_tip);
  if (pinchDistance < 0.05) {
    return "pinch";
  }
  
  // 2. Peace/Victory sign (index and middle up, others down)
  const isIndexUp = index_tip.y < index_mcp.y;
  const isMiddleUp = middle_tip.y < middle_mcp.y;
  const isRingDown = ring_tip.y > ring_mcp.y;
  const isPinkyDown = pinky_tip.y > pinky_mcp.y;
  
  if (isIndexUp && isMiddleUp && isRingDown && isPinkyDown) {
    return "peace";
  }
  
  // 3. Thumbs Up (thumb up, all fingers closed)
  const isThumbUp = thumb_tip.y < thumb_mcp.y;
  const areFingersClosed = 
    index_tip.y > index_pip.y && 
    middle_tip.y > middle_pip.y && 
    ring_tip.y > ring_mcp.y && 
    pinky_tip.y > pinky_mcp.y;
  
  if (isThumbUp && areFingersClosed) {
    return "thumbs_up";
  }
  
  // 4. Open Palm (all fingers extended)
  const areAllFingersOpen = 
    thumb_tip.x < thumb_cmc.x && 
    index_tip.y < index_mcp.y && 
    middle_tip.y < middle_mcp.y && 
    ring_tip.y < ring_mcp.y && 
    pinky_tip.y < pinky_mcp.y;
  
  if (areAllFingersOpen) {
    return "open_palm";
  }
  
  // 5. Fist (all fingers closed)
  const isAllFingersClosed = 
    thumb_tip.x > thumb_cmc.x && 
    index_tip.y > index_mcp.y && 
    middle_tip.y > middle_mcp.y && 
    ring_tip.y > ring_mcp.y && 
    pinky_tip.y > pinky_mcp.y;
  
  if (isAllFingersClosed) {
    return "fist";
  }
  
  // 6. Point (index finger extended, others closed)
  const isOnlyIndexUp = 
    index_tip.y < index_mcp.y && 
    middle_tip.y > middle_mcp.y && 
    ring_tip.y > ring_mcp.y && 
    pinky_tip.y > pinky_mcp.y;
  
  if (isOnlyIndexUp) {
    return "point";
  }
  
  // No recognizable gesture
  return null;
}

// Detect dynamic gestures like swipes based on hand movement history
function detectDynamicGesture() {
  if (gestureHistory.length < HISTORY_LENGTH) return null;
  
  // Calculate total movement in x and y directions
  let totalDx = 0;
  let totalDy = 0;
  
  for (let i = 1; i < gestureHistory.length; i++) {
    totalDx += gestureHistory[i].x - gestureHistory[i-1].x;
    totalDy += gestureHistory[i].y - gestureHistory[i-1].y;
  }
  
  // Detect horizontal swipes (significant x movement, minimal y movement)
  if (Math.abs(totalDx) > 0.15 && Math.abs(totalDy) < 0.05) {
    return totalDx > 0 ? "swipe_right" : "swipe_left";
  }
  
  // Detect vertical swipes (significant y movement, minimal x movement)
  if (Math.abs(totalDy) > 0.15 && Math.abs(totalDx) < 0.05) {
    return totalDy > 0 ? "swipe_down" : "swipe_up";
  }
  
  return null;
}

// Display detected gesture on screen
function displayGesture(gesture) {
  if (gesture && gesture !== lastGesture) {
    gestureOutput.textContent = gesture;
    gestureOutput.style.display = 'block';
    
    // Highlight the gesture briefly
    gestureOutput.style.backgroundColor = 'rgba(0, 150, 255, 0.7)';
    setTimeout(() => {
      gestureOutput.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }, 500);
    
    debugLog(`Gesture detected: ${gesture}`, '#00ff00');
    lastGesture = gesture;
  }
}

// Handle results from MediaPipe Hands
hands.onResults((results) => {
  // Clear the canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the video feed
  if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  }
  
  // Process hand landmarks if available
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label;
      
      // Draw hand landmarks and connections
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: handedness === 'Left' ? '#00FF00' : '#FF0000',
        lineWidth: 3
      });
      
      drawLandmarks(canvasCtx, landmarks, {
        color: handedness === 'Left' ? '#00CC00' : '#CC0000',
        lineWidth: 1,
        radius: 5
      });
      
      // Detect custom static gestures
      const customGesture = detectCustomGestures(landmarks);
      
      // Update gesture history for the first hand
      if (i === 0) {
        const wrist = landmarks[0];
        gestureHistory.push({x: wrist.x, y: wrist.y});
        
        // Keep history at fixed length
        if (gestureHistory.length > HISTORY_LENGTH) {
          gestureHistory.shift();
        }
        
        // Detect dynamic gestures
        const dynamicGesture = detectDynamicGesture();
        
        // Display the detected gesture (prioritize dynamic gestures)
        if (dynamicGesture) {
          displayGesture(dynamicGesture);
          // Clear history after detecting a dynamic gesture
          gestureHistory = [];
        } else if (customGesture) {
          displayGesture(customGesture);
        }
        
        lastLandmarks = landmarks;
      }
    }
  } else {
    // No hands detected, clear gesture history
    gestureHistory = [];
    lastLandmarks = null;
    
    // Hide gesture display after a delay when no hands are detected
    if (lastGesture) {
      setTimeout(() => {
        if (!lastLandmarks) {
          gestureOutput.style.display = 'none';
          lastGesture = '';
        }
      }, 1000);
    }
  }
  
  canvasCtx.restore();
});

// Start the camera with back camera when possible
async function startCamera() {
  try {
    debugLog("Starting camera initialization", '#ffff00');
    
    // Try to get list of available cameras
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      debugLog(`Found ${videoDevices.length} camera(s)`, '#00ffff');
      
      // Log camera details
      if (videoDevices.length > 0) {
        videoDevices.forEach((device, i) => {
          debugLog(`Camera ${i}: ${device.label || 'unnamed'}`, '#00ffff');
        });
      }
    } catch (enumError) {
      debugLog(`Could not enumerate devices: ${enumError.message}`, '#ff0000');
    }
    
    // First try exact environment constraint for back camera
    try {
      debugLog("Trying exact environment constraint", '#ffff00');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      debugLog("Successfully accessed back camera with exact constraint", '#00ff00');
      videoElement.srcObject = stream;
      
    } catch (exactError) {
      debugLog(`Exact constraint failed: ${exactError.message}`, '#ff0000');
      
      // Second attempt with regular environment constraint
      try {
        debugLog("Trying regular environment constraint", '#ffff00');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        debugLog("Successfully accessed camera with regular constraint", '#00ff00');
        videoElement.srcObject = stream;
        
      } catch (regularError) {
        debugLog(`Regular constraint failed: ${regularError.message}`, '#ff0000');
        
        // Final fallback - any camera
        try {
          debugLog("Trying any available camera", '#ffff00');
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          
          debugLog("Successfully accessed a camera (fallback)", '#00ff00');
          videoElement.srcObject = stream;
          
        } catch (fallbackError) {
          debugLog(`All camera attempts failed: ${fallbackError.message}`, '#ff0000');
          alert('Unable to access the camera. Please check permissions and try again.');
          startBtn.style.display = 'block';
          return;
        }
      }
    }
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        debugLog("Video metadata loaded", '#00ff00');
        resolve();
      };
    });
    
    // Monitor active track
    const tracks = videoElement.srcObject.getVideoTracks();
    if (tracks.length > 0) {
      const track = tracks[0];
      debugLog(`Active video track: ${track.label}`, '#00ff00');
      
      // Monitor for track ending
      track.addEventListener('ended', () => {
        debugLog("Video track ended unexpectedly", '#ff0000');
      });
    }
    
    // Initialize MediaPipe Camera
    debugLog("Initializing MediaPipe Camera", '#ffff00');
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({image: videoElement});
      }
    });
    
    camera.start();
    debugLog("Camera started successfully", '#00ff00');
    
  } catch (error) {
    debugLog(`Camera initialization error: ${error.message}`, '#ff0000');
    alert('Error initializing camera: ' + error.message);
    startBtn.style.display = 'block';
  }
}

// Event listeners
startBtn.addEventListener('click', () => {
  startBtn.style.display = 'none';
  gestureOutput.style.display = 'none';
  startCamera();
});

videoElement.addEventListener('playing', () => {
  debugLog("Video started playing", '#00ff00');
});

window.addEventListener('resize', () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
});
