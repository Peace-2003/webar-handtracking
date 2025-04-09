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

// Draw landmarks and connectors
hands.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

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

      // Example: detect pinch (between thumb tip and index tip)
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
