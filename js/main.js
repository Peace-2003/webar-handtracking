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
  
  // Motion tracking state
  let motionTrackingEnabled = false;
  
  // Audio state
  let audioEnabled = false;
  
  // Sound entities
  let soundEntities = [];
  
  // Motion tracking component reference
  let motionTrackingComponent = null;
  
  // Event listeners for AR experience
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = document.querySelector('a-camera');
  
  // Hide loading screen when AR experience is ready
  sceneEl.addEventListener('arReady', () => {
    console.log('AR experience ready');
    loadingElement.style.display = 'none';
    
    // Show help info briefly when AR is ready
    infoBox.style.display = 'block';
    setTimeout(() => {
      infoBox.style.display = 'none';
    }, 5000);
    
    // Get all sound entities
    soundEntities = [
      document.querySelector('#target1 [sound]'),
      document.querySelector('#target2 [sound]'),
      document.querySelector('#target3 [sound]')
    ];
    
    // Get motion tracking component
    motionTrackingComponent = cameraEl.components['motion-tracking'];
  });
  
  // Show loading screen when AR experience is not ready
  sceneEl.addEventListener('arError', () => {
    console.log('AR experience error');
    loadingElement.textContent = 'AR Error! Please try reloading the page.';
  });
  
  // When targets are found, update position and show the associated content
  sceneEl.addEventListener('targetFound', (event) => {
    const targetIndex = parseInt(event.detail.name);
    console.log(`Target ${targetIndex} found`);
    
    lastDetectedPattern = targetIndex;
    
    // Get target entity to extract position and rotation
    const targetEntity = document.querySelector(`#target${targetIndex + 1}`);
    if (targetEntity) {
      const position = targetEntity.object3D.position.clone();
      const rotation = targetEntity.object3D.rotation.clone();
      
      // Store position and rotation
      patternPositions[targetIndex] = position;
      patternRotations[targetIndex] = rotation;
      
      // Switch to this pattern's content
      switchToPattern(targetIndex);
      
      // Show AR content if not already visible
      if (!contentVisible) {
        arContent.setAttribute('visible', true);
        contentVisible = true;
      }
      
      // Update AR content position and rotation
      updateContentPosition(targetIndex);
      
      // Calibrate motion tracking when a new target is found
      if (motionTrackingEnabled && motionTrackingComponent && motionTrackingComponent.isCalibrated === false) {
        console.log('Calibrating motion tracking');
        motionTrackingComponent.calibrate();
      }
      
      // Play sound if audio is enabled
      if (audioEnabled && soundEntities[targetIndex]) {
        soundEntities[targetIndex].components.sound.playSound();
      }
      
      // Update UI
      activePatternDisplay.textContent = `Active Pattern: ${targetIndex + 1}`;
    }
  });
  
  // When targets are lost, we don't hide the content - it stays visible
  sceneEl.addEventListener('targetLost', (event) => {
    const targetIndex = parseInt(event.detail.name);
    console.log(`Target ${targetIndex} lost`);
    
    // If motion tracking is enabled, we continue tracking with device motion
    // Otherwise, the content just stays in place as before
  });
  
  // Function to switch to a specific pattern's content
  function switchToPattern(index) {
    if (activePatternIndex !== index) {
      // Hide all pattern contents
      patternContents.forEach(content => {
        content.setAttribute('visible', false);
      });
      
      // Show the selected pattern content
      patternContents[index].setAttribute('visible', true);
      activePatternIndex = index;
    }
  }
  
  // Function to update the AR content position and rotation
  function updateContentPosition(index) {
    if (patternPositions[index] && patternRotations[index]) {
      // Update position and rotation
      arContent.object3D.position.copy(patternPositions[index]);
      arContent.object3D.rotation.copy(patternRotations[index]);
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
    
    // Update all sound components
    soundEntities.forEach(entity => {
      if (entity && entity.components.sound) {
        entity.components.sound.data.autoplay = audioEnabled;
      }
    });
  });
  
  // Motion tracking toggle button functionality
  motionButton.addEventListener('click', () => {
    motionTrackingEnabled = !motionTrackingEnabled;
    motionButton.textContent = motionTrackingEnabled ? 'Motion: ON' : 'Motion: OFF';
    
    if (cameraEl && cameraEl.components['motion-tracking']) {
      // Update the motion tracking component
      cameraEl.setAttribute('motion-tracking', {enabled: motionTrackingEnabled});
      
      // Display message about motion tracking
      infoBox.textContent = motionTrackingEnabled ? 
        "Motion tracking enabled. Point at a pattern to calibrate." : 
        "Motion tracking disabled. AR content will stay fixed when patterns are lost.";
      infoBox.style.display = 'block';
      setTimeout(() => {
        infoBox.style.display = 'none';
      }, 3000);
    }
  });
  
  // Check if device motion is available
  function checkDeviceMotionSupport() {
    if ('DeviceOrientationEvent' in window && 'DeviceMotionEvent' in window) {
      console.log('Device motion sensors are supported');
      motionButton.style.display = 'block';
    } else {
      console.log('Device motion sensors are not supported');
      motionButton.style.display = 'none';
    }
  }
  
  // Initialize interactions and check device support
  function initialize() {
    // Add click event listeners to 3D objects
    const box = document.getElementById('box1');
    const sphere = document.getElementById('sphere1');
    const cylinder = document.getElementById('cylinder1');
    
    if (box) {
      box.addEventListener('click', function() {
        console.log('Box clicked');
      });
    }
    
    if (sphere) {
      sphere.addEventListener('click', function() {
        console.log('Sphere clicked');
      });
    }
    
    if (cylinder) {
      cylinder.addEventListener('click', function() {
        console.log('Cylinder clicked');
      });
    }
    
    // Check if device supports motion sensors
    checkDeviceMotionSupport();
  }
  
  // Initialize after a short delay to ensure elements are loaded
  setTimeout(initialize, 1000);
});