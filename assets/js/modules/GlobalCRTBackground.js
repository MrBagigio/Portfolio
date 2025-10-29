// assets/js/modules/GlobalCRTBackground.js
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { attachContextGuards, safeDisposeComposer, safeDisposeRenderer } from '../core/webglUtils.js';

const CrtShader = {
    uniforms: { "tDiffuse": { value: null }, "u_time": { value: 0.0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform float u_time; varying vec2 vUv;
        float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
            vec2 barrel_uv = vUv - 0.5; float r = dot(barrel_uv, barrel_uv); vec2 uv = 0.5 + barrel_uv * (1.0 - 0.05 * r);
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
            vec2 offset_r = vec2(0.0005, 0.0); vec2 offset_b = vec2(-0.0005, 0.0);
            float red = texture2D(tDiffuse, uv + offset_r).r; float green = texture2D(tDiffuse, uv).g; float blue = texture2D(tDiffuse, uv + offset_b).b;
            vec4 color = vec4(red, green, blue, 1.0);
            float scanline = sin(vUv.y * 1000.0) * 0.02 + 0.98;
            float noise = (random(vUv + u_time * 0.1) - 0.5) * 0.08;
            color.rgb *= scanline;
            color.rgb += noise;
            float vignette = 1.0 - length(vUv - 0.5) * 0.6;
            color.rgb *= vignette;
            gl_FragColor = color;
        }`
};

export class GlobalCRTBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) { console.error("GlobalCRTBackground: Canvas non trovato!"); return; }
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.contextLost = false;
    try { this._removeContextGuards = attachContextGuards(this.renderer, { onLost: () => { this.contextLost = true; console.warn('GlobalCRTBackground: context lost'); }, onRestored: () => { this.contextLost = false; this.onResize(); console.info('GlobalCRTBackground: context restored'); } }); } catch (e) {}
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const baseTexture = new THREE.DataTexture(new Uint8Array([13, 17, 23]), 1, 1, THREE.RGBFormat);
        this.scene.background = baseTexture;
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.1, 0.1);
        this.composer.addPass(bloomPass);
        this.crtPass = new ShaderPass(CrtShader);
        this.composer.addPass(this.crtPass);
        this.clock = new THREE.Clock();
        this.onResize = this.onResize.bind(this);
        this.animate = this.animate.bind(this); // Aggiunto bind per animate
        window.addEventListener('resize', this.onResize);
        this.onResize();
        this.animate(); // Avvia il loop di animazione
    }
    
    onResize() { 
        this.renderer.setSize(window.innerWidth, window.innerHeight); 
        this.composer.setSize(window.innerWidth, window.innerHeight); 
    }
    
    // Ripristinato il loop di animazione autonomo
    animate() { 
        if (this.contextLost) return;
        this.crtPass.uniforms.u_time.value = this.clock.getElapsedTime(); 
        try { this.composer.render(); } catch (e) { console.warn('GlobalCRTBackground composer.render failed', e); }
        requestAnimationFrame(this.animate);
    }

    dispose() {
        try { if (this._removeContextGuards) this._removeContextGuards(); } catch (e) {}
        try {
            if (!this.contextLost) {
                safeDisposeComposer(this.composer);
                safeDisposeRenderer(this.renderer);
            }
        } catch (err) { console.warn('GlobalCRTBackground dispose:', err); }
    }
}