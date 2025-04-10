const videoElement = document.querySelector('.input_video');
const canvasElement = document.getElementById('drawing-canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('startBtn');

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
        console.log("👆 Pinch detected");
      }
    }
  }

  canvasCtx.restore();
});

// COMPLETELY NEW CAMERA INITIALIZATION APPROACH
async function startCamera() {
  try {
    // 1. FIRST manually get the stream with exact environment constraint
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { exact: 'environment' },
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });
    
    // 2. Manually set the stream to the video element
    videoElement.srcObject = stream;
    
    // 3. Wait for video to be ready to ensure stream is established
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        console.log("Video metadata loaded");
        resolve();
      };
    });
    
    // 4. Setup MediaPipe Camera ONLY AFTER stream is established
    //    Don't pass any camera options since we already set the stream
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      }
    });
    
    // 5. Monitor for camera changes
    stream.getVideoTracks().forEach(track => {
      track.addEventListener('ended', () => {
        console.log("Camera track ended unexpectedly");
      });
    });
    
    // 6. Start MediaPipe processing
    camera.start();
    
  } catch (error) {
    console.error('Error starting camera:', error);
    
    // Fallback to try without exact constraint
    try {
      console.log("Trying fallback camera method...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      videoElement.srcObject = stream;
      
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => resolve();
      });
      
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        }
      });
      
      camera.start();
      
    } catch (fallbackError) {
      console.error('Fallback camera also failed:', fallbackError);
      alert('Unable to access the back camera. Please check permissions and try again.');
      startBtn.style.display = 'block';
    }
  }
}

startBtn.addEventListener('click', () => {
  startBtn.style.display = 'none';
  startCamera();
});

videoElement.addEventListener('playing', () => {
  console.log("Video started playing");
});

window.addEventListener('resize', () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
});
