// assets/js/modules/shaders/VhsTransitionShader.js
import * as THREE from 'three';

export const VhsPageTransitionShader = {
    uniforms: { 'tDiffuse': { value: null }, 'progress': { value: 0.0 }, 'time': { value: 0.0 }, 'rollSpeed': { value: 2.5 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
        uniform sampler2D tDiffuse; uniform float progress; uniform float time; uniform float rollSpeed; varying vec2 vUv;
        float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
        void main() {
            float roll_pos = fract(time * rollSpeed); float roll_height = 0.15; vec2 uv = vUv; vec4 final_color = texture2D(tDiffuse, uv);
            if (progress > 0.0) {
                float noise = rand(uv + time) * 0.4;
                if (uv.y > roll_pos && uv.y < roll_pos + roll_height) { uv.x += (rand(vec2(time, uv.y)) - 0.5) * 0.1 * progress; noise = 0.8 + rand(uv + time) * 0.5; }
                float r = texture2D(tDiffuse, uv + vec2(0.01, 0.0) * progress).r; float b = texture2D(tDiffuse, uv - vec2(0.01, 0.0) * progress).b;
                final_color.r = r; final_color.b = b; final_color.rgb += noise * progress;
            }
            gl_FragColor = final_color;
        }`
};