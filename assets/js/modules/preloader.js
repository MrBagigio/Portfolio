// assets/js/modules/preloader.js

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// assets/js/modules/preloader.js



class PreloaderExperience {
    constructor(loadingManager, terminalCursor, resolvePromise, cursorName) {
        this.loadingManager = loadingManager;
        this.terminalCursor = terminalCursor;
        this.resolvePromise = resolvePromise;
        this.cursorName = cursorName;

        this.preloaderElement = document.getElementById('preloader');
        this.sceneContainer = document.getElementById('preloader-3d-scene');
        this.hoverSound = document.getElementById('preloader-hover-sound');
        this.clickSound = document.getElementById('preloader-click-sound');
        this.shutdownSound = document.getElementById('preloader-shutdown-sound');
        
        this.isTutorialVisible = false;
        this.isHoveringInteractiveMesh = false;
        this.currentHoverTarget = null;
        this.isInteractionAllowed = false;
        this.isBootAnimationStarted = false;
        this.easterEggActive = false;
        this.glitchesActive = true;
        this.raveMode = false;
        this.raveTween = null;
        this.userInput = "";
        this.isTyping = false;
        
        this.activeColor = new THREE.Color(0x39ff14);
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.composer = new EffectComposer(this.renderer);
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouseVec = new THREE.Vector2();

    // WebGL context guard
    this.contextLost = false;
    this.boundOnContextLost = this.onContextLost.bind(this);
    this.boundOnContextRestored = this.onContextRestored.bind(this);
        
        this.sceneGroup = new THREE.Group();
        this.tutorialGroup = new THREE.Group();
        this.allMeshes = [];
        this.bootLineMeshes = [];
        this.tutorialLineMeshes = [];

        this.fontAlien = null; 
        this.fontVT323 = null;
        this.fontShareTech = null;

        this.boundOnMouseMove = this.onMouseMove.bind(this);
        this.boundOnWindowResize = this.onWindowResize.bind(this);
        this.boundOnPreloaderClick = this.onPreloaderClick.bind(this);
        this.boundHandleSystemCommands = this.handleSystemCommands.bind(this);

        this.bootTimeout = null;
        this.animationFrameId = null;
        this.currentHoverGlitchTarget = null;
    }

    async init() {
        if (!this.sceneContainer) {
            console.error("Elemento '#preloader-3d-scene' non trovato.");
            this.resolvePromise();
            return;
        }
        
        this.camera.position.z = 15;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.sceneContainer.appendChild(this.renderer.domElement);

        // Attach webgl context loss/restored handlers to the canvas
        // attach context guards using helper to centralize behavior (lazy import)
        try {
            const mod = await import('../core/webglUtils.js');
            this._removeContextGuards = mod.attachContextGuards(this.renderer, { onLost: this.boundOnContextLost, onRestored: this.boundOnContextRestored });
        } catch (e) {}
        
        this.scene.add(this.sceneGroup);
        this.tutorialGroup.visible = false;
        this.scene.add(this.tutorialGroup);

        try {
            this.startBootProcess();
            await this.loadFonts();
            
            this.createMeshes();
            this.setupPostProcessing();
            this.addEventListeners();
            this.onWindowResize();
            this.animate();
        } catch (error) {
            console.error("Errore critico durante l'inizializzazione del preloader:", error);
            this.resolvePromise();
        }
    }
    
    async loadFonts() { const fontLoader = new FontLoader(this.loadingManager); [this.fontAlien, this.fontVT323, this.fontShareTech] = await Promise.all([ fontLoader.loadAsync('assets/fonts/Orbitron.json'), fontLoader.loadAsync('assets/fonts/VT323_Regular.json'), fontLoader.loadAsync('assets/fonts/Share_Tech_Mono_Regular.json') ]); }

    createMeshes() {
        const createTextMaterial = (opacity = 0) => new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 1.5, transparent: true, opacity: opacity });
        const createHitbox = (mesh, padding = 0.4) => { mesh.geometry.computeBoundingBox(); const box = mesh.geometry.boundingBox; const size = new THREE.Vector3(); box.getSize(size); const geometry = new THREE.BoxGeometry(size.x + padding * 2, size.y + padding * 2, size.z + 0.2); const material = new THREE.MeshBasicMaterial({ visible: false }); const hitbox = new THREE.Mesh(geometry, material); hitbox.position.copy(mesh.position); this.allMeshes.push(hitbox); return hitbox; };
        let currentY = 0;
        const titleGeometry = new TextGeometry('A.P.I.S. TERMINAL', { font: this.fontAlien, size: 1.5, height: 0.05 }); titleGeometry.center(); this.titleMesh = new THREE.Mesh(titleGeometry, createTextMaterial()); this.sceneGroup.add(this.titleMesh); this.allMeshes.push(this.titleMesh); currentY -= 1.5;
        const subtitleGeometry = new TextGeometry('Alessandro Portfolio Interactive System', { font: this.fontShareTech, size: 0.5, height: 0.02 }); subtitleGeometry.center(); this.subtitleMesh = new THREE.Mesh(subtitleGeometry, createTextMaterial()); this.subtitleMesh.position.y = currentY; this.sceneGroup.add(this.subtitleMesh); this.allMeshes.push(this.subtitleMesh); currentY -= 1.5;
        const allBootPhrases = [ "Ottimizzando il caffè", "Esportazione pazienza in .fbx", "Rendering dello stress", "Compilando shader emotivi" ]; const selectedPhrases = allBootPhrases.sort(() => 0.5 - Math.random()).slice(0, 3);
        selectedPhrases.forEach((phrase) => { currentY -= 0.8; const isError = Math.random() < 0.3; const phraseText = `> ${phrase}...`; const phraseGeo = new TextGeometry(phraseText, { font: this.fontShareTech, size: 0.4, height: 0.02 }); phraseGeo.computeBoundingBox(); const phraseWidth = phraseGeo.boundingBox.max.x - phraseGeo.boundingBox.min.x; const phraseMesh = new THREE.Mesh(phraseGeo, createTextMaterial()); const statusMesh = new THREE.Mesh(new THREE.BufferGeometry(), createTextMaterial()); const lineGroup = new THREE.Group(); lineGroup.add(phraseMesh); lineGroup.add(statusMesh); statusMesh.position.x = phraseWidth + 0.3; lineGroup.position.x = -8; lineGroup.position.y = currentY; this.bootLineMeshes.push({ phrase: phraseMesh, status: statusMesh, lineGroup: lineGroup, text: phraseText, isError: isError }); this.sceneGroup.add(lineGroup); this.allMeshes.push(phraseMesh, statusMesh); });
        currentY -= 0.8;
        const finalLineBaseText = "> SYSTEM CHECK COMPLETE. AWAITING INPUT "; const finalLineGeo = new TextGeometry(finalLineBaseText, { font: this.fontShareTech, size: 0.4, height: 0.02 }); this.finalLineMesh = new THREE.Mesh(finalLineGeo, createTextMaterial()); this.finalLineMesh.position.x = -8; this.finalLineMesh.position.y = currentY; this.finalLineMesh.userData.baseText = finalLineBaseText; this.sceneGroup.add(this.finalLineMesh); this.allMeshes.push(this.finalLineMesh);
        finalLineGeo.computeBoundingBox(); const finalLineWidth = finalLineGeo.boundingBox.max.x - finalLineGeo.boundingBox.min.x; const blinkingCursorGeo = new TextGeometry("_", { font: this.fontShareTech, size: 0.4, height: 0.02 }); this.blinkingCursorMesh = new THREE.Mesh(blinkingCursorGeo, createTextMaterial()); this.blinkingCursorMesh.position.copy(this.finalLineMesh.position); this.blinkingCursorMesh.position.x += finalLineWidth + 0.1; this.sceneGroup.add(this.blinkingCursorMesh); this.allMeshes.push(this.blinkingCursorMesh);
        currentY -= 1.5;
        const pressStartGeo = new TextGeometry("CLICK TO PROCEED _", { font: this.fontVT323, size: 1.0, height: 0.05 }); pressStartGeo.center(); this.pressStartMesh = new THREE.Mesh(pressStartGeo, createTextMaterial()); this.pressStartMesh.position.y = currentY; this.sceneGroup.add(this.pressStartMesh); this.pressStartHitbox = createHitbox(this.pressStartMesh, 1.0); this.sceneGroup.add(this.pressStartHitbox); this.allMeshes.push(this.pressStartMesh);
        currentY -= 1.5;
        const instructionsGeo = new TextGeometry("[ ISTRUZIONI ]", { font: this.fontShareTech, size: 0.5, height: 0.02 }); instructionsGeo.center(); this.instructionsMesh = new THREE.Mesh(instructionsGeo, createTextMaterial()); this.instructionsMesh.position.y = currentY; this.sceneGroup.add(this.instructionsMesh); this.instructionsHitbox = createHitbox(this.instructionsMesh, 0.8); this.sceneGroup.add(this.instructionsHitbox); this.allMeshes.push(this.instructionsMesh);
        const totalHeight = Math.abs(currentY); this.sceneGroup.position.y = totalHeight / 2;
        const arrowGeo = new TextGeometry(">", { font: this.fontShareTech, size: 0.5, height: 0.02 }); arrowGeo.center(); this.arrowMesh = new THREE.Mesh(arrowGeo, createTextMaterial()); this.arrowMesh.material.opacity = 0; this.sceneGroup.add(this.arrowMesh); this.allMeshes.push(this.arrowMesh);
        const tutTitleGeo = new TextGeometry('A.P.I.S. TERMINAL', { font: this.fontAlien, size: 1.5, height: 0.05 }); tutTitleGeo.center(); this.tutorialTitleMesh = new THREE.Mesh(tutTitleGeo, createTextMaterial()); this.tutorialTitleMesh.position.y = 4; this.tutorialGroup.add(this.tutorialTitleMesh); this.allMeshes.push(this.tutorialTitleMesh);
        
        let tutorialTitleText, tutorialLines;
        if (this.cursorName === 'Pacman') {
            tutorialTitleText = 'SYSTEM STATUS: [HUNTER/HUNTED PARADIGM]';
            tutorialLines = [ "> ABILITÀ: ONLINE", ">   MUOVI MOUSE -> GUIDA L'ENTITÀ", ">   CLICK SX -> SCATTO D'ATTACCO (DISTRUGGE I CACCIATORI)", "> ", "> ANALISI BERSAGLI:", ">   ECHI (BLU) -> CONSUMALI PER PUNTEGGIO. SI AUTODISTRUGGONO.", ">   CACCIATORI (COLORATI) -> EVITALI O DISTRUGGILI CON LO SCATTO.", "> ", "> ... LA SOPRAVVIVENZA È LA PRIORITÀ." ];
        } else { // Default to Asteroids or any other case
            tutorialTitleText = 'SYSTEM STATUS: [VOIDBREAKER PROTOCOL]';
            tutorialLines = [ "> ARMAMENTI: ONLINE", ">   MUOVI MOUSE -> PILOTA NAVICELLA", ">   CLICK SX -> SPARA PROIETTILI", "> ", "> DIRETTIVA:", ">   SOPRAVVIVI A TUTTE LE ONDATE.", ">   RACCOGLI I MODULI DI POTENZIAMENTO RILASCIATI DAI NEMICI.", "> ", "> ... BUONA CACCIA, PILOTA." ];
        }

        const tutSubtitleGeo = new TextGeometry(tutorialTitleText, { font: this.fontShareTech, size: 0.5, height: 0.02 }); tutSubtitleGeo.center(); this.tutorialSubtitleMesh = new THREE.Mesh(tutSubtitleGeo, createTextMaterial()); this.tutorialSubtitleMesh.position.y = 2.5; this.tutorialGroup.add(this.tutorialSubtitleMesh); this.allMeshes.push(this.tutorialSubtitleMesh);
        tutorialLines.forEach((text, i) => { const geo = new TextGeometry(text, { font: this.fontShareTech, size: 0.4, height: 0.02 }); const mesh = new THREE.Mesh(geo, createTextMaterial()); mesh.position.x = -10; mesh.position.y = 1 - (i * 0.8); this.tutorialLineMeshes.push({mesh: mesh, text: text}); this.tutorialGroup.add(mesh); this.allMeshes.push(mesh); });
        const closeGeo = new TextGeometry("[ HO CAPITO ]", { font: this.fontVT323, size: 1.0, height: 0.05 }); closeGeo.center(); this.closeTutorialMesh = new THREE.Mesh(closeGeo, createTextMaterial()); this.closeTutorialMesh.position.y = -7; this.tutorialGroup.add(this.closeTutorialMesh); this.closeTutorialHitbox = createHitbox(this.closeTutorialMesh, 1.0); this.tutorialGroup.add(this.closeTutorialHitbox); this.allMeshes.push(this.closeTutorialMesh);
        this.tutorialGroup.children.forEach(child => { if(child.material) child.material.opacity = 0; });
    }

    setupPostProcessing() { this.composer.addPass(new RenderPass(this.scene, this.camera)); this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.sceneContainer.clientWidth, this.sceneContainer.clientHeight), 1.2, 0.2, 0.1); this.composer.addPass(this.bloomPass); const crtShader = { uniforms: { "tDiffuse": { value: null }, "u_time": { value: 0.0 } }, vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: `
                uniform sampler2D tDiffuse; uniform float u_time; varying vec2 vUv;
                float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453); }
                void main() {
                    vec2 barrel_uv = vUv - 0.5; float r = dot(barrel_uv, barrel_uv); vec2 uv = 0.5 + barrel_uv * (1.0 - 0.1 * r);
                    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { discard; }
                    vec2 offset_r = vec2(0.001, 0.0); vec2 offset_b = vec2(-0.001, 0.0);
                    float red = texture2D(tDiffuse, uv + offset_r).r; float green = texture2D(tDiffuse, uv).g; float blue = texture2D(tDiffuse, uv + offset_b).b;
                    vec4 color = vec4(red, green, blue, 1.0);
                    float scanline = sin(vUv.y * 800.0) * 0.1 + 0.9; float noise = (random(vUv + u_time * 0.2) - 0.5) * 0.15;
                    color.rgb *= scanline; color.rgb += noise; float vignette = 1.0 - length(vUv - 0.5) * 0.8; color.rgb *= vignette;
                    gl_FragColor = color;
                }` }; this.crtPass = new ShaderPass(crtShader); this.composer.addPass(this.crtPass); }
    
    addEventListeners() { window.addEventListener('mousemove', this.boundOnMouseMove); window.addEventListener('resize', this.boundOnWindowResize); this.preloaderElement.addEventListener('click', this.boundOnPreloaderClick); window.addEventListener('keydown', this.boundHandleSystemCommands); }
    startBootProcess() { this.loadingManager.onLoad = () => { if (this.bootTimeout) clearTimeout(this.bootTimeout); this.runPowerUpSequence(); }; this.bootTimeout = setTimeout(() => { if (!this.isBootAnimationStarted) { console.warn("Preloader: Avvio forzato causa timeout del LoadingManager."); this.runPowerUpSequence(); } }, 3000); }
    playSound(sound) { if (sound) { sound.currentTime = 0; sound.play().catch(e => {}); } }

    runPowerUpSequence() { if(this.isBootAnimationStarted) return; this.isBootAnimationStarted = true; const scanlineGeo = new THREE.PlaneGeometry(50, 0.1); const scanlineMat = new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.8 }); const scanlineMesh = new THREE.Mesh(scanlineGeo, scanlineMat); scanlineMesh.position.z = 1; scanlineMesh.position.y = 15; this.scene.add(scanlineMesh); gsap.to(scanlineMesh.position, { y: -15, duration: 1, ease: "power2.inOut" }); gsap.to(scanlineMesh.material, { opacity: 0, duration: 0.5, delay: 0.5, onComplete: () => { this.scene.remove(scanlineMesh); scanlineGeo.dispose(); scanlineMat.dispose(); }}); gsap.delayedCall(0.7, () => this.runBootAnimation()); }

    runBootAnimation(restart = false) {
        if (restart) {
            this.isInteractionAllowed = false; gsap.killTweensOf(this.allMeshes.map(m=>m.material).filter(Boolean));
            this.bootLineMeshes.forEach(line => { line.phrase.geometry.setDrawRange(0, 0); if (line.status.geometry) line.status.geometry.dispose(); line.status.geometry = new THREE.BufferGeometry(); gsap.set([line.phrase.material, line.status.material], { opacity: 0 }); });
            gsap.set([this.finalLineMesh.material, this.blinkingCursorMesh.material, this.pressStartMesh.material, this.instructionsMesh.material], { opacity: 0 });
        }
        const statusOkMaterial = new THREE.MeshStandardMaterial({ color: this.activeColor, emissive: this.activeColor, emissiveIntensity: 1.5, transparent: true, opacity: 1 }); const statusErrMaterial = new THREE.MeshStandardMaterial({ color: 0xff4136, emissive: 0xff4136, emissiveIntensity: 1.8, transparent: true, opacity: 1 });
        const tl = gsap.timeline();
        const updateStatusText = (mesh, text, isError = false) => { if (mesh.geometry) mesh.geometry.dispose(); mesh.geometry = new TextGeometry(text, { font: this.fontShareTech, size: 0.4, height: 0.02 }); mesh.material = isError ? statusErrMaterial : statusOkMaterial; mesh.material.color.set(this.activeColor); mesh.material.emissive.set(this.activeColor); };
        tl.to([this.titleMesh.material, this.subtitleMesh.material], { opacity: 1, duration: 1.0, stagger: 0.2 });
        this.bootLineMeshes.forEach(line => { const { phrase, status, lineGroup, text, isError } = line; phrase.geometry.setDrawRange(0, 0); const dummyType = { count: 0 }; const totalVertices = phrase.geometry.attributes.position.count; tl.to([phrase.material, status.material], { opacity: 1, duration: 0.01 }, "+=0.2"); tl.to(dummyType, { count: totalVertices, duration: text.length * 0.03, ease: "none", onUpdate: () => { phrase.geometry.setDrawRange(0, Math.ceil(dummyType.count)); }}); const dummyPercent = { val: 0 }; tl.to(dummyPercent, { val: 100, duration: 0.5, ease: "none", onUpdate: () => { updateStatusText(status, `[ ${Math.floor(dummyPercent.val)}% ]`); }, onComplete: () => { const statusText = isError ? '[ ERR ]' : '[ OK ]'; updateStatusText(status, statusText, isError); if (isError) { gsap.fromTo(lineGroup.position, { x: lineGroup.position.x - 0.1 }, { x: lineGroup.position.x, duration: 0.2, ease: "elastic.out(1, 0.3)" }); } } }); });
        tl.to([this.finalLineMesh.material, this.blinkingCursorMesh.material], { opacity: 1, duration: 1.0 }); tl.to([this.pressStartMesh.material, this.instructionsMesh.material], { opacity: 1, duration: 1.0 }, "-=1.0");
        gsap.to(this.pressStartMesh.material, { emissiveIntensity: 0.2, duration: 1.0, repeat: -1, yoyo: true, ease: "none" });
        tl.call(() => {
            this.glitchEffect3D(this.titleMesh, 'A.P.I.S. TERMINAL', { font: this.fontAlien, size: 1.5, height: 0.05 }, true); this.glitchEffect3D(this.subtitleMesh, 'Alessandro Portfolio Interactive System', { font: this.fontShareTech, size: 0.5, height: 0.02 }, true);
            this.bootLineMeshes.forEach(line => this.glitchEffect3D(line.phrase, line.text, { font: this.fontShareTech, size: 0.4, height: 0.02 }, false));
            this.glitchEffect3D(this.finalLineMesh, this.finalLineMesh.userData.baseText, { font: this.fontShareTech, size: 0.4, height: 0.02 }, false, 'input_line_glitch');
            this.glitchEffect3D(this.pressStartMesh, "CLICK TO PROCEED _", { font: this.fontVT323, size: 1.0, height: 0.05 }, true); this.glitchEffect3D(this.instructionsMesh, "[ ISTRUZIONI ]", { font: this.fontShareTech, size: 0.5, height: 0.02 }, true);
            this.isInteractionAllowed = true;
        });
    }

    showTutorial() { this.isTutorialVisible = true; this.isInteractionAllowed = false; const tl = gsap.timeline(); const materials = this.sceneGroup.children.map(c => c.material || (c.children ? c.children.map(child => child.material) : [])).flat().filter(Boolean); tl.to(materials, { opacity: 0, duration: 0.5, stagger: 0.05, onComplete: () => { this.sceneGroup.visible = false; this.tutorialGroup.visible = true; } }); tl.to([this.tutorialTitleMesh.material, this.tutorialSubtitleMesh.material], { opacity: 1, duration: 0.5, stagger: 0.2 }); this.tutorialLineMeshes.forEach(line => { const { mesh, text } = line; mesh.geometry.setDrawRange(0, 0); const dummy = { count: 0 }; const totalVertices = mesh.geometry.attributes.position.count; tl.to(mesh.material, { opacity: 1, duration: 0.01 }, "-=0.2"); tl.to(dummy, { count: totalVertices, duration: text.length * 0.03, ease: "none", onUpdate: () => mesh.geometry.setDrawRange(0, Math.ceil(dummy.count)) }); }); tl.to(this.closeTutorialMesh.material, { opacity: 1, duration: 0.5 }, "+=0.5").call(() => { gsap.to(this.closeTutorialMesh.material, { emissiveIntensity: 0.2, duration: 1.0, repeat: -1, yoyo: true, ease: "none" }); this.glitchEffect3D(this.tutorialTitleMesh, 'A.P.I.S. TERMINAL', { font: this.fontAlien, size: 1.5, height: 0.05 }, true); this.glitchEffect3D(this.tutorialSubtitleMesh, this.tutorialSubtitleMesh.geometry.parameters.options.text, { font: this.fontShareTech, size: 0.5, height: 0.02 }, true); this.tutorialLineMeshes.forEach(line => { this.glitchEffect3D(line.mesh, line.text, { font: this.fontShareTech, size: 0.4, height: 0.02 }, false); }); this.glitchEffect3D(this.closeTutorialMesh, '[ HO CAPITO ]', { font: this.fontVT323, size: 1.0, height: 0.05 }, true); this.isInteractionAllowed = true; }); }
    hideTutorial() { this.isTutorialVisible = false; this.isInteractionAllowed = false; gsap.killTweensOf(this.closeTutorialMesh.material); const tl = gsap.timeline(); const tutorialMaterials = this.tutorialGroup.children.map(c => c.material).filter(Boolean); tl.to(tutorialMaterials, { opacity: 0, duration: 0.5, stagger: 0.05, onComplete: () => { this.sceneGroup.visible = true; this.tutorialGroup.visible = false; } }); const sceneMaterials = this.sceneGroup.children.map(c => c.material || (c.children ? c.children.map(child => child.material) : [])).flat().filter(Boolean); tl.to(sceneMaterials, { opacity: 1, duration: 0.5, stagger: 0.1, onComplete: () => { this.isInteractionAllowed = true; } }); }
    
    handleSystemCommands(event) {
        if (this.isTutorialVisible || !this.isInteractionAllowed) return;
        const key = event.key;
        if (key === "Enter") {
            event.preventDefault(); this.isTyping = false; 
            const fullCommand = this.userInput.trim().toLowerCase();
            this.stopAllAnimations();
            const colorSchemes = { green: "#39ff14", blue: "#00ffff", amber: "#ffb000" };
            if (colorSchemes[fullCommand]) {
                const newColor = new THREE.Color(colorSchemes[fullCommand]);
                this.activeColor.set(newColor); this.changeTextColor(this.activeColor);
            } 
            else if (fullCommand === "reboot") {
                location.reload();
                return; 
            }
            else if (fullCommand === 'rave') { this.raveMode = true; this.toggleRaveMode(true); }
            else if (fullCommand === 'help') { this.displayTemporaryText(['> COMANDI DISPONIBILI:', '  green / blue / amber', '  reboot', '  rave']); }
            else { this.displayTemporaryText(['> COMANDO NON RICONOSCIUTO.', '> Digitare "help" per la lista.']); }
            this.userInput = ""; this.updateInputMesh();
            this.glitchEffect3D(this.finalLineMesh, this.finalLineMesh.userData.baseText, { font: this.fontShareTech, size: 0.4, height: 0.02 }, false, 'input_line_glitch');
        } else if (key === "Backspace" || key.length === 1) {
            this.isTyping = true;
            if (this.finalLineMesh.glitchInterval) { clearInterval(this.finalLineMesh.glitchInterval); this.finalLineMesh.glitchInterval = null; }
            if (key === "Backspace") { event.preventDefault(); this.userInput = this.userInput.slice(0, -1);
            } else if (key.length === 1 && this.userInput.length < 40) { event.preventDefault(); this.userInput += key; }
            this.updateInputMesh();
        }
    }

    stopAllAnimations() { if (this.raveMode) { this.raveMode = false; this.toggleRaveMode(false); } this.allMeshes.forEach(m => { if (m.material && m.material.color) { gsap.killTweensOf([m.material.color, m.material.emissive]); } }); }
    changeTextColor(colorObject) { this.allMeshes.forEach(m => { if (m.material && m.material.color) { gsap.to([m.material.color, m.material.emissive], { r: colorObject.r, g: colorObject.g, b: colorObject.b, duration: 0.5 }); } }); }
    displayTemporaryText(lines) {
        this.isInteractionAllowed = false; const tempMeshes = [];
        const elementsToHide = this.sceneGroup.children.filter(c => c !== this.titleMesh && c !== this.subtitleMesh );
        const tl = gsap.timeline({ onComplete: () => { tempMeshes.forEach(m => { this.sceneGroup.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); this.isInteractionAllowed = true; } });
        tl.to(elementsToHide, { 
            duration: 0.3,
            onStart: () => { elementsToHide.forEach(c => { const materials = c.material ? [c.material] : (c.children.map(child => child.material).flat()); gsap.to(materials, { opacity: 0, duration: 0.3 }); }); },
            onComplete: () => elementsToHide.forEach(c => c.visible = false)
        }, "start");
        lines.forEach((line, i) => { const geo = new TextGeometry(line, { font: this.fontShareTech, size: 0.4, height: 0.02 }); const mat = new THREE.MeshStandardMaterial({ color: this.activeColor, emissive: this.activeColor, emissiveIntensity: 1.5, transparent: true, opacity: 0 }); const mesh = new THREE.Mesh(geo, mat); mesh.position.set(-8, -6 - (i * 0.8), 0); this.sceneGroup.add(mesh); tempMeshes.push(mesh); });
        tl.to(tempMeshes.map(m => m.material), { opacity: 1, duration: 0.5, stagger: 0.1 }, "start+=0.3");
        tl.addLabel("hideTemp", "+=2.0");
        tl.to(tempMeshes.map(m => m.material), { opacity: 0, duration: 0.5, stagger: 0.1 }, "hideTemp");
        tl.call(() => elementsToHide.forEach(c => c.visible = true), null, "hideTemp+=0.5");
        tl.to(elementsToHide, {
            duration: 0.3,
            onStart: () => { elementsToHide.forEach(c => { const materials = c.material ? [c.material] : (c.children.map(child => child.material).flat()); gsap.to(materials.filter(Boolean), { opacity: 1, duration: 0.3 }); }); }
        }, "hideTemp+=0.5");
    }
    
    updateInputMesh() { const fullText = this.finalLineMesh.userData.baseText + this.userInput; if (this.finalLineMesh.geometry) this.finalLineMesh.geometry.dispose(); this.finalLineMesh.geometry = new TextGeometry(fullText, { font: this.fontShareTech, size: 0.4, height: 0.02 }); if (this.finalLineMesh.userData.glitchData) this.finalLineMesh.userData.glitchData.originalText = fullText; this.finalLineMesh.geometry.computeBoundingBox(); const newWidth = this.finalLineMesh.geometry.boundingBox.max.x - this.finalLineMesh.geometry.boundingBox.min.x; this.blinkingCursorMesh.position.x = this.finalLineMesh.position.x + newWidth + 0.1; }
    
    glitchEffect3D(mesh, originalText, textParams, isCentered, glitchId = null) {
        if (typeof originalText !== 'string') {
            console.warn("glitchEffect3D ha ricevuto un testo non valido e verrà saltato.", mesh);
            return;
        }
        mesh.userData.glitchData = { originalText, params: textParams, centered: isCentered, id: glitchId };
        if (mesh.glitchInterval) clearInterval(mesh.glitchInterval);
        mesh.glitchInterval = null;
        const startGlitch = () => {
            if (mesh.userData.glitchData.id === 'input_line_glitch' && this.isTyping) return;
            if (mesh.hoverGlitchInterval || !this.glitchesActive || mesh.glitchInterval) return;
            let flickerCount = 0;
            const maxFlickers = Math.floor(Math.random() * 4) + 2;
            mesh.glitchInterval = setInterval(() => {
                if (flickerCount < maxFlickers) {
                    const glitchChars = '`¡™£¢∞§¶•ªº–≠åß∂ƒ©˙∆˚¬…æ«Ω≈ç√∫˜µ≤≥÷!?@#$%^&*()';
                    const textToRender = originalText.split('').map(char => (char !== ' ' && Math.random() > 0.7) ? glitchChars.charAt(Math.floor(Math.random() * glitchChars.length)) : char).join('');
                    if (mesh.geometry) mesh.geometry.dispose();
                    mesh.geometry = new TextGeometry(textToRender, { ...textParams });
                    if (isCentered) mesh.geometry.center();
                    flickerCount++;
                } else {
                    clearInterval(mesh.glitchInterval);
                    mesh.glitchInterval = null;
                    if (mesh.geometry) mesh.geometry.dispose();
                    mesh.geometry = new TextGeometry(originalText, { ...textParams });
                    if (isCentered) mesh.geometry.center();
                    setTimeout(startGlitch, Math.random() * 5000 + 3000);
                }
            }, 100);
        };
        setTimeout(startGlitch, Math.random() * 5000 + 2000);
    }

    startHoverGlitch(mesh) { if (!mesh.userData.glitchData || !this.glitchesActive) return; if (mesh.glitchInterval) clearInterval(mesh.glitchInterval); if (mesh.hoverGlitchInterval) clearInterval(mesh.hoverGlitchInterval); const { originalText, params, centered } = mesh.userData.glitchData; mesh.hoverGlitchInterval = setInterval(() => { const glitchChars = '`¡™£¢∞§¶•ªº–≠åß∂ƒ©˙∆˚¬…æ«Ω≈ç√∫˜µ≤≥÷!?@#$%^&*()'; const glitchedText = originalText.split('').map(char => (char !== ' ') ? glitchChars.charAt(Math.floor(Math.random() * glitchChars.length)) : char).join(''); if (mesh.geometry) mesh.geometry.dispose(); mesh.geometry = new TextGeometry(glitchedText, { ...params }); if (centered) mesh.geometry.center(); }, 40); }
    stopHoverGlitch(mesh) { if (!mesh.userData.glitchData) return; if (mesh.hoverGlitchInterval) clearInterval(mesh.hoverGlitchInterval); mesh.hoverGlitchInterval = null; const { originalText, params, centered } = mesh.userData.glitchData; if (mesh.geometry) mesh.geometry.dispose(); mesh.geometry = new TextGeometry(originalText, { ...params }); if (centered) mesh.geometry.center(); this.glitchEffect3D(mesh, originalText, params, centered, mesh.userData.glitchData.id); }
    toggleRaveMode(activate) { if (activate) { if (this.raveTween) this.raveTween.kill(); this.raveTween = gsap.to({}, { duration: 0.5, repeat: -1, onRepeat: () => { const randomColor = new THREE.Color(Math.random() * 0xffffff); this.changeTextColor(randomColor); }}); } else { if (this.raveTween) { this.raveTween.kill(); this.raveTween = null; } } }
    
    onPreloaderClick(event) {
        this.mouseVec.x = (event.clientX / this.sceneContainer.clientWidth) * 2 - 1;
        this.mouseVec.y = - (event.clientY / this.sceneContainer.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouseVec, this.camera);
        if (this.isTutorialVisible) {
            if (this.raycaster.intersectObject(this.closeTutorialHitbox).length > 0) {
                this.playSound(this.clickSound);
                this.hideTutorial();
            }
        } else {
            if (!this.isInteractionAllowed) return;
            const intersects = this.raycaster.intersectObjects([this.pressStartHitbox, this.instructionsHitbox]);
            if (intersects.length > 0) {
                this.playSound(this.clickSound);
                const clickedObject = intersects[0].object;
                if (clickedObject === this.instructionsHitbox) {
                    this.showTutorial();
                } else if (clickedObject === this.pressStartHitbox) {
                    this.isInteractionAllowed = false;
                    if(this.terminalCursor) this.terminalCursor.destroy();
                    this.playSound(this.shutdownSound);
                    const shutdownTl = gsap.timeline({ onComplete: () => { this.preloaderElement.style.display = 'none'; this.destroy(); this.resolvePromise(); }});
                    shutdownTl.to(this.sceneGroup.scale, { duration: 0.3, y: 0.01, x: 1.2, ease: "power2.in" });
                    shutdownTl.to(this.sceneGroup.scale, { duration: 0.15, x: 0.01 });
                    shutdownTl.to(this.allMeshes.map(m => m.material).filter(m => m && m.emissiveIntensity !== undefined), { emissiveIntensity: 0, duration: 0.2 }, "-=0.1");
                    shutdownTl.to(this.preloaderElement, { opacity: 0, duration: 0.5 }, "+=0.2");
                }
            }
        }
    }

    onMouseMove(event) { this.mouseVec.x = (event.clientX / this.sceneContainer.clientWidth) * 2 - 1; this.mouseVec.y = -(event.clientY / this.sceneContainer.clientHeight) * 2 + 1; }
    onWindowResize() { this.camera.aspect = this.sceneContainer.clientWidth / this.sceneContainer.clientHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(this.sceneContainer.clientWidth, this.sceneContainer.clientHeight); this.composer.setSize(this.sceneContainer.clientWidth, this.sceneContainer.clientHeight); }
    
    animate() {
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        const elapsedTime = this.clock.getElapsedTime();
        this.raycaster.setFromCamera(this.mouseVec, this.camera);
        if (this.isInteractionAllowed) { const activeGroup = this.isTutorialVisible ? this.tutorialGroup : this.sceneGroup; const intersects = this.raycaster.intersectObjects(activeGroup.children, true); const validIntersects = intersects.filter(i => i.object.userData.glitchData); let newTarget = validIntersects.length > 0 ? validIntersects[0].object : null; if (newTarget !== this.currentHoverGlitchTarget) { if (this.currentHoverGlitchTarget) { this.stopHoverGlitch(this.currentHoverGlitchTarget); } if (newTarget) { this.startHoverGlitch(newTarget); } this.currentHoverGlitchTarget = newTarget; } }
        if (this.blinkingCursorMesh && this.blinkingCursorMesh.material.opacity > 0) { this.blinkingCursorMesh.material.opacity = 0.5 + Math.sin(elapsedTime * 10) * 0.5; }
        if(this.bloomPass) this.bloomPass.strength = 1.2 + Math.sin(elapsedTime * 0.5) * 0.1;
        const activeGroup = this.isTutorialVisible ? this.tutorialGroup : this.sceneGroup;
        const rotationIntensity = 0.08;
        const targetRotationX = -this.mouseVec.y * rotationIntensity;
        const targetRotationY = -this.mouseVec.x * rotationIntensity;
        activeGroup.rotation.x += (targetRotationX - activeGroup.rotation.x) * 0.05;
        activeGroup.rotation.y += (targetRotationY - activeGroup.rotation.y) * 0.05;
        if (this.terminalCursor && this.isInteractionAllowed) { let interactiveObjects, newArrowTarget = null; if (this.isTutorialVisible) { interactiveObjects = [this.closeTutorialHitbox]; } else { interactiveObjects = [this.pressStartHitbox, this.instructionsHitbox]; } const arrowIntersects = this.raycaster.intersectObjects(interactiveObjects); if (arrowIntersects.length > 0) { newArrowTarget = arrowIntersects[0].object; if (!this.isHoveringInteractiveMesh) { this.isHoveringInteractiveMesh = true; this.terminalCursor.handleMouseEnter(); } } else { if (this.isHoveringInteractiveMesh) { this.isHoveringInteractiveMesh = false; this.terminalCursor.handleMouseLeave(); } } if (newArrowTarget !== this.currentHoverTarget) { if(newArrowTarget) this.playSound(this.hoverSound); this.currentHoverTarget = newArrowTarget; gsap.killTweensOf(this.arrowMesh.material); if (this.currentHoverTarget) { const targetMesh = (this.currentHoverTarget === this.instructionsHitbox) ? this.instructionsMesh : ((this.currentHoverTarget === this.closeTutorialHitbox) ? this.closeTutorialMesh : this.pressStartMesh); targetMesh.geometry.computeBoundingBox(); const width = targetMesh.geometry.boundingBox.max.x - targetMesh.geometry.boundingBox.min.x; const targetX = targetMesh.position.x - (width / 2) - 0.7; const targetY = targetMesh.position.y; this.arrowMesh.position.set(targetX, targetY, 0); gsap.to(this.arrowMesh.material, { opacity: 1, duration: 0.3, ease: 'power2.out' }); } else { gsap.to(this.arrowMesh.material, { opacity: 0, duration: 0.2 }); } } }
        if (this.titleMesh && this.titleMesh.material) { this.titleMesh.material.emissiveIntensity = 1.5 + Math.sin(elapsedTime * 2.0) * 0.5; }
        if(this.crtPass && this.crtPass.uniforms.u_time) { this.crtPass.uniforms.u_time.value = elapsedTime; }

        // Skip rendering while the GL context is lost to avoid INVALID_OPERATION errors
        if (!this.contextLost) {
            try {
                this.composer.render();
            } catch (err) {
                console.warn('Preloader composer.render() failed:', err);
            }
        }
    }

    destroy() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        window.removeEventListener('mousemove', this.boundOnMouseMove);
        window.removeEventListener('resize', this.boundOnWindowResize);
        this.preloaderElement.removeEventListener('click', this.boundOnPreloaderClick);
        window.removeEventListener('keydown', this.boundHandleSystemCommands);
        try { if (this._removeContextGuards) this._removeContextGuards(); } catch (e) {}
        this.allMeshes.forEach(mesh => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => mat.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });
        // Defensive dispose: guard against context lost / invalid operation errors
        try {
            if (this.composer && Array.isArray(this.composer.passes)) {
                this.composer.passes.forEach(pass => { try { if (pass && pass.dispose) pass.dispose(); } catch (e) {} });
            }
        } catch (e) {}
        try { if (this.renderer) this.renderer.dispose(); } catch (e) {}
        try { if (this.sceneContainer && this.renderer && this.renderer.domElement) this.sceneContainer.removeChild(this.renderer.domElement); } catch (e) {}
        clearTimeout(this.bootTimeout);
    }

    onContextLost(event) {
        // Prevent the default to allow restore events
        try { event.preventDefault(); } catch (e) {}
        console.warn('Preloader WebGL context lost');
        this.contextLost = true;
    }

    onContextRestored(/* event */) {
        console.info('Preloader WebGL context restored — recreating renderer/composer');
        this.contextLost = false;
        try {
            this.recreateRenderer();
        } catch (e) {
            console.error('Failed to recreate Preloader renderer on context restore', e);
        }
    }

    recreateRenderer() {
        // Dispose old composer and renderer defensively
        try {
            if (this.composer && Array.isArray(this.composer.passes)) {
                this.composer.passes.forEach(pass => { try { if (pass && pass.dispose) pass.dispose(); } catch (e) {} });
            }
        } catch (e) {}
        try { if (this.renderer) this.renderer.dispose(); } catch (e) {}

        // Remove old canvas
        try { if (this.sceneContainer && this.renderer && this.renderer.domElement) this.sceneContainer.removeChild(this.renderer.domElement); } catch (e) {}

        // Create a fresh renderer and composer, reattach canvas and reapply postprocessing
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // Use robust sizing similar to onWindowResize
    const rect = this.sceneContainer.getBoundingClientRect ? this.sceneContainer.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const rw = Math.max(1, Math.round(rect.width) || window.innerWidth);
    const rh = Math.max(1, Math.round(rect.height) || window.innerHeight);
    this.renderer.setSize(rw, rh);
        this.sceneContainer.appendChild(this.renderer.domElement);
        try {
            this.renderer.domElement.addEventListener('webglcontextlost', this.boundOnContextLost, false);
            this.renderer.domElement.addEventListener('webglcontextrestored', this.boundOnContextRestored, false);
        } catch (e) {}
        this.composer = new EffectComposer(this.renderer);
        try { this.setupPostProcessing(); } catch (e) { console.warn('[Preloader] setupPostProcessing failed during recreateRenderer', e); }
    }
}

export function setupPreloader(loadingManager, isFirstLoad, terminalCursor, cursorName) {
    const preloaderElement = document.getElementById('preloader');
    if (!preloaderElement || !isFirstLoad) {
        if (preloaderElement) preloaderElement.style.display = 'none';
        return Promise.resolve();
    }

    preloaderElement.style.display = 'block';
    preloaderElement.style.opacity = '1';
    
    return new Promise(async (resolve) => {
        const experience = new PreloaderExperience(loadingManager, terminalCursor, resolve, cursorName);
        await experience.init();
        
        // Safety timeout: close preloader after 30 seconds if not closed manually
        setTimeout(() => {
            if (preloaderElement.style.display !== 'none') {
                console.warn('Preloader safety timeout triggered - closing automatically');
                preloaderElement.style.display = 'none';
                experience.destroy();
                resolve();
            }
        }, 30000);
    });
}