const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('drawing-canvas');
const canvasCtx = canvasElement.getContext('2d');

// Resize canvas to full screen
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

// Set up MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

// Process results from MediaPipe
hands.onResults((results) => {
  // Draw the current video frame as a background for debugging.
  canvasCtx.save();
  // Draw the video frame so you can see what the camera sees.
  canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  // Then optionally, overlay the landmarks.
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw connections between landmarks.
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      });
      // Draw each landmark.
      drawLandmarks(canvasCtx, landmarks, {
        color: '#FF0000',
        lineWidth: 1
      });

      // Example: detect a pinch gesture (thumb tip vs index tip)
      const thumb = landmarks[4];
      const index = landmarks[8];
      const dx = thumb.x - index.x;
      const dy = thumb.y - index.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.05) {
        console.log("👆 Pinch detected");
        // You can add any response (e.g., change background, trigger an action) here.
      }
    }
  }
  canvasCtx.restore();
});

// Set up camera with user gesture
function startCamera() {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

// Start experience on button click
document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('startBtn').style.display = 'none';
  startCamera();
});

// Optional: Adjust canvas size on window resize
window.addEventListener('resize', () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
});
