document.addEventListener('DOMContentLoaded', () => {
  const loadingElement = document.getElementById('loading');
  const helpButton = document.getElementById('btn-help');
  const audioButton = document.getElementById('btn-toggle-audio');
  const motionButton = document.getElementById('btn-toggle-motion');
  const infoBox = document.getElementById('info-box');
  const activePatternDisplay = document.getElementById('active-pattern');
  
  // Motion tracking state - changed to true by default
  let motionTrackingEnabled = true;
  
  // Audio state
  let audioEnabled = false;
  
  // Tracking state
  let activePatternIndex = -1;
  
  // Event listeners for AR experience
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = document.querySelector('a-camera');
  
  // Function to help with debugging
  function logDebug(message) {
    console.log(`[DEBUG] ${message}`);
  }
  
  // Hide loading screen when AR experience is ready
  sceneEl.addEventListener('arReady', () => {
    logDebug('AR experience ready');
    loadingElement.style.display = 'none';
    
    // Show help info briefly when AR is ready
    infoBox.style.display = 'block';
    infoBox.textContent = "Point your camera at one of the target patterns. Motion tracking is enabled.";
    setTimeout(() => {
      infoBox.style.display = 'none';
    }, 5000);
    
    // Get motion tracking component and ensure it's enabled
    const motionTrackingComponent = cameraEl.components['motion-tracking'];
    if (motionTrackingComponent) {
      cameraEl.setAttribute('motion-tracking', {enabled: true});
      logDebug('Motion tracking component initialized');
    } else {
      logDebug('Motion tracking component not found');
    }
    
    // Display status message
    activePatternDisplay.textContent = "Ready - Point at a pattern";
  });
  
  // Show loading screen when AR experience is not ready
  sceneEl.addEventListener('arError', (error) => {
    logDebug('AR experience error: ' + (error.detail || 'Unknown error'));
    loadingElement.textContent = 'AR Error! Please try reloading the page.';
  });
  
  // When targets are found
  sceneEl.addEventListener('targetFound', (event) => {
    const targetIndex = parseInt(event.detail.name);
    logDebug(`Target ${targetIndex} found`);
    
    // Update active pattern index
    activePatternIndex = targetIndex;
    
    // Update UI
    activePatternDisplay.textContent = `Active Pattern: ${targetIndex + 1}`;
  });
  
  // When targets are lost
  sceneEl.addEventListener('targetLost', (event) => {
    const targetIndex = parseInt(event.detail.name);
    logDebug(`Target ${targetIndex} lost - Content remains visible with motion tracking`);
    
    // Content stays visible thanks to our visibility controller
    activePatternDisplay.textContent = `Pattern ${targetIndex + 1} (tracking with motion)`;
  });
  
  // Help button functionality
  helpButton.addEventListener('click', () => {
    if (infoBox.style.display === 'none' || infoBox.style.display === '') {
      infoBox.style.display = 'block';
      infoBox.textContent = motionTrackingEnabled ? 
        "Point at a pattern first, then you can move around and the AR content will stay in place." :
        "Point your camera at one of the target patterns to see the AR content";
      
      setTimeout(() => {
        infoBox.style.display = 'none';
      }, 5000);
    } else {
      infoBox.style.display = 'none';
    }
  });
  
  // Audio toggle button functionality
  audioButton.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    audioButton.textContent = audioEnabled ? 'Sound: ON' : 'Sound: OFF';
    logDebug(`Audio ${audioEnabled ? 'enabled' : 'disabled'}`);
  });
  
  // Motion tracking toggle button functionality
  motionButton.addEventListener('click', () => {
    motionTrackingEnabled = !motionTrackingEnabled;
    motionButton.textContent = motionTrackingEnabled ? 'Motion: ON' : 'Motion: OFF';
    
    if (cameraEl && cameraEl.components['motion-tracking']) {
      // Update the motion tracking component
      cameraEl.setAttribute('motion-tracking', {enabled: motionTrackingEnabled});
      logDebug(`Motion tracking ${motionTrackingEnabled ? 'enabled' : 'disabled'}`);
      
      // Display message about motion tracking
      infoBox.textContent = motionTrackingEnabled ? 
        "Motion tracking enabled. Point at a pattern to calibrate." : 
        "Motion tracking disabled. AR content will stay fixed when patterns are lost.";
      infoBox.style.display = 'block';
      setTimeout(() => {
        infoBox.style.display = 'none';
      }, 3000);
    } else {
      logDebug('Cannot toggle motion tracking: component not found');
    }
  });
  
  // Check if device motion is available
  function checkDeviceMotionSupport() {
    if ('DeviceOrientationEvent' in window && 'DeviceMotionEvent' in window) {
      logDebug('Device motion sensors are supported');
      motionButton.style.display = 'block';
    } else {
      logDebug('Device motion sensors are not supported');
      motionButton.style.display = 'none';
    }
  }
  
  // Initialize click listeners for interactive elements
  function initializeInteractions() {
    // Add click event listeners to 3D objects
    const box = document.getElementById('box1');
    const sphere = document.getElementById('sphere1');
    const cylinder = document.getElementById('cylinder1');
    
    if (box) {
      box.addEventListener('click', function() {
        logDebug('Box clicked');
      });
    }
    
    if (sphere) {
      sphere.addEventListener('click', function() {
        logDebug('Sphere clicked');
      });
    }
    
    if (cylinder) {
      cylinder.addEventListener('click', function() {
        logDebug('Cylinder clicked');
      });
    }
  }
  
  // Initialize everything
  function initialize() {
    // Check device support
    checkDeviceMotionSupport();
    
    // Initialize interactive elements
    setTimeout(initializeInteractions, 1000);
  }
  
  // Run initialization
  initialize();
});