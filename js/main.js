document.addEventListener('DOMContentLoaded', () => {
  const loadingElement = document.getElementById('loading');
  const helpButton = document.getElementById('btn-help');
  const audioButton = document.getElementById('btn-toggle-audio');
  const infoBox = document.getElementById('info-box');
  
  // Audio state
  let audioEnabled = false;
  
  // Sound entities
  let soundEntities = [];
  
  // Event listeners for AR experience
  const sceneEl = document.querySelector('a-scene');
  
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
  });
  
  // Show loading screen when AR experience is not ready
  sceneEl.addEventListener('arError', () => {
    console.log('AR experience error');
    loadingElement.textContent = 'AR Error! Please try reloading the page.';
  });
  
  // Log when targets are found and play corresponding sound if enabled
  sceneEl.addEventListener('targetFound', (event) => {
    const targetIndex = event.detail.name;
    console.log(`Target ${targetIndex} found`);
    
    // Play sound if audio is enabled
    if (audioEnabled && soundEntities[targetIndex]) {
      soundEntities[targetIndex].components.sound.playSound();
    }
  });
  
  // Log when targets are lost
  sceneEl.addEventListener('targetLost', (event) => {
    const targetIndex = event.detail.name;
    console.log(`Target ${targetIndex} lost`);
  });
  
  // Help button functionality
  helpButton.addEventListener('click', () => {
    if (infoBox.style.display === 'none' || infoBox.style.display === '') {
      infoBox.style.display = 'block';
      setTimeout(() => {
        infoBox.style.display = 'none';
      }, 3000);
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
  
  // Make AR elements interactive
  document.addEventListener('DOMContentLoaded', () => {
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
  });
});