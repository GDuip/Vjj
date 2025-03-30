// ============================================================================
// Utility Functions
// ============================================================================
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Add is-mobile class to body for CSS targeting
if (isMobile) {
    document.body.classList.add('is-mobile');
}

// ============================================================================
// Game Settings Module
// ============================================================================
const GameSettings = {
    settings: {
        language: 'ko', // Default language
        forwardKey: 'KeyW',
        backwardKey: 'KeyS',
        leftKey: 'KeyA',
        rightKey: 'KeyD',
        touchSensitivity: 1.0,
        musicVolume: 0.5,
        sfxVolume: 0.7,
        useSpatialReverb: true,
        reverbQuality: 'medium', // Corresponds to different IR files potentially
    },

    init() {
        this.loadSettings();
        // applySettings() is called AFTER other modules are ready in Game.init
        this.bindControlEvents();
        console.log("GameSettings Initialized (will apply settings later)");
    },

    loadSettings() {
        const savedSettings = localStorage.getItem('fpsGameSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                // Validate loaded settings slightly
                this.settings = {
                     ...this.settings,
                     ...parsed,
                     // Ensure numerical values are numbers
                     touchSensitivity: parseFloat(parsed.touchSensitivity ?? this.settings.touchSensitivity),
                     musicVolume: parseFloat(parsed.musicVolume ?? this.settings.musicVolume),
                     sfxVolume: parseFloat(parsed.sfxVolume ?? this.settings.sfxVolume),
                     // Ensure boolean is boolean
                     useSpatialReverb: typeof parsed.useSpatialReverb === 'boolean' ? parsed.useSpatialReverb : this.settings.useSpatialReverb,
                 };
                console.log("Loaded settings:", this.settings);
            } catch (e) {
                console.error("Failed to parse saved settings:", e);
                localStorage.removeItem('fpsGameSettings'); // Remove corrupted data
            }
        }
        // Update UI elements to reflect loaded settings *values*
        this.updateUIFromSettings();
    },

    saveSettings() {
        // Read current values from UI controls
        this.settings.language = document.getElementById('languageSelect')?.value ?? this.settings.language;
        this.settings.forwardKey = document.getElementById('forwardKeyInput')?.value ?? this.settings.forwardKey;
        this.settings.backwardKey = document.getElementById('backwardKeyInput')?.value ?? this.settings.backwardKey;
        this.settings.leftKey = document.getElementById('leftKeyInput')?.value ?? this.settings.leftKey;
        this.settings.rightKey = document.getElementById('rightKeyInput')?.value ?? this.settings.rightKey;
        this.settings.touchSensitivity = parseFloat(document.getElementById('touchSensitivity')?.value ?? this.settings.touchSensitivity);
        this.settings.musicVolume = parseFloat(document.getElementById('musicVolume')?.value ?? this.settings.musicVolume);
        this.settings.sfxVolume = parseFloat(document.getElementById('sfxVolume')?.value ?? this.settings.sfxVolume);
        this.settings.useSpatialReverb = document.getElementById('spatialReverb')?.checked ?? this.settings.useSpatialReverb;
        this.settings.reverbQuality = document.getElementById('reverbQuality')?.value ?? this.settings.reverbQuality;

        try {
            localStorage.setItem('fpsGameSettings', JSON.stringify(this.settings));
            // console.log("Saved settings:", this.settings);
            this.applySettings(); // Apply settings immediately after saving/changing
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
    },

    applySettings() {
        // Apply settings to relevant modules (check if modules exist first)
        if (AudioManager.setMusicVolume) AudioManager.setMusicVolume(this.settings.musicVolume);
        if (AudioManager.setSfxVolume) AudioManager.setSfxVolume(this.settings.sfxVolume);
        if (AudioManager.setReverb) AudioManager.setReverb(this.settings.useSpatialReverb, this.settings.reverbQuality);
        if (InputManager.setTouchSensitivity) InputManager.setTouchSensitivity(this.settings.touchSensitivity);
        if (InputManager.updateKeyBindings) InputManager.updateKeyBindings(); // Tell InputManager to re-read key bindings

        // Language change might require a UI refresh or re-init of localization library
        // For now, just log the change
        console.log("Applied language setting:", this.settings.language);
        // If using a localization library, trigger its update function here.
        // e.g., Localization.setLanguage(this.settings.language);

        // Update UI elements that might not trigger change events automatically
        this.updateUIFromSettings();
        console.log("Applied settings:", this.settings);
    },

    updateUIFromSettings() {
        // Update UI elements to match the loaded settings state
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) langSelect.value = this.settings.language;

        const forwardKeyInput = document.getElementById('forwardKeyInput');
        if (forwardKeyInput) forwardKeyInput.value = this.settings.forwardKey;
        const backwardKeyInput = document.getElementById('backwardKeyInput');
        if (backwardKeyInput) backwardKeyInput.value = this.settings.backwardKey;
        const leftKeyInput = document.getElementById('leftKeyInput');
        if (leftKeyInput) leftKeyInput.value = this.settings.leftKey;
        const rightKeyInput = document.getElementById('rightKeyInput');
        if (rightKeyInput) rightKeyInput.value = this.settings.rightKey;

        const touchSensitivitySlider = document.getElementById('touchSensitivity');
        if (touchSensitivitySlider) touchSensitivitySlider.value = this.settings.touchSensitivity;
        const touchSensitivityValue = document.getElementById('touchSensitivityValue');
        if(touchSensitivityValue) touchSensitivityValue.textContent = parseFloat(this.settings.touchSensitivity).toFixed(1);


        const musicVolSlider = document.getElementById('musicVolume');
        if (musicVolSlider) musicVolSlider.value = this.settings.musicVolume;
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        if(musicVolumeValue) musicVolumeValue.textContent = Math.round(this.settings.musicVolume * 100);


        const sfxVolSlider = document.getElementById('sfxVolume');
        if (sfxVolSlider) sfxVolSlider.value = this.settings.sfxVolume;
        const sfxVolumeValue = document.getElementById('sfxVolumeValue');
        if(sfxVolumeValue) sfxVolumeValue.textContent = Math.round(this.settings.sfxVolume * 100);


        const reverbCheckbox = document.getElementById('spatialReverb');
        if (reverbCheckbox) reverbCheckbox.checked = this.settings.useSpatialReverb;

        const reverbQualitySelect = document.getElementById('reverbQuality');
        if (reverbQualitySelect) reverbQualitySelect.value = this.settings.reverbQuality;

        // Disable reverb quality if reverb is off
        if(reverbQualitySelect && reverbCheckbox) {
            reverbQualitySelect.disabled = !reverbCheckbox.checked;
        }
    },

    bindControlEvents() {
        // Add change/input listeners to all settings controls to save immediately
        document.querySelectorAll('#settingsScreen select, #settingsScreen input[type="checkbox"], #settingsScreen input[type="radio"]').forEach(element => {
             element.addEventListener('change', () => this.saveSettings());
         });
        // Use 'input' for sliders for real-time feedback saving
         document.querySelectorAll('#settingsScreen input[type="range"]').forEach(element => {
             element.addEventListener('input', () => {
                 this.saveSettings(); // Save continuously while sliding
                 // Update displayed value next to slider
                  const valueDisplay = document.getElementById(element.id + 'Value');
                  if(valueDisplay) {
                     if(element.id === 'touchSensitivity') {
                         valueDisplay.textContent = parseFloat(element.value).toFixed(1);
                     } else {
                          valueDisplay.textContent = Math.round(element.value * 100);
                     }
                  }
             });
         });

         // Special handling for key binding inputs (update on blur or Enter key?)
         document.querySelectorAll('#settingsScreen input.keybind-input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                 e.preventDefault(); // Prevent typing the key character itself
                 input.value = e.code; // Display the code (e.g., "KeyW", "ArrowUp")
                this.saveSettings(); // Save immediately on key press display
                 input.blur(); // Optional: lose focus after setting
            });
            // Fallback in case keydown doesn't register weird keys
             input.addEventListener('blur', () => this.saveSettings());
        });

        console.log("Settings controls bound.");
    }
};

// ============================================================================
// Audio Manager Module
// ============================================================================
const AudioManager = {
    audioContext: null,
    sfxGainNode: null,
    musicGainNode: null,
    masterGainNode: null,
    listener: null,
    loadedSounds: {},
    loadedReverbs: {},
    currentReverbNode: null,
    reverbEnabled: true,
    reverbQuality: 'medium',
    bgmSource: null, // For background music loop
    soundsToLoad: {
        // --- Essential ---
        hit_standard: 'assets/sounds/hit_standard.wav', // *** REPLACE PATH ***
        hit_bonus: 'assets/sounds/hit_bonus.wav',       // *** REPLACE PATH ***
        hit_penalty: 'assets/sounds/hit_penalty.wav',   // *** REPLACE PATH ***
        miss: 'assets/sounds/miss.wav',                // *** REPLACE PATH ***
        shoot: 'assets/sounds/shoot.wav',              // *** REPLACE PATH ***
        reload: 'assets/sounds/reload.wav',            // *** REPLACE PATH ***
        // --- Optional ---
        hit_wood: 'assets/sounds/hit_wood.wav',         // *** REPLACE PATH *** (For penetrable cover)
        // empty_clip: 'assets/sounds/empty_clip.wav', // *** REPLACE PATH ***
        // footstep: 'assets/sounds/footstep.wav',     // *** REPLACE PATH ***
        // target_spawn: 'assets/sounds/target_spawn.wav', // *** REPLACE PATH ***
        bgm: 'assets/sounds/background_music.mp3'   // *** REPLACE PATH ***
    },
    reverbsToLoad: { // Different IR files for quality levels
        low: 'assets/sounds/reverb_ir_small.wav',    // *** REPLACE PATH ***
        medium: 'assets/sounds/reverb_ir_medium.wav', // *** REPLACE PATH ***
        high: 'assets/sounds/reverb_ir_large.wav'    // *** REPLACE PATH ***
    },
    activeSoundSources: new Set(), // Track active sources for stopping etc.

    init() {
        return new Promise((resolve, reject) => {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // Resume context on user gesture if needed (often required by browsers)
                const resumeContext = () => {
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume().then(() => {
                            console.log("AudioContext Resumed");
                            document.removeEventListener('click', resumeContext);
                            document.removeEventListener('touchstart', resumeContext);
                        });
                    } else {
                        document.removeEventListener('click', resumeContext);
                        document.removeEventListener('touchstart', resumeContext);
                    }
                };
                document.addEventListener('click', resumeContext);
                document.addEventListener('touchstart', resumeContext);


                this.listener = new THREE.AudioListener(); // Use THREE's listener

                // Create gain nodes
                this.masterGainNode = this.audioContext.createGain();
                this.musicGainNode = this.audioContext.createGain();
                this.sfxGainNode = this.audioContext.createGain();

                // Connect gains: Source -> SFX/Music Gain -> Master Gain -> Destination
                this.musicGainNode.connect(this.masterGainNode);
                this.sfxGainNode.connect(this.masterGainNode);
                this.masterGainNode.connect(this.audioContext.destination);

                console.log("AudioManager Initializing - Loading Sounds...");
                this.loadAllSounds().then(() => {
                    console.log("AudioManager Sounds Loaded.");
                    // Initial settings applied later by GameSettings.applySettings
                    resolve();
                }).catch(reject);

            } catch (e) {
                console.error("Web Audio API not supported or context creation failed.", e);
                this.audioContext = null;
                reject("Audio initialization failed");
            }
        });
    },

    async loadAllSounds() {
        if (!this.audioContext) return Promise.resolve(); // Skip loading if context failed

        const loader = new THREE.AudioLoader();
        const loadPromises = [];

        // Load regular sounds
        for (const key in this.soundsToLoad) {
            const path = this.soundsToLoad[key];
            const promise = new Promise((resolve, reject) => {
                loader.load(path,
                    (buffer) => { this.loadedSounds[key] = buffer; /*console.log(`Sound loaded: ${key}`);*/ resolve(); },
                    undefined, // Progress
                    (err) => { console.error(`Failed to load sound ${key} from ${path}:`, err); resolve(); /* Resolve anyway? Or reject? */ }
                );
            });
            loadPromises.push(promise);
        }

        // Load reverb impulse responses
        for (const key in this.reverbsToLoad) {
            const path = this.reverbsToLoad[key];
            const promise = new Promise((resolve, reject) => {
                loader.load(path,
                    (buffer) => { this.loadedReverbs[key] = buffer; /*console.log(`Reverb loaded: ${key}`);*/ resolve(); },
                    undefined,
                    (err) => { console.error(`Failed to load reverb IR ${key} from ${path}:`, err); resolve(); /* Resolve anyway */ }
                );
            });
            loadPromises.push(promise);
        }

        return Promise.all(loadPromises);
    },

    playSound(soundKey, position = null, volume = 1.0, playbackRate = 1.0, loop = false) {
        if (!this.audioContext || this.audioContext.state === 'suspended' || !this.loadedSounds[soundKey] || !this.sfxGainNode) {
            // console.warn(`SFX Not ready or context suspended: ${soundKey}`);
            return null;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.loadedSounds[soundKey];
        source.playbackRate.setValueAtTime(playbackRate, this.audioContext.currentTime);
        source.loop = loop;

        let outputNode = this.sfxGainNode; // Default connection target
        let soundNodeChain = source; // Start of the chain

        // Gain node for individual sound volume control BEFORE spatialization/reverb
        const individualGain = this.audioContext.createGain();
        individualGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        soundNodeChain.connect(individualGain);
        soundNodeChain = individualGain; // Update end of chain

        // Spatialization + Reverb Send
        if (position && this.listener && typeof position.x === 'number') { // Check if position is valid
            const panner = this.audioContext.createPanner();
            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 100; // Adjust max distance
            panner.rolloffFactor = 1;
            panner.coneInnerAngle = 360; // Omni-directional for now
            panner.coneOuterAngle = 0;
            panner.coneOuterGain = 0;
            // Set position using the correct methods
            if(panner.positionX) {
                 panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
                 panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
                 panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
            } else { // Fallback for older implementations
                 panner.setPosition(position.x, position.y, position.z);
            }


            soundNodeChain.connect(panner); // Connect gain to panner
            soundNodeChain = panner; // Panner is now end of the main chain for direct sound

            // Reverb Path (if enabled and IR loaded for current quality)
            if (this.reverbEnabled && this.currentReverbNode && this.loadedReverbs[this.reverbQuality]) {
                const reverbSendGain = this.audioContext.createGain();
                // Adjust reverb send level (e.g., less than direct path volume)
                reverbSendGain.gain.setValueAtTime(volume * 0.35, this.audioContext.currentTime); // Example: 35% send

                // Send signal FROM the panner TO the reverb send gain
                panner.connect(reverbSendGain);
                reverbSendGain.connect(this.currentReverbNode);

                // Connect the Reverb Node's output TO the main SFX gain node
                this.currentReverbNode.connect(this.sfxGainNode);
                // Note: The direct sound (from panner) also connects to sfxGainNode below
            }
             // Connect the main sound chain (ending with panner) to the SFX gain node
             soundNodeChain.connect(this.sfxGainNode);

        } else {
            // Non-spatial sound: connect individual gain directly to SFX gain
            soundNodeChain.connect(this.sfxGainNode);
        }

        // Track the source node
        this.activeSoundSources.add(source);
        source.onended = () => {
            this.activeSoundSources.delete(source);
             // Disconnect nodes explicitly to help garbage collection? (Might not be necessary)
             // source.disconnect();
             // individualGain.disconnect();
             // if(panner) panner.disconnect();
             // if(reverbSendGain) reverbSendGain.disconnect();
             // No need to disconnect currentReverbNode here, it's persistent
        };


        source.start(this.audioContext.currentTime);
        return source;
    },

    playBGM() {
        if (!this.audioContext || this.audioContext.state === 'suspended' || !this.loadedSounds['bgm'] || !this.musicGainNode) {
           console.warn("BGM Not ready or context suspended.");
            return;
        }
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
            } catch (e) { /* Ignore error if already stopped */ }
            this.bgmSource.disconnect(); // Disconnect previous source
        }

        this.bgmSource = this.audioContext.createBufferSource();
        this.bgmSource.buffer = this.loadedSounds['bgm'];
        this.bgmSource.loop = true;
        this.bgmSource.connect(this.musicGainNode);
        this.bgmSource.start(0);
        console.log("BGM Started.");
    },

    stopBGM() {
        if (this.bgmSource && this.audioContext) {
            try {
                this.bgmSource.stop();
                this.bgmSource.disconnect();
            } catch (e) { /* Ignore error if already stopped */ }
            this.bgmSource = null;
            console.log("BGM Stopped.");
        }
    },

    stopAllSounds() {
        // Stop background music
        this.stopBGM();

        // Stop all active one-shot sound effects
        this.activeSoundSources.forEach(source => {
             try {
                 source.stop(0); // Stop immediately
             } catch (e) { /* Ignore errors if already stopped */ }
            source.disconnect(); // Disconnect to be sure
        });
        this.activeSoundSources.clear(); // Clear the tracking set
        console.log("All active sounds stopped.");
    },


    // --- Volume Controls ---
    setMusicVolume(volume) {
        if (this.musicGainNode && this.audioContext) {
            this.musicGainNode.gain.setTargetAtTime(clamp(volume, 0, 1), this.audioContext.currentTime, 0.05); // Smooth ramp
            // console.log("Music Volume Set:", volume);
        }
    },

    setSfxVolume(volume) {
        if (this.sfxGainNode && this.audioContext) {
            this.sfxGainNode.gain.setTargetAtTime(clamp(volume, 0, 1), this.audioContext.currentTime, 0.05); // Smooth ramp
            // console.log("SFX Volume Set:", volume);
        }
    },

    // --- Reverb Control ---
    setReverb(enabled, quality) {
        this.reverbEnabled = enabled;
        this.reverbQuality = quality; // low, medium, high

        if (!this.audioContext) return;

        // Disconnect the old reverb node cleanly FROM its destination (sfxGainNode)
        if (this.currentReverbNode) {
            try {
                 this.currentReverbNode.disconnect(this.sfxGainNode);
            } catch(e) { /* Ignore if not connected */ }
            console.log("Disconnected previous reverb node output.");
        }

        // Create and connect the new one if enabled and the IR buffer exists
        if (enabled && this.loadedReverbs[quality]) {
            if (!this.currentReverbNode || this.currentReverbNode.buffer !== this.loadedReverbs[quality]) {
                // Create new convolver only if it doesn't exist or quality changed
                this.currentReverbNode = this.audioContext.createConvolver();
                this.currentReverbNode.buffer = this.loadedReverbs[quality];
                console.log(`Reverb Enabled: Created/Set Convolver Quality - ${quality}`);
            }
            // Connection happens dynamically in playSound (reverbSend -> convolver -> sfxGain)
        } else {
            // Reverb disabled or IR not loaded
            if (!this.loadedReverbs[quality]) {
                 console.warn(`Reverb IR for quality "${quality}" not loaded. Disabling reverb.`);
                 this.reverbEnabled = false; // Force disable if IR is missing
                 // Optionally update UI to reflect this forced state
                const reverbCheckbox = document.getElementById('spatialReverb');
                const reverbQualitySelect = document.getElementById('reverbQuality');
                 if (reverbCheckbox) reverbCheckbox.checked = false;
                 if (reverbQualitySelect) reverbQualitySelect.disabled = true; // Disable quality select if IR missing?
            } else {
                 console.log("Reverb Disabled via settings.");
            }
            // We don't nullify currentReverbNode here, just don't connect to it in playSound
             // Keep the node object around in case it's re-enabled later.
        }

        // Update UI reverb quality dropdown enabled state based on checkbox
        const reverbCheckbox = document.getElementById('spatialReverb');
        const reverbQualitySelect = document.getElementById('reverbQuality');
        if(reverbQualitySelect && reverbCheckbox) {
            reverbQualitySelect.disabled = !reverbCheckbox.checked || !this.reverbEnabled;
        }
    },

    getListener() {
       return this.listener;
   }
};


// ============================================================================
// Graphics Module
// ============================================================================
const Graphics = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    container: null,
    // Camera control setup
    cameraBaseY: 1.6, // Player eye height
    cameraPitchObject: null, // Rotates vertically (X-axis)
    cameraYawObject: null,   // Rotates horizontally (Y-axis) - THIS WILL BE THE PLAYER MESH/PHYSICS OBJECT

    init() {
        this.container = document.getElementById('gameCanvas');
        if (!this.container) {
            console.error("Canvas container ('gameCanvas') not found!");
            return false; // Indicate failure
        }

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x33334d);
        this.scene.fog = new THREE.Fog(0x33334d, 50, 150);

        // Camera (Perspective)
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.cameraPitchObject = new THREE.Object3D(); // Controls pitch
        this.cameraPitchObject.add(this.camera);
        // cameraYawObject (player's body/mesh) is set later in attachCameraToPlayer
        this.camera.position.set(0, 0, 0); // Position relative to pitch object

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true, alpha: false }); // Ensure alpha is false unless needed
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding; // Correct color space

        // Clock
        this.clock = new THREE.Clock();

        // Lighting
        this.setupLighting();

        // Add Audio Listener to Camera *after* AudioManager init
        const audioListener = AudioManager.getListener();
        if (audioListener) {
            this.camera.add(audioListener); // Add the listener used by AudioManager
            console.log("Audio Listener attached to camera.");
        } else {
            console.warn("Audio Listener not available when Graphics init ran.");
        }

        // Resize listener
        window.addEventListener('resize', this.onWindowResize.bind(this));

        console.log("Graphics Initialized");
        return true; // Indicate success
    },

    setupLighting() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.6); // Softer ambient
        this.scene.add(ambientLight);

        // Directional Light (Sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Slightly less intense sun
        directionalLight.position.set(20, 30, 25); // Angled position
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100; // Adjusted shadow camera range
        directionalLight.shadow.camera.left = -40; // Wider shadow area
        directionalLight.shadow.camera.right = 40;
        directionalLight.shadow.camera.top = 40;
        directionalLight.shadow.camera.bottom = -40;
        directionalLight.shadow.bias = -0.002; // Adjust bias carefully if shadow acne occurs
        this.scene.add(directionalLight);
        this.scene.add(directionalLight.target); // Target defaults to (0,0,0), can be moved if needed

        // Hemisphere Light (Optional, for softer ground/sky lighting)
        // const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a4a4a, 0.4); // Sky blue, ground gray, less intense
        // this.scene.add(hemiLight);
    },

    // Call this AFTER Physics player body & MESH are created
    attachCameraToPlayer(playerMesh) {
        if (!playerMesh) {
             console.error("Cannot attach camera: Provided player mesh is invalid.");
             return;
        }
        if (!this.cameraPitchObject) {
             console.error("Cannot attach camera: cameraPitchObject is not initialized.");
             return;
        }
        this.cameraYawObject = playerMesh; // Yaw is controlled by the mesh linked to the physics body
        // Position the pitch object at eye level *within* the player mesh's local space
        this.cameraPitchObject.position.set(0, this.cameraBaseY, 0);
        this.cameraYawObject.add(this.cameraPitchObject); // Add pitch control to the player mesh
        console.log("Camera attached to player object.");
    },

    updateCameraRotation(targetYaw, targetPitch) {
        // Note: Yaw rotation is now primarily handled by the PHYSICS body's rotation.
        // This function mainly handles the visual PITCH rotation.
        // We might still visually lerp the YawObject's rotation for smoothness if needed,
        // but the authoritative rotation comes from Physics.syncMeshes().

        if (!this.cameraPitchObject) return;

        const lerpFactor = 0.25; // Smoothing factor for visual pitch

        // Apply Pitch to the Pitch Object (visual only)
        this.cameraPitchObject.rotation.x = lerp(this.cameraPitchObject.rotation.x, targetPitch, lerpFactor);
        // Clamp pitch immediately after lerping
        this.cameraPitchObject.rotation.x = clamp(this.cameraPitchObject.rotation.x, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);


        // --- Physics Body Yaw Update (handled in Physics.applyPlayerMovement and syncMeshes) ---
        // The InputManager provides targetYaw, Physics module uses it to apply torque or slerp the body's quaternion.
        // Graphics.cameraYawObject (the player mesh) will copy the body's quaternion in Physics.syncMeshes.
    },


    render(deltaTime) {
        if (!this.renderer || !this.scene || !this.camera) return;

        // Update camera's visual pitch based on InputManager's target
        // (Yaw is updated by physics sync)
        this.updateCameraRotation(InputManager.targetYaw, InputManager.targetPitch);

        this.renderer.render(this.scene, this.camera);
    },

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    addObject(object) {
        if (object) {
            this.scene.add(object);
        }
    },

    removeObject(object) {
        if (!object) return;

        // Recursively dispose of materials and geometries
        object.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            if (m.map) m.map.dispose(); // Dispose textures
                            m.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            }
        });
        this.scene.remove(object);
    }
};

// ============================================================================
// Physics Module
// ============================================================================
const Physics = {
    world: null,
    materials: {
        default: null, // Will be created
        player: null,
        target: null,
        ground: null,
    },
    player: {
        body: null,
        mesh: null, // Reference to the graphical mesh linked to the body
        shape: null,
        height: 1.7, // Adjusted height
        radius: 0.4
    },
    // activeBodies: [], // Less necessary if using userData linking

    init() {
        // Physics World
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -10, 0), // Standard gravity
            // allowSleep: true // Enable sleeping for performance
        });
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 12; // Increase solver iterations slightly

        // Initialize materials
        this.materials.default = new CANNON.Material("defaultMaterial");
        this.materials.player = new CANNON.Material("playerMaterial");
        this.materials.target = new CANNON.Material("targetMaterial");
        this.materials.ground = new CANNON.Material("groundMaterial");


        this.setupContactMaterials();
        this.createGroundPlane();
        this.createPlayerBody(); // Creates body AND mesh

        // IMPORTANT: Attach camera AFTER player mesh exists
        if (this.player.mesh) {
             Graphics.attachCameraToPlayer(this.player.mesh);
        } else {
            console.error("Player mesh not created, cannot attach camera!");
        }

        console.log("Physics Initialized");
        return true; // Indicate success
    },

    setupContactMaterials() {
        // Default contact properties (if materials not specifically defined below)
        const defaultContactMaterial = new CANNON.ContactMaterial(
             this.materials.default,
             this.materials.default,
             {
                 friction: 0.4,
                 restitution: 0.2,
                 // contactEquationStiffness: 1e8,
                 // contactEquationRelaxation: 3
             }
         );
        this.world.addContactMaterial(defaultContactMaterial);
        this.world.defaultContactMaterial = defaultContactMaterial; // Set as default


        // Player <-> Ground
        const playerGroundContact = new CANNON.ContactMaterial(
            this.materials.player, this.materials.ground,
            { friction: 0.3, restitution: 0.1 }
        );
        this.world.addContactMaterial(playerGroundContact);

        // Target <-> Ground
        const targetGroundContact = new CANNON.ContactMaterial(
            this.materials.target, this.materials.ground,
            { friction: 0.6, restitution: 0.3 }
        );
        this.world.addContactMaterial(targetGroundContact);

        // Target <-> Target
        const targetTargetContact = new CANNON.ContactMaterial(
            this.materials.target, this.materials.target,
            { friction: 0.2, restitution: 0.4 }
        );
        this.world.addContactMaterial(targetTargetContact);

         // Player <-> Target (Example: Player bumping into targets)
         const playerTargetContact = new CANNON.ContactMaterial(
            this.materials.player, this.materials.target,
            { friction: 0.1, restitution: 0.1 } // Low friction/restitution
        );
        this.world.addContactMaterial(playerTargetContact);


        console.log("Contact materials set up.");
    },

    createGroundPlane() {
        // Visual Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x777777, // Darker grey
            roughness: 0.9,
            metalness: 0.1,
            // side: THREE.DoubleSide // Usually not needed for ground plane
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2; // Rotate flat
        groundMesh.position.y = -0.01; // Slightly below 0 to avoid z-fighting if player starts exactly at y=0
        groundMesh.receiveShadow = true;
        Graphics.addObject(groundMesh);

        // Physics Ground Plane
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0, // Static
            material: this.materials.ground,
            shape: groundShape
        });
        // Rotate physics plane to match visual orientation
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
        console.log("Ground plane created.");
    },

    createPlayerBody() {
        // Player Physics Body (Using a Box shape for simplicity)
        // A Capsule is better but requires Cannon-es compound shapes or custom implementation.
        this.player.shape = new CANNON.Box(new CANNON.Vec3(this.player.radius, this.player.height / 2, this.player.radius));

        this.player.body = new CANNON.Body({
            mass: 75,
            position: new CANNON.Vec3(0, 5, 5), // Start higher to avoid initial ground intersection issues
            material: this.materials.player,
            shape: this.player.shape,
            linearDamping: 0.6, // Increase linear damping for less sliding
            angularDamping: 0.95, // Strong angular damping to prevent spinning
            // fixedRotation: false, // Allow rotation (esp. Yaw) - handled via quaternion updates
            // allowSleep: false // Keep player awake for responsiveness
        });

        // Prevent tumbling: Allow rotation only around the Y-axis effectively.
        // Best way is often applying corrective torque or directly setting angular velocity to zero on X/Z,
        // or using constraints. For simplicity, strong angular damping helps a lot.
        // An alternative: Set inertia tensor to prioritize Y rotation (advanced).


        this.world.addBody(this.player.body);

        // Player Visual Mesh (e.g., a simple capsule or cylinder for debugging)
        // IMPORTANT: This mesh is what the camera will be attached to.
        const playerGeometry = new THREE.CapsuleGeometry(this.player.radius, this.player.height - this.player.radius * 2, 8, 16);
        const playerMaterial = new THREE.MeshStandardMaterial({
             color: 0xeeeeee,
             roughness: 0.8,
             visible: false // Make player model invisible from first-person view
        });
        this.player.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.mesh.castShadow = true; // Player can cast shadows
        // Initial position sync (important before camera attachment)
        this.player.mesh.position.copy(this.player.body.position);
        this.player.mesh.quaternion.copy(this.player.body.quaternion);

        Graphics.addObject(this.player.mesh); // Add mesh to the graphics scene

        // Link body and mesh via userData
         this.player.body.userData = { mesh: this.player.mesh, isPlayer: true };
         this.player.mesh.userData = { body: this.player.body };

        console.log("Player physics body and mesh created.");

        // Add collision event listener (example)
       this.player.body.addEventListener("collide", (event) => {
           const otherBody = event.body;
           const contact = event.contact;
           const impactVelocity = contact.getImpactVelocityAlongNormal();

            if (otherBody.material === this.materials.ground) {
                if (impactVelocity > 1.5) { // Threshold for footstep sound
                    // AudioManager.playSound('footstep', contact.rj, 0.4); // Play at contact point
                }
            } else if (otherBody.userData?.targetData) { // Check for targetData in userData
                 // Player collided with a target
                 // console.log("Player bumped target:", otherBody.userData.targetData.id);
                 // Maybe apply small force to target?
            }
       });
    },


    update(deltaTime) {
        if (!this.world) return;

        // Apply forces/torques based on InputManager state
        this.applyPlayerMovementAndRotation(deltaTime);

        // Step the physics world
        const fixedTimeStep = 1 / 60;
        const maxSubSteps = 5; // Allow more substeps if needed for stability
        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);

        // Synchronize visual meshes with physics bodies
        this.syncMeshes();
    },

    applyPlayerMovementAndRotation(deltaTime) {
        if (!this.player.body || (!Game.gameStarted || Game.isPaused || Game.isSettingsOpen)) {
             // If paused or settings open, explicitly stop movement by zeroing velocity?
             if(this.player.body) {
                // this.player.body.velocity.x *= 0.1; // Heavy damping when inactive
                // this.player.body.velocity.z *= 0.1;
                // this.player.body.angularVelocity.y *= 0.1;
             }
            return;
        }

        // --- Movement ---
        const moveSpeed = 6.0; // Base movement speed
        const maxSpeed = 7.0; // Max horizontal speed
        const acceleration = 40.0; // How quickly player reaches moveSpeed (force multiplier)
        const inputVector = InputManager.getMovementVector(); // {x, z} normalized direction

        // Get player's current forward and right directions from the physics body's quaternion
        const forwardDir = new CANNON.Vec3(0, 0, -1);
        const rightDir = new CANNON.Vec3(1, 0, 0);
        this.player.body.quaternion.vmult(forwardDir, forwardDir); // Rotate Vec3 by Quaternion
        this.player.body.quaternion.vmult(rightDir, rightDir);
        forwardDir.y = 0; // Project onto XZ plane
        rightDir.y = 0;
        forwardDir.normalize();
        rightDir.normalize();

        // Calculate desired velocity based on input
        const desiredVel = new CANNON.Vec3(0, 0, 0);
        desiredVel.vadd(rightDir.scale(inputVector.x), desiredVel);
        desiredVel.vadd(forwardDir.scale(inputVector.z), desiredVel);
        desiredVel.normalize(); // Ensure input direction is normalized
        desiredVel.scale(moveSpeed, desiredVel); // Scale to target speed

        // Calculate velocity change needed
        const currentVelXZ = new CANNON.Vec3(this.player.body.velocity.x, 0, this.player.body.velocity.z);
        const velocityChange = new CANNON.Vec3();
        desiredVel.vsub(currentVelXZ, velocityChange);

        // Calculate force to apply (F = m * a, but here a is related to velocityChange/time)
        // Simple approach: Apply force proportional to velocity change needed
        const force = new CANNON.Vec3(
            velocityChange.x * acceleration,
            0, // No vertical force from movement input
            velocityChange.z * acceleration
        );

        // Apply the calculated force
        this.player.body.applyForce(force, this.player.body.position);

        // Clamp horizontal speed
        const currentSpeedSq = this.player.body.velocity.x ** 2 + this.player.body.velocity.z ** 2;
        if (currentSpeedSq > maxSpeed ** 2) {
            const factor = maxSpeed / Math.sqrt(currentSpeedSq);
            this.player.body.velocity.x *= factor;
            this.player.body.velocity.z *= factor;
        }


        // --- Rotation (Yaw) ---
        // Apply torque or directly manipulate quaternion to match InputManager.targetYaw
        const targetYaw = InputManager.targetYaw;
        const currentQuaternion = this.player.body.quaternion;
        const targetQuaternion = new CANNON.Quaternion();
        targetQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), targetYaw);

        // Smoothly interpolate the physics body's quaternion towards the target
        const lerpFactor = 0.2; // Smoothing factor for rotation (adjust as needed)
        currentQuaternion.slerp(targetQuaternion, lerpFactor, this.player.body.quaternion);
        // Ensure the body wakes up if it was sleeping
        // this.player.body.wakeUp(); // Usually needed if allowSleep=true

        // Alternative: Apply torque to rotate (more physics-based, harder to tune)
        // const angleDiff = targetYaw - currentYawAngle; // Need to get currentYawAngle from quaternion
        // const torqueMagnitude = angleDiff * rotationSpeedFactor;
        // this.player.body.torque.y = torqueMagnitude; // Apply torque around Y
    },


    syncMeshes() {
        // Sync player mesh
        if (this.player.body && this.player.mesh) {
            this.player.mesh.position.copy(this.player.body.position);
            this.player.mesh.quaternion.copy(this.player.body.quaternion);
        }

        // Sync active targets
        TargetManager.targets.forEach(targetData => {
            if (targetData.mesh && targetData.body) {
                // Only sync if the body is not sleeping (or sync always if needed)
                // if (!targetData.body.sleepState === CANNON.Body.SLEEPING) {
                     targetData.mesh.position.copy(targetData.body.position);
                     targetData.mesh.quaternion.copy(targetData.body.quaternion);
                // }

                // Check if target has fallen out of bounds
                if (targetData.body.position.y < -15) { // Lower threshold
                    // console.log(`Target ${targetData.id} fell out of bounds.`);
                    TargetManager.removeTarget(targetData, true); // Mark as out of bounds
                }
            }
        });
    },


    // --- Raycasting for Shooting ---
    raycast(originVec3, directionVec3, distance) {
         // Convert THREE vectors (if passed) to CANNON vectors
         const origin = new CANNON.Vec3(originVec3.x, originVec3.y, originVec3.z);
         const direction = new CANNON.Vec3(directionVec3.x, directionVec3.y, directionVec3.z);

         // Calculate end point for the ray
        const to = origin.clone();
        direction.normalize(); // Ensure direction is normalized
        to.vadd(direction.scale(distance), to); // Add scaled direction vector

         const ray = new CANNON.Ray(origin, to);
         const options = {
             collisionFilterMask: -1, // Collide with everything by default
             skipBackfaces: true,     // Don't detect hits from inside
             checkCollisionResponse: true // Respect collision response settings
         };
         const result = new CANNON.RaycastResult();
         const hits = [];

         ray.intersectWorld(this.world, options, function(result){
              // Check if the hit body is the player itself, ignore if so
             if(result.body === Physics.player.body) {
                  // console.log("Raycast hit player body, ignoring.");
                  return; // Continue ray through player
              }
               hits.push({
                  body: result.body,
                  point: result.hitPointWorld.clone(), // Clone vectors!
                  distance: result.distance,
                  normal: result.hitNormalWorld.clone() // Get hit normal too
               });
           });

           // Sort hits by distance (closest first)
           hits.sort((a, b) => a.distance - b.distance);
          return hits; // Return array of sorted hits: [{body, point, distance, normal}, ...]
      },


    addBody(body, mesh = null, linkUserData = true) {
        if (!body) return;
        this.world.addBody(body);

         // Link mesh and body via userData if requested and mesh exists
         if (linkUserData && mesh) {
            body.userData = body.userData || {}; // Ensure userData exists
             body.userData.mesh = mesh;
             mesh.userData = mesh.userData || {};
             mesh.userData.body = body;
         }
    },

    removeBody(body) {
        if (!body) return;

        // Remove any event listeners attached *directly* to the body
        // body.removeEventListener("collide", ...); // Needs reference to the specific listener function

        // Remove the graphical mesh if linked via userData
        if (body.userData?.mesh) {
            const mesh = body.userData.mesh;
             Graphics.removeObject(mesh); // Use Graphics module to remove and dispose
             if (mesh.userData) {
                mesh.userData.body = null; // Break link from mesh back to body
            }
            body.userData.mesh = null; // Break link from body to mesh
        }

        // Remove body from the physics world
        this.world.removeBody(body);
    }
};

// ============================================================================
// Input Manager Module
// ============================================================================
const InputManager = {
    keys: {}, // Tracks state of keyboard keys { "KeyW": true, ... }
    mouse: {
        dx: 0, dy: 0, // Delta movement this frame
        leftButton: false,
        // rightButton: false
    },
    touch: {
        moveIdentifier: null, // ID of touch controlling movement joystick
        lookIdentifier: null, // ID of touch controlling camera look
        shootIdentifier: null, // ID of touch controlling shooting button

        moveStartX: 0, moveStartY: 0,
        moveCurrentX: 0, moveCurrentY: 0,
        moveDeltaX: 0, moveDeltaY: 0, // Raw delta from start for joystick visual

        lookStartX: 0, lookStartY: 0,
        lookCurrentX: 0, lookCurrentY: 0,
        lookDeltaX: 0, lookDeltaY: 0, // Delta for look rotation calculation this frame

        sensitivity: 1.0,
        moveActive: false,
        lookActive: false,
    },
    pointerLocked: false,
    targetYaw: 0,    // Target camera yaw (horizontal) angle (radians) - Physics body aims for this
    targetPitch: 0, // Target camera pitch (vertical) angle (radians) - Visual only

    lookSensitivity: 0.0022, // Desktop sensitivity
    mobileLookSensitivityMultiplier: 0.6, // Adjust mobile sensitivity relative to desktop

    // Key Bindings (loaded from GameSettings)
    keyBindings: {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        reload: 'KeyR',
        // jump: 'Space'
    },

    init() {
        this.updateKeyBindings(); // Load initially from GameSettings
        this.addEventListeners();
        this.resetState();
        console.log("InputManager Initialized");
        return true; // Indicate success
    },

     resetState() {
        this.keys = {};
        this.mouse = { dx: 0, dy: 0, leftButton: false };
        this.touch = {
             moveIdentifier: null, lookIdentifier: null, shootIdentifier: null,
             moveStartX: 0, moveStartY: 0, moveCurrentX: 0, moveCurrentY: 0, moveDeltaX: 0, moveDeltaY: 0,
             lookStartX: 0, lookStartY: 0, lookCurrentX: 0, lookCurrentY: 0, lookDeltaX: 0, lookDeltaY: 0,
             sensitivity: this.touch.sensitivity, // Keep loaded sensitivity
             moveActive: false, lookActive: false
         };
        this.targetYaw = 0;
        this.targetPitch = 0;
        // Pointer lock state is handled by events, not reset here
    },

    updateKeyBindings() {
        this.keyBindings.forward = GameSettings.settings.forwardKey;
        this.keyBindings.backward = GameSettings.settings.backwardKey;
        this.keyBindings.left = GameSettings.settings.leftKey;
        this.keyBindings.right = GameSettings.settings.rightKey;
        // Add other keys if implemented (reload, jump)
         // this.keyBindings.reload = GameSettings.settings.reloadKey;
        console.log("Key bindings updated:", this.keyBindings);
        this.keys = {}; // Reset internal key state when bindings change
    },

    setTouchSensitivity(sensitivity) {
        this.touch.sensitivity = clamp(sensitivity, 0.1, 3.0); // Clamp sensitivity range
        console.log("Touch sensitivity set:", this.touch.sensitivity);
    },

    addEventListeners() {
        // Keyboard
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Pointer Lock (Desktop)
        document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this), false);
        document.addEventListener('mozpointerlockchange', this.handlePointerLockChange.bind(this), false); // Firefox
        // Click on canvas to request pointer lock
        Graphics.renderer.domElement.addEventListener('click', () => {
            if (!isMobile && !this.pointerLocked && Game.gameStarted && !Game.isPaused && !Game.isSettingsOpen) {
                Graphics.renderer.domElement.requestPointerLock()
                    .catch(err => console.error("Failed to request pointer lock:", err));
            }
        });

        // Mouse Movement (Only when locked)
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Pointer Down/Up for Shooting (Handles Mouse and Generic Touch)
        // Attach to canvas for game world interactions
        Graphics.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        Graphics.renderer.domElement.addEventListener('pointerup', this.handlePointerUp.bind(this));
        // Prevent context menu on right click over canvas
         Graphics.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());


        // Specific Touch Events for Mobile UI (Joystick, Buttons)
        if (isMobile) {
            this.addMobileTouchListeners();
        }
    },

    // --- Keyboard Handling ---
    handleKeyDown(e) {
        // Ignore input if settings menu is open and the target is not a keybind input
        if (Game.isSettingsOpen && !e.target.classList.contains('keybind-input')) return;
         // Ignore repeats to only capture initial press for some actions
         // if (e.repeat) return;

         this.keys[e.code] = true;

         // Handle actions triggered on key down (if any, e.g., toggle something)
         // Example: Pause toggle
         if (e.code === 'Escape' && !Game.isSettingsOpen) {
             // If pointer lock is active, Escape will release it first.
             // The pointerlockchange event handles pausing in that case.
             // If not locked, toggle pause directly.
             if(!this.pointerLocked) {
                Game.togglePause();
             }
         }
    },
    handleKeyUp(e) {
        if (Game.isSettingsOpen && !e.target.classList.contains('keybind-input')) return;
        this.keys[e.code] = false;
    },

    // --- Pointer Lock Handling ---
    handlePointerLockChange() {
        const lockElement = document.pointerLockElement || document.mozPointerLockElement;
        if (lockElement === Graphics.renderer.domElement) {
            this.pointerLocked = true;
            console.log('Pointer Lock acquired');
            // Optional: Hide custom cursor if you have one
        } else {
             if(this.pointerLocked) { // Only trigger if lock was previously held
                this.pointerLocked = false;
                console.log('Pointer Lock released');
                // If game was running and lock is lost, pause the game
                 if (Game.gameStarted && !Game.isPaused && !Game.isSettingsOpen) {
                     console.log('Pointer lock lost during gameplay, pausing.');
                     Game.pauseGame(true); // Pass true to force pause state
                      // Optional: Show pause menu UI
                 }
                 // Optional: Show custom cursor
             }
        }
    },

    // --- Mouse Movement Handling (Desktop - Pointer Locked) ---
    handleMouseMove(event) {
        // Only process if pointer is locked (desktop) and game is active
        if (!this.pointerLocked || !Game.gameStarted || Game.isPaused || Game.isSettingsOpen) {
             this.mouse.dx = 0; this.mouse.dy = 0; // Reset delta if not active
             return;
        }

        // Get movement deltas
        const movementX = event.movementX || event.mozMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || 0;

        this.mouse.dx = movementX;
        this.mouse.dy = movementY;

        // Update target camera angles (sensitivity applied here)
        this.targetYaw -= movementX * this.lookSensitivity;
        this.targetPitch -= movementY * this.lookSensitivity;

        // Normalize Yaw angle (keep between 0 and 2*PI or -PI and PI)
        this.targetYaw = this.targetYaw % (Math.PI * 2);
        // Clamp Pitch angle
        this.targetPitch = clamp(this.targetPitch, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
    },


    // --- Mobile Touch Handling ---
    addMobileTouchListeners() {
        const joystickArea = document.getElementById('joystick');
        const shootButton = document.getElementById('shootButton');
        const canvas = Graphics.renderer.domElement; // Use canvas for look input

        // --- Touch Start ---
         document.body.addEventListener('touchstart', (e) => { // Listen on body to capture all touches initially
            if (!Game.gameStarted || Game.isPaused || Game.isSettingsOpen) return;

             // e.preventDefault(); // Prevent default actions like scrolling/zooming ONLY if touch is handled

             const joystickRect = joystickArea?.getBoundingClientRect();
             const shootButtonRect = shootButton?.getBoundingClientRect();

             for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                 const touchX = touch.clientX;
                 const touchY = touch.clientY;

                 // Check if touch is on Joystick
                 if (joystickArea && this.touch.moveIdentifier === null &&
                    touchX >= joystickRect.left && touchX <= joystickRect.right &&
                    touchY >= joystickRect.top && touchY <= joystickRect.bottom)
                {
                     e.preventDefault();
                     this.touch.moveIdentifier = touch.identifier;
                     this.touch.moveStartX = touchX;
                     this.touch.moveStartY = touchY;
                     this.touch.moveCurrentX = touchX;
                     this.touch.moveCurrentY = touchY;
                     this.touch.moveActive = true;
                     this.updateJoystickVisual(0, 0); // Center initially
                     joystickArea.classList.add('active');
                     // console.log("Joystick touch started:", touch.identifier);

                 }
                 // Check if touch is on Shoot Button
                 else if (shootButton && this.touch.shootIdentifier === null &&
                    touchX >= shootButtonRect.left && touchX <= shootButtonRect.right &&
                    touchY >= shootButtonRect.top && touchY <= shootButtonRect.bottom)
                 {
                      e.preventDefault();
                      this.touch.shootIdentifier = touch.identifier;
                      this.mouse.leftButton = true; // Simulate left mouse down
                      Game.triggerShoot(); // Trigger immediately on press
                      shootButton.classList.add('active');
                      // console.log("Shoot button touch started:", touch.identifier);
                 }
                 // Check if touch is for Looking (right side of screen, not on buttons)
                 else if (this.touch.lookIdentifier === null && touchX > window.innerWidth / 2) {
                     // Avoid starting look if touch also started on shoot button
                      let onShootButton = shootButton &&
                                         touchX >= shootButtonRect.left && touchX <= shootButtonRect.right &&
                                         touchY >= shootButtonRect.top && touchY <= shootButtonRect.bottom;
                     if(!onShootButton) {
                         e.preventDefault();
                         this.touch.lookIdentifier = touch.identifier;
                         this.touch.lookStartX = touchX;
                         this.touch.lookStartY = touchY;
                         this.touch.lookCurrentX = touchX;
                         this.touch.lookCurrentY = touchY;
                         this.touch.lookActive = true;
                         this.touch.lookDeltaX = 0; // Reset delta for the frame
                         this.touch.lookDeltaY = 0;
                         // console.log("Look touch started:", touch.identifier);
                     }
                 }
             }
         }, { passive: false }); // Need passive: false to call preventDefault


        // --- Touch Move ---
         document.body.addEventListener('touchmove', (e) => {
             if (!Game.gameStarted || Game.isPaused || Game.isSettingsOpen) return;

              // Prevent default only if a relevant touch is moved
             let prevent = false;
             for (let i = 0; i < e.changedTouches.length; i++) {
                 const touch = e.changedTouches[i];
                  if (touch.identifier === this.touch.moveIdentifier || touch.identifier === this.touch.lookIdentifier) {
                     prevent = true;
                     break;
                  }
             }
             if (prevent) e.preventDefault();


             for (let i = 0; i < e.changedTouches.length; i++) {
                 const touch = e.changedTouches[i];
                 const touchX = touch.clientX;
                 const touchY = touch.clientY;

                  // Handle Movement Joystick Drag
                  if (touch.identifier === this.touch.moveIdentifier) {
                      this.touch.moveCurrentX = touchX;
                      this.touch.moveCurrentY = touchY;
                      // Calculate delta from the initial touch start for visual feedback
                      const visualDeltaX = this.touch.moveCurrentX - this.touch.moveStartX;
                      const visualDeltaY = this.touch.moveCurrentY - this.touch.moveStartY;
                      this.updateJoystickVisual(visualDeltaX, visualDeltaY);
                       // Store the raw delta from start for getMovementVector
                       this.touch.moveDeltaX = visualDeltaX;
                       this.touch.moveDeltaY = visualDeltaY;
                  }
                 // Handle Look Drag
                  else if (touch.identifier === this.touch.lookIdentifier) {
                     // Calculate delta since last move event for this finger
                     const deltaX = touchX - this.touch.lookCurrentX;
                     const deltaY = touchY - this.touch.lookCurrentY;

                      this.touch.lookDeltaX = deltaX; // Store delta for this frame
                      this.touch.lookDeltaY = deltaY;

                      // Update target angles (apply sensitivity here)
                      const effectiveSensitivity = this.lookSensitivity * this.mobileLookSensitivityMultiplier * this.touch.sensitivity;
                      this.targetYaw -= deltaX * effectiveSensitivity;
                      this.targetPitch -= deltaY * effectiveSensitivity;

                      // Normalize Yaw and Clamp Pitch
                     this.targetYaw = this.targetYaw % (Math.PI * 2);
                     this.targetPitch = clamp(this.targetPitch, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);

                     // Update current position for next delta calculation
                     this.touch.lookCurrentX = touchX;
                     this.touch.lookCurrentY = touchY;
                 }
             }
         }, { passive: false }); // Need passive: false for preventDefault


         // --- Touch End / Cancel ---
         const handleTouchEnd = (e) => {
            if (!Game.gameStarted) return; // Check game started, but allow ending touches even if paused/settings

            for (let i = 0; i < e.changedTouches.length; i++) {
                 const touch = e.changedTouches[i];

                  // Movement Joystick Touch Ended
                 if (touch.identifier === this.touch.moveIdentifier) {
                     this.touch.moveIdentifier = null;
                     this.touch.moveActive = false;
                     this.touch.moveDeltaX = 0;
                     this.touch.moveDeltaY = 0;
                     this.updateJoystickVisual(0, 0); // Reset visual
                     joystickArea?.classList.remove('active');
                      // console.log("Joystick touch ended.");
                 }
                 // Look Touch Ended
                 else if (touch.identifier === this.touch.lookIdentifier) {
                     this.touch.lookIdentifier = null;
                     this.touch.lookActive = false;
                     this.touch.lookDeltaX = 0; // Reset delta
                     this.touch.lookDeltaY = 0;
                      // console.log("Look touch ended.");
                 }
                  // Shoot Button Touch Ended
                 else if (touch.identifier === this.touch.shootIdentifier) {
                     this.touch.shootIdentifier = null;
                     this.mouse.leftButton = false; // Simulate mouse up
                     shootButton?.classList.remove('active');
                     // console.log("Shoot button touch ended.");
                 }
             }
         };

         document.body.addEventListener('touchend', handleTouchEnd);
         document.body.addEventListener('touchcancel', handleTouchEnd); // Handle interruptions
     },

     updateJoystickVisual(deltaX, deltaY) {
        const knob = document.getElementById('joystickKnob');
        const base = document.getElementById('joystick');
        if (!knob || !base) return;

         const maxDist = base.offsetWidth / 3; // Max distance knob moves from center

         // Clamp the delta vector magnitude
         const currentDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
         let clampedX = deltaX;
         let clampedY = deltaY;

         if (currentDist > maxDist) {
             const angle = Math.atan2(deltaY, deltaX);
             clampedX = Math.cos(angle) * maxDist;
             clampedY = Math.sin(angle) * maxDist;
         }

         knob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
     },


    // --- Unified Pointer Down (Shooting Trigger - Mouse & Non-UI Touch) ---
     handlePointerDown(event) {
        // Ignore if interacting with UI elements (buttons, sliders etc.)
         // Check if the event target is the canvas itself or the body/html
        if (event.target !== Graphics.renderer.domElement && event.target !== document.body && event.target !== document.documentElement) {
             // console.log("Pointer down ignored (target is UI element):", event.target);
             return;
         }
        // On mobile, ignore if this touch is already assigned to movement or look
         if (isMobile && event.pointerType === 'touch') {
              if (event.pointerId === this.touch.moveIdentifier || event.pointerId === this.touch.lookIdentifier) {
                 // console.log("Pointer down ignored (touch assigned to move/look)");
                 return;
             }
             // Also ignore if it's the dedicated shoot button touch (handled in touchstart)
              if (event.pointerId === this.touch.shootIdentifier) {
                 // console.log("Pointer down ignored (touch assigned to shoot button)");
                 return;
             }
         }

        // Require pointer lock on desktop for shooting, but allow click to gain lock
        if (!isMobile && !this.pointerLocked) {
             if (Game.gameStarted && !Game.isPaused && !Game.isSettingsOpen) {
                 // Request lock, but don't shoot yet
                 // Graphics.renderer.domElement.requestPointerLock();
             }
             // console.log("Pointer down ignored (desktop, not locked)");
             return;
        }

        // Conditions to actually shoot
        if (Game.gameStarted && !Game.isPaused && !Game.isSettingsOpen) {
            // Check for left mouse button (button 0) or primary touch
             if (event.button === 0) { // Includes primary touch point
                this.mouse.leftButton = true;
                Game.triggerShoot(); // Tell Game module to handle shooting
            }
            // Potential right-click action (e.g., aim down sights)
            // else if (event.button === 2) {
            //     this.mouse.rightButton = true;
            //     // Game.startAiming();
            // }
        }
     },

     // --- Unified Pointer Up (Shooting Release) ---
     handlePointerUp(event) {
        // Check if the event target is relevant (canvas or body)
         if (event.target !== Graphics.renderer.domElement && event.target !== document.body && event.target !== document.documentElement) {
            return;
        }

         // Check for left mouse button release or primary touch release
        if (event.button === 0) {
             this.mouse.leftButton = false;
             // Handle stopping automatic fire here if implemented
         }
        // Right button release
        // else if (event.button === 2) {
        //     this.mouse.rightButton = false;
        //     // Game.stopAiming();
        // }
    },


    // --- Getters for Game Logic ---
    isKeyDown(keyCode) {
        return this.keys[keyCode] === true;
    },

    // Returns a normalized {x, z} vector representing movement input
    getMovementVector() {
        const vector = { x: 0, z: 0 };

        if (isMobile) {
            // Mobile joystick input
            if (this.touch.moveActive && this.touch.moveIdentifier !== null) {
                const maxDist = document.getElementById('joystick')?.offsetWidth / 3 ?? 50; // Use base radius
                 // Calculate direction vector based on current delta from start
                 const dx = this.touch.moveDeltaX;
                 const dy = this.touch.moveDeltaY; // Raw delta from start pos
                 const dist = Math.sqrt(dx*dx + dy*dy);

                 if (dist > 0) {
                    const normalizedX = clamp(dx / maxDist, -1, 1);
                     const normalizedY = clamp(dy / maxDist, -1, 1); // Y delta corresponds to Z movement

                     vector.x = normalizedX;
                      vector.z = -normalizedY; // Invert Y axis: Up on joystick (-Y) means forward (-Z)
                 }
            }
        } else {
            // Desktop keyboard input
            let fwd = 0, side = 0;
            if (this.isKeyDown(this.keyBindings.forward)) fwd -= 1;
            if (this.isKeyDown(this.keyBindings.backward)) fwd += 1;
            if (this.isKeyDown(this.keyBindings.left)) side -= 1;
            if (this.isKeyDown(this.keyBindings.right)) side += 1;

             vector.z = fwd;
             vector.x = side;
        }

        // Normalize the vector if there's diagonal movement
        const length = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
        if (length > 0) {
            vector.x /= length;
            vector.z /= length;
        }

        return vector;
    }

};

// ============================================================================
// Target Manager Module
// ============================================================================
const TargetManager = {
    targets: [], // Array of active target data objects: { id, mesh, body, type, currentHealth }
    targetTypes: { // Define different target properties
        STANDARD: { name: 'STANDARD', points: 10, color: 0xff4444, /* Bright Red */ scale: 1.0, sound: 'hit_standard', penetrable: false, health: 1, massMultiplier: 1.0 },
        BONUS:    { name: 'BONUS',    points: 30, color: 0xffd700, /* Gold */       scale: 0.7, sound: 'hit_bonus',    penetrable: false, health: 1, massMultiplier: 0.8 },
        PENALTY:  { name: 'PENALTY',  points: -20,color: 0x44ff44, /* Bright Green */ scale: 1.1, sound: 'hit_penalty',  penetrable: false, health: 1, massMultiplier: 1.2 },
        COVER:    { name: 'COVER',    points: 5,  color: 0xcd853f, /* Peru (Brown) */ scale: 1.4, sound: 'hit_wood',     penetrable: true,  health: 3, massMultiplier: 2.0 }, // Example penetrable
    },
    maxTargets: 12, // Max concurrent targets
    spawnIntervalBase: 1.3, // Base time between spawns (seconds)
    spawnIntervalVariance: 0.6, // Random variance +/-
    nextSpawnTime: 0, // Time until next spawn attempt
    timeSinceLastSpawn: 0, // Counter
    spawnArea: { minX: -18, maxX: 18, minY: 0.8, maxY: 7, minZ: -28, maxZ: -12 }, // Define spawn volume
    targetCounter: 0, // Simple unique ID counter
    targetGeometryCache: {}, // Cache geometries for reuse
    targetMaterialCache: {}, // Cache materials for reuse

    init() {
        // Pre-cache geometries and materials if possible (optional optimization)
         this.cacheTargetAssets();
        console.log("TargetManager Initialized");
        this.reset();
    },

    cacheTargetAssets() {
        Object.values(this.targetTypes).forEach(type => {
            // Cache Geometry (adjust size based on type scale)
             const geoKey = `box_${type.scale.toFixed(2)}`;
             if (!this.targetGeometryCache[geoKey]) {
                // Standard target dimensions: width=0.6, height=1.2, depth=0.3
                 this.targetGeometryCache[geoKey] = new THREE.BoxGeometry(
                    0.6 * type.scale,
                    1.2 * type.scale,
                    0.3 * type.scale
                );
             }
             // Cache Material (based on color)
            const matKey = `mat_${type.color.toString(16)}`;
             if (!this.targetMaterialCache[matKey]) {
                 this.targetMaterialCache[matKey] = new THREE.MeshStandardMaterial({
                     color: type.color,
                     roughness: 0.7,
                     metalness: 0.1
                 });
             }
        });
        console.log("Target assets cached.");
    },


    reset() {
        // Remove all existing targets cleanly using the proper removal function
        [...this.targets].forEach(targetData => this.removeTarget(targetData)); // Iterate over a copy
        this.targets = []; // Ensure array is empty
        this.timeSinceLastSpawn = 0;
        this.nextSpawnTime = this.spawnIntervalBase / 2; // Spawn first target relatively quickly
        this.targetCounter = 0;
        console.log("TargetManager Reset");
    },

    update(deltaTime) {
        if (!Game.gameStarted || Game.isPaused || Game.isSettingsOpen) return;

        // --- Target Spawning ---
        this.timeSinceLastSpawn += deltaTime;
        if (this.targets.length < this.maxTargets && this.timeSinceLastSpawn >= this.nextSpawnTime) {
            this.spawnTarget();
            this.timeSinceLastSpawn = 0;
            // Calculate next spawn time with variance
            this.nextSpawnTime = this.spawnIntervalBase + (Math.random() - 0.5) * 2 * this.spawnIntervalVariance;
            this.nextSpawnTime = Math.max(0.4, this.nextSpawnTime); // Ensure minimum spawn delay
        }

        // --- Target Behavior / Updates (Optional) ---
        // Example: Slowly rotate targets?
        // this.targets.forEach(targetData => {
        //     if (targetData.body && !targetData.body.isSleeping) { // Only rotate active targets
        //         const rotationSpeed = 0.1;
        //         const q = new CANNON.Quaternion();
        //         q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationSpeed * deltaTime);
        //         targetData.body.quaternion = q.mult(targetData.body.quaternion);
        //     }
        // });
    },

    spawnTarget() {
        // --- Choose Target Type ---
        // Weighted random selection can be implemented here. Simple random for now:
        const typeKeys = Object.keys(this.targetTypes);
        const randomTypeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const type = this.targetTypes[randomTypeKey];

        // --- Get Cached Assets ---
        const geoKey = `box_${type.scale.toFixed(2)}`;
        const matKey = `mat_${type.color.toString(16)}`;
        const geometry = this.targetGeometryCache[geoKey];
        const material = this.targetMaterialCache[matKey];

         if(!geometry || !material) {
             console.error(`Could not find cached assets for target type: ${type.name}`);
             this.cacheTargetAssets(); // Attempt to re-cache if missing
             return; // Skip spawning this target
         }

        // --- Visual Representation (Three.js Mesh) ---
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = false; // Targets usually don't receive complex shadows

        // --- Spawn Position & Rotation ---
        const spawnX = THREE.MathUtils.randFloat(this.spawnArea.minX, this.spawnArea.maxX);
        const spawnY = THREE.MathUtils.randFloat(this.spawnArea.minY, this.spawnArea.maxY);
        const spawnZ = THREE.MathUtils.randFloat(this.spawnArea.minZ, this.spawnArea.maxZ);
        mesh.position.set(spawnX, spawnY, spawnZ);
        mesh.rotation.y = Math.random() * Math.PI * 2; // Random initial yaw

        // --- Physical Representation (Cannon.js Body) ---
        // Use half extents matching the geometry size
        const halfExtents = new CANNON.Vec3(
            (0.6 * type.scale) / 2,
            (1.2 * type.scale) / 2,
            (0.3 * type.scale) / 2
        );
        const shape = new CANNON.Box(halfExtents);
        const body = new CANNON.Body({
            mass: type.massMultiplier * type.scale * 1.5, // Mass based on type and scale
            position: new CANNON.Vec3(spawnX, spawnY, spawnZ),
            shape: shape,
            material: Physics.materials.target,
            linearDamping: 0.05, // Low linear damping
            angularDamping: 0.1, // Low angular damping
            // allowSleep: true, // Allow targets to sleep
            // sleepSpeedLimit: 0.2,
            // sleepTimeLimit: 0.8
        });
        body.quaternion.copy(mesh.quaternion); // Match initial rotation

        // Optional: Apply a small initial impulse to make them tumble slightly
         const impulseStrength = 0.5 * body.mass;
         const randomImpulse = new CANNON.Vec3(
             (Math.random() - 0.5) * impulseStrength,
             Math.random() * impulseStrength * 0.5, // Less upward impulse
             (Math.random() - 0.5) * impulseStrength
         );
         const randomPoint = new CANNON.Vec3( // Apply impulse off-center for rotation
              (Math.random() - 0.5) * halfExtents.x,
              (Math.random() - 0.5) * halfExtents.y,
              (Math.random() - 0.5) * halfExtents.z
          );
         body.applyImpulse(randomImpulse, randomPoint);


        // --- Link Mesh, Body, and Data ---
        const targetId = `target_${this.targetCounter++}`;
        const targetData = {
            id: targetId,
            mesh: mesh,
            body: body,
            type: type,
            currentHealth: type.health
        };

        // Add references for easy lookup using userData (CRITICAL FOR RAYCAST HITS)
        // Store the actual targetData object on the body's userData
        body.userData = { targetData: targetData }; // Overwrite/set userData
        mesh.userData = { targetId: targetId }; // Store ID on mesh for potential debugging

        // --- Add to Worlds & Tracking ---
        Graphics.addObject(mesh);
        Physics.addBody(body, mesh, false); // Add body, mesh linking handled above
        this.targets.push(targetData);

        // Optional: Play spawn sound effect
        // AudioManager.playSound('target_spawn', body.position, 0.3);
    },

    getTargetDataFromId(id) {
        return this.targets.find(t => t.id === id);
    },

    // Get target data directly from the physics body's userData
    getTargetDataFromBody(body) {
        return body?.userData?.targetData; // Safely access nested property
    },

    // Call this when a raycast hits a target body
    processHit(hitBody, hitPoint, hitNormal, damage = 1) {
        const targetData = this.getTargetDataFromBody(hitBody);
        if (!targetData || targetData.currentHealth <= 0) {
             // console.log("Hit processed on invalid or already destroyed target.");
             return { destroyed: false, score: 0, wasPenalized: false, wasPenetrable: false }; // Target already gone or invalid
         }

        targetData.currentHealth -= damage;

        // --- Visual/Audio Feedback ---
        // Play hit sound based on type
         AudioManager.playSound(targetData.type.sound, hitPoint);

        // Apply impulse to body based on hit
         const impulseMagnitude = 5 * damage; // Scale impulse with damage
         const impulse = new CANNON.Vec3(-hitNormal.x, -hitNormal.y, -hitNormal.z); // Impulse opposite to normal
         impulse.scale(impulseMagnitude, impulse);
         hitBody.applyImpulse(impulse, hitPoint); // Apply impulse at the hit point

        // TODO: Add visual hit effect (particle spark, decal) at hitPoint, oriented by hitNormal
         // ParticleSystem.createHitEffect(hitPoint, hitNormal, targetData.type.color);

        let score = 0;
        let destroyed = false;
        let wasPenalized = false;
        let wasPenetrable = targetData.type.penetrable; // Return if the hit target was penetrable

        if (targetData.currentHealth <= 0) {
            // --- Target Destroyed ---
            destroyed = true;
            score = targetData.type.points; // Base points for destruction
            wasPenalized = targetData.type.points < 0;

            // Let Game module handle combo/scoring logic based on points and destruction
            Game.registerHit(targetData.type.points, true);

            // If it was a penalty target, maybe trigger player damage in Game.registerHit
            // if (wasPenalized) { Game.playerDamage(10); }

            // Remove the destroyed target
            this.removeTarget(targetData);

        } else {
            // --- Target Damaged but not Destroyed (e.g., penetrable cover) ---
            destroyed = false;
            // Give partial points for damaging cover? Or only score on destruction?
             score = targetData.type.points >= 0 ? Math.round(targetData.type.points * 0.1) : 0; // e.g., 10% points if not penalty
             wasPenalized = false; // Not fully penalized if not destroyed? Or penalize per hit?

             Game.registerHit(targetData.type.points, false); // Register partial hit (less/no points/combo)

            // TODO: Add visual feedback for damage (e.g., change color slightly, add crack decal)
            // targetData.mesh.material.color.offsetHSL(0, -0.1, -0.1); // Example: darken slightly
        }

         return { destroyed, score, wasPenalized, wasPenetrable }; // Return info about the hit result
    },

    // Remove target from the game
    removeTarget(targetDataOrId, isOutOfBounds = false) {
        const idToRemove = (typeof targetDataOrId === 'string') ? targetDataOrId : targetDataOrId?.id;
        if (!idToRemove) return;

        const index = this.targets.findIndex(t => t.id === idToRemove);
        if (index > -1) {
            const targetData = this.targets[index];

            // Remove physics body first (this also triggers Graphics.removeObject via Physics.removeBody)
            Physics.removeBody(targetData.body);

            // Remove from tracking array
            this.targets.splice(index, 1);

            // Optional: Trigger logic if removed because it fell out
            if (isOutOfBounds && targetData.type.points > 0) { // Only penalize if it wasn't a penalty target already
                // console.log(`Target ${targetData.id} removed (out of bounds).`);
                // Game.registerOutOfBoundsPenalty(); // Maybe a small score penalty?
            }
            // console.log(`Target ${idToRemove} removed successfully. Remaining: ${this.targets.length}`);
        } else {
            // console.warn(`Target with ID ${idToRemove} not found for removal.`);
        }
    }
};

// ============================================================================
// Game Module (Main Logic, State, UI)
// ============================================================================
const Game = {
    // Game State
    score: 0,
    consecutiveHits: 0,
    maxConsecutiveHits: 0, // Track max combo reached
    comboMultiplier: 1.0,
    gameTime: 90, // Game duration in seconds
    timeLeft: 90,
    gameStarted: false,
    isPaused: false,
    isSettingsOpen: false,
    isGameOver: false,

    // Player Stats
    ammo: 15,
    maxAmmo: 15,
    totalAmmo: 75, // Reserve ammo
    isReloading: false,
    reloadTime: 1.5, // seconds
    reloadTimer: 0,
    health: 100,
    maxHealth: 100,

    // UI Elements Cache
    uiElements: {
        score: null, combo: null, comboLabel: null, comboValue: null, comboHits: null,
        ammo: null, maxAmmo: null, totalAmmo: null, reloadIndicator: null,
        timer: null, healthFill: null, healthValue: null,
        hitMarker: null, gunEffects: null, crosshair: null,
        gameUI: null, settingsButton: null, settingsScreen: null,
        pauseScreen: null, gameOverScreen: null, finalScore: null, maxComboStat: null, startScreen: null,
        startButton: null, restartButton: null, resumeButton: null, quitButton: null, // Example buttons
        mobileControls: null, // Container for mobile UI
    },

    // Config
    comboThresholds: { 1: 1.0, 5: 1.5, 10: 2.0, 15: 2.5, 25: 3.0 }, // Hits : Multiplier
    hitMarkerTimeoutId: null,
    shootCooldown: 0.12, // Seconds between shots (fire rate)
    timeSinceLastShot: 0,

    // --- Initialization ---
    init() {
        return new Promise(async (resolve, reject) => {
            console.log("Game Initializing...");
            try {
                // Init essential modules in order
                await AudioManager.init();      // Needs to load sounds (async)
                if (!Graphics.init()) throw new Error("Graphics initialization failed"); // Needs Audio Listener
                if (!Physics.init()) throw new Error("Physics initialization failed");  // Needs Graphics, creates player mesh
                TargetManager.init();           // Needs Physics materials
                GameSettings.init();            // Load settings data
                if (!InputManager.init()) throw new Error("Input Manager initialization failed"); // Needs Graphics, Physics, Settings

                // Cache DOM elements AFTER basic init
                this.cacheDOMElements();
                if (!this.uiElements.gameCanvas || !this.uiElements.settingsScreen) {
                     throw new Error("Essential UI elements not found in HTML.");
                 }

                // Apply loaded settings now that modules are ready
                GameSettings.applySettings();

                // Set initial game state & UI
                this.resetGame();

                // Bind UI button actions
                this.setupUIInteractions();

                // Start the main loop
                requestAnimationFrame(this.gameLoop.bind(this));

                console.log("Game Initialized Successfully. Ready for Start.");
                // Show start screen (handled by resetGame)
                resolve();

            } catch (error) {
                console.error("Game Initialization Failed:", error);
                // Display a user-friendly error message on the page
                document.body.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">
                    <h1>Initialization Error</h1><p>Could not start the game.</p><p>${error.message || error}</p>
                    <p>Please ensure asset paths are correct and required libraries (Three.js, Cannon-es.js) are loaded.</p></div>`;
                reject(error);
            }
        });
    },

    cacheDOMElements() {
        this.uiElements.gameCanvas = document.getElementById('gameCanvas'); // Essential check

        this.uiElements.score = document.getElementById('scoreValue'); // Target the value span
        this.uiElements.combo = document.getElementById('combo');
        this.uiElements.comboLabel = document.getElementById('comboLabel');
        this.uiElements.comboValue = document.getElementById('comboValue');
        this.uiElements.comboHits = document.getElementById('comboHits');


        this.uiElements.ammo = document.getElementById('ammoValue'); // Target the value span
        this.uiElements.maxAmmo = document.getElementById('ammoMaxValue'); // Target the value span
        this.uiElements.totalAmmo = document.getElementById('totalAmmoValue'); // Target the value span
        this.uiElements.reloadIndicator = document.getElementById('reloadIndicator');


        this.uiElements.timer = document.getElementById('timerValue'); // Target the value span
        this.uiElements.healthFill = document.getElementById('healthFill');
        this.uiElements.healthValue = document.getElementById('healthValue'); // Target the value span


        this.uiElements.hitMarker = document.getElementById('hitMarker');
        this.uiElements.gunEffects = document.getElementById('gunEffects'); // For muzzle flash, etc.
        this.uiElements.crosshair = document.getElementById('crosshair');


        this.uiElements.gameUI = document.getElementById('gameUI');
        this.uiElements.settingsButton = document.getElementById('settingsButton');
        this.uiElements.settingsScreen = document.getElementById('settingsScreen'); // Essential check
        this.uiElements.pauseScreen = document.getElementById('pauseScreen');
        this.uiElements.gameOverScreen = document.getElementById('gameOverScreen');
        this.uiElements.finalScore = document.getElementById('finalScoreValue'); // Target the value span
        this.uiElements.maxComboStat = document.getElementById('maxComboValue'); // Target the value span


        this.uiElements.startScreen = document.getElementById('startScreen');
        this.uiElements.startButton = document.getElementById('startButton');
        this.uiElements.restartButton = document.getElementById('restartButton'); // In game over screen
        this.uiElements.resumeButton = document.getElementById('resumeButton'); // In pause screen
        this.uiElements.quitButton = document.getElementById('quitButton'); // In pause screen (optional)


        this.uiElements.mobileControls = document.getElementById('mobileControls');

         console.log("UI Elements Cached");
    },

    setupUIInteractions() {
        // Start Button
        this.uiElements.startButton?.addEventListener('click', () => this.startGame());

        // Restart Button (Game Over)
        this.uiElements.restartButton?.addEventListener('click', () => {
            this.hideGameOverScreen();
            this.resetGame(); // Reset first
            this.startGame(); // Then start fresh
        });

        // Resume Button (Pause Menu)
        this.uiElements.resumeButton?.addEventListener('click', () => this.pauseGame(false)); // Pass false to unpause

        // Settings Button (Toggle) - Uses inline onclick="toggleSettings()" in HTML example
        // If not using inline, add listener here:
         this.uiElements.settingsButton?.addEventListener('click', () => this.toggleSettings());

        // Settings Screen Close Button (if one exists)
        document.getElementById('closeSettingsButton')?.addEventListener('click', () => this.hideSettings());

         // Quit Button (Pause Menu - Optional: reloads page or goes to main menu)
         this.uiElements.quitButton?.addEventListener('click', () => {
            // Simple quit: Reload the page
             window.location.reload();
             // More complex: Go back to a main menu state if implemented
             // this.hidePauseScreen();
             // this.resetGame(); // Go back to initial state (shows start screen)
         });

         // Add listener for ESC key to handle pause/settings closing
         window.addEventListener('keydown', (e) => {
             if (e.key === 'Escape') {
                 if (this.isSettingsOpen) {
                     this.hideSettings();
                 } else if (this.gameStarted && !this.isGameOver) {
                     // If pointer lock is active, ESC releases it first.
                     // The pointerlockchange listener will handle pausing.
                     // If not locked, toggle pause directly.
                     if (!InputManager.pointerLocked) {
                         this.togglePause();
                     }
                 }
             }
         });


        console.log("UI Interactions Setup");
    },

    // --- Game State Control ---
    resetGame() {
        console.log("Resetting Game State...");
        this.score = 0;
        this.consecutiveHits = 0;
        this.maxConsecutiveHits = 0;
        this.comboMultiplier = 1.0;
        this.ammo = this.maxAmmo;
        this.totalAmmo = 90; // Reset reserve ammo
        this.health = this.maxHealth;
        this.timeLeft = this.gameTime;
        this.isGameOver = false;
        this.isPaused = false;
        this.isSettingsOpen = false;
        this.gameStarted = false; // Mark as not started
        this.isReloading = false;
        this.reloadTimer = 0;
        this.timeSinceLastShot = this.shootCooldown; // Ready to shoot immediately

        // Reset Managers
        TargetManager.reset();
        InputManager.resetState(); // Reset input states (keys, touch, look angles)
        AudioManager.stopAllSounds(); // Stop any lingering sounds

        // Reset Physics Player State
        if (Physics.player.body) {
            Physics.player.body.position.set(0, 1.5, 5); // Reset position
            Physics.player.body.velocity.set(0, 0, 0);
            Physics.player.body.angularVelocity.set(0, 0, 0);
            Physics.player.body.quaternion.set(0, 0, 0, 1); // Identity quaternion (facing Z-)
            Physics.player.body.wakeUp(); // Ensure body is active
             // Immediately sync mesh to reset visuals
             Physics.syncMeshes();
              // Reset graphics camera pitch object rotation directly
             if(Graphics.cameraPitchObject) Graphics.cameraPitchObject.rotation.x = 0;
        }

        // Reset UI
        this.updateScoreUI();
        this.updateComboUI();
        this.updateAmmoUI();
        this.updateTimerUI();
        this.updateHealthUI();
        this.hideHitMarker();
        if(this.uiElements.reloadIndicator) this.uiElements.reloadIndicator.style.display = 'none';


        // Show/Hide Screens
        this.hideSettingsScreen();
        this.hidePauseScreen();
        this.hideGameOverScreen();
        if (this.uiElements.gameUI) this.uiElements.gameUI.style.display = 'none'; // Hide game UI initially
        if (this.uiElements.startScreen) this.uiElements.startScreen.style.display = 'flex'; // Show start screen
        if (this.uiElements.settingsButton) this.uiElements.settingsButton.classList.add('hidden'); // Hide settings btn
        if (this.uiElements.mobileControls) this.uiElements.mobileControls.style.display = isMobile ? 'block' : 'none'; // Show mobile controls if needed


         // Release pointer lock if held
         if (document.pointerLockElement) {
             document.exitPointerLock();
         }
    },

    startGame() {
        if (this.gameStarted) return;
        console.log("Starting Game!");

        // Reset might be redundant if called from button, but ensures clean state
        // this.resetGame(); // Optional: Force reset before start?

        this.gameStarted = true;
        this.isGameOver = false;
        this.isPaused = false;
        this.isSettingsOpen = false;
        this.timeLeft = this.gameTime; // Ensure timer starts correctly

        // Show/Hide Screens
        if (this.uiElements.startScreen) this.uiElements.startScreen.style.display = 'none';
        if (this.uiElements.gameUI) this.uiElements.gameUI.style.display = 'block'; // Show game UI
        this.hideGameOverScreen();
        this.hidePauseScreen();
        this.hideSettingsScreen();
        if (this.uiElements.settingsButton) this.uiElements.settingsButton.classList.remove('hidden'); // Show settings btn

        // Request pointer lock on desktop
        if (!isMobile) {
            Graphics.renderer.domElement.requestPointerLock()
                .catch(err => console.warn("Could not acquire pointer lock on start:", err));
        }

        // Start Background Music
        AudioManager.playBGM();

        // Allow target spawning & reset counters
        TargetManager.timeSinceLastSpawn = TargetManager.spawnIntervalBase; // Spawn one relatively quickly
        TargetManager.nextSpawnTime = TargetManager.spawnIntervalBase;
    },

    pauseGame(pauseState) {
        if (this.isGameOver || this.isSettingsOpen) return; // Don't pause if game over or settings open

        if (this.isPaused === pauseState) return; // Already in the desired state

        this.isPaused = pauseState;
        console.log(`Game ${this.isPaused ? 'Paused' : 'Resumed'}`);

        if (this.isPaused) {
            this.showPauseScreen();
            AudioManager.setMusicVolume(GameSettings.settings.musicVolume * 0.3); // Lower music volume
            // Release pointer lock when pausing
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        } else {
            this.hidePauseScreen();
            AudioManager.setMusicVolume(GameSettings.settings.musicVolume); // Restore music volume
            // Re-request pointer lock on resume (desktop)
            if (!isMobile) {
                Graphics.renderer.domElement.requestPointerLock()
                    .catch(err => console.warn("Could not acquire pointer lock on resume:", err));
            }
        }
    },

    togglePause() {
        if (this.isGameOver || this.isSettingsOpen) return;
        this.pauseGame(!this.isPaused);
    },

    gameOver() {
        if (this.isGameOver) return;
        console.log("Game Over!");
        this.isGameOver = true;
        this.gameStarted = false; // Stop game logic updates

        AudioManager.stopBGM();
        // AudioManager.playSound('game_over_sound'); // Play game over fanfare

        this.showGameOverScreen();

        // Release pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        // Disable settings button?
        if (this.uiElements.settingsButton) this.uiElements.settingsButton.classList.add('hidden');
    },

    // --- Settings Menu Handling ---
    toggleSettings() {
         if(this.isSettingsOpen) {
            this.hideSettings();
         } else {
            this.showSettings();
         }
    },

    showSettings() {
         if (this.isGameOver) return; // Don't open settings if game over

        this.isSettingsOpen = true;
        // Pause game logic but don't show pause menu UI
        this.wasPausedBeforeSettings = this.isPaused; // Remember if game was already paused
        this.isPaused = true; // Set internal pause state

        this.showSettingsScreen();
        AudioManager.setMusicVolume(GameSettings.settings.musicVolume * 0.3); // Lower music volume

        // Release pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        console.log("Settings Opened");
    },

    hideSettings() {
        this.isSettingsOpen = false;
        // GameSettings.saveSettings(); // Settings are saved on control interaction now

        this.hideSettingsScreen();
        AudioManager.setMusicVolume(GameSettings.settings.musicVolume); // Restore music volume

        // Restore previous pause state
        this.isPaused = this.wasPausedBeforeSettings;

        // Re-acquire pointer lock if game was running and not explicitly paused before settings
        if (!this.isPaused && !this.isGameOver && this.gameStarted && !isMobile) {
            Graphics.renderer.domElement.requestPointerLock()
                 .catch(err => console.warn("Could not acquire pointer lock after closing settings:", err));
        }
        console.log("Settings Closed");
    },


    // --- Screen Visibility Helpers ---
    showStartScreen() { if (this.uiElements.startScreen) this.uiElements.startScreen.style.display = 'flex'; },
    hideStartScreen() { if (this.uiElements.startScreen) this.uiElements.startScreen.style.display = 'none'; },
    showPauseScreen() { if (this.uiElements.pauseScreen) this.uiElements.pauseScreen.style.display = 'flex'; },
    hidePauseScreen() { if (this.uiElements.pauseScreen) this.uiElements.pauseScreen.style.display = 'none'; },
    showGameOverScreen() {
        if (this.uiElements.gameOverScreen) {
             if(this.uiElements.finalScore) this.uiElements.finalScore.textContent = this.score;
             if(this.uiElements.maxComboStat) this.uiElements.maxComboStat.textContent = this.maxConsecutiveHits;
            this.uiElements.gameOverScreen.style.display = 'flex';
        }
    },
    hideGameOverScreen() { if (this.uiElements.gameOverScreen) this.uiElements.gameOverScreen.style.display = 'none'; },
    showSettingsScreen() { if (this.uiElements.settingsScreen) this.uiElements.settingsScreen.style.display = 'block'; if (this.uiElements.settingsButton) this.uiElements.settingsButton.classList.add('hidden');},
    hideSettingsScreen() { if (this.uiElements.settingsScreen) this.uiElements.settingsScreen.style.display = 'none'; if (this.uiElements.settingsButton) this.uiElements.settingsButton.classList.remove('hidden');},


    // --- Core Game Loop ---
    gameLoop(timestamp) {
        requestAnimationFrame(this.gameLoop.bind(this)); // Schedule next frame

        const deltaTime = Graphics.clock.getDelta();

        // Only update game logic if running
        if (this.gameStarted && !this.isPaused && !this.isGameOver) {
            this.updateGameLogic(deltaTime);
        }

        // Update physics simulation if game started and not paused
        // (Physics.update internally calls applyPlayerMovement which checks pause state)
        if (this.gameStarted && !this.isPaused) {
            Physics.update(deltaTime);
        } else if (this.gameStarted) {
            // If paused, still sync meshes to show the last state correctly
             Physics.syncMeshes();
        }


        // Render the scene always (even when paused/settings open)
        Graphics.render(deltaTime);

         // Reset input deltas after processing frame (important for touch look)
         InputManager.mouse.dx = 0;
         InputManager.mouse.dy = 0;
         InputManager.touch.lookDeltaX = 0;
         InputManager.touch.lookDeltaY = 0;
    },

    updateGameLogic(deltaTime) {
        // Update Timer
        this.timeLeft -= deltaTime;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.gameOver();
            return; // Stop further updates this frame
        }
        this.updateTimerUI();

        // Update Reloading state
        if (this.isReloading) {
            this.reloadTimer -= deltaTime;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
            this.updateReloadIndicator();
        }

        // Update shoot cooldown
        this.timeSinceLastShot += deltaTime;


        // Update Target Manager (Spawning, etc.)
        TargetManager.update(deltaTime);

        // Check for Reload Input
        if (InputManager.isKeyDown(InputManager.keyBindings.reload) && !this.isReloading) {
             this.startReload();
         }

        // Check player health (redundant if playerDamage handles it, but safe)
        if (this.health <= 0 && !this.isGameOver) {
            this.gameOver();
        }
    },

    // --- Shooting Mechanics ---
    triggerShoot() {
        if (this.isReloading || this.timeSinceLastShot < this.shootCooldown) {
            // Play click sound if trying to shoot too fast or while reloading?
             // AudioManager.playSound('empty_clip');
             return;
         }

        if (this.ammo <= 0) {
            this.startReload(); // Auto-reload on empty trigger
            return;
        }

        this.ammo--;
        this.timeSinceLastShot = 0; // Reset cooldown timer
        this.updateAmmoUI();

        // Audio/Visual Feedback
        AudioManager.playSound('shoot', null, 0.8); // Play shoot sound non-spatially
        this.showGunEffect('muzzleFlash');
        // TODO: Add slight camera shake? Recoil effect on camera pitch?

        // Perform Raycast from Camera Center
        const rayOrigin = new THREE.Vector3();
        const rayDirection = new THREE.Vector3();
        Graphics.camera.getWorldPosition(rayOrigin);
        Graphics.camera.getWorldDirection(rayDirection);

        const hits = Physics.raycast(rayOrigin, rayDirection, 300); // Max distance 300 units

        // Process Hits (Penetration Logic)
        let penetrationPower = 1.0; // How much the bullet can penetrate
        const penetrationReduction = 0.7; // Power reduction per penetrable layer
        let hitDetected = false;

        if (hits.length > 0) {
            for (const hit of hits) {
                if (penetrationPower <= 0) break; // Bullet stopped

                const hitBody = hit.body;
                const hitPoint = hit.point;
                const hitNormal = hit.normal;

                 // Try to get target data from the hit body
                 const hitResult = TargetManager.processHit(hitBody, hitPoint, hitNormal, 1); // Process hit with 1 damage

                 if (hitResult) { // processHit should return an object if it hit a target
                     hitDetected = true;
                     this.showHitMarker(); // Show visual confirmation

                      // Reduce penetration power or stop based on result
                     if (hitResult.wasPenetrable && !hitResult.destroyed) {
                         penetrationPower -= penetrationReduction; // Reduce power
                     } else {
                          penetrationPower = 0; // Stop on non-penetrable or destroyed target
                      }

                      if(penetrationPower <= 0) break; // Stop looping if bullet stopped

                  } else {
                      // Hit something that wasn't a managed target (wall, ground, etc.)
                      // console.log("Ray hit non-target object.");
                      // Play wall hit sound? AudioManager.playSound('hit_wall', hitPoint);
                      // Add bullet hole decal? ParticleSystem.createImpactEffect(hitPoint, hitNormal);
                      penetrationPower = 0; // Stop bullet
                      break;
                  }
            }
        }

        // If no targets were hit by the ray at all
        if (!hitDetected) {
            this.registerMiss();
        }
    },

    // --- Scoring and Combos ---
    registerHit(pointsValue, wasDestroyed) {
         // Only process hits on positive point targets for combo/scoring,
         // penalty targets handled separately below.
         if (pointsValue > 0) {
             if (wasDestroyed) { // Only count combo/score multiplier if destroyed
                 this.consecutiveHits++;
                 this.maxConsecutiveHits = Math.max(this.maxConsecutiveHits, this.consecutiveHits);
                 this.updateCombo();
                 const pointsEarned = Math.round(pointsValue * this.comboMultiplier);
                 this.score += pointsEarned;
                 // console.log(`Hit Destroyed! +${pointsEarned} (${pointsValue} x ${this.comboMultiplier}x). Combo: ${this.consecutiveHits}`);
             } else {
                 // Hit but not destroyed (e.g., damaged cover) - Optional small points, no combo increase
                 const partialPoints = Math.round(pointsValue * 0.1); // 10% points for damage?
                 this.score += partialPoints;
                 // console.log(`Target Damaged! +${partialPoints}`);
             }
         }
         // Handle Penalty Targets separately
         else if (pointsValue < 0) {
              // Apply penalty score regardless of destruction state? Assume yes.
             this.score += pointsValue; // Add the negative value
             this.playerDamage(15); // Penalty targets damage the player
             this.resetCombo(); // Hitting penalty resets combo
             console.log(`Penalty Hit! Score ${pointsValue}. Combo Reset. Health: ${this.health}`);
              // Play negative feedback sound?
          }

         this.updateScoreUI();
         this.updateComboUI(); // Update combo UI even on penalty hit (to show it resetting)
     },

    registerMiss() {
        if (this.consecutiveHits > 0) {
            // console.log("Miss! Combo Reset.");
             this.resetCombo();
        }
        AudioManager.playSound('miss', null, 0.6); // Non-spatial miss sound
    },

    updateCombo() {
        let newMultiplier = 1.0; // Default
        // Find the highest threshold met
         let highestThreshold = 1;
         for (const hits in this.comboThresholds) {
             const hitCount = parseInt(hits);
             if (this.consecutiveHits >= hitCount) {
                 newMultiplier = this.comboThresholds[hits];
                 highestThreshold = hitCount; // Keep track for UI potentially
             } else {
                 break; // Stop checking once threshold not met (assumes ordered keys)
             }
         }
         this.comboMultiplier = newMultiplier;
         // UI update handled separately
    },

    resetCombo() {
        this.consecutiveHits = 0;
        this.comboMultiplier = 1.0; // Reset multiplier
        this.updateComboUI(); // Update UI immediately
    },

    // --- Ammo and Reloading ---
    startReload() {
        if (this.isReloading || this.ammo === this.maxAmmo || this.totalAmmo <= 0) {
            return; // Already reloading, full, or no reserve ammo
        }

        console.log("Starting Reload...");
        this.isReloading = true;
        this.reloadTimer = this.reloadTime;
        AudioManager.playSound('reload', null, 0.7);
        this.showReloadIndicator();
    },

    finishReload() {
         if (!this.isReloading) return; // Should not happen, but safety check

         const ammoNeeded = this.maxAmmo - this.ammo;
         const ammoToLoad = Math.min(ammoNeeded, this.totalAmmo);

         if (ammoToLoad > 0) {
             this.ammo += ammoToLoad;
             this.totalAmmo -= ammoToLoad;
             this.updateAmmoUI();
             console.log(`Reload Finished. Ammo: ${this.ammo}/${this.totalAmmo}`);
         }

         this.isReloading = false;
         this.reloadTimer = 0;
         this.hideReloadIndicator();
    },

    // --- Player Health ---
    playerDamage(amount) {
       if (this.isGameOver || amount <= 0) return; // No damage if game over or amount is zero/negative

        this.health -= amount;
        this.health = Math.max(0, this.health); // Clamp at 0
        this.updateHealthUI();
        console.log(`Player took ${amount} damage. Health: ${this.health}`);

        // Add feedback: screen flash red, pain sound?
         document.body.style.animation = 'damageFlash 0.3s ease-out';
         // Need to remove the animation property after it finishes
         setTimeout(() => { document.body.style.animation = ''; }, 300);
        // AudioManager.playSound('player_pain', null, 0.8);

        if (this.health <= 0) {
            this.gameOver();
        }
    },

    playerHeal(amount) {
       if (this.isGameOver || amount <= 0) return;

         this.health += amount;
         this.health = Math.min(this.maxHealth, this.health); // Clamp at max
         this.updateHealthUI();
         console.log(`Player healed ${amount}. Health: ${this.health}`);
         // Add feedback: green flash? Heal sound?
    },

    // --- UI Updates ---
    updateScoreUI() {
        if (this.uiElements.score) this.uiElements.score.textContent = this.score;
    },

    updateComboUI() {
       if (this.uiElements.combo) {
           if (this.consecutiveHits > 0) {
                if(this.uiElements.comboValue) this.uiElements.comboValue.textContent = `${this.comboMultiplier.toFixed(1)}x`;
                if(this.uiElements.comboHits) this.uiElements.comboHits.textContent = `${this.consecutiveHits} HIT`;
                this.uiElements.combo.style.opacity = '1'; // Show combo display smoothly
                this.uiElements.combo.style.transform = 'translateY(0)'; // Slide in?
            } else {
                 // Hide combo display smoothly
                 this.uiElements.combo.style.opacity = '0';
                 this.uiElements.combo.style.transform = 'translateY(10px)'; // Slide out?
            }
       }
    },

    updateAmmoUI() {
        if (this.uiElements.ammo) this.uiElements.ammo.textContent = this.ammo;
        if (this.uiElements.maxAmmo) this.uiElements.maxAmmo.textContent = this.maxAmmo;
        if (this.uiElements.totalAmmo) this.uiElements.totalAmmo.textContent = this.totalAmmo;
    },

    updateTimerUI() {
        if (this.uiElements.timer) {
            this.uiElements.timer.textContent = Math.ceil(this.timeLeft);
        }
    },

    updateHealthUI() {
       if (this.uiElements.healthFill && this.uiElements.healthValue) {
           const percentage = (this.health / this.maxHealth) * 100;
           this.uiElements.healthFill.style.width = `${percentage}%`;
           this.uiElements.healthValue.textContent = Math.round(this.health); // Show numerical health

            // Change color based on health percentage
            if (percentage < 25) {
                this.uiElements.healthFill.style.backgroundColor = '#ff4d4d'; // Red
            } else if (percentage < 60) {
                this.uiElements.healthFill.style.backgroundColor = '#ffcc00'; // Yellow
            } else {
                 this.uiElements.healthFill.style.backgroundColor = '#66cc66'; // Green
             }
       }
   },

    showHitMarker() {
       if (!this.uiElements.hitMarker) return;
       clearTimeout(this.hitMarkerTimeoutId); // Clear previous timeout
       this.uiElements.hitMarker.style.opacity = '1';
       this.uiElements.hitMarker.style.transform = 'translate(-50%, -50%) scale(1)'; // Reset scale
        // Add a quick scale animation
        requestAnimationFrame(() => { // Ensure style is applied before animating
            this.uiElements.hitMarker.style.transform = 'translate(-50%, -50%) scale(1.2)';
        });

       this.hitMarkerTimeoutId = setTimeout(() => {
           if (this.uiElements.hitMarker) {
                this.uiElements.hitMarker.style.opacity = '0';
                this.uiElements.hitMarker.style.transform = 'translate(-50%, -50%) scale(0.8)'; // Shrink out
           }
       }, 120); // Duration marker is visible (ms)
   },
    hideHitMarker() {
        if (!this.uiElements.hitMarker) return;
        clearTimeout(this.hitMarkerTimeoutId);
        this.uiElements.hitMarker.style.opacity = '0';
        this.uiElements.hitMarker.style.transform = 'translate(-50%, -50%) scale(0.8)';
    },

    showGunEffect(effectType) {
        if (effectType === 'muzzleFlash' && this.uiElements.gunEffects) {
            const flash = document.createElement('div');
            flash.className = 'muzzle-flash'; // CSS handles appearance and animation
            this.uiElements.gunEffects.appendChild(flash);
            setTimeout(() => flash.remove(), 100); // Remove after animation duration
        }
        // Add cases for other effects (e.g., shell ejection)
    },

    showReloadIndicator() {
        if (!this.uiElements.reloadIndicator) return;
        this.uiElements.reloadIndicator.style.display = 'block';
        this.updateReloadIndicator(); // Update fill immediately
    },
    hideReloadIndicator() {
        if (!this.uiElements.reloadIndicator) return;
        this.uiElements.reloadIndicator.style.display = 'none';
    },
    updateReloadIndicator() {
        if (!this.uiElements.reloadIndicator || !this.isReloading) return;
        const fillElement = this.uiElements.reloadIndicator.querySelector('.reload-fill');
        if (fillElement) {
            const progress = clamp(1 - (this.reloadTime), 0, 1); // Calculate progress 0-1
            fillElement.style.width = `${progress * 100}%`; // Set fill width
        }
    },


    // --- Game Start/Stop/Reset from Outside ---
    initializeAndStartGame() {
        Game.init().then(() => {
             Game.startGame(); // Only start game after full initialization
             console.log("Game Initialized and Started via external call.");
         }).catch(error => {
             console.error("Game initialization failed:", error);
             // Handle initialization failure in UI if needed
         });
     },

     resetAndShowStartScreen() {
         Game.resetGame();
         Game.showStartScreen();
     },

     showSettingsMenu() {
         Game.showSettings();
     },

     hideSettingsMenuAndResume() {
         Game.hideSettings();
     },

     toggleGamePause() {
         Game.togglePause();
     }


};

console.log("Main script.js loaded, Game object defined. Waiting for external start trigger.");
