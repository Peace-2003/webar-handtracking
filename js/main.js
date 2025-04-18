// AR Book Experience
// Implementation focused on pattern detection for initial positioning
// with motion tracking for persistent visibility

class ARBookExperience {
  constructor() {
    // App state
    this.state = {
      isLoading: true,
      activePatternIndex: -1,
      positionOffsets: {}, // Store position offsets for each pattern
      isAdjustMode: false,
      adjustStep: 0.01, // Step size for position adjustments
      motionTrackingEnabled: true
    };

    // UI elements
    this.uiElements = {
      loading: document.getElementById('loading'),
      statusDisplay: document.getElementById('status-display'),
      infoBox: document.getElementById('info-box'),
      btnHelp: document.getElementById('btn-help'),
      btnAdjust: document.getElementById('btn-adjust'),
      btnReset: document.getElementById('btn-reset'),
      positionControls: document.getElementById('position-controls')
    };

    // AR components
    this.arComponents = {
      mindarThree: null,
      renderer: null,
      scene: null,
      camera: null,
      anchors: [],
      contentGroup: null, // Group holding the currently visible content
      contentModels: [] // Will store actual 3D content for each pattern
    };

    // Debug mode
    this.debug = true;
  }

  // Initialize the AR experience
  async init() {
    this.logDebug('Initializing AR experience');
    
    // Set up UI event listeners
    this.setupUIEvents();
    
    // Initialize Three.js and MindAR
    await this.setupAR();
    
    this.state.isLoading = false;
    this.uiElements.loading.style.display = 'none';
    
    this.logDebug('AR experience initialized');
  }

  // Set up UI event listeners
  setupUIEvents() {
    // Help button
    this.uiElements.btnHelp.addEventListener('click', () => {
      this.showMessage("Point your camera at a pattern. Content will stay visible as you move around.");
    });

    // Adjust position button
    this.uiElements.btnAdjust.addEventListener('click', () => {
      if (this.state.activePatternIndex === -1) {
        this.showMessage("First locate a pattern");
        return;
      }

      this.state.isAdjustMode = !this.state.isAdjustMode;
      this.uiElements.positionControls.style.display = this.state.isAdjustMode ? 'block' : 'none';
      
      if (this.state.isAdjustMode) {
        this.showMessage("Adjust position mode active");
      }
    });

    // Reset position button
    this.uiElements.btnReset.addEventListener('click', () => {
      if (this.state.activePatternIndex === -1) {
        this.showMessage("First locate a pattern");
        return;
      }
      
      // Reset stored offsets for active pattern
      const index = this.state.activePatternIndex;
      this.state.positionOffsets[index] = { x: 0, y: 0, z: 0 };
      
      // Reset position of content
      if (this.arComponents.contentGroup) {
        this.arComponents.contentGroup.position.set(0, 0, 0);
        this.showMessage("Position reset");
      }
    });

    // Position adjustment buttons
    const positionButtons = document.querySelectorAll('.position-btn');
    positionButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (this.state.activePatternIndex === -1 || !this.arComponents.contentGroup) {
          return;
        }
        
        const axis = button.getAttribute('data-axis');
        const dir = parseInt(button.getAttribute('data-dir'));
        const step = this.state.adjustStep * dir;
        const patternIndex = this.state.activePatternIndex;
        
        // Initialize offsets object if it doesn't exist
        if (!this.state.positionOffsets[patternIndex]) {
          this.state.positionOffsets[patternIndex] = { x: 0, y: 0, z: 0 };
        }
        
        // Update offset
        this.state.positionOffsets[patternIndex][axis] += step;
        
        // Apply offset to content group
        if (axis === 'x') this.arComponents.contentGroup.position.x += step;
        else if (axis === 'y') this.arComponents.contentGroup.position.y += step;
        else if (axis === 'z') this.arComponents.contentGroup.position.z += step;
        
        const offset = this.state.positionOffsets[patternIndex];
        this.logDebug(`Adjusted ${axis} by ${step}. Total offset: x:${offset.x.toFixed(3)}, y:${offset.y.toFixed(3)}, z:${offset.z.toFixed(3)}`);
      });
    });
  }

  // Set up Three.js and MindAR
  async setupAR() {
    try {
      // Create MindAR instance with image target
      this.arComponents.mindarThree = new MindARThree({
        container: document.body,
        imageTargetSrc: './targets/targets.mind',
        filterMinCF: 0.0001,
        filterBeta: 0.01,
        missTolerance: 5
      });
      
      // Get AR components
      this.arComponents.renderer = this.arComponents.mindarThree.renderer;
      this.arComponents.scene = this.arComponents.mindarThree.scene;
      this.arComponents.camera = this.arComponents.mindarThree.camera;
      
      // Create world container group to hold the active content
      this.arComponents.contentGroup = new THREE.Group();
      this.arComponents.scene.add(this.arComponents.contentGroup);
      
      // Create AR anchors for each pattern
      const numTargets = 3; // Assuming 3 patterns are used
      
      for (let i = 0; i < numTargets; i++) {
        // Create anchor for this target
        const anchor = this.arComponents.mindarThree.addAnchor(i);
        this.arComponents.anchors.push(anchor);
        
        // Create content for this pattern
        const content = this.createContentForPattern(i);
        this.arComponents.contentModels.push(content);
        
        // Set up anchor events
        anchor.onTargetFound = () => {
          this.onPatternFound(i);
        };
        
        anchor.onTargetLost = () => {
          this.onPatternLost(i);
        };
      }
      
      // Start AR
      await this.arComponents.mindarThree.start();
      this.startRenderLoop();
      
    } catch (error) {
      console.error("Error setting up AR:", error);
      this.showMessage("Failed to initialize AR. Please refresh and try again.");
    }
  }

  // Create 3D content for a specific pattern
  createContentForPattern(patternIndex) {
    const content = new THREE.Group();
    
    // Different content based on pattern index
    switch(patternIndex) {
      case 0: // Pattern 1 - Red cube
        const geometry1 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material1 = new THREE.MeshBasicMaterial({color: 0xff0000});
        const cube = new THREE.Mesh(geometry1, material1);
        cube.position.set(0, 0.05, 0);
        content.add(cube);
        
        // Add a label for Pattern 1
        const label1 = this.createTextSprite("Pattern 1");
        label1.position.set(0, 0.15, 0);
        content.add(label1);
        break;
        
      case 1: // Pattern 2 - Blue sphere
        const geometry2 = new THREE.SphereGeometry(0.05, 32, 32);
        const material2 = new THREE.MeshBasicMaterial({color: 0x0000ff});
        const sphere = new THREE.Mesh(geometry2, material2);
        sphere.position.set(0, 0.05, 0);
        content.add(sphere);
        
        // Add a label for Pattern 2
        const label2 = this.createTextSprite("Pattern 2");
        label2.position.set(0, 0.15, 0);
        content.add(label2);
        break;
        
      case 2: // Pattern 3 - Green cylinder
        const geometry3 = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 32);
        const material3 = new THREE.MeshBasicMaterial({color: 0x00ff00});
        const cylinder = new THREE.Mesh(geometry3, material3);
        cylinder.position.set(0, 0.05, 0);
        content.add(cylinder);
        
        // Add a yellow torus knot for pattern 3
        const geometryKnot = new THREE.TorusKnotGeometry(0.03, 0.01, 64, 16);
        const materialKnot = new THREE.MeshBasicMaterial({color: 0xffff00});
        const torusKnot = new THREE.Mesh(geometryKnot, materialKnot);
        torusKnot.position.set(0.1, 0.05, 0);
        content.add(torusKnot);
        
        // Add a label for Pattern 3
        const label3 = this.createTextSprite("Pattern 3");
        label3.position.set(0, 0.15, 0);
        content.add(label3);
        break;
    }
    
    return content;
  }
  
  // Create a text label as a sprite
  createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = '32px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({map: texture});
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.2, 0.05, 1);
    
    return sprite;
  }

  // Handle pattern found event
  onPatternFound(patternIndex) {
    this.logDebug(`Pattern ${patternIndex} found`);
    
    // If a different pattern is already active, hide it
    if (this.state.activePatternIndex !== -1 && this.state.activePatternIndex !== patternIndex) {
      this.logDebug(`Switching from pattern ${this.state.activePatternIndex} to pattern ${patternIndex}`);
    }
    
    this.state.activePatternIndex = patternIndex;
    this.uiElements.statusDisplay.textContent = `Pattern ${patternIndex + 1} detected`;
    
    // Position content in world space
    this.positionContentInWorld(patternIndex);
  }

  // Handle pattern lost event
  onPatternLost(patternIndex) {
    this.logDebug(`Pattern ${patternIndex} lost - content still visible with motion tracking`);
    
    if (this.state.activePatternIndex === patternIndex) {
      this.uiElements.statusDisplay.textContent = `Pattern ${patternIndex + 1} (tracking with motion)`;
    }
    
    // We don't hide content - it stays visible with motion tracking
  }

  // Position content in world space based on pattern
  positionContentInWorld(patternIndex) {
    // Clear any existing content in the content group
    while(this.arComponents.contentGroup.children.length > 0) {
      this.arComponents.contentGroup.remove(this.arComponents.contentGroup.children[0]);
    }
    
    // Get the anchor for this pattern
    const anchor = this.arComponents.anchors[patternIndex];
    if (!anchor) return;
    
    // Get the content for this pattern
    const content = this.arComponents.contentModels[patternIndex];
    if (!content) return;
    
    // Clone the content for display
    const contentClone = content.clone();
    
    // Add the content to the content group
    this.arComponents.contentGroup.add(contentClone);
    
    // Get the world position and rotation from the anchor
    const worldPosition = new THREE.Vector3();
    anchor.object3D.getWorldPosition(worldPosition);
    
    const worldQuaternion = new THREE.Quaternion();
    anchor.object3D.getWorldQuaternion(worldQuaternion);
    
    // Position the content group at the anchor's world position
    this.arComponents.contentGroup.position.copy(worldPosition);
    this.arComponents.contentGroup.quaternion.copy(worldQuaternion);
    
    // Apply any saved position offsets
    if (this.state.positionOffsets[patternIndex]) {
      const offset = this.state.positionOffsets[patternIndex];
      this.arComponents.contentGroup.position.x += offset.x;
      this.arComponents.contentGroup.position.y += offset.y;
      this.arComponents.contentGroup.position.z += offset.z;
    }
    
    this.logDebug(`Content for pattern ${patternIndex} positioned in world space`);
  }

  // Start the render loop
  startRenderLoop() {
    const render = () => {
      this.arComponents.renderer.render(this.arComponents.scene, this.arComponents.camera);
      requestAnimationFrame(render);
    };
    
    requestAnimationFrame(render);
  }

  // Display a temporary message
  showMessage(message, duration = 3000) {
    this.uiElements.infoBox.textContent = message;
    this.uiElements.infoBox.style.display = 'block';
    setTimeout(() => {
      this.uiElements.infoBox.style.display = 'none';
    }, duration);
  }

  // Debug logging
  logDebug(message) {
    if (this.debug) {
      console.log(`[ARBookExperience] ${message}`);
    }
  }
}

// Initialize the app when the document is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const arExperience = new ARBookExperience();
    await arExperience.init();
  } catch (error) {
    console.error('Error initializing AR experience:', error);
    document.getElementById('loading').textContent = 'Failed to load AR experience. Please refresh.';
  }
});