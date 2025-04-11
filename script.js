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
let gestureStartTime = 0;
let handTrackingData = {
  positions: [],          // Store wrist positions for path-based gestures
  pinchDistances: [],     // Store pinch distances for zoom gestures
  timestamps: [],         // Store timestamps for timing-based gestures
  angles: []              // Store angles for rotation gestures
};
const HISTORY_LENGTH = 20;
let lastLandmarks = null;
let frameCount = 0;
let isTwoHandGesture = false;

// Calculate distance between two landmarks
function calculateDistance(landmark1, landmark2) {
  const dx = landmark1.x - landmark2.x;
  const dy = landmark1.y - landmark2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate angle of a landmark relative to another (in degrees)
function calculateAngle(landmark1, landmark2) {
  const dx = landmark2.x - landmark1.x;
  const dy = landmark2.y - landmark1.y;
  return Math.atan2(dy, dx) * 180 / Math.PI;
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
    index_tip.y < index_mcp.y && 
    middle_tip.y < middle_mcp.y && 
    ring_tip.y < ring_mcp.y && 
    pinky_tip.y < pinky_mcp.y;
  
  if (areAllFingersOpen) {
    return "open_palm";
  }
  
  // 5. Fist (all fingers closed)
  const isAllFingersClosed = 
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

// Updates tracking data with new hand information
function updateHandTrackingData(landmarks) {
  const wrist = landmarks[0];
  const thumb_tip = landmarks[4];
  const index_tip = landmarks[8];
  
  // Store current position
  handTrackingData.positions.push({ x: wrist.x, y: wrist.y });
  
  // Store pinch distance (for zoom gestures)
  handTrackingData.pinchDistances.push(calculateDistance(thumb_tip, index_tip));
  
  // Store timestamp
  handTrackingData.timestamps.push(performance.now());
  
  // Store angle between wrist and index tip (for rotation detection)
  handTrackingData.angles.push(calculateAngle(wrist, index_tip));
  
  // Keep arrays at fixed length
  if (handTrackingData.positions.length > HISTORY_LENGTH) {
    handTrackingData.positions.shift();
    handTrackingData.pinchDistances.shift();
    handTrackingData.timestamps.shift();
    handTrackingData.angles.shift();
  }
}

// Detect dynamic gestures based on hand movement patterns
function detectDynamicGestures() {
  // Need enough data points for reliable detection
  if (handTrackingData.positions.length < HISTORY_LENGTH * 0.75) return null;
  
  // 1. SWIPE GESTURES
  // Calculate total movement in x and y directions
  let totalDx = 0;
  let totalDy = 0;
  
  for (let i = 1; i < handTrackingData.positions.length; i++) {
    totalDx += handTrackingData.positions[i].x - handTrackingData.positions[i-1].x;
    totalDy += handTrackingData.positions[i].y - handTrackingData.positions[i-1].y;
  }
  
  // Detect horizontal swipes (significant x movement, minimal y movement)
  if (Math.abs(totalDx) > 0.15 && Math.abs(totalDy) < 0.05) {
    return totalDx > 0 ? "swipe_right" : "swipe_left";
  }
  
  // Detect vertical swipes (significant y movement, minimal x movement)
  if (Math.abs(totalDy) > 0.15 && Math.abs(totalDx) < 0.05) {
    return totalDy > 0 ? "swipe_down" : "swipe_up";
  }
  
  // 2. CIRCULAR MOTION DETECTION
  // Check if the path forms a circular pattern
  if (detectCircularMotion()) {
    return "circle";
  }
  
  // 3. WAVE GESTURE (multiple side-to-side movements)
  if (detectWaveGesture()) {
    return "wave";
  }
  
  // 4. ZOOM GESTURE (pinch distance changing significantly)
  const zoomGesture = detectZoomGesture();
  if (zoomGesture) {
    return zoomGesture;
  }
  
  // 5. ROTATION GESTURE
  const rotationGesture = detectRotationGesture();
  if (rotationGesture) {
    return rotationGesture;
  }
  
  return null;
}

// Detect if the hand is moving in a circular motion
function detectCircularMotion() {
  const positions = handTrackingData.positions;
  if (positions.length < HISTORY_LENGTH) return false;
  
  // Calculate the center of the path
  let centerX = 0, centerY = 0;
  positions.forEach(pos => {
    centerX += pos.x;
    centerY += pos.y;
  });
  centerX /= positions.length;
  centerY /= positions.length;
  
  // Calculate the average distance from center (radius)
  let avgRadius = 0;
  positions.forEach(pos => {
    const dx = pos.x - centerX;
    const dy = pos.y - centerY;
    avgRadius += Math.sqrt(dx*dx + dy*dy);
  });
  avgRadius /= positions.length;
  
  // Check if points maintain similar distance from center
  let isCircular = true;
  positions.forEach(pos => {
    const dx = pos.x - centerX;
    const dy = pos.y - centerY;
    const radius = Math.sqrt(dx*dx + dy*dy);
    // If any point deviates too much from average radius, it's not circular
    if (Math.abs(radius - avgRadius) > 0.05) {
      isCircular = false;
    }
  });
  
  // Check if we've covered enough of the circle (at least 270 degrees)
  if (isCircular) {
    // Calculate angle coverage
    const angles = positions.map(pos => {
      return Math.atan2(pos.y - centerY, pos.x - centerX) * 180 / Math.PI;
    });
    
    // Convert angles to 0-360 range
    const normalizedAngles = angles.map(angle => (angle + 360) % 360);
    
    // Find min and max angles
    const minAngle = Math.min(...normalizedAngles);
    const maxAngle = Math.max(...normalizedAngles);
    
    // Check if we've covered at least 270 degrees
    return (maxAngle - minAngle > 270) || checkAngleCrossover(normalizedAngles);
  }
  
  return false;
}

// Helper to check if angles cross over the 0/360 boundary
function checkAngleCrossover(angles) {
  // Check if we have both small angles (near 0) and large angles (near 360)
  let hasSmallAngle = false;
  let hasLargeAngle = false;
  
  angles.forEach(angle => {
    if (angle < 45) hasSmallAngle = true;
    if (angle > 315) hasLargeAngle = true;
  });
  
  return hasSmallAngle && hasLargeAngle;
}

// Detect wave gesture (multiple side-to-side movements)
function detectWaveGesture() {
  const positions = handTrackingData.positions;
  if (positions.length < HISTORY_LENGTH) return false;
  
  let directionChanges = 0;
  let lastDx = 0;
  
  // Count how many times the hand changes horizontal direction
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i-1].x;
    
    // If we change from moving right to left or vice versa
    if (lastDx * dx < 0 && Math.abs(dx) > 0.01) {
      directionChanges++;
    }
    
    lastDx = dx;
  }
  
  // Wave needs at least 3 direction changes in short time
  return directionChanges >= 3;
}

// Detect zoom gesture based on pinch distance changes
function detectZoomGesture() {
  const distances = handTrackingData.pinchDistances;
  if (distances.length < HISTORY_LENGTH * 0.5) return null;
  
  // Calculate the total change in pinch distance
  const startDist = distances[0];
  const endDist = distances[distances.length - 1];
  const distChange = endDist - startDist;
  
  // Check if the distance changed significantly
  if (Math.abs(distChange) > 0.1) {
    return distChange > 0 ? "zoom_in" : "zoom_out";
  }
  
  return null;
}

// Detect rotation gesture based on angle changes
function detectRotationGesture() {
  const angles = handTrackingData.angles;
  if (angles.length < HISTORY_LENGTH * 0.75) return null;
  
  // Calculate total angle change (accounting for 360° wraparound)
  let totalRotation = 0;
  for (let i = 1; i < angles.length; i++) {
    let diff = angles[i] - angles[i-1];
    
    // Handle angle wraparound
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    totalRotation += diff;
  }
  
  // Check if we've rotated enough
  if (Math.abs(totalRotation) > 90) {
    return totalRotation > 0 ? "rotate_ccw" : "rotate_cw";
  }
  
  return null;
}

// Display detected gesture on screen
function displayGesture(gesture) {
  if (gesture && gesture !== lastGesture) {
    gestureOutput.textContent = gesture.replace('_', ' ');
    gestureOutput.style.display = 'block';
    
    // Highlight the gesture briefly
    gestureOutput.style.backgroundColor = 'rgba(0, 150, 255, 0.7)';
    setTimeout(() => {
      gestureOutput.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }, 500);
    
    debugLog(`Gesture detected: ${gesture}`, '#00ff00');
    
    // Update the last gesture and start time
    lastGesture = gesture;
    gestureStartTime = performance.now();
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
  
  // Increment frame counter (used for gesture detection timing)
  frameCount++;
  
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
      
      // Update tracking data for the first hand
      if (i === 0) {
        updateHandTrackingData(landmarks);
        lastLandmarks = landmarks;
      }
    }
    
    // Check for two-hand gestures if two hands are detected
    if (results.multiHandLandmarks.length === 2) {
      const hand1 = results.multiHandLandmarks[0];
      const hand2 = results.multiHandLandmarks[1];
      
      // Detect two-hand zoom gesture
      const thumb1 = hand1[4];
      const index1 = hand1[8];
      const thumb2 = hand2[4];
      const index2 = hand2[8];
      
      // Distance between the two hands' index fingers
      const handDistance = calculateDistance(index1, index2);
      
      // Simple two hand gesture example - hands far apart
      if (handDistance > 0.5) {
        displayGesture("hands_wide");
        isTwoHandGesture = true;
      } else {
        isTwoHandGesture = false;
      }
    } else {
      isTwoHandGesture = false;
    }
    
    // Process gestures if we're not already in a two-hand gesture
    if (!isTwoHandGesture) {
      // Try to detect dynamic gestures first (they're more interesting)
      const dynamicGesture = detectDynamicGestures();
      
      if (dynamicGesture) {
        displayGesture(dynamicGesture);
        // Reset tracking data after detecting a dynamic gesture
        handTrackingData = {
          positions: [],
          pinchDistances: [],
          timestamps: [],
          angles: []
        };
      } 
      // Only check for static gestures if no dynamic gesture was found and we have landmarks
      else if (lastLandmarks && frameCount % 10 === 0) { // Only check every 10 frames for performance
        const customGesture = detectCustomGestures(lastLandmarks);
        if (customGesture) {
          displayGesture(customGesture);
        }
      }
    }
  } else {
    // No hands detected, reset tracking data
    handTrackingData = {
      positions: [],
      pinchDistances: [],
      timestamps: [],
      angles: []
    };
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
