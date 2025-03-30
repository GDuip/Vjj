
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
        language: 'en', // Default language (changed to match initial HTML option)
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
        } else {
            console.log("No saved settings found, using defaults.");
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
            console.log("Saved settings:", this.settings);
            this.applySettings(); // Apply settings immediately after saving/changing
        } catch (e) {
            console.error("Failed to save settings:", e);
        }
    },

    applySettings() {
        // Apply settings to relevant modules (check if modules exist first)
        // Check if modules and their methods exist before calling
        if (typeof AudioManager !== 'undefined' && AudioManager.setMusicVolume) AudioManager.setMusicVolume(this.settings.musicVolume);
        if (typeof AudioManager !== 'undefined' && AudioManager.setSfxVolume) AudioManager.setSfxVolume(this.settings.sfxVolume);
        if (typeof AudioManager !== 'undefined' && AudioManager.setReverb) AudioManager.setReverb(this.settings.useSpatialReverb, this.settings.reverbQuality);
        if (typeof InputManager !== 'undefined' && InputManager.setTouchSensitivity) InputManager.setTouchSensitivity(this.settings.touchSensitivity);
        if (typeof InputManager !== 'undefined' && InputManager.updateKeyBindings) InputManager.updateKeyBindings(); // Tell InputManager to re-read key bindings

        // Language change might require a UI refresh or re-init of localization library
        // For now, just log the change
        console.log("Applied language setting:", this.settings.language);
        // If using a localization library, trigger its update function here.
        // e.g., Localization.setLanguage(this.settings.language);

        // Update UI elements that might not trigger change events automatically
        // This is crucial after loading settings or manual application
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
        const touchSensitivityValue = document.getElementById('touchSensitivityValue');
        if (touchSensitivitySlider) touchSensitivitySlider.value = this.settings.touchSensitivity;
        if(touchSensitivityValue) touchSensitivityValue.textContent = parseFloat(this.settings.touchSensitivity).toFixed(1);


        const musicVolSlider = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        if (musicVolSlider) musicVolSlider.value = this.settings.musicVolume;
        if(musicVolumeValue) musicVolumeValue.textContent = Math.round(this.settings.musicVolume * 100) + '%';


        const sfxVolSlider = document.getElementById('sfxVolume');
        const sfxVolumeValue = document.getElementById('sfxVolumeValue');
        if (sfxVolSlider) sfxVolSlider.value = this.settings.sfxVolume;
        if(sfxVolumeValue) sfxVolumeValue.textContent = Math.round(this.settings.sfxVolume * 100) + '%';


        const reverbCheckbox = document.getElementById('spatialReverb');
        if (reverbCheckbox) reverbCheckbox.checked = this.settings.useSpatialReverb;

        const reverbQualitySelect = document.getElementById('reverbQuality');
        if (reverbQualitySelect) {
            reverbQualitySelect.value = this.settings.reverbQuality;
            // Disable reverb quality if reverb is off OR if corresponding IR failed to load (handled in AudioManager.setReverb)
            reverbQualitySelect.disabled = !(reverbCheckbox?.checked ?? false);
        }
    },

    bindControlEvents() {
        // Add change/input listeners to all settings controls to save immediately
        document.querySelectorAll('#settingsScreen select, #settingsScreen input[type="checkbox"], #settingsScreen input[type="radio"]').forEach(element => {
             element.addEventListener('change', () => {
                this.saveSettings();
                // Special case: enable/disable reverb quality select when checkbox changes
                if (element.id === 'spatialReverb') {
                     const reverbQualitySelect = document.getElementById('reverbQuality');
                     if (reverbQualitySelect) {
                         reverbQualitySelect.disabled = !element.checked;
                     }
                }
             });
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
                          valueDisplay.textContent = Math.round(element.value * 100) + '%';
                     }
                  }
             });
         });

         // Special handling for key binding inputs
         document.querySelectorAll('#settingsScreen input.keybind-input').forEach(input => {
            input.addEventListener('focus', () => { input.value = 'Press key...'; });
            input.addEventListener('blur', () => {
                // Restore previous value if nothing was pressed or if still 'Press key...'
                 if(input.value === 'Press key...') {
                     const settingKey = input.id.replace('KeyInput', 'Key'); // e.g., forwardKey
                     input.value = this.settings[settingKey] || '???';
                 }
                 // Save settings on blur just in case
                 this.saveSettings();
             });

            input.addEventListener('keydown', (e) => {
                 e.preventDefault(); // Prevent typing the key character itself / default actions
                 if(e.code === 'Escape') { // Allow Escape to cancel binding
                     input.blur(); // Lose focus, blur handler will restore previous value
                     return;
                 }
                 if(e.code === 'Backspace' || e.code === 'Delete') { // Clear binding (optional)
                      // input.value = ''; // Or set to a default? Maybe disallow?
                      // For now, just ignore clear keys
                      return;
                 }
                 input.value = e.code; // Display the code (e.g., "KeyW", "ArrowUp")
                 this.saveSettings(); // Save immediately on key press display
                 input.blur(); // Lose focus after setting
            });
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
    reverbLoadStatus: {}, // Track loading success/failure per quality
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
                const resumeContext = async () => { // Make async
                    if (this.audioContext.state === 'suspended') {
                         try {
                            await this.audioContext.resume();
                             console.log("AudioContext Resumed");
                             // Remove listeners once resumed successfully
                             document.removeEventListener('click', resumeContext, true);
                             document.removeEventListener('touchstart', resumeContext, true);
                             document.removeEventListener('keydown', resumeContext, true);
                         } catch (err) {
                             console.error("Failed to resume AudioContext:", err);
                             // Keep listeners active if resume fails
                         }
                    } else {
                        // Context already running, remove listeners
                         document.removeEventListener('click', resumeContext, true);
                         document.removeEventListener('touchstart', resumeContext, true);
                         document.removeEventListener('keydown', resumeContext, true);
                    }
                };
                 // Use capturing phase to catch gestures early
                 document.addEventListener('click', resumeContext, true);
                 document.addEventListener('touchstart', resumeContext, true);
                 document.addEventListener('keydown', resumeContext, true);


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
                reject("Audio initialization failed: Web Audio API not supported.");
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
            const promise = new Promise((resolve) => { // Resolve always
                loader.load(path,
                    (buffer) => { this.loadedSounds[key] = buffer; /*console.log(`Sound loaded: ${key}`);*/ resolve(); },
                    undefined, // Progress
                    (err) => { console.error(`Failed to load sound ${key} from ${path}:`, err); resolve(); /* Resolve anyway */ }
                );
            });
            loadPromises.push(promise);
        }

        // Load reverb impulse responses
         this.reverbLoadStatus = {}; // Reset status
        for (const key in this.reverbsToLoad) {
            const path = this.reverbsToLoad[key];
            const promise = new Promise((resolve) => { // Resolve always
                 this.reverbLoadStatus[key] = 'loading';
                loader.load(path,
                    (buffer) => {
                        this.loadedReverbs[key] = buffer;
                        this.reverbLoadStatus[key] = 'loaded';
                        // console.log(`Reverb loaded: ${key}`);
                        resolve();
                    },
                    undefined,
                    (err) => {
                        console.error(`Failed to load reverb IR ${key} from ${path}:`, err);
                         this.reverbLoadStatus[key] = 'failed';
                        resolve(); /* Resolve anyway */
                    }
                );
            });
            loadPromises.push(promise);
        }

        return Promise.all(loadPromises);
    },

    playSound(soundKey, position = null, volume = 1.0, playbackRate = 1.0, loop = false) {
        if (!this.audioContext || this.audioContext.state !== 'running' || !this.loadedSounds[soundKey] || !this.sfxGainNode) {
             if(this.audioContext && this.audioContext.state === 'suspended') {
                 console.warn(`SFX skipped (context suspended): ${soundKey}. Trying resume...`);
                 this.audioContext.resume().catch(e => console.error("Resume failed:", e)); // Attempt resume on play
             } else if (!this.loadedSounds[soundKey]) {
                 // console.warn(`SFX sound not loaded: ${soundKey}`);
             }
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
         let panner = null; // Declare panner here
         let reverbSendGain = null; // Declare send gain here

        if (position && this.listener && typeof position.x === 'number' && typeof THREE !== 'undefined') { // Check if position is valid and THREE exists
             panner = this.audioContext.createPanner();
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
             // Panner orientation will automatically follow the listener's orientation

            soundNodeChain.connect(panner); // Connect gain to panner
            soundNodeChain = panner; // Panner is now end of the main chain for direct sound

            // Reverb Path (if enabled and IR loaded for current quality)
            if (this.reverbEnabled && this.currentReverbNode && this.reverbLoadStatus[this.reverbQuality] === 'loaded') {
                reverbSendGain = this.audioContext.createGain();
                // Adjust reverb send level (e.g., less than direct path volume)
                // Make reverb quieter for sounds further away? More complex. Simple fixed send for now.
                 reverbSendGain.gain.setValueAtTime(volume * 0.35, this.audioContext.currentTime); // Example: 35% send

                // Send signal FROM the panner TO the reverb send gain
                panner.connect(reverbSendGain);
                reverbSendGain.connect(this.currentReverbNode);

                // Connect the Reverb Node's output TO the main SFX gain node
                // IMPORTANT: Connect only ONCE for the reverb node instance, not per sound!
                // This connection should ideally be made in setReverb. Let's adjust setReverb.
                // For now, assume connection exists if currentReverbNode is valid.
                // this.currentReverbNode.connect(this.sfxGainNode); // MOVED TO setReverb

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
             // Explicitly disconnect nodes for this specific sound instance
             // This helps prevent potential memory leaks with complex graphs
             try {
                 source.disconnect();
                 individualGain.disconnect();
                 if(panner) panner.disconnect(); // Disconnect panner from sfxGain and reverbSendGain
                 if(reverbSendGain) reverbSendGain.disconnect(); // Disconnect send gain from reverbNode
             } catch (e) {
                 // console.warn("Error disconnecting nodes on sound end:", e);
             }
        };


        source.start(this.audioContext.currentTime);
        return source;
    },

    playBGM() {
         if (!this.audioContext || this.audioContext.state !== 'running' || !this.loadedSounds['bgm'] || !this.musicGainNode) {
            console.warn("BGM Not ready or context not running.");
            if(this.audioContext && this.audioContext.state === 'suspended') {
                 this.audioContext.resume().catch(e => console.error("Resume failed:", e));
             }
             return;
         }
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
                this.bgmSource.disconnect(); // Disconnect previous source
            } catch (e) { /* Ignore error if already stopped */ }
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
                 source.disconnect(); // Disconnect to be sure
             } catch (e) { /* Ignore errors if already stopped */ }
        });
        this.activeSoundSources.clear(); // Clear the tracking set
        console.log("All active sounds stopped.");
    },


    // --- Volume Controls ---
    setMusicVolume(volume) {
        if (this.musicGainNode && this.audioContext) {
            // Use exponential ramp for perceived loudness change
            this.musicGainNode.gain.setTargetAtTime(clamp(volume, 0.0001, 1), this.audioContext.currentTime, 0.05); // Avoid 0 for exponential ramp
            // console.log("Music Volume Set:", volume);
        }
    },

    setSfxVolume(volume) {
        if (this.sfxGainNode && this.audioContext) {
            this.sfxGainNode.gain.setTargetAtTime(clamp(volume, 0.0001, 1), this.audioContext.currentTime, 0.05); // Avoid 0
            // console.log("SFX Volume Set:", volume);
        }
    },

    // --- Reverb Control ---
    setReverb(enabled, quality) {
        this.reverbEnabled = enabled;
        this.reverbQuality = quality; // low, medium, high

        if (!this.audioContext) return;

        const reverbQualitySelect = document.getElementById('reverbQuality');
        const reverbCheckbox = document.getElementById('spatialReverb');

        // Disconnect the old reverb node cleanly FROM its destination (sfxGainNode)
        if (this.currentReverbNode) {
            try {
                 this.currentReverbNode.disconnect(this.sfxGainNode);
                 console.log("Disconnected previous reverb node output.");
            } catch(e) { /* Ignore if not connected */ }
        }

        // Check if the desired reverb quality actually loaded successfully
        const isReverbLoaded = this.reverbLoadStatus[quality] === 'loaded';

        // Create and connect the new one if enabled AND the IR buffer exists and loaded
        if (enabled && isReverbLoaded) {
            if (!this.currentReverbNode || this.currentReverbNode.buffer !== this.loadedReverbs[quality]) {
                // Create new convolver only if it doesn't exist or quality changed
                this.currentReverbNode = this.audioContext.createConvolver();
                this.currentReverbNode.buffer = this.loadedReverbs[quality];
                console.log(`Reverb Enabled: Created/Set Convolver Quality - ${quality}`);
            }
            // Connect the convolver output TO the main SFX gain node (persistent connection)
            try {
                this.currentReverbNode.connect(this.sfxGainNode);
                console.log(`Reverb node (${quality}) output connected to SFX Gain.`);
            } catch (e) {
                console.error("Error connecting reverb node:", e);
                this.currentReverbNode = null; // Invalidate if connection fails
            }
        } else {
            // Reverb disabled by user OR IR failed to load
             this.currentReverbNode = null; // Ensure no reverb node is active/connected

            if (enabled && !isReverbLoaded) { // User wanted reverb, but it failed to load
                 console.warn(`Reverb IR for quality "${quality}" not loaded or failed to load. Reverb disabled.`);
                 this.reverbEnabled = false; // Force disable internal state
                 // Update UI to reflect this forced state
                 if (reverbCheckbox) reverbCheckbox.checked = false;
                 if (reverbQualitySelect) reverbQualitySelect.disabled = true;
            } else { // Reverb disabled via settings normally
                 console.log("Reverb Disabled via settings.");
            }
        }

        // Update UI reverb quality dropdown enabled state based on the CHECKBOX state
        if(reverbQualitySelect && reverbCheckbox) {
             // Only enable quality select if checkbox is checked AND the currently selected quality is actually loaded
             // Re-evaluate based on the potentially forced disabled state above
            reverbQualitySelect.disabled = !this.reverbEnabled || !reverbCheckbox.checked;
        }
    },

    getListener() {
       // Ensure THREE is loaded before accessing its properties
       if (typeof THREE !== 'undefined') {
           if (!this.listener) {
               this.listener = new THREE.AudioListener();
           }
           return this.listener;
       }
       console.warn("THREE is not defined, cannot get AudioListener.");
       return null;
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
         // Ensure THREE is loaded
         if (typeof THREE === 'undefined') {
            console.error("THREE.js is not loaded! Graphics initialization failed.");
            return false;
         }

        this.container = document.getElementById('gameCanvas');
        if (!this.container) {
            console.error("Canvas container ('gameCanvas') not found!");
            return false; // Indicate failure
        }

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x33334d); // Dark blue/grey sky
        this.scene.fog = new THREE.Fog(0x33334d, 30, 120); // Start fog closer, end sooner

        // Camera (Perspective)
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000); // Slightly less FOV
        this.cameraPitchObject = new THREE.Object3D(); // Controls pitch
        this.cameraPitchObject.add(this.camera);
        // cameraYawObject (player's body/mesh) is set later in attachCameraToPlayer
        this.camera.position.set(0, 0, 0); // Position relative to pitch object

        // Renderer
        try {
            this.renderer = new THREE.WebGLRenderer({ canvas: this.container, antialias: true, alpha: false });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
             // Use sRGBEncoding for output for better color representation
             // Note: THREE.sRGBEncoding is deprecated in newer versions, use ColorManagement instead if updating THREE.js
             // For r99:
             // this.renderer.gammaOutput = true;
             // this.renderer.gammaFactor = 2.2;
             // For newer THREE:
             this.renderer.outputColorSpace = THREE.SRGBColorSpace;


             // Tone mapping for more realistic lighting
             this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
             this.renderer.toneMappingExposure = 1.0;


        } catch (e) {
             console.error("Failed to create WebGLRenderer:", e);
             // Provide feedback to user?
             document.body.innerHTML = `<div style="color: white; padding: 30px; text-align: center;"><h1>WebGL Error</h1><p>Could not initialize WebGL.</p><p>Your browser or graphics card may not support it.</p></div>`;
             return false;
        }

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
        // Ambient Light (Lower intensity, complements directional light)
        const ambientLight = new THREE.AmbientLight(0x607080, 0.4); // Cool ambient
        this.scene.add(ambientLight);

        // Directional Light (Sun)
        const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.0); // Warmer sun color, slightly higher intensity due to tone mapping
        directionalLight.position.set(30, 50, 40); // Angled position
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048; // Good shadow resolution
        directionalLight.shadow.mapSize.height = 2048;
        // Adjust shadow camera bounds to fit the expected play area
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 150;
        directionalLight.shadow.camera.left = -50; // Wider shadow area if needed
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.bias = -0.002; // Adjust bias carefully if shadow acne occurs
        directionalLight.shadow.radius = 1.5; // Soften shadow edges slightly (PCFSoft specific)
        this.scene.add(directionalLight);
        // Optional: Add a target object if the light needs to point somewhere other than origin
        // directionalLight.target.position.set(0, 0, 0);
        // this.scene.add(directionalLight.target);

        // Hemisphere Light (Subtle sky/ground bounce light)
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a4a4a, 0.5); // Sky blue, ground gray, moderate intensity
        this.scene.add(hemiLight);
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
        // Make sure the pitch object isn't already parented elsewhere
         if(this.cameraPitchObject.parent) this.cameraPitchObject.parent.remove(this.cameraPitchObject);
        this.cameraYawObject.add(this.cameraPitchObject); // Add pitch control to the player mesh
        console.log("Camera attached to player object.");
    },

    updateCameraRotation(targetYaw, targetPitch) {
        // Yaw rotation is handled by Physics sync (Physics.syncMeshes copies body quaternion to mesh)
        // This function only handles the visual PITCH rotation on the cameraPitchObject.

        if (!this.cameraPitchObject) return;

        // We directly set the pitch based on the input manager's target pitch.
        // Smoothing (lerp) is now less critical here as the physics body rotation handles yaw smoothing.
        // If pitch feels too snappy, lerping can be re-added.
        const lerpFactor = 1.0; // Use 1.0 for direct control, < 1.0 for smoothing

        // Clamp the target pitch *before* applying it (prevents over-rotation)
         const clampedPitch = clamp(targetPitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05); // Slightly smaller clamp

        // Apply Pitch to the Pitch Object
        this.cameraPitchObject.rotation.x = lerp(this.cameraPitchObject.rotation.x, clampedPitch, lerpFactor);

        // The listener's orientation is automatically updated as it's a child of the camera/pitch object
    },


    render(deltaTime) {
        if (!this.renderer || !this.scene || !this.camera || typeof InputManager === 'undefined') return;

        // Update camera's visual pitch based on InputManager's target
        // (Yaw is updated by physics sync)
        this.updateCameraRotation(InputManager.targetYaw, InputManager.targetPitch);

        // Update the Audio Listener's position/orientation (handled automatically by THREE if added to camera)
        // However, ensure the listener's matrix world is up to date if needed elsewhere, though usually not required.
        // if (AudioManager.listener) AudioManager.listener.updateMatrixWorld();


        this.renderer.render(this.scene, this.camera);
    },

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
         // Consider updating shadow camera bounds if aspect ratio changes drastically? Usually not needed.
    },

    addObject(object) {
        if (object && object instanceof THREE.Object3D) {
            this.scene.add(object);
        } else {
             // console.warn("Attempted to add invalid object to scene:", object);
        }
    },

    removeObject(object) {
        if (!object || !(object instanceof THREE.Object3D)) return;

        // Recursively dispose of materials and geometries
        object.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                     // console.log("Disposed geometry");
                }
                if (child.material) {
                    // Handle arrays of materials
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(m => {
                        // Dispose textures attached to the material
                         for (const key in m) {
                            if (m[key] instanceof THREE.Texture) {
                                m[key].dispose();
                                // console.log(`Disposed texture on material key: ${key}`);
                            }
                        }
                        m.dispose();
                        // console.log("Disposed material");
                    });
                }
            }
        });
        this.scene.remove(object);
         // console.log("Removed object from scene:", object.name || object.uuid);
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
        radius: 0.4,
        isOnGround: false, // Track ground contact
        lastGroundContactTime: 0,
    },
    fixedTimeStep: 1 / 60, // Standard physics step rate
    maxSubSteps: 5, // Allow more substeps if needed for stability

    init() {
         // Ensure Cannon-es is loaded
         if (typeof CANNON === 'undefined') {
             console.error("Cannon-es is not loaded! Physics initialization failed.");
             return false;
         }

        // Physics World
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -10.5, 0), // Slightly stronger gravity
             allowSleep: true // Enable sleeping for performance on inactive objects
        });
         this.world.broadphase = new CANNON.SAPBroadphase(this.world); // Generally good performance
         // this.world.broadphase = new CANNON.NaiveBroadphase(); // Simpler, ok for fewer objects
         this.world.solver.iterations = 10; // 10-15 is usually a good balance
         this.world.solver.tolerance = 0.01; // Default is 0.1

        // Initialize materials
        this.materials.default = new CANNON.Material("defaultMaterial");
        this.materials.player = new CANNON.Material("playerMaterial");
        this.materials.target = new CANNON.Material("targetMaterial");
        this.materials.ground = new CANNON.Material("groundMaterial");


        this.setupContactMaterials();
        this.createGroundPlane();
        this.createPlayerBody(); // Creates body AND mesh

        // IMPORTANT: Attach camera AFTER player mesh exists
        if (this.player.mesh && typeof Graphics !== 'undefined' && Graphics.attachCameraToPlayer) {
             Graphics.attachCameraToPlayer(this.player.mesh);
        } else {
            console.error("Player mesh not created or Graphics module not ready, cannot attach camera!");
        }

        console.log("Physics Initialized");
        return true; // Indicate success
    },

    setupContactMaterials() {
        // Default contact properties (low friction, some restitution)
        const defaultContactMaterial = new CANNON.ContactMaterial(
             this.materials.default,
             this.materials.default,
             {
                 friction: 0.3,
                 restitution: 0.2,
             }
         );
        this.world.addContactMaterial(defaultContactMaterial);
        this.world.defaultContactMaterial = defaultContactMaterial; // Set as default


        // Player <-> Ground (Low friction for movement, low restitution to prevent bounce)
        const playerGroundContact = new CANNON.ContactMaterial(
            this.materials.player, this.materials.ground,
            { friction: 0.2, restitution: 0.1 }
        );
        this.world.addContactMaterial(playerGroundContact);

        // Target <-> Ground (Higher friction, moderate restitution)
        const targetGroundContact = new CANNON.ContactMaterial(
            this.materials.target, this.materials.ground,
            { friction: 0.6, restitution: 0.3 }
        );
        this.world.addContactMaterial(targetGroundContact);

        // Target <-> Target (Low friction, higher restitution for bouncing off each other)
        const targetTargetContact = new CANNON.ContactMaterial(
            this.materials.target, this.materials.target,
            { friction: 0.2, restitution: 0.5 }
        );
        this.world.addContactMaterial(targetTargetContact);

         // Player <-> Target (Player bumping into targets - very low friction/restitution)
         const playerTargetContact = new CANNON.ContactMaterial(
            this.materials.player, this.materials.target,
            { friction: 0.1, restitution: 0.1 }
        );
        this.world.addContactMaterial(playerTargetContact);


        console.log("Contact materials set up.");
    },

    createGroundPlane() {
         if (typeof THREE === 'undefined') return; // Skip if THREE not loaded
        // Visual Ground
        const groundGeometry = new THREE.PlaneGeometry(300, 300); // Larger ground
        // Use a texture for better visuals (optional)
        // const textureLoader = new THREE.TextureLoader();
        // const groundTexture = textureLoader.load('assets/textures/ground.jpg'); // ** REPLACE PATH **
        // groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
        // groundTexture.repeat.set(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666, // Mid-grey
            roughness: 0.9,
            metalness: 0.1,
            // map: groundTexture // Uncomment if using texture
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2; // Rotate flat
        groundMesh.position.y = 0; // Position exactly at 0
        groundMesh.receiveShadow = true; // Ground should receive shadows
         groundMesh.name = "GroundMesh";
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
        groundBody.position.copy(groundMesh.position); // Ensure physics body matches visual y
         groundBody.userData = { isGround: true }; // Add identifier
        this.world.addBody(groundBody);
        console.log("Ground plane created.");
    },

    createPlayerBody() {
        if (typeof THREE === 'undefined' || typeof CANNON === 'undefined') return; // Skip if libs not loaded

        // Player Physics Body (Using a Capsule shape is ideal for FPS controllers)
        // Cannon-es doesn't have a native capsule, simulate with a Box or compound shape.
        // Using a Box is simpler but less realistic for slopes/stairs.
        // Let's stick with Box for now as per original code.
        const boxHalfExtents = new CANNON.Vec3(this.player.radius, this.player.height / 2, this.player.radius);
        this.player.shape = new CANNON.Box(boxHalfExtents);

        // For a slightly better approximation, use a compound shape: Sphere + Box + Sphere (requires more setup)
        // const sphereRadius = this.player.radius;
        // const cylinderHeight = this.player.height - 2 * sphereRadius;
        // this.player.shape = new CANNON.Compound();
        // const sphereShape = new CANNON.Sphere(sphereRadius);
        // // Top sphere
        // this.player.shape.addShape(sphereShape, new CANNON.Vec3(0, cylinderHeight / 2, 0));
        // // Bottom sphere
        // this.player.shape.addShape(sphereShape, new CANNON.Vec3(0, -cylinderHeight / 2, 0));
        // // Optional middle part (Box or Cylinder if available) - Box is simpler
        // const boxShape = new CANNON.Box(new CANNON.Vec3(sphereRadius, cylinderHeight / 2, sphereRadius));
        // this.player.shape.addShape(boxShape, new CANNON.Vec3(0, 0, 0));


        this.player.body = new CANNON.Body({
            mass: 70, // Player mass
            position: new CANNON.Vec3(0, 5, 5), // Start higher to avoid initial ground intersection issues
            material: this.materials.player,
            shape: this.player.shape,
            linearDamping: 0.6, // Dampens sliding motion, helps control
            angularDamping: 1.0, // VERY strong angular damping - prevents ALL rotation from physics
            fixedRotation: false, // We control rotation manually via quaternion updates
            allowSleep: false // Keep player awake for responsiveness
        });

        // Prevent tumbling by setting inertia tensor to infinity for X and Z axes
        // This ensures physics engine won't easily rotate the body around these axes.
        // this.player.body.invInertia.set(0, this.player.body.invInertia.y, 0, 0,0,0); // Does invInertia work like this? Check Cannon docs.
        // Alternative: The high angular damping achieves a similar effect.


        this.world.addBody(this.player.body);

        // Player Visual Mesh (A simple capsule for visual representation)
        // This mesh is what the camera will be attached to.
        // Geometry height should match physics body height.
        const playerGeometry = new THREE.CapsuleGeometry(
            this.player.radius, // Capsule radius
            this.player.height - (2 * this.player.radius), // Height of the cylindrical part
            4, 8 // Segments (low poly)
        );
        const playerMaterial = new THREE.MeshStandardMaterial({
             color: 0xeeeeee,
             roughness: 0.8,
             visible: false // Make player model invisible from first-person view
             // wireframe: true // Use wireframe for debugging visibility
        });
        this.player.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.mesh.castShadow = true; // Player can cast shadows
        this.player.mesh.name = "PlayerMesh";
        // Initial position sync (important before camera attachment)
        this.player.mesh.position.copy(this.player.body.position);
        this.player.mesh.quaternion.copy(this.player.body.quaternion);

        Graphics.addObject(this.player.mesh); // Add mesh to the graphics scene

        // Link body and mesh via userData
         this.player.body.userData = { mesh: this.player.mesh, isPlayer: true, type: 'player' };
         this.player.mesh.userData = { body: this.player.body };

        console.log("Player physics body and mesh created.");

        // Add collision event listener for ground detection
       this.player.body.addEventListener("collide", (event) => {
           const otherBody = event.body;
           const contact = event.contact;

           // Check if colliding with the ground (or any static body below)
           // A more robust check involves the contact normal
            let isGroundContact = false;
            if (otherBody.userData?.isGround || otherBody.mass === 0) { // Check userData or if static
                // Check contact normal - should point mostly upwards relative to player
                const contactNormal = contact.ni; // Normal on the player body
                // Player's up vector (local Y) in world space
                const upAxis = new CANNON.Vec3(0, 1, 0);
                this.player.body.quaternion.vmult(upAxis, upAxis); // Rotate local up to world space

                // Check angle between contact normal and player's up vector
                // Dot product > 0.5 means angle is less than 60 degrees from vertical
                if (contactNormal.dot(upAxis) > 0.5) {
                     isGroundContact = true;
                }
            }


            if (isGroundContact) {
                this.player.isOnGround = true;
                this.player.lastGroundContactTime = this.world.time;
                 // Play footstep sound on impact (optional)
                 // const impactVelocity = contact.getImpactVelocityAlongNormal();
                 // if (impactVelocity > 1.0) {
                 //     AudioManager.playSound('footstep', contact.rj, 0.4);
                 // }
            } else if (otherBody.userData?.targetData) { // Check for targetData in userData
                 // Player collided with a target
                 // console.log("Player bumped target:", otherBody.userData.targetData.id);
            }
       });
    },


    update(deltaTime) {
        if (!this.world) return;

        // Apply forces/torques based on InputManager state
        this.applyPlayerMovementAndRotation(deltaTime);

        // Check if player is still on ground (add a small buffer time)
        if (this.player.isOnGround && (this.world.time - this.player.lastGroundContactTime > 0.1)) {
             this.player.isOnGround = false;
             // console.log("Player left ground");
        }


        // Step the physics world
        // Use a fixed time step loop for stability
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);

        // Synchronize visual meshes with physics bodies
        this.syncMeshes();
    },

    applyPlayerMovementAndRotation(deltaTime) {
         if (!this.player.body || !this.player.mesh || !Game.gameStarted || Game.isPaused || Game.isSettingsOpen) {
            // If inactive, strongly dampen velocities to prevent drifting
            if(this.player.body) {
                this.player.body.velocity.x *= 0.1;
                this.player.body.velocity.z *= 0.1;
                // Keep vertical velocity for gravity
                this.player.body.angularVelocity.y *= 0.1; // Only dampen yaw slightly if needed
            }
            return;
        }

        // --- Movement ---
        const moveSpeed = 5.5; // Base movement speed (slightly reduced)
        const maxSpeed = 6.0; // Max horizontal speed
        const accelerationForce = 800.0; // Force applied for acceleration (adjust based on mass)
        const brakingForceFactor = 0.3; // How strongly to brake when no input (fraction of accel force)

        const inputVector = InputManager.getMovementVector(); // {x, z} normalized direction

        // Get player's current forward and right directions from the *physics body's* quaternion
        const forwardDir = new CANNON.Vec3(0, 0, -1);
        const rightDir = new CANNON.Vec3(1, 0, 0);
        this.player.body.quaternion.vmult(forwardDir, forwardDir); // Rotate Vec3 by Quaternion
        this.player.body.quaternion.vmult(rightDir, rightDir);
        // No need to project to XZ plane, use the body's orientation directly

        // Calculate desired world-space movement direction based on input
        const desiredMoveDir = new CANNON.Vec3(0, 0, 0);
        desiredMoveDir.vadd(rightDir.scale(inputVector.x), desiredMoveDir);
        desiredMoveDir.vadd(forwardDir.scale(inputVector.z), desiredMoveDir);
        desiredMoveDir.y = 0; // Ensure movement is horizontal
        desiredMoveDir.normalize(); // Normalize the final direction vector

        // Calculate force to apply
        let force = new CANNON.Vec3(0,0,0);
        const currentVelXZ = new CANNON.Vec3(this.player.body.velocity.x, 0, this.player.body.velocity.z);
        const currentSpeed = currentVelXZ.length();

        if (inputVector.x !== 0 || inputVector.z !== 0) {
             // Apply force in the desired direction
             force = desiredMoveDir.scale(accelerationForce);

             // Optional: Limit force if already moving fast in the desired direction
             // This prevents exceeding max speed too easily due to continuous force application.
             // const projVel = currentVelXZ.dot(desiredMoveDir);
             // if (projVel > moveSpeed * 0.8) { // If moving fast in target dir
             //     force = force.scale(0.5); // Reduce force
             // }

        } else {
             // No input: Apply braking force opposite to current velocity
             if (currentSpeed > 0.1) { // Only brake if moving significantly
                 const brakeDir = currentVelXZ.scale(-1);
                 brakeDir.normalize();
                 force = brakeDir.scale(accelerationForce * brakingForceFactor);
             }
        }

        // Apply the calculated force (only horizontally)
         const forcePoint = this.player.body.position; // Apply force at center of mass
         this.player.body.applyForce(new CANNON.Vec3(force.x, 0, force.z), forcePoint);

        // Clamp horizontal speed AFTER applying force and stepping the world (better handled by damping + forces)
        // If direct speed clamping is needed, do it here:
        const postStepVelXZ = new CANNON.Vec3(this.player.body.velocity.x, 0, this.player.body.velocity.z);
        const postStepSpeed = postStepVelXZ.length();
        if (postStepSpeed > maxSpeed) {
            const factor = maxSpeed / postStepSpeed;
            this.player.body.velocity.x *= factor;
            this.player.body.velocity.z *= factor;
            // console.log("Speed clamped");
        }


        // --- Rotation (Yaw) ---
        // Directly set the player body's quaternion to match the desired yaw from InputManager
        const targetYaw = InputManager.targetYaw;
        const currentQuaternion = this.player.body.quaternion;
        const targetQuaternion = new CANNON.Quaternion();
        targetQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), targetYaw);

        // Smoothly interpolate the physics body's quaternion towards the target
        const slerpFactor = 0.25; // Smoothing factor for rotation (adjust as needed)
        currentQuaternion.slerp(targetQuaternion, slerpFactor, this.player.body.quaternion);

        // Important: Ensure angular velocity around X and Z is zeroed due to direct quaternion manipulation
        // and high angular damping. The slerp handles Y rotation smoothly.
        this.player.body.angularVelocity.x = 0;
        this.player.body.angularVelocity.z = 0;
        // Allow Y angular velocity if using torque-based rotation, but zero it out if using slerp.
        // Slerp approach is generally easier for FPS controllers.
         // this.player.body.angularVelocity.y *= 0.1; // Dampen Y angular velocity if needed

        // Ensure the body wakes up if it was sleeping (shouldn't sleep if allowSleep=false)
        this.player.body.wakeUp();
    },


    syncMeshes() {
         if (typeof THREE === 'undefined') return; // Skip if THREE not loaded

        // Sync player mesh
        if (this.player.body && this.player.mesh) {
            this.player.mesh.position.copy(this.player.body.position);
            this.player.mesh.quaternion.copy(this.player.body.quaternion);
        }

        // Sync active targets (Iterate through Cannon world bodies is safer than TargetManager array if removals happen)
        this.world.bodies.forEach(body => {
            if (body.userData?.mesh && body.userData?.targetData) { // Check if it's a target body with a mesh
                const mesh = body.userData.mesh;
                // Only sync if the body is not sleeping (performance optimization)
                if (body.sleepState !== CANNON.Body.SLEEPING) {
                     mesh.position.copy(body.position);
                     mesh.quaternion.copy(body.quaternion);
                }

                // Check if target has fallen out of bounds or is way too far
                if (body.position.y < -20 || body.position.length() > 500) {
                     // console.log(`Target ${body.userData.targetData.id} out of bounds or too far.`);
                     if (typeof TargetManager !== 'undefined' && TargetManager.removeTarget) {
                         // Use timeout to avoid modifying array/world during iteration/step
                         setTimeout(() => TargetManager.removeTarget(body.userData.targetData, true), 0);
                     }
                }
            }
        });
    },


    // --- Raycasting for Shooting ---
    raycast(originVec3, directionVec3, distance) {
         if (!this.world || typeof CANNON === 'undefined') return [];

         // Convert THREE vectors to CANNON vectors
         const origin = new CANNON.Vec3(originVec3.x, originVec3.y, originVec3.z);
         const direction = new CANNON.Vec3(directionVec3.x, directionVec3.y, directionVec3.z);

         // Calculate end point for the ray
        const to = origin.clone();
        direction.normalize(); // Ensure direction is normalized
        to.vadd(direction.scale(distance), to); // Add scaled direction vector

         // Use RaycastClosest for efficiency if only the first hit matters often
         // const ray = new CANNON.Ray(origin, to);
         // const options = {
         //     collisionFilterMask: -1, // Collide with everything
         //     skipBackfaces: true,
         //     checkCollisionResponse: true
         // };
         // const result = new CANNON.RaycastResult();
         // ray.intersectWorld(this.world, options, result); // Fills 'result'
         // if(result.hasHit && result.body !== this.player.body) {
         //     return [{ // Return array format consistent with intersectWorld
         //          body: result.body,
         //          point: result.hitPointWorld.clone(),
         //          distance: result.distance,
         //          normal: result.hitNormalWorld.clone()
         //       }];
         // } else {
         //     return []; // No hit or hit player
         // }


         // Use intersectWorld if penetration/multiple hits are needed
         const ray = new CANNON.Ray(origin, to);
         const options = {
             collisionFilterMask: -1, // Collide with everything by default
             skipBackfaces: true,     // Don't detect hits from inside
             checkCollisionResponse: true, // Respect collision response settings
             mode: CANNON.Ray.CLOSEST // Start with closest, can change to ALL if needed
             // mode: CANNON.Ray.ANY // Fastest if you just need to know *if* something was hit
         };
         const result = new CANNON.RaycastResult(); // Reusable result object
         const hits = [];

         // intersectWorld with a callback allows processing multiple hits if mode=ALL
         // With mode=CLOSEST, it behaves like intersectBody but checks the whole world.
         const hasHit = ray.intersectWorld(this.world, options, result);

          if(hasHit && result.body !== this.player.body) {
               hits.push({
                  body: result.body,
                  point: result.hitPointWorld.clone(), // Clone vectors!
                  distance: result.distance,
                  normal: result.hitNormalWorld.clone() // Get hit normal too
               });
           }


           // If using mode = CANNON.Ray.ALL:
           /*
           ray.result = new CANNON.RaycastResult(); // Reset result for ALL mode
           options.mode = CANNON.Ray.ALL;
           options.result = []; // Provide array to store results
           ray.intersectWorld(this.world, options);
           options.result.forEach(hitResult => {
               if (hitResult.body !== this.player.body) {
                    hits.push({
                        body: hitResult.body,
                        point: hitResult.hitPointWorld.clone(),
                        distance: hitResult.distance,
                        normal: hitResult.hitNormalWorld.clone()
                    });
               }
           });
           // Sort hits by distance (closest first) if using ALL mode
           hits.sort((a, b) => a.distance - b.distance);
           */

          return hits; // Return array of hits (usually just one with CLOSEST mode)
      },


    addBody(body, mesh = null, linkUserData = true) {
        if (!body || !(body instanceof CANNON.Body)) {
             console.warn("Attempted to add invalid body to physics world:", body);
             return;
        }
        if (!this.world) return;

        this.world.addBody(body);

         // Link mesh and body via userData if requested and mesh exists
         if (linkUserData && mesh && typeof THREE !== 'undefined' && mesh instanceof THREE.Object3D) {
            body.userData = body.userData || {}; // Ensure userData exists
             body.userData.mesh = mesh;
             mesh.userData = mesh.userData || {};
             mesh.userData.body = body;
         }
    },

    removeBody(body) {
        if (!body || !(body instanceof CANNON.Body)) return;
        if (!this.world) return;


        // Remove any event listeners attached *directly* to the body
         // This requires storing references to listeners, which is complex.
         // Often easier to let JS garbage collection handle listeners if the body is removed.
         // body.removeEventListener("collide", ...);

        // Remove the graphical mesh if linked via userData
        if (body.userData?.mesh) {
            const mesh = body.userData.mesh;
            if (typeof Graphics !== 'undefined' && Graphics.removeObject) {
                 Graphics.removeObject(mesh); // Use Graphics module to remove and dispose
            }
             if (mesh.userData) {
                mesh.userData.body = null; // Break link from mesh back to body
            }
            body.userData.mesh = null; // Break link from body to mesh
        }

        // Remove body from the physics world
        this.world.removeBody(body);
        // console.log("Removed physics body.");
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
        // rightButton: false // Uncomment if needed
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

        sensitivity: 1.0, // This is the setting multiplier
        moveActive: false,
        lookActive: false,
        shootActive: false, // Track if shoot button is pressed
    },
    pointerLocked: false,
    targetYaw: 0,    // Target camera yaw (horizontal) angle (radians) - Physics body aims for this
    targetPitch: 0, // Target camera pitch (vertical) angle (radians) - Visual only

    lookSensitivity: 0.0022, // Base Desktop sensitivity
    mobileLookSensitivityMultiplier: 0.7, // Adjust mobile sensitivity relative to desktop (increased slightly)

    // Key Bindings (loaded from GameSettings)
    keyBindings: {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        reload: 'KeyR',
        // jump: 'Space',
        // pause: 'Escape' // Handled separately in Game module usually
    },

    init() {
         // Ensure required modules/elements are available
         if (typeof GameSettings === 'undefined' || typeof Graphics === 'undefined' || !Graphics.renderer?.domElement) {
             console.error("InputManager init failed: Missing dependencies (GameSettings, Graphics, or renderer).");
             return false;
         }
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
             // Keep sensitivity loaded from settings
             sensitivity: this.touch.sensitivity || GameSettings.settings.touchSensitivity || 1.0,
             moveActive: false, lookActive: false, shootActive: false
         };
         // Reset look angles to face forward initially?
         this.targetYaw = 0; // Or read initial player body yaw?
         this.targetPitch = 0;
         // Pointer lock state is handled by events, not reset here unless forced
         // if(document.pointerLockElement) document.exitPointerLock();
         this.pointerLocked = !!document.pointerLockElement; // Update state based on current lock
    },

    updateKeyBindings() {
         if (typeof GameSettings === 'undefined') return;
        this.keyBindings.forward = GameSettings.settings.forwardKey;
        this.keyBindings.backward = GameSettings.settings.backwardKey;
        this.keyBindings.left = GameSettings.settings.leftKey;
        this.keyBindings.right = GameSettings.settings.rightKey;
        // Add other keys if implemented (reload, jump)
         this.keyBindings.reload = GameSettings.settings.reloadKey || 'KeyR'; // Add default fallback
        console.log("Key bindings updated:", this.keyBindings);
        // Reset internal key state ONLY if bindings actually changed? Or always? Reset always is safer.
         this.keys = {};
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
        // No need for moz prefix anymore generally

        // Click on canvas to request pointer lock
        const canvas = Graphics.renderer.domElement;
        canvas.addEventListener('click', () => {
             // Only request lock if game is running, not paused/settings, and not already locked
            if (!isMobile && !this.pointerLocked && Game.gameStarted && !Game.isPaused && !Game.isSettingsOpen) {
                 canvas.requestPointerLock({
                     unadjustedMovement: true // Use raw mouse movement if available
                 }).catch(err => console.warn("Failed to request pointer lock:", err)); // Warn instead of error
            }
        });

        // Mouse Movement (Only when locked)
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Pointer Down/Up for Shooting (Handles Mouse and Generic Touch outside UI buttons)
        canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        // Listen on window for pointer up to catch release even if cursor moved off canvas
        window.addEventListener('pointerup', this.handlePointerUp.bind(this));
        // Prevent context menu on right click over canvas
         canvas.addEventListener('contextmenu', (e) => e.preventDefault());


        // Specific Touch Events for Mobile UI (Joystick, Buttons)
        if (isMobile) {
            this.addMobileTouchListeners();
        }

        // Handle browser visibility change (pause game if tab hidden)
        document.addEventListener("visibilitychange", () => {
             if (document.visibilityState === 'hidden' && Game.gameStarted && !Game.isPaused) {
                 console.log("Tab hidden, pausing game.");
                 Game.pauseGame(true); // Force pause
             }
         });
    },

    // --- Keyboard Handling ---
    handleKeyDown(e) {
        // Ignore input if focused on an input/textarea/select, unless it's a keybind input
        const targetTagName = e.target.tagName.toLowerCase();
        if ( (targetTagName === 'input' || targetTagName === 'textarea' || targetTagName === 'select') &&
             !e.target.classList.contains('keybind-input') ) {
                return;
            }

        // Ignore input if settings menu is open (unless it's ESC or keybind input)
        if (Game.isSettingsOpen && e.key !== 'Escape' && !e.target.classList.contains('keybind-input')) return;

        // Prevent default browser actions for game keys (like spacebar scrolling)
         if (Object.values(this.keyBindings).includes(e.code) || e.code === 'Space') {
             e.preventDefault();
         }

         this.keys[e.code] = true;

         // Let Game module handle pause toggle on Escape press
         // if (e.code === 'Escape' && !Game.isSettingsOpen) { ... } handled in Game.setupUIInteractions
    },
    handleKeyUp(e) {
         // Similar check for focused elements
         const targetTagName = e.target.tagName.toLowerCase();
         if ( (targetTagName === 'input' || targetTagName === 'textarea' || targetTagName === 'select') &&
              !e.target.classList.contains('keybind-input') ) {
                 return;
         }
        if (Game.isSettingsOpen && e.key !== 'Escape' && !e.target.classList.contains('keybind-input')) return;

        this.keys[e.code] = false;
    },

    // --- Pointer Lock Handling ---
    handlePointerLockChange() {
        const lockElement = document.pointerLockElement;
        if (lockElement === Graphics.renderer.domElement) {
            this.pointerLocked = true;
            console.log('Pointer Lock acquired');
            // Optional: Hide custom cursor if you have one
             document.body.style.cursor = 'none';
        } else {
             if(this.pointerLocked) { // Only trigger if lock was previously held
                this.pointerLocked = false;
                console.log('Pointer Lock released');
                // Show cursor again
                 document.body.style.cursor = 'default';
                // If game was running and lock is lost (e.g. via ESC), pause the game
                 if (Game.gameStarted && !Game.isPaused && !Game.isSettingsOpen) {
                     console.log('Pointer lock lost during gameplay, pausing.');
                     Game.pauseGame(true); // Pass true to force pause state
                 }
             }
        }
    },

    // --- Mouse Movement Handling (Desktop - Pointer Locked) ---
    handleMouseMove(event) {
        // Only process if pointer is locked (desktop) and game is active
        if (!this.pointerLocked || !Game.gameStarted || Game.isPaused || Game.isSettingsOpen) {
             // No need to reset dx/dy here, they are reset at end of Game.gameLoop
             return;
        }

        // Get movement deltas (use unadjusted if available)
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.mouse.dx += movementX; // Accumulate delta for the frame
        this.mouse.dy += movementY;

        // Update target camera angles (sensitivity applied here)
        // Use accumulated delta for smoother feeling over the frame
        const effectiveSensitivity = this.lookSensitivity; // No multiplier for desktop
        this.targetYaw -= this.mouse.dx * effectiveSensitivity;
        this.targetPitch -= this.mouse.dy * effectiveSensitivity;
   
// Normalize Yaw and Clamp Pitch
                     this.targetYaw = this.targetYaw % (Math.PI * 2);
                     if(this.targetYaw < 0) this.targetYaw += Math.PI * 2; // Ensure positive angle
                     this.targetPitch = clamp(this.targetPitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05); // Clamp pitch

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
                     this.touch.lookDeltaX = 0; // Reset accumulated delta
                     this.touch.lookDeltaY = 0;
                      // console.log("Look touch ended.");
                 }
                  // Shoot Button Touch Ended
                 else if (touch.identifier === this.touch.shootIdentifier) {
                     this.touch.shootIdentifier = null;
                     this.touch.shootActive = false; // Button is no longer active
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
                 // Request lock, but don't shoot yet - let click acquire lock first
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
             if(this.touch.shootActive) { // Ensure shoot button is also released on touch end
                const shootButton = document.getElementById('shootButton');
                shootButton?.classList.remove('active');
                this.touch.shootActive = false;
             }
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
            allowSleep: true, // Allow targets to sleep
            sleepSpeedLimit: 0.2,
            sleepTimeLimit: 0.8
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
