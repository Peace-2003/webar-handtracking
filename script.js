const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('drawing-canvas');
const canvasCtx = canvasElement.getContext('2d');

// Ensure the canvas always matches the window size
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

// Set up MediaPipe Hands with a callback to process results
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

// Called for each processed video frame
hands.onResults((results) => {
  // Clear the canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the current video frame on the canvas
  if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  } else {
    console.log("Video not ready for drawing");
  }
  
  // If any hand landmarks are detected, draw them on top
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

      // Example: detect a pinch gesture between thumb (landmark 4) and index finger (landmark 8)
      const thumb = landmarks[4];
      const index = landmarks[8];
      const dx = thumb.x - index.x;
      const dy = thumb.y - index.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.05) {
        console.log("👆 Pinch detected");
      }
    }
  }
  
  canvasCtx.restore();
});

// Function to start the camera using MediaPipe's Camera utility
function startCamera() {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      // For each frame, send the current image to MediaPipe Hands
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
    facingMode: 'environment' // ADD THIS LINE to use back camera
  });
  });
  camera.start();
}

// Log when the video element begins playing
videoElement.addEventListener('playing', () => {
  console.log("Video started playing");
});

// Start the camera feed when the user clicks the start button
document.getElementById('startBtn').addEventListener('click', () => {
  // Hide the start button once tapped
  document.getElementById('startBtn').style.display = 'none';
  // Start the camera and processing
  startCamera();
});

// Adjust the canvas if the window is resized
window.addEventListener('resize', () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
});
