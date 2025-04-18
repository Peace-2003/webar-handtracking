document.addEventListener('DOMContentLoaded', () => {
  const loadingElement = document.getElementById('loading');
  const helpButton = document.getElementById('btn-help');
  const audioButton = document.getElementById('btn-toggle-audio');
  const motionButton = document.getElementById('btn-toggle-motion');
  const infoBox = document.getElementById('info-box');
  const activePatternDisplay = document.getElementById('active-pattern');
  
  // AR content management
  const arContent = document.getElementById('ar-content');
  const patternContents = [
    document.getElementById('content-pattern1'),
    document.getElementById('content-pattern2'),
    document.getElementById('content-pattern3')
  ];
  
  // Tracking state
  let activePatternIndex = -1;
  let lastDetectedPattern = -1;
  let patternPositions = [null, null, null];
  let patternRotations = [null, null, null];
  let contentVisible = false;
  
  // Motion tracking state - changed to true by default
  let motionTrackingEnabled = true;
  
  // Audio state
  let audioEnabled = false;
  
  // Sound entities
  let soundEntities = [];
  
  // Motion tracking component reference
  let motionTrackingComponent = null;
  
  // Event listeners for AR experience
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = document.querySelector('a-camera');
  
  // Function to help with debugging
  function logDebug(message) {
    console.log(`[DEBUG] ${message}`);
    // Also display in active pattern area for mobile debugging
    // activePatternDisplay.textContent = message;
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
    
    // Get all sound entities
    soundEntities = [
      document.querySelector('#target1 [sound]'),
      document.querySelector('#target2 [sound]'),
      document.querySelector('#target3 [sound]')
    ];
    
    // Get motion tracking component and ensure it's enabled
    motionTrackingComponent = cameraEl.components['motion-tracking'];
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
  
  // When targets are found, update position and show the associated content
  sceneEl.addEventListener('targetFound', (event) => {
    const targetIndex = parseInt(event.detail.name);
    logDebug(`Target ${targetIndex} found`);
    
    lastDetectedPattern = targetIndex;
    
    // Get target entity to extract position and rotation
    const targetEntity = document.querySelector(`#target${targetIndex + 1}`);
    if (targetEntity) {
      const position = targetEntity.object3D.position.clone();
      const rotation = targetEntity.object3D.rotation.clone();
      
      logDebug(`Target position: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`);
      
      // Store position and rotation
      patternPositions[targetIndex] = position;
      patternRotations[targetIndex] = rotation;
      
      // Switch to this pattern's content
      switchToPattern(targetIndex);
      
      // Show AR content if not already visible
      if (!contentVisible) {
        arContent.setAttribute('visible', true);
        contentVisible = true;
        logDebug('AR content made visible');
      }
      
      // Update AR content position and rotation
      updateContentPosition(targetIndex);
      
      // Calibrate motion tracking when a new target is found
      if (motionTrackingEnabled && motionTrackingComponent) {
        if (!motionTrackingComponent.isCalibrated) {
          logDebug('Calibrating motion tracking');
          motionTrackingComponent.calibrate();
        }
      }
      
      // Play sound if audio is enabled
      if (audioEnabled && soundEntities && soundEntities[targetIndex]) {
        try {
          soundEntities[targetIndex].components.sound.playSound();
        } catch (e) {
          logDebug('Sound error: ' + e.message);
        }
      }
      
      // Update UI
      activePatternDisplay.textContent = `Active Pattern: ${targetIndex + 1}`;
    } else {
      logDebug(`Target entity #target${targetIndex + 1} not found`);
    }
  });
  
  // When targets are lost, we don't hide the content - it stays visible
  sceneEl.addEventListener('targetLost', (event) => {
    const targetIndex = parseInt(event.detail.name);
    logDebug(`Target ${targetIndex} lost`);
    
    // Content remains visible and in place thanks to motion tracking
    activePatternDisplay.textContent = `Pattern ${targetIndex + 1} lost, but content persists`;
  });
  
  // Function to switch to a specific pattern's content
  function switchToPattern(index) {
    if (activePatternIndex !== index) {
      // Hide all pattern contents
      patternContents.forEach((content, i) => {
        if (!content) {
          logDebug(`Warning: content-pattern${i+1} element not found`);
          return;
        }
        content.setAttribute('visible', false);
      });
      
      // Show the selected pattern content
      if (patternContents[index]) {
        patternContents[index].setAttribute('visible', true);
        logDebug(`Switched to pattern ${index + 1} content`);
        activePatternIndex = index;
      } else {
        logDebug(`Error: content-pattern${index + 1} not found`);
      }
    }
  }
  
  // Function to update the AR content position and rotation
  function updateContentPosition(index) {
    if (patternPositions[index] && patternRotations[index]) {
      // Update position and rotation
      arContent.object3D.position.copy(patternPositions[index]);
      arContent.object3D.rotation.copy(patternRotations[index]);
      logDebug(`Updated content position to match pattern ${index + 1}`);
    }
  }
  
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
    
    // Audio is just visual, no need to update components
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
  
  // Debug function to test pattern visibility directly
  function forceShowPattern(index) {
    if (index >= 0 && index < patternContents.length) {
      // Make AR content visible
      arContent.setAttribute('visible', true);
      contentVisible = true;
      
      // Switch to specified pattern
      switchToPattern(index);
      
      // Set a default position if none exists
      if (!patternPositions[index]) {
        patternPositions[index] = new THREE.Vector3(0, 0, -0.5);
        patternRotations[index] = new THREE.Euler(0, 0, 0);
      }
      
      // Update position
      updateContentPosition(index);
      
      logDebug(`Forced pattern ${index + 1} to show`);
      activePatternDisplay.textContent = `Pattern ${index + 1} (forced)`;
    }
  }
  
  // Add debug buttons (hidden by default)
  function addDebugButtons() {
    const debugContainer = document.createElement('div');
    debugContainer.style.position = 'fixed';
    debugContainer.style.top = '50px';
    debugContainer.style.right = '10px';
    debugContainer.style.zIndex = '1000';
    debugContainer.style.display = 'none'; // Hidden by default
    
    for (let i = 0; i < 3; i++) {
      const btn = document.createElement('button');
      btn.textContent = `Show Pattern ${i+1}`;
      btn.style.display = 'block';
      btn.style.margin = '5px';
      btn.addEventListener('click', () => forceShowPattern(i));
      debugContainer.appendChild(btn);
    }
    
    document.body.appendChild(debugContainer);
    
    // Press 'D' to show debug buttons
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'd') {
        debugContainer.style.display = debugContainer.style.display === 'none' ? 'block' : 'none';
      }
    });
  }
  
  // Initialize all functionality
  function initialize() {
    // Add click event listeners to 3D objects
    const box = document.getElementById('box1');
    const sphere = document.getElementById('sphere1');
    const cylinder = document.getElementById('cylinder1');
    
    if (box) {
      box.addEventListener('click', function() {
        logDebug('Box clicked');
      });
    } else {
      logDebug('Box element not found');
    }
    
    if (sphere) {
      sphere.addEventListener('click', function() {
        logDebug('Sphere clicked');
      });
    } else {
      logDebug('Sphere element not found');
    }
    
    if (cylinder) {
      cylinder.addEventListener('click', function() {
        logDebug('Cylinder clicked');
      });
    } else {
      logDebug('Cylinder element not found');
    }
    
    // Check if device supports motion sensors
    checkDeviceMotionSupport();
    
    // Add debug buttons
    addDebugButtons();
    
    // Ensure motion tracking is enabled by default
    if (cameraEl && cameraEl.components['motion-tracking']) {
      cameraEl.setAttribute('motion-tracking', {enabled: true});
      logDebug('Motion tracking enabled by default');
    }
  }
  
  // Initialize after a short delay to ensure elements are loaded
  setTimeout(initialize, 1000);
});