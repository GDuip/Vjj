// --- Constants ---
const MAX_FILE_SIZE_MB = 50; // Example limit

// --- Model Data Storage ---
const ModelData = {
    gunUrl: null, characterUrl: null,
    gunFile: null, characterFile: null,
    gunLoaded: false, characterLoaded: false,
    loadError: null,
    pendingFiles: 0, // Track files being processed

    isReady() { return this.gunLoaded && this.characterLoaded && !this.loadError; },
    reset() {
        console.log("Resetting ModelData");
        // Revoke previous URLs to free memory
        if (this.gunUrl) URL.revokeObjectURL(this.gunUrl);
        if (this.characterUrl) URL.revokeObjectURL(this.characterUrl);
        this.gunUrl = null; this.characterUrl = null; this.gunFile = null; this.characterFile = null;
        this.gunLoaded = false; this.characterLoaded = false; this.loadError = null; this.pendingFiles = 0;
        // Reset UI elements on Upload screen
        this.updateFileUI('gun', 'Pending', 'pending');
        this.updateFileUI('character', 'Pending', 'pending');
        try { // Wrap DOM access in try-catch during reset
            document.getElementById('gunFileLabel').textContent = 'Select Gun Model';
            document.getElementById('charFileLabel').textContent = 'Select Character Model';
            document.getElementById('startFromUploadButton').disabled = true;
            document.getElementById('uploadErrorLog').textContent = '';
        } catch (e) { console.warn("Error resetting upload UI elements:", e); }
    },
    updateFileUI(type, statusText, statusClass) {
         const statusElement = document.getElementById(type === 'gun' ? 'gunStatus' : 'charStatus');
         if (statusElement) {
             statusElement.textContent = statusText;
             statusElement.className = `status ${statusClass}`;
         }
    }
};

// --- AudioManager ---
const AudioManager = {
    audioContext: null, masterGain: null, sfxGain: null, musicGain: null,
    sounds: {}, music: { buffer: null, sourceNode: null, isPlaying: false },
    sfxVolume: 0.7, musicVolume: 0.5, isInitialized: false,
    // IMPORTANT: Replace with your actual asset paths or URLs! Use relative paths if hosted together.
    assetsToLoad: {
         shoot: 'sounds/shoot.wav', // Make sure these paths are correct relative to your HTML file
         hit: 'sounds/hit.wav',
         reload: 'sounds/reload.wav',
         jump: 'sounds/jump.wav',
         emptyGun: 'sounds/empty.wav',
         backgroundMusic: 'music/game_music.mp3' // Example music file
    },
    init() {
        if (this.isInitialized) { return true; }
        console.log("AudioManager: Initializing...");
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!window.AudioContext) {
                console.error("Web Audio API not supported."); return false;
            }
            this.audioContext = new AudioContext();
            if (this.audioContext.state === 'suspended') {
                console.warn("AudioContext is suspended. Will try to resume on interaction.");
                // Add a general interaction listener to resume context
                const resumeHandler = () => {
                    this.resumeContext();
                    document.body.removeEventListener('click', resumeHandler, true);
                    document.body.removeEventListener('touchend', resumeHandler, true);
                };
                document.body.addEventListener('click', resumeHandler, true);
                document.body.addEventListener('touchend', resumeHandler, true);
            }
            this.masterGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);
            this.setVolume('sfx', GameSettings.volumes.sfx); // Use loaded settings
            this.setVolume('music', GameSettings.volumes.music);
            this.preloadAssets(); // Start loading sounds
            this.isInitialized = true;
            console.log("AudioManager: Init OK.");
            return true;
        } catch (e) {
            console.error("AudioManager: Initialization Error:", e);
            this.isInitialized = false;
            return false;
        }
    },
    resumeContext() {
        if (!this.audioContext || this.audioContext.state !== 'suspended') return;
        this.audioContext.resume().then(() => {
            console.log("AudioContext resumed successfully.");
        }).catch(err => {
            console.error("AudioContext resume failed:", err);
        });
    },
    preloadAssets() {
         if (!this.isInitialized) return;
         console.log("Preloading audio assets...");
         const promises = [];
         for (const name in this.assetsToLoad) {
             const url = this.assetsToLoad[name];
             if (!url) { console.warn(`No URL for audio asset: ${name}`); continue; }
             // Simple check if path seems invalid (optional)
             if (!url.includes('/') && !url.startsWith('http')) {
                 console.warn(`Audio asset path "${url}" for "${name}" looks suspicious. Ensure it's correct.`);
             }
             if (name === 'backgroundMusic') {
                 promises.push(this.loadMusic(url).catch(e => console.error(`Failed loading music '${url}':`, e)));
             } else {
                 promises.push(this.loadSound(name, url).catch(e => console.error(`Failed loading SFX '${name}' from '${url}':`, e)));
             }
         }
         Promise.allSettled(promises).then((results) => {
             console.log("AudioManager: Audio asset loading attempt finished.");
             results.forEach(result => {
                if (result.status === 'rejected') {
                    // Log specific errors if needed, already logged in catch blocks
                    // console.warn("Audio Loading Issue:", result.reason);
                }
            });
         });
    },
    async loadSound(name, url) {
        if (!this.audioContext) { return Promise.reject("Audio context not ready"); }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[name] = { buffer: audioBuffer };
            // console.log(`SFX Loaded: ${name}`);
            return audioBuffer;
        } catch (error) {
            // console.error(`Failed to load sound "${name}":`, error); // Be less verbose on expected fails
            this.sounds[name] = null; // Ensure it's marked as unloaded
            throw error; // Re-throw to be caught by Promise.allSettled
        }
    },
    async loadMusic(url) {
         if (!this.audioContext) { return Promise.reject("Audio context not ready"); }
         try {
             const response = await fetch(url);
             if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${url}`);
             const arrayBuffer = await response.arrayBuffer();
             const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
             this.music.buffer = audioBuffer;
             // console.log(`Music Loaded: ${url}`);
             return audioBuffer;
         } catch (error) {
            // console.error("Failed to load music:", error);
            this.music.buffer = null;
            throw error; // Re-throw
         }
    },
    play(name) {
         // Ensure context is running before playing
         this.resumeContext();
         if (!this.isInitialized || !this.audioContext || this.audioContext.state !== 'running') return;
         const sound = this.sounds[name];
         // if (!sound || !sound.buffer) { console.warn(`Sound "${name}" not loaded or failed.`); return; } // Less noisy log
         if (!sound || !sound.buffer) return;
         try {
             const source = this.audioContext.createBufferSource();
             source.buffer = sound.buffer;
             source.connect(this.sfxGain);
             source.start(0);
         } catch (e) { console.error(`Error playing sound "${name}":`, e); }
    },
    playMusic() {
         this.resumeContext();
         if (!this.isInitialized || !this.audioContext || this.audioContext.state !== 'running') return;
         if (this.music.isPlaying || !this.music.buffer) return;
         try {
             // Stop and disconnect previous node if it exists
             if (this.music.sourceNode) {
                 try { this.music.sourceNode.stop(); } catch (e) {/* Already stopped */}
                 this.music.sourceNode.disconnect();
             }
             const source = this.audioContext.createBufferSource();
             source.buffer = this.music.buffer;
             source.loop = true;
             source.connect(this.musicGain);
             source.start(0);
             this.music.sourceNode = source;
             this.music.isPlaying = true;
         } catch (e) {
             console.error("Error playing music:", e);
             this.music.sourceNode = null;
             this.music.isPlaying = false;
         }
    },
    pauseMusic() {
         if (!this.isInitialized || !this.music.isPlaying || !this.music.sourceNode) return;
         try {
             this.music.sourceNode.stop(0);
         } catch (e) { /* Ignore errors if already stopped */ }
         finally {
             // Check if disconnect is needed before calling
             if(this.music.sourceNode.buffer) { // Check if it was actually playing
                try { this.music.sourceNode.disconnect(); } catch(e) {/* Ignore disconnect errors */}
             }
             this.music.sourceNode = null;
             this.music.isPlaying = false;
         }
    },
    setVolume(type, volume) {
         if (!this.isInitialized || !this.audioContext) return;
         const gainNode = type === 'music' ? this.musicGain : this.sfxGain;
         const targetVolume = Math.max(0.0001, Math.min(1, Number(volume))); // Clamp and avoid 0 for exp ramp

         if (gainNode) {
            if (type === 'music') this.musicVolume = volume;
            else this.sfxVolume = volume;

             try {
                gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(targetVolume, this.audioContext.currentTime + 0.1);
             } catch(e) {
                console.warn("Exponential ramp failed, using setValueAtTime:", e);
                gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
            }
         }
     }
};

// --- GameSettings ---
const GameSettings = {
    keyBindings: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', reload: 'KeyR' },
    volumes: { music: 0.5, sfx: 0.7 },
    controls: { sensitivity: 0.002 },
    graphics: { shadowQuality: 'medium' }, // 'low', 'medium', 'high'
    settingsOpen: false, // Track if settings menu is open

    saveSettings() {
         console.log("Saving settings...");
         try {
             // Keys
             ['forward', 'backward', 'left', 'right', 'jump', 'reload'].forEach(action => {
                 const select = document.getElementById(`${action}Key`);
                 if (select) {
                    this.keyBindings[action] = select.value;
                 } else { console.warn(`Settings: Could not find element for key binding "${action}Key"`); }
             });
             // Volumes
             const musicVol = document.getElementById('musicVolume');
             const sfxVol = document.getElementById('sfxVolume');
             if (musicVol) this.volumes.music = parseFloat(musicVol.value); else console.warn("Settings: musicVolume element not found");
             if (sfxVol) this.volumes.sfx = parseFloat(sfxVol.value); else console.warn("Settings: sfxVolume element not found");
            // Controls
            const sensitivity = document.getElementById('sensitivity');
            if (sensitivity) this.controls.sensitivity = parseFloat(sensitivity.value); else console.warn("Settings: sensitivity element not found");
            // Graphics
            const shadow = document.getElementById('shadowQuality');
            if (shadow) this.graphics.shadowQuality = shadow.value; else console.warn("Settings: shadowQuality element not found");

            // Apply settings immediately
            AudioManager.setVolume('music', this.volumes.music);
            AudioManager.setVolume('sfx', this.volumes.sfx);
            InputManager.sensitivity = this.controls.sensitivity;
            // Apply graphics setting only if Graphics is initialized
            if (Graphics.renderer) {
                Graphics.setShadowQuality(this.graphics.shadowQuality);
            } else { console.warn("Settings: Graphics not ready, shadow quality not applied immediately."); }

             // Persist to localStorage
             localStorage.setItem('fpsGameSettings', JSON.stringify({
                 keyBindings: this.keyBindings,
                 volumes: this.volumes,
                 controls: this.controls,
                 graphics: this.graphics
             }));
             console.log("Settings saved and applied.");
         } catch (e) { console.error("Error saving settings:", e); }
    },

    loadSettings() {
        console.log("Loading settings...");
         try {
             const savedSettings = localStorage.getItem('fpsGameSettings');
             if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                // Deep merge/assign carefully
                if (parsed.keyBindings) this.keyBindings = { ...this.keyBindings, ...parsed.keyBindings };
                if (parsed.volumes) this.volumes = { ...this.volumes, ...parsed.volumes };
                if (parsed.controls) this.controls = { ...this.controls, ...parsed.controls };
                if (parsed.graphics) this.graphics = { ...this.graphics, ...parsed.graphics };
                 console.log("Loaded settings from localStorage.");
             }

            // --- Update UI elements ---
            Object.keys(this.keyBindings).forEach(action => {
                const select = document.getElementById(`${action}Key`);
                if (select) {
                    // Ensure the saved value exists as an option, otherwise default
                    if ([...select.options].some(option => option.value === this.keyBindings[action])) {
                        select.value = this.keyBindings[action];
                    } else {
                        console.warn(`Saved key "${this.keyBindings[action]}" for "${action}" not found in options. Using default "${select.value}".`);
                        this.keyBindings[action] = select.value; // Update internal state to match UI default
                    }
                } else { console.warn(`Load Settings: Could not find element for key binding "${action}Key"`); }
            });

            const musicVol = document.getElementById('musicVolume');
            const sfxVol = document.getElementById('sfxVolume');
            const sensitivity = document.getElementById('sensitivity');
            const shadow = document.getElementById('shadowQuality');

            if (musicVol) musicVol.value = this.volumes.music; else console.warn("Load Settings: musicVolume element not found");
            if (sfxVol) sfxVol.value = this.volumes.sfx; else console.warn("Load Settings: sfxVolume element not found");
            if (sensitivity) sensitivity.value = this.controls.sensitivity; else console.warn("Load Settings: sensitivity element not found");
            if (shadow) shadow.value = this.graphics.shadowQuality; else console.warn("Load Settings: shadowQuality element not found");

            // Update labels immediately after setting values
             this.updateVolumeLabel('musicVolumeLabel', this.volumes.music);
             this.updateVolumeLabel('sfxVolumeLabel', this.volumes.sfx);
             this.updateSensitivityLabel(this.controls.sensitivity);

            // Apply loaded settings that have immediate effect
            AudioManager.setVolume('music', this.volumes.music);
            AudioManager.setVolume('sfx', this.volumes.sfx);
            InputManager.sensitivity = this.controls.sensitivity;
            // Apply graphics setting only if Graphics is initialized
            if(Graphics.renderer) {
                Graphics.setShadowQuality(this.graphics.shadowQuality);
            }

        } catch (e) { console.error("Error loading settings:", e); }
    },

     updateVolumeLabel(labelId, value) {
         const label = document.getElementById(labelId);
         if (label) label.textContent = parseFloat(value).toFixed(2);
     },
    updateSensitivityLabel(value) {
        const label = document.getElementById('sensitivityLabel');
        if (label) {
             label.textContent = (parseFloat(value) * 1000).toFixed(1); // Display scale
         }
    },

    addSettingsListeners() {
        // Ensure elements exist before adding listeners
        const musicVol = document.getElementById('musicVolume');
        const sfxVol = document.getElementById('sfxVolume');
        const sensitivity = document.getElementById('sensitivity');
        const saveBtn = document.getElementById('saveSettings');
        const cancelBtn = document.getElementById('cancelSettings');

        if (musicVol) musicVol.addEventListener('input', (e) => this.updateVolumeLabel('musicVolumeLabel', e.target.value));
        else console.warn("Settings Listeners: musicVolume not found");

        if (sfxVol) sfxVol.addEventListener('input', (e) => this.updateVolumeLabel('sfxVolumeLabel', e.target.value));
        else console.warn("Settings Listeners: sfxVolume not found");

        if (sensitivity) sensitivity.addEventListener('input', (e) => this.updateSensitivityLabel(e.target.value));
        else console.warn("Settings Listeners: sensitivity not found");

        if (saveBtn) saveBtn.addEventListener('click', () => Game.closeSettings(true));
        else console.warn("Settings Listeners: saveSettings button not found");

        if (cancelBtn) cancelBtn.addEventListener('click', () => Game.closeSettings(false));
        else console.warn("Settings Listeners: cancelSettings button not found");

        // Add listener for the in-game settings button
        const settingsBtn = document.getElementById('settingsButton');
        if (settingsBtn) {
             settingsBtn.addEventListener('click', () => Game.showSettings());
        } else { console.warn("Settings Listeners: In-game settingsButton not found"); }
    }
};

// --- Graphics ---
const Graphics = {
    scene: null, camera: null, renderer: null, clock: null, gunModel: null,
    // Use THREE namespace directly since it's global from the script tag
    loader: new THREE.GLTFLoader(),
    defaultFov: 70,

    init() {
        console.log("Graphics: Initializing...");
         try {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);

            this.camera = new THREE.PerspectiveCamera(this.defaultFov, window.innerWidth / window.innerHeight, 0.1, 1000);
            // Player height is handled by physics body, camera sits at body's position
            this.camera.position.set(0, 1.6, 0); // Initial position, will sync with physics

            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.outputEncoding = THREE.sRGBEncoding; // Correct for GLTF colors
            this.renderer.shadowMap.enabled = true;
            this.setShadowQuality(GameSettings.graphics.shadowQuality); // Apply loaded setting

            const container = document.getElementById('gameContainer');
            if (!container) throw new Error("gameContainer element not found in HTML!");
            // Clear previous renderer if any (e.g., on restart)
            while (container.firstChild) { container.removeChild(container.firstChild); }
            container.appendChild(this.renderer.domElement);

            this.clock = new THREE.Clock();

            window.addEventListener('resize', this.onWindowResize.bind(this), false);
            console.log("Graphics: Base Init complete.");
            return true;
        } catch (error) {
            console.error("Graphics Initialization failed:", error);
            ModelData.loadError = "Failed to initialize Graphics (WebGL issue?). Check console.";
            alert(`Graphics Initialization Failed:\n${error.message}\n\nPlease ensure your browser supports WebGL and hardware acceleration is enabled.`);
             return false;
         }
    },

    loadAssets() {
        console.log("Graphics: Loading assets (Gun)...");
         return this.loadGunModel(ModelData.gunUrl);
    },

     setupLights() {
        console.log("Setting up lights...");
         // Clear existing lights first? Maybe not necessary if scene is recreated.
         const ambientLight = new THREE.AmbientLight(0x8090a0, 0.8);
         this.scene.add(ambientLight);

         const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
         dirLight.position.set(50, 80, 30);
         dirLight.castShadow = true;
         dirLight.shadow.camera.top = 50;
         dirLight.shadow.camera.bottom = -50;
         dirLight.shadow.camera.left = -50;
         dirLight.shadow.camera.right = 50;
         dirLight.shadow.camera.near = 0.5;
         dirLight.shadow.camera.far = 200;
         // Shadow map size set by setShadowQuality
         this.scene.add(dirLight);
         this.scene.add(dirLight.target);
         dirLight.target.position.set(0, 0, 0);

         const hemiLight = new THREE.HemisphereLight(0xadd8e6, 0x404040, 0.6);
         this.scene.add(hemiLight);
         console.log("Lights OK.");
     },

    onWindowResize() {
        if (!this.camera || !this.renderer) { return; }
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    createGunFlash() {
         const flashContainer = document.getElementById('gunEffects');
         if (!flashContainer) return;

         const flash = document.createElement('div');
         // Style (same as before)
         flash.style.cssText = `
             position: absolute; bottom: 15%; left: 52%; width: 80px; height: 80px;
             border-radius: 50%;
             background: radial-gradient(circle, rgba(255,230,180,0.95) 0%, rgba(255,200,100,0.8) 30%, rgba(255,160,0,0) 70%);
             transform: translate(-50%, 50%) scale(0); transform-origin: center center; opacity: 1;
             transition: transform 0.04s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.1s 0.04s linear;
             mix-blend-mode: screen; pointer-events: none; /* Ensure it doesn't block clicks */
         `;
         flashContainer.appendChild(flash);

         requestAnimationFrame(() => {
             requestAnimationFrame(() => {
                 flash.style.transform = 'translate(-50%, 50%) scale(1)';
                 flash.style.opacity = '0';
             });
         });

         setTimeout(() => {
             if (flash.parentNode === flashContainer) {
                 flashContainer.removeChild(flash);
             }
         }, 150);
    },

    showHitMarker() {
         const hitMarker = document.getElementById('hitMarker');
         if (!hitMarker) return;
         hitMarker.style.opacity = '1';
         hitMarker.style.transform = 'translate(-50%, -50%) scale(1.3)';
         setTimeout(() => {
             hitMarker.style.opacity = '0';
             hitMarker.style.transform = 'translate(-50%, -50%) scale(1)';
         }, 120);
    },

     loadGunModel(url) {
        return new Promise((resolve, reject) => {
            if (!url) { return reject(new Error("Missing gun model URL")); }
            console.log("Graphics: Loading gun model...");

            this.loader.load(url, (gltf) => {
                console.log("Graphics: Gun model GLTF loaded.");
                 // Remove previous gun model if any
                 if (this.gunModel) {
                    this.camera.remove(this.gunModel); // Remove from camera, not scene
                    // Optional: Dispose geometry/material if needed, but often overkill
                 }

                this.gunModel = gltf.scene;

                // ---<<< CRITICAL ADJUSTMENT AREA >>>---
                // These values DEPEND ENTIRELY on your specific GLB/GLTF file.
                // The model's origin point, scale, and default orientation matter.
                // EXPERIMENT with these values until the gun looks correct in first person.
                //
                // Common Starting Points:
                // Scale: Often needs to be much smaller (e.g., 0.05 to 0.5)
                // Position:
                //   X: Positive = right, Negative = left (e.g., 0.1 to 0.3 for right hand)
                //   Y: Positive = up, Negative = down (e.g., -0.1 to -0.3)
                //   Z: Positive = towards camera, Negative = away (e.g., -0.3 to -0.7)
                // Rotation:
                //   Often needs rotation around Y axis (Math.PI = 180 degrees) if model faces wrong way.
                //   Sometimes needs X or Z rotation for tilt. Rotations are in radians.
                //
                // Example (ADJUST THESE):
                this.gunModel.scale.set(0.1, 0.1, 0.1);         // START SMALLER
                this.gunModel.position.set(0.15, -0.15, -0.4);  // Slightly right, down, forward
                this.gunModel.rotation.set(0, Math.PI, 0);    // Point forward (Adjust if needed!)
                // ---<<< END CRITICAL ADJUSTMENT AREA >>>---

                this.gunModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = false; // Gun usually doesn't cast shadow FROM camera
                        child.receiveShadow = false;
                        // Optional: Adjust material properties if needed
                        // child.material.envMapIntensity = 0.5;
                        // child.material.metalness = 0.8; // Example
                        // child.material.roughness = 0.4; // Example
                    }
                });

                // Add the gun model as a child of the camera for FPS view
                 this.camera.add(this.gunModel);
                 console.log("Graphics: Gun model processed and added to camera.");
                 resolve();
            },
            (xhr) => { /* Optional progress */ },
            (error) => {
                console.error('Graphics: Error loading gun model:', error);
                // Provide more specific feedback if possible
                let errorMsg = `Failed to load gun model. Check console.`;
                if (error.message && error.message.includes('fetch')) errorMsg += ' Network error or invalid URL?';
                if (error.message && error.message.includes('JSON')) errorMsg += ' Invalid GLTF JSON structure?';
                if (error.message && error.message.includes('parse')) errorMsg += ' Error parsing model file.';
                reject(new Error(errorMsg));
            });
        });
    },

     setShadowQuality(level) {
        if (!this.renderer) return;
         console.log(`Graphics: Setting shadow quality to ${level}`);
         let mapSize = 1024; // Medium default
         let shadowType = THREE.PCFSoftShadowMap; // Smoother default

         switch (level.toLowerCase()) {
             case 'low':
                 mapSize = 512;
                 shadowType = THREE.PCFShadowMap; // Faster, harder shadows
                 // this.renderer.shadowMap.autoUpdate = false; // Risky, might miss updates
                 break;
             case 'high':
                 mapSize = 2048;
                 shadowType = THREE.PCFSoftShadowMap;
                 // this.renderer.shadowMap.autoUpdate = true;
                 break;
             case 'medium':
             default:
                 mapSize = 1024;
                 shadowType = THREE.PCFSoftShadowMap;
                 // this.renderer.shadowMap.autoUpdate = true;
                 break;
         }

         this.renderer.shadowMap.type = shadowType;
         let needsUpdate = false;
         this.scene?.traverse((object) => {
             if (object.isLight && object.castShadow) {
                 if (object.shadow.mapSize.width !== mapSize || object.shadow.mapSize.height !== mapSize) {
                     object.shadow.mapSize.width = mapSize;
                     object.shadow.mapSize.height = mapSize;
                     if (object.shadow.map) {
                         object.shadow.map.dispose();
                         object.shadow.map = null;
                         needsUpdate = true; // Mark that map needs redraw
                         console.log(`Updated shadow map size for light: ${object.uuid || 'unnamed'}`);
                     }
                 }
             }
         });
         // Force renderer to update shadow maps if they were changed
         if (needsUpdate) {
            this.renderer.shadowMap.needsUpdate = true;
            console.log("Forcing shadow map update.");
         }
     }
};

// --- Physics ---
const Physics = {
    world: null, playerBody: null, playerMaterial: null, groundMaterial: null,
     lastTime: 0, // For fixed timestep

    init() {
        console.log("Physics: Initializing...");
        try {
            this.world = new CANNON.World();
            // --- TUNING AREA for Feel ---
            this.world.gravity.set(0, -15, 0); // Reduced gravity slightly, adjust as needed
            this.world.broadphase = new CANNON.SAPBroadphase(this.world);
            this.world.solver.iterations = 12; // Slightly more iterations for stability
            this.world.allowSleep = true; // Allow bodies to sleep

            this.playerMaterial = new CANNON.Material("playerMaterial");
            this.groundMaterial = new CANNON.Material("groundMaterial");

            const playerGroundContact = new CANNON.ContactMaterial(this.playerMaterial, this.groundMaterial, {
                 friction: 0.2,      // Lower friction for less 'stickiness'
                 restitution: 0.1,   // Low bounciness
            });
            this.world.addContactMaterial(playerGroundContact);

            const playerRadius = 0.4; // Slightly smaller radius
            const playerHeight = 1.6; // Eye level approx
            // Using a sphere is simple but can feel like rolling. A capsule is better but complex in Cannon.js.
            const playerShape = new CANNON.Sphere(playerRadius);
            this.playerBody = new CANNON.Body({
                mass: 70,
                position: new CANNON.Vec3(0, playerHeight, 5), // Start slightly back
                shape: playerShape,
                fixedRotation: true, // Essential for FPS
                material: this.playerMaterial,
                linearDamping: 0.5, // Lower damping for less 'sluggish' feel, adjust this!
                angularDamping: 1.0 // Prevent any rotation
            });
            this.world.addBody(this.playerBody);

            // Ground Body
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0, shape: groundShape, material: this.groundMaterial });
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            groundBody.position.set(0, 0, 0);
            this.world.addBody(groundBody);

            this.lastTime = performance.now();
            console.log("Physics: Init complete.");
            return true;
        } catch(e) {
             console.error("Physics Initialization failed:", e);
             ModelData.loadError = "Failed to initialize Physics. Check console.";
             return false;
        }
    },

    update(currentTime) {
        if (!this.world) return;
        // Calculate delta time since last physics update
        const deltaTime = (currentTime - this.lastTime) / 1000.0;
        this.lastTime = currentTime;

        // Use a fixed timestep for stability
        const fixedTimeStep = 1 / 60; // Target 60Hz physics
        const maxSubSteps = 5;     // Max steps per frame to prevent spiral
        try {
            this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
        } catch (e) {
            console.error("Physics step failed:", e);
            // Maybe pause game or handle error?
        }
    },

    isPlayerOnGround() {
        if (!this.playerBody || !this.world) return false;
        const playerPos = this.playerBody.position;
        const sphereRadius = this.playerBody.shapes[0].radius || 0.4;
        const rayStartOffset = 0.1; // Start ray slightly above bottom of sphere
        const rayLength = sphereRadius + 0.15; // Check just below the sphere base

        const rayFrom = new CANNON.Vec3(playerPos.x, playerPos.y + rayStartOffset, playerPos.z);
        const rayTo = new CANNON.Vec3(playerPos.x, playerPos.y - rayLength, playerPos.z);
        const rayOptions = {
             collisionFilterMask: -1, skipBackfaces: true
         };
         const result = new CANNON.RaycastResult();
         // Debug Ray (Optional, requires THREE.js setup)
         // const arrowHelper = new THREE.ArrowHelper(rayTo.vsub(rayFrom).unit(), rayFrom, rayLength + rayStartOffset, 0xff0000);
         // Graphics.scene.add(arrowHelper);
         // setTimeout(() => Graphics.scene.remove(arrowHelper), 100);

         return this.world.raycastClosest(rayFrom, rayTo, rayOptions, result);
    }
};

// --- InputManager ---
const InputManager = {
    keys: { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, jump: false, reload: false },
    mouse: { movementX: 0, movementY: 0, isMouseDown: false }, // Added isMouseDown
    touch: {
         joystickActive: false, joystickStartPos: { x: 0, y: 0 }, joystickCurrentPos: { x: 0, y: 0 },
         joystickRadius: 65, knobRadius: 30,
        joystickElement: null, knobElement: null, actionButtons: {}, joystickTouchId: null, lookTouchId: null,
        lookStartPos: { x: 0, y: 0 }, lookDelta: { x: 0, y: 0 }, lookAreaElement: null
    },
    pointerLocked: false,
    isMobile: false,
    sensitivity: 0.002, // Loaded from settings

     init() {
         console.log("InputManager: Initializing...");
         this.checkMobile();
         this.sensitivity = GameSettings.controls.sensitivity; // Load initial sensitivity

         // Reset state
         this.keys = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, jump: false, reload: false };
         this.mouse = { movementX: 0, movementY: 0, isMouseDown: false };
         this.touch = { ...this.touch, lookDelta: { x: 0, y: 0 }, joystickActive: false, joystickTouchId: null, lookTouchId: null }; // Reset touch state
         this.pointerLocked = false;


         document.addEventListener('keydown', this.onKeyDown.bind(this));
         document.addEventListener('keyup', this.onKeyUp.bind(this));

         if (this.isMobile) {
             console.log("Mobile device detected. Setting up touch controls.");
             this.setupMobileControls();
             const mobileControlsElement = document.getElementById('mobileControls');
             if (mobileControlsElement) mobileControlsElement.style.display = 'flex';
         } else {
             console.log("Desktop device detected. Setting up mouse/keyboard controls.");
             this.setupDesktopControls();
             const mobileControlsElement = document.getElementById('mobileControls');
             if (mobileControlsElement) mobileControlsElement.style.display = 'none';
         }
         console.log("InputManager: Init complete.");
         return true;
     },

     checkMobile() {
         // More robust check
         let check = false;
         (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
         this.isMobile = check;
         console.log("Is Mobile:", this.isMobile);
     },

    setupDesktopControls() {
        const gameCanvas = Graphics.renderer?.domElement;
         if (!gameCanvas) {
            console.error("Cannot setup desktop controls: Renderer canvas not found.");
            return;
         }
         gameCanvas.addEventListener('mousemove', this.onMouseMove.bind(this));
         gameCanvas.addEventListener('mousedown', this.onMouseDown.bind(this)); // Use mousedown for shooting
         gameCanvas.addEventListener('mouseup', this.onMouseUp.bind(this));
         gameCanvas.addEventListener('click', this.onClick.bind(this), false); // Still needed for requesting pointer lock

         document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this), false);
         document.addEventListener('pointerlockerror', this.onPointerLockError.bind(this), false);
     },

     setupMobileControls() {
         this.touch.joystickElement = document.getElementById('joystick');
         this.touch.knobElement = document.getElementById('joystickKnob');
         this.touch.actionButtons.shoot = document.getElementById('shootButton');
         this.touch.actionButtons.jump = document.getElementById('jumpButton');
         this.touch.actionButtons.reload = document.getElementById('reloadButton');
         this.touch.lookAreaElement = document.getElementById('gameContainer'); // Use game container for look

         if (!this.touch.joystickElement || !this.touch.knobElement || !this.touch.actionButtons.shoot || !this.touch.actionButtons.jump || !this.touch.actionButtons.reload || !this.touch.lookAreaElement) {
             console.error("One or more mobile control elements are missing!");
             return;
         }

         // Prevent default behaviors like scrolling/zooming on the controls
         [this.touch.joystickElement, this.touch.lookAreaElement, ...Object.values(this.touch.actionButtons)].forEach(el => {
             el.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
             // Optional: prevent context menu on long press
             el.addEventListener('contextmenu', e => e.preventDefault());
         });

         // Joystick Listener
         this.touch.joystickElement.addEventListener('touchstart', (e) => {
             if (this.touch.joystickTouchId === null) {
                 e.preventDefault();
                 this.touch.joystickTouchId = e.changedTouches[0].identifier;
                 this.touch.joystickActive = true;
                 const rect = this.touch.joystickElement.getBoundingClientRect();
                 this.touch.joystickStartPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                 this.updateJoystickPosition(e.changedTouches[0]);
             }
         }, { passive: false });

         // Look Area Listener
         this.touch.lookAreaElement.addEventListener('touchstart', (e) => {
            if (this.touch.lookTouchId === null) {
                 // Check if touch STARTS on a control element, if so, ignore for looking
                 if (this.isTouchOnControl(e.changedTouches[0])) return;

                 e.preventDefault();
                 const touch = e.changedTouches[0];
                 this.touch.lookTouchId = touch.identifier;
                 this.touch.lookStartPos = { x: touch.clientX, y: touch.clientY };
                 this.touch.lookDelta = { x: 0, y: 0 };
            }
         }, { passive: false });


        // Global Move Listener
         document.addEventListener('touchmove', (e) => {
             for (let i = 0; i < e.changedTouches.length; i++) {
                 const touch = e.changedTouches[i];
                 if (touch.identifier === this.touch.joystickTouchId) {
                    e.preventDefault();
                    this.updateJoystickPosition(touch);
                 } else if (touch.identifier === this.touch.lookTouchId) {
                    e.preventDefault();
                    const dx = touch.clientX - this.touch.lookStartPos.x;
                    const dy = touch.clientY - this.touch.lookStartPos.y;
                    // Accumulate delta, will be consumed by game loop
                    this.touch.lookDelta.x += dx;
                    this.touch.lookDelta.y += dy;
                    // Update start position for next delta calculation
                    this.touch.lookStartPos = { x: touch.clientX, y: touch.clientY };
                 }
             }
         }, { passive: false });

        // Global End/Cancel Listener
         const touchEndHandler = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                 if (touch.identifier === this.touch.joystickTouchId) {
                     this.resetJoystick();
                 } else if (touch.identifier === this.touch.lookTouchId) {
                     this.touch.lookTouchId = null;
                     // Keep the last lookDelta until consumed by game loop
                 }
             }
         };
         document.addEventListener('touchend', touchEndHandler);
         document.addEventListener('touchcancel', touchEndHandler); // Handle cancellation

         // Action Button Listeners
         this.setupMobileButton(this.touch.actionButtons.shoot,
            () => { this.mouse.isMouseDown = true; }, // Simulate mouse down for shooting logic
            () => { this.mouse.isMouseDown = false; }
         );
         this.setupMobileButton(this.touch.actionButtons.jump,
            () => { this.keys.jump = true; },
            () => { this.keys.jump = false; }
         );
         this.setupMobileButton(this.touch.actionButtons.reload,
            () => { if (!this.keys.reload) { this.keys.reload = true; Game.reload(); } },
            () => { this.keys.reload = false; }
         );
     },

    isTouchOnControl(touch) {
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        const joyRect = this.touch.joystickElement?.getBoundingClientRect();
        if (joyRect && touchX >= joyRect.left && touchX <= joyRect.right && touchY >= joyRect.top && touchY <= joyRect.bottom) return true;

        for (const btnName in this.touch.actionButtons) {
            const btn = this.touch.actionButtons[btnName];
            if (!btn) continue;
            const btnRect = btn.getBoundingClientRect();
            if (touchX >= btnRect.left && touchX <= btnRect.right && touchY >= btnRect.top && touchY <= btnRect.bottom) return true;
        }
        return false;
    },

    setupMobileButton(element, actionStart, actionEnd = null) {
         if (!element) return;
         let touchId = null;
         element.addEventListener('touchstart', (e) => {
             if (touchId === null) { // Only handle first touch on button
                e.preventDefault();
                 touchId = e.changedTouches[0].identifier;
                 actionStart();
                 element.classList.add('active');
             }
         }, { passive: false });

         const endListener = (e) => {
             for (let i = 0; i < e.changedTouches.length; i++) {
                 if (e.changedTouches[i].identifier === touchId) {
                     actionEnd?.();
                     element.classList.remove('active');
                     touchId = null; // Release the button lock
                     break; // Exit loop once handled
                 }
             }
         };
         element.addEventListener('touchend', endListener);
         element.addEventListener('touchcancel', endListener);
    },

    updateJoystickPosition(touch) {
        if (!this.touch.joystickElement || !this.touch.knobElement || !this.touch.joystickActive) return;

         let dx = touch.clientX - this.touch.joystickStartPos.x;
         let dy = touch.clientY - this.touch.joystickStartPos.y;

        const maxDist = this.touch.joystickRadius - this.touch.knobRadius;
         const currentDist = Math.sqrt(dx * dx + dy * dy);
         let clampedX = dx, clampedY = dy;

         if (currentDist > maxDist) {
             clampedX = (dx / currentDist) * maxDist;
             clampedY = (dy / currentDist) * maxDist;
         }

         this.touch.knobElement.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

         const relativeX = currentDist > 0 ? dx / maxDist : 0; // Use original dx/dy for direction
         const relativeY = currentDist > 0 ? dy / maxDist : 0;

         const deadzone = 0.15;
         this.keys.moveForward = relativeY < -deadzone;
         this.keys.moveBackward = relativeY > deadzone;
         this.keys.moveLeft = relativeX < -deadzone;
         this.keys.moveRight = relativeX > deadzone;
     },

     resetJoystick() {
         this.touch.joystickActive = false;
         this.touch.joystickTouchId = null;
         if (this.touch.knobElement) {
             this.touch.knobElement.style.transform = 'translate(-50%, -50%)';
         }
         this.keys.moveForward = false;
         this.keys.moveBackward = false;
         this.keys.moveLeft = false;
         this.keys.moveRight = false;
     },

    // --- Desktop Callbacks ---
    onKeyDown(event) {
        // Ignore input if typing in settings or if game not active (unless it's Escape)
        if ((GameSettings.settingsOpen || !Game.gameStarted || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') && event.code !== 'Escape') return;

         const key = event.code;
         if (key === GameSettings.keyBindings.forward) this.keys.moveForward = true;
         else if (key === GameSettings.keyBindings.backward) this.keys.moveBackward = true;
         else if (key === GameSettings.keyBindings.left) this.keys.moveLeft = true;
         else if (key === GameSettings.keyBindings.right) this.keys.moveRight = true;
         else if (key === GameSettings.keyBindings.jump && !this.keys.jump) this.keys.jump = true; // Trigger on press if not already jumping
         else if (key === GameSettings.keyBindings.reload && !this.keys.reload) {
             this.keys.reload = true; // Set flag immediately
             Game.reload();          // Trigger reload action
         } else if (key === 'Escape') {
            if (GameSettings.settingsOpen) {
                Game.closeSettings(false); // Cancel settings on Escape
            } else if (this.pointerLocked) {
                document.exitPointerLock();
            } else if (Game.gameStarted) {
                Game.showSettings(); // Open settings if game is running and not locked
            }
         }
    },

    onKeyUp(event) {
        // Always process key up unless typing in an input/select
         if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

         const key = event.code;
         if (key === GameSettings.keyBindings.forward) this.keys.moveForward = false;
         else if (key === GameSettings.keyBindings.backward) this.keys.moveBackward = false;
         else if (key === GameSettings.keyBindings.left) this.keys.moveLeft = false;
         else if (key === GameSettings.keyBindings.right) this.keys.moveRight = false;
         else if (key === GameSettings.keyBindings.jump) this.keys.jump = false; // Allow jump again on release
         else if (key === GameSettings.keyBindings.reload) this.keys.reload = false; // Reset reload flag
    },

     onMouseMove(event) {
        if (!this.pointerLocked) return;
         this.mouse.movementX += event.movementX || 0; // Accumulate movement
         this.mouse.movementY += event.movementY || 0;
    },

    onMouseDown(event) {
        // Left mouse button (button 0)
        if (this.pointerLocked && event.button === 0) {
            this.mouse.isMouseDown = true;
        }
    },

    onMouseUp(event) {
        if (event.button === 0) {
            this.mouse.isMouseDown = false;
        }
    },

    onClick() {
        // Request pointer lock if not locked and game container is visible
        if (!this.pointerLocked && !this.isMobile && document.getElementById('gameContainer').style.display !== 'none' && !GameSettings.settingsOpen) {
            Graphics.renderer?.domElement?.requestPointerLock();
         }
        // Note: Actual shooting is now handled by onMouseDown/isMouseDown in the game loop for holding fire
    },

    onPointerLockChange() {
        this.pointerLocked = document.pointerLockElement === Graphics.renderer?.domElement;
         console.log("Pointer Lock Status:", this.pointerLocked);
         if (!this.pointerLocked && Game.gameStarted && !GameSettings.settingsOpen) {
             // If lock is lost unexpectedly during gameplay, show settings/pause
             Game.showSettings();
         }
        // Reset accumulated mouse movement when lock state changes
         this.mouse.movementX = 0;
         this.mouse.movementY = 0;
         this.mouse.isMouseDown = false; // Reset mouse down state
    },

    onPointerLockError() {
        console.error('Pointer Lock Error.');
        alert("Could not lock pointer. Ensure the browser tab has focus and pointer lock is allowed.");
    }
};

// --- Environment ---
const Environment = {
    obstacles: [], // Store mesh and body pairs

    init() {
        console.log("Environment: Initializing...");
        this.obstacles = []; // Clear previous obstacles
        try {
            this.createFloor();
            this.createWalls();
            this.createObstacles(20);
            console.log("Environment: Init complete.");
            return true;
        } catch(e) {
            console.error("Environment Initialization Failed:", e);
            ModelData.loadError = "Failed to create environment. Check console.";
            return false;
        }
    },

    createFloor() {
         const floorSize = 100;
         const textureLoader = new THREE.TextureLoader();
         const gridTexture = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAQKADAAQAAAABAAAAQAAAAABGUUKwAAAA GklEQVR4Ae3SAQ0AAAgDILV/51lBqQck6ABAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgACAvgEPAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIECAAAECBAgQIHACDhAYAAIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECLgtgQABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIEPhfAe4ADLzFgtgAAAAASUVORK5CYII=', (texture) => {
             texture.wrapS = THREE.RepeatWrapping;
             texture.wrapT = THREE.RepeatWrapping;
             texture.repeat.set(floorSize / 4, floorSize / 4);
         });

         const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
         const floorMaterial = new THREE.MeshStandardMaterial({
             map: gridTexture,
             color: 0x778899, roughness: 0.8, metalness: 0.1
         });
         const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
         floorMesh.rotation.x = -Math.PI / 2;
         floorMesh.position.y = 0;
         floorMesh.receiveShadow = true;
         Graphics.scene.add(floorMesh);
    },

    createWalls() {
         console.log("Creating boundary walls...");
         const wallHeight = 10, wallThickness = 2, mapSize = 100, halfMap = mapSize / 2;
         const wallMaterial = new THREE.MeshStandardMaterial({
             color: 0xaaaaaa, roughness: 0.8, metalness: 0.2 }); // Single side is often enough

         const ewGeom = new THREE.BoxGeometry(mapSize + wallThickness, wallHeight, wallThickness);
         const nsGeom = new THREE.BoxGeometry(wallThickness, wallHeight, mapSize + wallThickness); // Extend N/S slightly

        const walls = [ // Position adjusted for thickness
            { geom: ewGeom, pos: new THREE.Vector3(0, wallHeight / 2, -halfMap - wallThickness / 2) }, // North
            { geom: ewGeom, pos: new THREE.Vector3(0, wallHeight / 2, halfMap + wallThickness / 2) },  // South
            { geom: nsGeom, pos: new THREE.Vector3(halfMap + wallThickness / 2, wallHeight / 2, 0) },  // East
            { geom: nsGeom, pos: new THREE.Vector3(-halfMap - wallThickness / 2, wallHeight / 2, 0) }  // West
        ];

         walls.forEach(wallData => {
             const wallMesh = new THREE.Mesh(wallData.geom, wallMaterial);
             wallMesh.position.copy(wallData.pos);
             wallMesh.castShadow = true;
             wallMesh.receiveShadow = true;
             Graphics.scene.add(wallMesh);

             this.addWallBody(
                 new CANNON.Vec3(wallData.pos.x, wallData.pos.y, wallData.pos.z),
                 // Use geometry parameters directly for half extents
                 new CANNON.Vec3(wallData.geom.parameters.width / 2, wallData.geom.parameters.height / 2, wallData.geom.parameters.depth / 2)
             );
         });
         console.log("Walls created.");
    },

     addWallBody(position, halfExtents) {
         const wallShape = new CANNON.Box(halfExtents);
         const wallBody = new CANNON.Body({
             mass: 0, position: position, shape: wallShape,
             material: Physics.groundMaterial // Use ground material for walls
         });
         Physics.world.addBody(wallBody);
     },

    createObstacles(count) {
        console.log(`Creating ${count} obstacles...`);
         const obstacleMaterial = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.1 });
         const minSize = 1.5, maxSize = 5.0, bounds = 45; // Keep away from walls

         for (let i = 0; i < count; i++) {
             const width = THREE.MathUtils.randFloat(minSize, maxSize);
             const height = THREE.MathUtils.randFloat(minSize, maxSize * 1.5);
             const depth = THREE.MathUtils.randFloat(minSize, maxSize);
             const geometry = new THREE.BoxGeometry(width, height, depth);
             const instanceMaterial = obstacleMaterial.clone();
             instanceMaterial.color.setHSL(Math.random(), 0.6, 0.5);

             const mesh = new THREE.Mesh(geometry, instanceMaterial);

             let position, isValid = false, attempts = 0;
             const minSpawnDistFromCenterSq = 25; // 5*5
             const minObstacleDistSq = (maxSize + 1)**2; // Min dist squared between obstacle centers

            while (!isValid && attempts < 30) { // Increased attempts
                position = new THREE.Vector3(
                     THREE.MathUtils.randFloatSpread(bounds * 2),
                     height / 2, // Base on the ground
                     THREE.MathUtils.randFloatSpread(bounds * 2)
                 );
                 attempts++;
                 // Check distance from center
                 if (position.x*position.x + position.z*position.z < minSpawnDistFromCenterSq) {
                     continue;
                 }
                 // Check distance from other obstacles
                 let tooClose = false;
                 for(const obs of this.obstacles) {
                    if (position.distanceToSquared(obs.mesh.position) < minObstacleDistSq) {
                        tooClose = true; break;
                    }
                 }
                 if (tooClose) continue;
                 isValid = true;
             }
             if (!isValid) { console.warn("Could not find valid position for obstacle", i); continue; }

             mesh.position.copy(position);
             mesh.rotation.y = Math.random() * Math.PI * 2;
             mesh.castShadow = true;
             mesh.receiveShadow = true;
             Graphics.scene.add(mesh);

             // Physics Body
             const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
             const body = new CANNON.Body({
                 mass: 0, // Static
                 position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
                 shape: shape,
                 material: Physics.groundMaterial
             });
             // Cannon.js quaternions are x, y, z, w; THREE.js are _x, _y, _z, _w
             body.quaternion.set(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w);
             Physics.world.addBody(body);

             this.obstacles.push({ mesh: mesh, body: body });
         }
         console.log(`${this.obstacles.length} obstacles created.`);
    }
};

// --- TargetManager ---
const TargetManager = {
    targets: [], targetModelTemplate: null, animations: null,
    targetCount: 15,
    respawnDelay: 4.0,
    isModelLoaded: false,
    loader: new THREE.GLTFLoader(),
    mixers: [], // Store animation mixers

    init() {
        console.log("TargetManager: Initializing...");
        this.targets = [];
        this.mixers = [];
        this.isModelLoaded = false;
        this.targetModelTemplate = null;
        this.animations = null;
    },

    loadAssets() {
        console.log("TargetManager: Loading assets (Character)...");
         return this.loadCharacterModel(ModelData.characterUrl);
    },

    loadCharacterModel(url) {
         return new Promise((resolve, reject) => {
            if (!url) { return reject(new Error("Missing character model URL")); }
            console.log("TargetManager: Loading character model...");

            // Ensure THREE.SkeletonUtils is available
             if (typeof THREE.SkeletonUtils === 'undefined') {
                return reject(new Error("TargetManager requires THREE.SkeletonUtils. Please include it."));
             }

            this.loader.load(url, (gltf) => {
                 console.log("TargetManager: Character model GLTF loaded.");
                this.targetModelTemplate = gltf.scene;
                this.animations = gltf.animations;

                let hasMesh = false;
                this.targetModelTemplate.traverse(child => { if (child.isMesh || child.isSkinnedMesh) hasMesh = true; });
                if (!hasMesh) {
                    console.warn("TargetManager: Loaded character model seems to have no mesh!");
                    // Maybe reject? Or allow proceeding but targets won't be visible/hittable.
                    // return reject(new Error("Character model has no mesh data."));
                }

                 this.targetModelTemplate.traverse((child) => {
                    if (child.isMesh || child.isSkinnedMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                 });

                 this.isModelLoaded = true;
                 console.log("TargetManager: Character model processed.");
                 resolve();
            },
            undefined,
            (error) => {
                console.error('TargetManager: Error loading character model:', error);
                let errorMsg = `Failed to load character model. Check console.`;
                if (error.message && error.message.includes('fetch')) errorMsg += ' Network error or invalid URL?';
                if (error.message && error.message.includes('JSON')) errorMsg += ' Invalid GLTF JSON structure?';
                if (error.message && error.message.includes('parse')) errorMsg += ' Error parsing model file.';
                this.isModelLoaded = false;
                reject(new Error(errorMsg));
            });
        });
    },

     createTargets(count) {
         if (!this.isModelLoaded || !this.targetModelTemplate) {
             console.error("TargetManager: Cannot create targets - model not loaded!");
             return;
         }
         console.log(`Creating ${count} target instances...`);
         this.targets = []; // Clear existing
         this.mixers = []; // Clear existing

         const bounds = 45;
         const minSpawnHeight = 0.5, maxSpawnHeight = 1.5; // Relative to ground

         for (let i = 0; i < count; i++) {
             let targetModelClone;
             try {
                // --- CRITICAL: Use SkeletonUtils.clone for rigged models ---
                targetModelClone = THREE.SkeletonUtils.clone(this.targetModelTemplate);
             } catch (cloneError) {
                console.error(`TargetManager: Error cloning model for target ${i}:`, cloneError);
                continue; // Skip this target if cloning fails
             }

             let targetMesh = null; // Find a mesh for raycasting later
             targetModelClone.traverse(child => {
                 if (!targetMesh && (child.isSkinnedMesh || child.isMesh)) {
                     targetMesh = child;
                 }
                 // Ensure shadows are on for all parts of the clone
                 if (child.isMesh || child.isSkinnedMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                 }
             });

             if (!targetMesh) {
                 console.warn(`TargetManager: Could not find a suitable mesh in the cloned model for target ${i}. Hit detection might fail.`);
                 // Use the group itself as a fallback? Might not work well.
                 targetMesh = targetModelClone;
             }

             // --- Optional: Adjust Scale ---
             // targetModelClone.scale.set(0.8, 0.8, 0.8);

             Graphics.scene.add(targetModelClone);

             // Animation Mixer
             let mixer = null;
             if (this.animations && this.animations.length > 0) {
                 mixer = new THREE.AnimationMixer(targetModelClone);
                 const idleClip = THREE.AnimationClip.findByName(this.animations, 'Idle') ||
                                  THREE.AnimationClip.findByName(this.animations, 'idle') ||
                                  this.animations.find(clip => clip.name.toLowerCase().includes('idle')) || // More lenient search
                                  this.animations[0]; // Fallback

                 if (idleClip) {
                     mixer.clipAction(idleClip).play();
                 } else {
                     console.warn(`TargetManager ${i}: Idle or fallback animation not found!`);
                 }
                 this.mixers.push(mixer);
             }

             // Position the target
             let validPos = false, attempts = 0, maxAttempts = 30;
             let position = new THREE.Vector3();
             while (!validPos && attempts < maxAttempts) {
                 position.set(
                     THREE.MathUtils.randFloatSpread(bounds * 2),
                     THREE.MathUtils.randFloat(minSpawnHeight, maxSpawnHeight),
                     THREE.MathUtils.randFloatSpread(bounds * 2)
                 );
                 validPos = this.isValidPosition(position);
                 attempts++;
             }
             if (!validPos) console.warn(`TargetManager ${i}: Could not find valid spawn position after ${maxAttempts} attempts. Spawning anyway.`);

            targetModelClone.position.copy(position);
            // Ensure base of model is near the ground (adjust Y based on model origin)
            // This requires knowing the model's bounding box or origin offset.
            // Example: targetModelClone.position.y = targetModelClone.position.y - modelBaseOffset;
             targetModelClone.rotation.y = Math.random() * Math.PI * 2;

             this.targets.push({
                 id: `target_${i}`, // Unique ID
                 model: targetModelClone, // The Object3D group
                 mesh: targetMesh,      // The specific mesh for coarse intersection tests (optional)
                 mixer: mixer,
                 active: true,
                 respawnTime: 0
             });
         }
         console.log(`${this.targets.length} targets created.`);
    },

     isValidPosition(position) {
         const checkRadiusSq = 2.25; // 1.5 * 1.5 (squared radius)
         // Check against environment obstacles
         for (const obs of Environment.obstacles) {
             const obsPos = obs.mesh.position;
             const dx = position.x - obsPos.x;
             const dz = position.z - obsPos.z;
             // Simplified check ignoring height, using bounding radius approx
             const obsRadius = (obs.mesh.geometry.parameters.width + obs.mesh.geometry.parameters.depth) / 4; // Avg radius
             const minDist = 1.5 + obsRadius; // Required distance between centers
             if (dx * dx + dz * dz < minDist * minDist) {
                 return false; // Too close
             }
         }
        // Check against other targets (prevent clumping)
        for (const target of this.targets) {
            if(target.active && target.model.position.distanceToSquared(position) < checkRadiusSq * 2) {
                return false;
            }
        }
         // Check distance from player start
         if (position.distanceToSquared(new THREE.Vector3(0, 1, 5)) < 100) return false; // Avoid spawn near start (dist < 10)

         return true;
     },

    update(delta) {
         const now = performance.now() / 1000.0;
         // Update animation mixers
         this.mixers.forEach(mixer => mixer.update(delta));

         // Check for respawns
         this.targets.forEach(target => {
             if (!target.active && target.respawnTime > 0 && now >= target.respawnTime) {
                 this.respawnTarget(target);
             }
         });
    },

    respawnTarget(target) {
         target.active = true;
         target.model.visible = true;
         target.respawnTime = 0;

         const bounds = 45;
         const minH = 0.5, maxH = 1.5;
         let validPos = false, attempts = 0, maxAttempts = 30;
         let position = new THREE.Vector3();
        while (!validPos && attempts < maxAttempts) {
             position.set(
                 THREE.MathUtils.randFloatSpread(bounds * 2),
                 THREE.MathUtils.randFloat(minH, maxH),
                 THREE.MathUtils.randFloatSpread(bounds * 2)
             );
             validPos = this.isValidPosition(position);
             attempts++;
         }
         if (!validPos) {
             console.warn(`TargetManager respawn ${target.id}: Could not find valid position. Reusing old or centering.`);
             position.set(0, 1, 0); // Fallback position
         }

         target.model.position.copy(position);
         target.model.rotation.y = Math.random() * Math.PI * 2;

         if (target.mixer) {
             target.mixer.stopAllAction();
             const idleClip = THREE.AnimationClip.findByName(this.animations || [], 'Idle') ||
                              THREE.AnimationClip.findByName(this.animations || [], 'idle') ||
                              (this.animations?.find(clip => clip.name.toLowerCase().includes('idle'))) ||
                              (this.animations?.[0]);
             if (idleClip) {
                 target.mixer.clipAction(idleClip).play();
             }
         }
         // console.log(`Target ${target.id} respawned.`);
    },

    checkHit(raycaster) {
         if (!Game.gameStarted || !this.isModelLoaded || this.targets.length === 0) { return false; }

         // Get list of *active* target models for intersection test
         const activeTargetModels = this.targets
             .filter(t => t.active && t.model)
             .map(t => t.model); // Intersect against the top-level group

         if (activeTargetModels.length === 0) { return false; }

         const intersects = raycaster.intersectObjects(activeTargetModels, true); // Recursive check is crucial

         if (intersects.length > 0) {
             // Find the FIRST intersected object belonging to an ACTIVE target
             for (const intersect of intersects) {
                 let hitObject = intersect.object;
                 let hitTarget = null;

                 // Traverse up the hierarchy to find the main model group associated with a target entry
                 while (hitObject && hitObject !== Graphics.scene) {
                     hitTarget = this.targets.find(t => t.model === hitObject && t.active); // Check if active here
                     if (hitTarget) break; // Found the active target
                     hitObject = hitObject.parent;
                 }

                 // If we found a valid, active target associated with this intersection
                 if (hitTarget) {
                     console.log(`Hit Target ${hitTarget.id}`);
                     hitTarget.active = false;
                     hitTarget.model.visible = false; // Hide
                     hitTarget.respawnTime = performance.now() / 1000.0 + this.respawnDelay;

                     if (hitTarget.mixer) {
                         hitTarget.mixer.stopAllAction();
                         // Optional: Play death animation
                     }

                     Game.addScore(10);
                     Graphics.showHitMarker();
                     AudioManager.play('hit');
                     return true; // Indicate a successful hit and stop checking further intersects
                 }
             }
         }
         return false; // No hit on an active target
     },

     resetAllTargets() {
        console.log("Resetting all targets...");
         this.targets.forEach(target => {
             if (target.model) { // Ensure model exists before respawning
                this.respawnTarget(target); // Respawn finds new position etc.
                target.active = true;      // Ensure active flag is set
                target.respawnTime = 0;    // Clear pending respawn
                target.model.visible = true; // Ensure visible
             }
         });
     }
};

// --- Game ---
const Game = {
    gameInitialized: false,
    gameStarted: false,
    score: 0,
    ammo: 30, maxAmmo: 30,
    timeLeft: 60, timeLimit: 60,
    health: 100, maxHealth: 100,
    playerVelocity: new THREE.Vector3(),
    // --- TUNING AREA for Movement ---
    playerMoveSpeed: 7.0, // Base speed
    playerSprintMultiplier: 1.5, // Sprint multiplier (implement sprint key if desired)
    playerJumpForce: 7.5, // Jump impulse strength
    // --- End Tuning Area ---
    playerDirection: new THREE.Vector3(),
     cameraTargetRotation: { x: 0, y: 0 },
     cameraCurrentRotation: { x: 0, y: 0 },
     lookSmoothingFactor: 0.1, // Lower = smoother, more delay. Higher = snappier
    timerInterval: null,
    isReloading: false, reloadTime: 1.5, // seconds
    lastShootTime: 0, fireRate: 0.12, // seconds (approx 8 shots/sec)
    lastPhysicsUpdateTime: 0,
    animationFrameId: null, // Store requestAnimationFrame ID

    sendGameState(state) { /* ... (no changes needed here) ... */ },

    initUploadScreen() {
         console.log("Game: Setting up upload screen...");
         ModelData.reset(); // Clean state

         // Ensure listeners are added only once or removed first
         const gunInput = document.getElementById('gunInput');
         const charInput = document.getElementById('charInput');
         const startButton = document.getElementById('startFromUploadButton');
         const restartButton = document.getElementById('restartButton');
         const mainMenuButton = document.getElementById('mainMenuButton');

         // Simple way to avoid duplicates: replace node or use flags (here just re-adding)
         if (gunInput) gunInput.onchange = (e) => this.handleFileUpload(e, 'gun');
         if (charInput) charInput.onchange = (e) => this.handleFileUpload(e, 'character');
         if (startButton) startButton.onclick = () => this.initGameCoreAndStart();
         if (restartButton) restartButton.onclick = () => this.startGame(); // Restart now directly calls startGame
         if (mainMenuButton) mainMenuButton.onclick = () => this.goToUploadScreen();

         GameSettings.loadSettings(); // Load settings early
         GameSettings.addSettingsListeners(); // Add listeners for settings UI

         // Show/Hide Screens
         document.getElementById('uploadScreen').style.display = 'flex';
         document.getElementById('gameContainer').style.display = 'none';
         document.getElementById('settingsScreen').style.display = 'none';
         document.getElementById('gameOverScreen').style.display = 'none';
         document.getElementById('gameUI').style.display = 'none'; // Hide game UI on upload screen

         this.sendGameState('upload');
    },

     handleFileUpload(event, type) {
         const file = event.target.files[0];
         const inputElement = event.target;
         const labelElement = document.getElementById(type === 'gun' ? 'gunFileLabel' : 'charFileLabel');
         const startButton = document.getElementById('startFromUploadButton');
         const errorLog = document.getElementById('uploadErrorLog');

         errorLog.textContent = '';
         ModelData.loadError = null;

         if (!file) {
             ModelData.updateFileUI(type, 'Pending', 'pending');
             ModelData[type + 'Loaded'] = false;
             if(labelElement) labelElement.textContent = type === 'gun' ? 'Select Gun Model' : 'Select Character Model';
             if(startButton) startButton.disabled = true;
             return;
         }

         const fileSizeMB = file.size / 1024 / 1024;
         if(labelElement) labelElement.textContent = file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name;

         if (!file.name.match(/\.(glb|gltf)$/i)) {
             ModelData.updateFileUI(type, 'Invalid Format!', 'error');
             ModelData[type + 'Loaded'] = false;
             ModelData.loadError = `Invalid format: ${file.name}. Use .glb or .gltf`;
             if(errorLog) errorLog.textContent = ModelData.loadError;
             if(startButton) startButton.disabled = true;
             inputElement.value = ''; // Clear invalid selection
             return;
         }
         if (fileSizeMB > MAX_FILE_SIZE_MB) {
            ModelData.updateFileUI(type, 'File Too Large!', 'error');
            ModelData[type + 'Loaded'] = false;
            ModelData.loadError = `File > ${MAX_FILE_SIZE_MB}MB: ${file.name} (${fileSizeMB.toFixed(1)} MB)`;
            if(errorLog) errorLog.textContent = ModelData.loadError;
            if(startButton) startButton.disabled = true;
            inputElement.value = '';
            return;
         }

         ModelData.updateFileUI(type, 'Processing...', 'loading');
         if(startButton) startButton.disabled = true;
         ModelData.pendingFiles++;

         const reader = new FileReader();
         reader.onload = (e) => {
             try {
                 if (type === 'gun' && ModelData.gunUrl) URL.revokeObjectURL(ModelData.gunUrl);
                 if (type === 'character' && ModelData.characterUrl) URL.revokeObjectURL(ModelData.characterUrl);

                 const blob = new Blob([e.target.result], { type: file.type || 'model/gltf-binary' });
                 const url = URL.createObjectURL(blob);

                 if (type === 'gun') {
                     ModelData.gunUrl = url; ModelData.gunFile = file; ModelData.gunLoaded = true;
                     ModelData.updateFileUI(type, `✓ (${fileSizeMB.toFixed(1)} MB)`, 'loaded');
                 } else {
                     ModelData.characterUrl = url; ModelData.characterFile = file; ModelData.characterLoaded = true;
                     ModelData.updateFileUI(type, `✓ (${fileSizeMB.toFixed(1)} MB)`, 'loaded');
                 }
                 console.log(`${type} file processed: ${file.name}`);

             } catch (err) {
                 console.error(`Error creating object URL for ${type}:`, err);
                 ModelData.updateFileUI(type, 'Process Error!', 'error');
                 ModelData[type + 'Loaded'] = false;
                 ModelData.loadError = `Error processing file data for ${file.name}.`;
                 if(errorLog) errorLog.textContent = ModelData.loadError;
                 inputElement.value = '';
             } finally {
                ModelData.pendingFiles--;
                 if (ModelData.pendingFiles === 0) {
                    if (ModelData.isReady()) {
                       if(startButton) startButton.disabled = false;
                       if(errorLog) errorLog.textContent = '';
                    } else if (!ModelData.loadError) {
                       if(startButton) startButton.disabled = true;
                       // Optionally provide a message like "Waiting for other file..."
                    } else {
                        if(startButton) startButton.disabled = true; // Keep disabled if there was an error
                    }
                 }
             }
         };
         reader.onerror = (e) => {
             console.error(`FileReader error for ${type}:`, reader.error);
             ModelData.updateFileUI(type, 'Read Error!', 'error');
             ModelData[type + 'Loaded'] = false;
             ModelData.loadError = `Error reading file: ${file.name}.`;
             if(errorLog) errorLog.textContent = ModelData.loadError;
             if(startButton) startButton.disabled = true;
             inputElement.value = '';
             ModelData.pendingFiles--;
         };
         reader.readAsArrayBuffer(file);
    },

    async initGameCoreAndStart() {
         if (this.gameStarted) { console.warn("Game already started."); return; }
         if (!ModelData.isReady()) {
             console.error("Start attempt failed: Models not ready or have errors.");
             const errorLog = document.getElementById('uploadErrorLog');
             if(errorLog) errorLog.textContent = ModelData.loadError || 'Please upload both required models correctly.';
             return;
         }

         console.log("Game: Initializing core modules...");
         const errorLog = document.getElementById('uploadErrorLog');
         const startButton = document.getElementById('startFromUploadButton');
         if(errorLog) errorLog.textContent = 'Initializing game, please wait...';
         if(startButton) startButton.disabled = true;

         // --- Reset Game State Variables ---
         this.gameInitialized = false; this.gameStarted = false; this.score = 0;
         this.ammo = this.maxAmmo; this.health = this.maxHealth; this.timeLeft = this.timeLimit;
         if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null;
         if (this.timerInterval) clearInterval(this.timerInterval); this.timerInterval = null;
         this.isReloading = false; this.lastShootTime = 0;

         try {
             // --- Core Initializations (Order matters!) ---
            if (!Graphics.init()) throw new Error("Graphics initialization failed.");
            if (!Physics.init()) throw new Error("Physics initialization failed.");
            if (!Environment.init()) throw new Error("Environment initialization failed.");
             TargetManager.init(); // Basic setup, resets target list
             if (!AudioManager.init()) console.warn("AudioManager initialization failed (continuing without audio).");
             else AudioManager.resumeContext(); // Try resuming context now
            if (!InputManager.init()) throw new Error("InputManager initialization failed.");
             // Settings already loaded/listeners added by initUploadScreen

             // --- Load 3D Assets ---
             if(errorLog) errorLog.textContent = 'Loading 3D models...';
             console.log("Loading 3D assets (Gun and Character)...");
             await Promise.all([
                 Graphics.loadAssets(),
                 TargetManager.loadAssets()
             ]).catch(err => {
                 throw new Error(`Failed to load 3D models: ${err.message}`); // Propagate asset loading errors
             });
             console.log("3D assets loaded successfully.");
             if(errorLog) errorLog.textContent = 'Setting up scene...';

             // --- Final Scene Setup ---
             Graphics.setupLights();
             TargetManager.createTargets(TargetManager.targetCount); // Create target instances AFTER model is loaded

             this.gameInitialized = true;
             console.log("Game core initialization complete.");
             if(errorLog) errorLog.textContent = '';

             // --- Transition to Game ---
             document.getElementById('uploadScreen').style.display = 'none';
             document.getElementById('gameContainer').style.display = 'block'; // Show game area
             document.getElementById('gameUI').style.display = 'block';    // Show game UI

             this.startGame(); // Start the actual game logic/loop

         } catch (error) {
             console.error("!#!#!#! FATAL ERROR during game core initialization !#!#!#!");
             console.error(error);
             console.error("!#!#!#! END FATAL ERROR !#!#!#!");
             if(errorLog) errorLog.textContent = `ERROR: ${error.message || 'Unknown Setup Error'}. Check console.`;
             if(startButton) startButton.disabled = false; // Re-enable button to allow retry
             this.gameInitialized = false;
             // Ensure game container/UI is hidden if init failed midway
             document.getElementById('gameContainer').style.display = 'none';
             document.getElementById('gameUI').style.display = 'none';
             document.getElementById('uploadScreen').style.display = 'flex';
         }
     },

     startGame() {
         console.log("Attempting game start...");
         if (this.gameStarted) { console.warn("Game already running."); return; }
         if (!this.gameInitialized) { console.error("Cannot start game: Core not initialized."); return; }

         this.gameStarted = true;
         this.lastPhysicsUpdateTime = performance.now();

         this.resetGame(); // Reset scores, player pos, targets, UI etc.

         // --- Screen Management ---
         document.getElementById('uploadScreen').style.display = 'none';
         document.getElementById('gameOverScreen').style.display = 'none';
         document.getElementById('settingsScreen').style.display = 'none';
         document.getElementById('gameContainer').style.display = 'block';
         document.getElementById('gameUI').style.display = 'block';
         document.getElementById('crosshair').style.display = 'block';
         document.getElementById('healthFill').parentElement.style.display = 'block';
         const mobileControls = document.getElementById('mobileControls');
         if(mobileControls) mobileControls.style.display = InputManager.isMobile ? 'flex' : 'none';

         this.startTimer();
         AudioManager.resumeContext();
         AudioManager.playMusic();

         // Request pointer lock for desktop immediately
         if (!InputManager.isMobile && Graphics.renderer?.domElement) {
             setTimeout(() => { // Short delay can help ensure focus
                 Graphics.renderer.domElement.requestPointerLock();
             }, 100);
         }

         GameSettings.settingsOpen = false;
         this.sendGameState('playing');
         console.log("Starting animation loop.");
         if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); // Cancel previous loop just in case
         this.animate(); // Start the main game loop
     },

     resetGame() {
         if (!this.gameInitialized) return;
         console.log("Resetting game state...");
         this.score = 0;
         this.ammo = this.maxAmmo;
         this.timeLeft = this.timeLimit;
         this.health = this.maxHealth;
         this.isReloading = false;
         this.lastShootTime = 0;
         this.cameraTargetRotation = { x: 0, y: 0 };
         this.cameraCurrentRotation = { x: 0, y: 0 };

         // Reset Player Physics and Camera
         if (Physics.playerBody) {
             Physics.playerBody.position.set(0, 1.6, 5); // Reset start position
             Physics.playerBody.velocity.set(0, 0, 0);
             Physics.playerBody.angularVelocity.set(0, 0, 0);
             Physics.playerBody.wakeUp(); // Ensure body is active
         }
         if (Graphics.camera) {
             Graphics.camera.rotation.set(0, 0, 0); // Reset camera rotation directly
             Graphics.camera.position.set(0, 1.6, 5); // Sync camera position initially
         }

         TargetManager.resetAllTargets();

         InputManager.keys = { moveForward: false, moveBackward: false, moveLeft: false, moveRight: false, jump: false, reload: false };
         InputManager.mouse = { movementX: 0, movementY: 0, isMouseDown: false };
         InputManager.touch.lookDelta = { x: 0, y: 0 }; // Reset look delta
         if (InputManager.isMobile) InputManager.resetJoystick();

         this.updateUI(); // Update UI elements
         console.log("Game state reset.");
     },

     startTimer() {
         if (this.timerInterval) { clearInterval(this.timerInterval); }
         console.log("Timer started.");
         this.timeLeft = this.timeLimit;
         const timerElement = document.getElementById('timer');
         if(timerElement) timerElement.textContent = this.timeLeft;

         this.timerInterval = setInterval(() => {
             if (!this.gameStarted || GameSettings.settingsOpen) { return; } // Pause timer logic
             this.timeLeft--;
             if(timerElement) timerElement.textContent = this.timeLeft;
             if (this.timeLeft <= 0) {
                 clearInterval(this.timerInterval);
                 this.timerInterval = null;
                 this.gameOver('Time Expired!');
             }
         }, 1000);
     },

     gameOver(reason = "Game Over") {
         console.log(`Game Over: ${reason}`);
         if (!this.gameStarted) { return; }
         this.gameStarted = false;
         if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; } // Stop game loop
         AudioManager.pauseMusic();
         if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }

         if (document.pointerLockElement === Graphics.renderer?.domElement) {
             document.exitPointerLock();
         }

         // Hide Game UI, Show Game Over Screen
         document.getElementById('gameUI').style.display = 'none';
         document.getElementById('crosshair').style.display = 'none';
         document.getElementById('healthFill').parentElement.style.display = 'none';
         const mobileControls = document.getElementById('mobileControls');
         if(mobileControls) mobileControls.style.display = 'none';

         const finalScoreEl = document.getElementById('finalScore');
         if(finalScoreEl) finalScoreEl.textContent = this.score;
         document.getElementById('gameOverScreen').style.display = 'flex';

         this.sendGameState('gameOver');
     },

     // Shoot logic now checks InputManager.mouse.isMouseDown for continuous fire
     handleShooting() {
         if (!this.gameStarted || this.isReloading || this.ammo <= 0 || GameSettings.settingsOpen) {
             if (this.ammo <= 0 && !this.isReloading && this.gameStarted && !GameSettings.settingsOpen && InputManager.mouse.isMouseDown) {
                 const now = performance.now();
                 if (now - this.lastShootTime > 500) { // Debounce empty sound
                     AudioManager.play('emptyGun');
                     this.lastShootTime = now;
                 }
             }
             return; // Don't shoot
         }

         // Check if mouse/touch is held down
         if (InputManager.mouse.isMouseDown) {
             const now = performance.now();
             if (now - this.lastShootTime >= this.fireRate * 1000) { // Check fire rate
                 this.lastShootTime = now;
                 this.ammo--;
                 const ammoElement = document.getElementById('ammo');
                 if(ammoElement) ammoElement.textContent = this.ammo; // Update UI

                 Graphics.createGunFlash();
                 AudioManager.play('shoot');

                 // Raycasting
                 const raycaster = new THREE.Raycaster();
                 if (Graphics.camera) {
                     raycaster.setFromCamera(new THREE.Vector2(0, 0), Graphics.camera);
                     TargetManager.checkHit(raycaster);
                 }
             }
         }
     },

     reload() {
         if (!this.gameStarted || this.isReloading || this.ammo >= this.maxAmmo || GameSettings.settingsOpen) {
             return;
         }
         console.log("Reloading...");
         this.isReloading = true;
         AudioManager.play('reload');

         // UI indication for reloading (optional)
         // document.getElementById('ammo').style.color = 'orange';

         setTimeout(() => {
             this.ammo = this.maxAmmo;
             this.isReloading = false;
             if(this.gameStarted) { // Update UI only if game still running
                const ammoElement = document.getElementById('ammo');
                if(ammoElement) {
                    ammoElement.textContent = this.ammo;
                    // ammoElement.style.color = ''; // Reset color
                }
             }
             console.log("Reload complete.");
         }, this.reloadTime * 1000);
     },

     addScore(points) {
         if (!this.gameStarted) return;
         this.score += points;
         const scoreElement = document.getElementById('score');
         if(scoreElement) scoreElement.textContent = this.score;
     },

     takeDamage(amount) { /* ... (no changes needed here) ... */ },

    updateUI() {
         // Updates score, ammo, timer, health based on current Game state
         try {
             const scoreEl = document.getElementById('score');
             const ammoEl = document.getElementById('ammo');
             const maxAmmoEl = document.getElementById('maxAmmo');
             const timerEl = document.getElementById('timer');

             if (scoreEl) scoreEl.textContent = this.score;
             if (ammoEl) ammoEl.textContent = this.ammo;
             if (maxAmmoEl) maxAmmoEl.textContent = this.maxAmmo;
             if (timerEl) timerEl.textContent = this.timeLeft;
             this.updateHealthUI();
         } catch (e) {
            console.warn("Minor error updating UI:", e);
         }
     },
    updateHealthUI() { /* ... (no changes needed here) ... */ },

     updatePlayerLook(delta) {
        if (!Graphics.camera || GameSettings.settingsOpen) return;

        let lookX = 0;
        let lookY = 0;

        if (InputManager.isMobile) {
            const mobileSensitivityFactor = 1.5; // Adjust mobile sensitivity multiplier
             lookX = -InputManager.touch.lookDelta.x * InputManager.sensitivity * mobileSensitivityFactor;
             lookY = -InputManager.touch.lookDelta.y * InputManager.sensitivity * mobileSensitivityFactor;
             InputManager.touch.lookDelta = { x: 0, y: 0 }; // Consume delta
        } else {
             lookX = -InputManager.mouse.movementX * InputManager.sensitivity;
             lookY = -InputManager.mouse.movementY * InputManager.sensitivity;
            InputManager.mouse.movementX = 0; // Consume delta
            InputManager.mouse.movementY = 0;
        }

         // Update target rotation (directly apply delta)
         this.cameraTargetRotation.y += lookX;
         this.cameraTargetRotation.x += lookY;

         const maxPitch = Math.PI / 2 - 0.05; // Clamp pitch slightly less than 90 deg
         this.cameraTargetRotation.x = Math.max(-maxPitch, Math.min(maxPitch, this.cameraTargetRotation.x));

         // Smooth rotation using Lerp
         this.cameraCurrentRotation.x = THREE.MathUtils.lerp(this.cameraCurrentRotation.x, this.cameraTargetRotation.x, this.lookSmoothingFactor);
         this.cameraCurrentRotation.y = THREE.MathUtils.lerp(this.cameraCurrentRotation.y, this.cameraTargetRotation.y, this.lookSmoothingFactor);

         // Apply smoothed rotation
         Graphics.camera.rotation.x = this.cameraCurrentRotation.x;
         Graphics.camera.rotation.y = this.cameraCurrentRotation.y;
         Graphics.camera.rotation.order = 'YXZ'; // Ensure correct rotation order for FPS
     },

     updatePlayerMovement(delta) {
        if (!Physics.playerBody || !Graphics.camera || GameSettings.settingsOpen) return;

         this.playerDirection.z = Number(InputManager.keys.moveForward) - Number(InputManager.keys.moveBackward);
         this.playerDirection.x = Number(InputManager.keys.moveRight) - Number(InputManager.keys.moveLeft);
         this.playerDirection.normalize(); // Ensure consistent speed

         // Get camera direction projected onto the ground plane
         const cameraForward = new THREE.Vector3();
         Graphics.camera.getWorldDirection(cameraForward);
         cameraForward.y = 0;
         cameraForward.normalize();

         const cameraRight = new THREE.Vector3();
         cameraRight.crossVectors(new THREE.Vector3(0, 1, 0), cameraForward).normalize(); // Use world UP

         // Calculate world-space movement direction based on input and camera orientation
         const moveDirection = new THREE.Vector3();
         moveDirection.addScaledVector(cameraForward, this.playerDirection.z);
         moveDirection.addScaledVector(cameraRight, this.playerDirection.x);
         moveDirection.normalize(); // Normalize the final move direction

         const currentSpeed = this.playerMoveSpeed; // Add sprinting check later if needed
         const targetVelocityXZ = new CANNON.Vec3(
             moveDirection.x * currentSpeed,
             0, // We handle Y velocity separately (gravity/jump)
             moveDirection.z * currentSpeed
         );

         // Apply XZ velocity directly - relies on linearDamping for stopping
         Physics.playerBody.velocity.x = targetVelocityXZ.x;
         Physics.playerBody.velocity.z = targetVelocityXZ.z;

         // --- Jumping ---
         const isOnGround = Physics.isPlayerOnGround();
         if (InputManager.keys.jump && isOnGround) {
             Physics.playerBody.velocity.y = this.playerJumpForce; // Apply upward velocity impulse
             AudioManager.play('jump');
             InputManager.keys.jump = false; // Consume the jump input immediately
         }
         // Prevent holding jump to multi-jump (already handled by consuming input)
         if (!isOnGround) {
            InputManager.keys.jump = false; // Ensure jump key is false if airborne
         }
     },

    showSettings() {
         if (GameSettings.settingsOpen) return;
         console.log("Opening settings...");
         this.sendGameState('settings');
         GameSettings.settingsOpen = true;

         if (document.pointerLockElement === Graphics.renderer?.domElement) {
             document.exitPointerLock();
         }
         // Timer automatically pauses in its own logic based on GameSettings.settingsOpen

         GameSettings.loadSettings(); // Load current settings into UI
         document.getElementById('settingsScreen').style.display = 'flex';

         // Hide game UI
         document.getElementById('gameUI').style.display = 'none';
         document.getElementById('crosshair').style.display = 'none';
         document.getElementById('healthFill').parentElement.style.display = 'none';
         const mobileControls = document.getElementById('mobileControls');
         if(mobileControls) mobileControls.style.display = 'none';
     },

    closeSettings(saveChanges) {
        if (!GameSettings.settingsOpen) return;
        console.log(`Closing settings (Save: ${saveChanges})...`);

         if (saveChanges) {
             GameSettings.saveSettings();
         } else {
             GameSettings.loadSettings(); // Reload previous settings to discard UI changes
         }

         GameSettings.settingsOpen = false;
         document.getElementById('settingsScreen').style.display = 'none';

         // Restore game UI only if game was actually running
         if (this.gameStarted) {
             document.getElementById('gameUI').style.display = 'block';
             document.getElementById('crosshair').style.display = 'block';
             document.getElementById('healthFill').parentElement.style.display = 'block';
             const mobileControls = document.getElementById('mobileControls');
             if(mobileControls) mobileControls.style.display = InputManager.isMobile ? 'flex' : 'none';

             // Re-acquire pointer lock for desktop
             if (!InputManager.isMobile && Graphics.renderer?.domElement) {
                 setTimeout(() => { // Delay slightly
                     Graphics.renderer.domElement.requestPointerLock();
                 }, 100);
             }
             this.sendGameState('playing');
         } else {
            // If game wasn't running (e.g., paused on upload screen), maybe go back there?
             this.goToUploadScreen(); // Or just leave settings closed
         }
     },

     goToUploadScreen() {
        console.log("Returning to Upload Screen...");
        this.gameStarted = false;
        this.gameInitialized = false; // Mark as uninitialized

         if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null;
         if (this.timerInterval) clearInterval(this.timerInterval); this.timerInterval = null;
         AudioManager.pauseMusic();
         if (document.pointerLockElement) document.exitPointerLock();

         // --- Cleanup THREE.js Scene (IMPORTANT for preventing memory leaks on restart) ---
         if (Graphics.scene) {
            while(Graphics.scene.children.length > 0){
                const obj = Graphics.scene.children[0];
                Graphics.scene.remove(obj);
                // Optional: Dispose geometry/material if needed
                if(obj.geometry) obj.geometry.dispose();
                if(obj.material) {
                    if (Array.isArray(obj.material)) {
                         obj.material.forEach(material => material.dispose());
                    } else {
                         obj.material.dispose();
                    }
                }
            }
         }
         // Remove gun model from camera
         if (Graphics.gunModel && Graphics.camera) Graphics.camera.remove(Graphics.gunModel);
         Graphics.gunModel = null;
         TargetManager.targets = []; // Clear target list explicitly
         TargetManager.mixers = [];
         Environment.obstacles = []; // Clear obstacles
         // Physics world is re-created in Physics.init

         // Show/Hide Screens
         document.getElementById('gameContainer').style.display = 'none';
         document.getElementById('gameOverScreen').style.display = 'none';
         document.getElementById('settingsScreen').style.display = 'none';
         document.getElementById('uploadScreen').style.display = 'flex';

         ModelData.reset(); // Reset file data and upload UI
         this.sendGameState('upload');
     },

     animate() {
         if (!this.gameStarted) {
             console.log("Animation loop stopped.");
             return;
         }
         this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

         const currentTime = performance.now();
         // Use clock delta for smooth animations/updates, but fixed step for physics
         const delta = Graphics.clock.getDelta(); // THREE.Clock delta

         // --- Update Order ---
         // 1. Handle Input -> Update Look Rotation (directly affects camera)
         this.updatePlayerLook(delta);

         // 2. Calculate Movement Intent -> Apply forces/velocity to Physics Body
         this.updatePlayerMovement(delta);

         // 3. Step the Physics World (using fixed timestep)
         Physics.update(currentTime); // Pass current time for physics internal dt calculation

         // 4. Handle Shooting (based on input state)
         this.handleShooting();

         // 5. Update Game Logic (Targets, Timers etc.)
         TargetManager.update(delta); // Update target animations/respawns

         // 6. Sync Graphics -> Physics (Camera position matches physics body)
         if (Graphics.camera && Physics.playerBody) {
             Graphics.camera.position.copy(Physics.playerBody.position);
             // Optional Y offset if physics body center isn't eye level
             // Graphics.camera.position.y += 0.2;
         }

         // 7. Render Scene
         if (Graphics.renderer && Graphics.scene && Graphics.camera) {
            Graphics.renderer.render(Graphics.scene, Graphics.camera);
         }
     }
};

// --- Global Listeners & Initial Setup ---
window.addEventListener('message', (event) => { /* ... (no changes needed here) ... */ });

window.addEventListener('load', () => {
     console.log("Window loaded. Initializing FPS Game V2.");
     // Check for WebGL support early
     if (!window.WebGLRenderingContext) {
        alert("Error: Your browser does not support WebGL, which is required for this game.");
        return;
     }
     Game.initUploadScreen(); // Start with upload screen
});

window.addEventListener('contextmenu', (e) => {
    // Prevent context menu only if game container is active and pointer isn't locked
    const gameContainer = document.getElementById('gameContainer');
    if(gameContainer && gameContainer.style.display !== 'none' && !document.pointerLockElement) {
         e.preventDefault();
     }
});
