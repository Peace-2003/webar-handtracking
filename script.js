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

// More reliable approach to get back camera
async function startCamera() {
  try {
    // First try direct device selection
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('Available cameras:', videoDevices.length);
    
    let stream;
    
    // If multiple cameras, try to select back camera
    if (videoDevices.length > 1) {
      try {
        // On most mobile devices, back camera is often the last in the list
        const backCamera = videoDevices[videoDevices.length - 1];
        console.log('Attempting to use camera:', backCamera.label || 'unnamed camera');
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: {exact: backCamera.deviceId},
            width: 640,
            height: 480
          }
        });
      } catch (err) {
        console.log('Device selection failed:', err);
        // Fall back to environment facing mode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {exact: 'environment'},
            width: 640,
            height: 480
          }
        });
      }
    } else {
      // If only one camera or enumeration not supported
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: 640,
          height: 480
        }
      });
    }
    
    // Set the stream as video source
    videoElement.srcObject = stream;
    
    // Initialize the Camera utility after stream is set
    videoElement.onloadedmetadata = () => {
      const camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({image: videoElement});
        }
      });
      camera.start();
    };
    
  } catch (error) {
    console.error('Error starting camera:', error);
    alert('Unable to access the camera. Please check permissions and try again.');
    startBtn.style.display = 'block';
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
