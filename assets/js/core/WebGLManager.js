// assets/js/core/WebGLManager.js

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
// --- PERCORSO CORRETTO E VERIFICATO ---
// Sale da 'core' a 'js', poi entra in 'modules', poi in 'shaders'
import { VhsPageTransitionShader } from '../modules/shaders/VhsTransitionShader.js';

export class WebGLManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.isActive = false;
        this.loadingManager = new THREE.LoadingManager();
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            alpha: true,
            powerPreference: "high-performance"
        });
        // Track context state to avoid disposing or deleting resources
        // that belong to a lost context (causes INVALID_OPERATION errors).
        this.contextLost = false;
        this._onContextLost = (e) => {
            // Prevent the browser default (which may try to restore automatically)
            e.preventDefault();
            console.warn('WebGL context lost on canvas');
            this.contextLost = true;
            // Stop the render loop while context is lost
            this.stop();
        };
        this._onContextRestored = (e) => {
            console.info('WebGL context restored on canvas');
            // Recreate renderer and composer to get a fresh context-bound state.
            try {
                // Dispose any leftover renderer if present
                if (this.renderer && this.renderer.forceContextLoss) {
                    try { this.renderer.forceContextLoss(); } catch (err) {}
                }
            } catch (err) {}
            // Create a new renderer instance bound to the same canvas
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            // Recreate composer with new renderer
            this.composer = new EffectComposer(this.renderer);
            this.composer.addPass(new RenderPass(this.scene, this.camera));
            this.contextLost = false;
            // Restart rendering if it was active before
            if (this.isActive) this.start();
        };
        // Listen for context lost/restored on the canvas element
        if (this.canvas && this.canvas.addEventListener) {
            this.canvas.addEventListener('webglcontextlost', this._onContextLost, false);
            this.canvas.addEventListener('webglcontextrestored', this._onContextRestored, false);
        }
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.clock = new THREE.Clock();
        
        this.onResize = this.onResize.bind(this);
        this._render = this._render.bind(this);
        
        window.addEventListener('resize', this.onResize);
    }

    start() { if (!this.isActive && !this.contextLost) { this.isActive = true; this.clock.start(); this._render(); } }
    stop() { this.isActive = false; try { this.clock.stop(); } catch (err) {} }
    onResize() { this.renderer.setSize(window.innerWidth, window.innerHeight); this.composer.setSize(window.innerWidth, window.innerHeight); }
    _render() { if (!this.isActive || this.contextLost) return; this.composer.render(this.clock.getDelta()); requestAnimationFrame(this._render); }

    createTransition() {
        const afterimagePass = new AfterimagePass();
        afterimagePass.uniforms["damp"].value = 0.96;
        
        const filmPass = new FilmPass(0.35, 0.025, 648, false);
        const vhsPass = new ShaderPass(VhsPageTransitionShader);
        
        this.composer.addPass(afterimagePass);
        this.composer.addPass(filmPass);
        this.composer.addPass(vhsPass);

        return {
            play: () => new Promise((resolve) => {
                this.start();
                const tl = gsap.timeline({
                    onComplete: () => {
                        // If context was lost during the transition, skip manual
                        // removal/dispose of passes because they may belong to a
                        // different GL context and cause invalid-operation errors.
                        if (!this.contextLost) {
                            try {
                                this.composer.removePass(afterimagePass);
                                this.composer.removePass(filmPass);
                                this.composer.removePass(vhsPass);
                            } catch (err) { console.warn('Failed to remove passes (context lost?):', err); }
                        }
                        this.stop();
                        resolve();
                    },
                    onUpdate: () => { vhsPass.uniforms.time.value += 0.05; }
                });
                tl.to(vhsPass.uniforms.progress, { value: 1.0, duration: 0.6, ease: 'power2.in' })
                  .to(vhsPass.uniforms.progress, { value: 0.0, duration: 0.8, ease: 'power3.out' }, "+=0.1");
            }),
            halfway: new Promise((resolveHalfway) => { setTimeout(resolveHalfway, 600); })
        };
    }
}