import * as THREE from 'three';
// FontLoader and TextGeometry live in the examples/jsm/ area. Use the importmap alias
// defined in Index.html ("three/addons/") to pull them in as ES modules.
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class Title3D {
    constructor(container, text, options = {}) {
        this.container = container;
        this.text = text || container.innerText || 'TITLE';
        this.options = Object.assign({
            fontUrl: 'assets/fonts/Orbitron.json',
            color: 0x39ff14,
            emissive: 0x39ff14,
            metalness: 0.1,
            roughness: 0.6,
            sizeFactor: 0.5, // dimensione in rapporto alla larghezza del contenitore (aumentata per testi più grandi)
            height: 4,
            curveSegments: 12
        }, options);

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.canvas.style.pointerEvents = 'none';
        this.container.classList.add('title-3d-canvas-wrap');
        // keep original text for accessibility but visually hide it
        this.container.setAttribute('data-text', this.text);

        // Wrap original content
        this.originalTextEl = document.createElement('div');
    this.originalTextEl.className = 'title-3d-fallback';
        // Move original text into fallback
        while (this.container.firstChild) {
            this.originalTextEl.appendChild(this.container.firstChild);
        }
        this.container.appendChild(this.originalTextEl);
        this.container.appendChild(this.canvas);

        // Attempt to create a WebGL renderer. If this fails (WebGL unsupported / context denied),
        // fall back to showing the textual fallback and skip 3D setup.
        this.renderer = null;
        // Force fallback to 2D text
        const force2D = true;
        if (!force2D) {
        try {
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
            // limit DPR to 1.5 to balance clarity and performance
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
            // Ensure transparent background and expose DOM element for z-index control
            this.renderer.setClearColor(0x000000, 0);
            // Keep the canvas behind the textual DOM title (title z-index is 10100 in CSS).
            // Use a slightly lower z-index so the DOM text or other UI is not obscured.
            try { this.renderer.domElement.style.zIndex = '10099'; } catch(_) {}
        } catch (e) {
            console.warn('Title3D: WebGL renderer not available, falling back to text.', e);
            // reveal fallback text and remove canvas
                // temporary visual debug styling to locate the canvas in the page
                try {
                    // removed debug styling now that titles are visible
                    // this.renderer.domElement.style.outline = '3px solid rgba(255,0,0,0.9)';
                    // this.renderer.domElement.style.background = 'rgba(255,255,255,0.04)';
                    // bring canvas above everything temporarily for debugging
                    // this.renderer.domElement.style.zIndex = '20001';
                } catch(_) {}
            try {
                if (this.originalTextEl) {
                    // Reset the visually-hidden styles so the text becomes visible
                    Object.assign(this.originalTextEl.style, {
                        visibility: '',
                        position: 'static',
                        width: 'auto',
                        height: 'auto',
                        padding: '0',
                        margin: '0',
                        overflow: 'visible',
                        clip: 'auto',
                        whiteSpace: 'normal',
                        border: '0'
                    });
                }
                if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
            } catch (inner) { /* silent */ }
        }
        } else {
            // Force 2D fallback
            try {
                if (this.originalTextEl) {
                    // Reset the visually-hidden styles so the text becomes visible
                    Object.assign(this.originalTextEl.style, {
                        visibility: '',
                        position: 'static',
                        width: 'auto',
                        height: 'auto',
                        padding: '0',
                        margin: '0',
                        overflow: 'visible',
                        clip: 'auto',
                        whiteSpace: 'normal',
                        border: '0'
                    });
                }
                if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
            } catch (inner) { /* silent */ }
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        // move camera closer to make text appear larger
        this.camera.position.set(0, 0, 50);        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
    // Add a soft rim light to make text more visible in darker UI backgrounds
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.35);
    this.scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(50, 50, 100);
        this.scene.add(dir);

        this.mesh = null;
        this.font = null;
        this.isRunning = false;

        this._onResize = this._onResize.bind(this);
        this._animate = this._animate.bind(this);

        // If renderer failed to initialize, skip 3D init
    if (!this.renderer) {
        try { this.container.classList.add('visible'); } catch(_) {}
        console.debug('Title3D: renderer not available, showing fallback text for', this.text);
        return;
    }
    this._init();
    }

    async _init() {
        try {
            // Carica font JSON usando FontLoader dagli examples (importato sopra)
            const loader = new FontLoader();
            const fontJson = await new Promise((resolve, reject) => {
                loader.load(this.options.fontUrl, resolve, undefined, reject);
            });
            this.font = fontJson;
            this._createText();
            // once the 3D mesh is created successfully, hide the textual fallback and reveal the element
            try { if (this.originalTextEl) this.originalTextEl.style.visibility = 'hidden'; } catch(_) {}
            try { this.container.classList.add('visible'); } catch(_) {}
            this._onResize();
            window.addEventListener('resize', this._onResize);
            this.isRunning = true;
            requestAnimationFrame(this._animate);
        } catch (e) {
            console.warn('Title3D: impossibile caricare il font o creare la scena', e);
            // mostra il fallback testuale se qualcosa va storto (font non caricato, WebGL non supportato, ecc.)
            try {
                if (this.originalTextEl) {
                    Object.assign(this.originalTextEl.style, {
                        visibility: '',
                        position: 'static',
                        width: 'auto',
                        height: 'auto',
                        padding: '0',
                        margin: '0',
                        overflow: 'visible',
                        clip: 'auto',
                        whiteSpace: 'normal',
                        border: '0'
                    });
                }
                // rimuovi canvas se presente per evitare elementi inutili
                if (this.canvas && this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
                try { this.container.classList.add('visible'); } catch(_) {}
            } catch (inner) {
                /* silent */
            }
        }
    }

    _createText() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            this.mesh = null;
        }

        const params = { font: this.font, size: 30, height: this.options.height, curveSegments: this.options.curveSegments };
    // TextGeometry is imported from the examples module above
    const geometry = new TextGeometry(this.text, params);
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
        const textWidth = bbox.max.x - bbox.min.x;

    const material = new THREE.MeshStandardMaterial({ color: this.options.color, emissive: this.options.emissive, metalness: this.options.metalness, roughness: this.options.roughness });
        // make material more visible on dark backgrounds (debug preset)
        try { material.emissiveIntensity = 1.5; material.side = THREE.DoubleSide; } catch(_) {}        this.mesh = new THREE.Mesh(geometry, material);
        // center the geometry like preloader
        geometry.center();
        // center
        this.mesh.position.x = 0;
        this.mesh.position.y = 0;
        this.scene.add(this.mesh);
    // apply glitch effect like preloader
    this.glitchEffect3D(this.mesh, this.text, params, true);
    // ensure the mesh is placed in z=0 and scale it to roughly fit container immediately
    try { this.mesh.position.z = 0; } catch(_) {}
    try { this._onResize(); } catch(_) {}

        // initial subtle scale; actual scale set on resize
    }

    _onResize() {
        const rect = this.container.getBoundingClientRect();
        const width = Math.max(32, Math.floor(rect.width));
        const height = Math.max(32, Math.floor(rect.height || (rect.width * 0.25)));
        this.renderer.setSize(width, height, false);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // scale text to fit container width
        if (this.mesh && this.mesh.geometry && this.mesh.geometry.boundingBox) {
            const bbox = this.mesh.geometry.boundingBox;
            const textWidth = bbox.max.x - bbox.min.x;
            const target = width * this.options.sizeFactor;
            const scale = target / Math.max(1, textWidth);
            this.mesh.scale.setScalar(scale);
        }
    }

    _animate(t) {
        if (!this.isRunning) return;
        // subtle floating and tilt
        if (this.mesh) {
            const time = performance.now() * 0.001;
            this.mesh.rotation.y = Math.sin(time * 0.6) * 0.04;
            this.mesh.rotation.x = Math.cos(time * 0.4) * 0.02;
            this.mesh.position.y = Math.sin(time * 0.9) * 0.6;
        }
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this._animate);
    }

    glitchEffect3D(mesh, originalText, textParams, isCentered, glitchId = null) {
        if (typeof originalText !== 'string') {
            console.warn("glitchEffect3D ha ricevuto un testo non valido e verrà saltato.", mesh);
            return;
        }
        mesh.userData.glitchData = { originalText, params: textParams, centered: isCentered, id: glitchId };
        if (mesh.glitchInterval) clearInterval(mesh.glitchInterval);
        mesh.glitchInterval = null;
        const startGlitch = () => {
            if (mesh.hoverGlitchInterval || mesh.glitchInterval) return;
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

    destroy() {
        this.isRunning = false;
        window.removeEventListener('resize', this._onResize);
        if (this.mesh) {
            if (this.mesh.glitchInterval) clearInterval(this.mesh.glitchInterval);
            if (this.mesh.hoverGlitchInterval) clearInterval(this.mesh.hoverGlitchInterval);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        // restore fallback visibility
        if (this.originalTextEl) this.originalTextEl.style.visibility = '';
    }
}
