// src/core/interactions/InteractionManager.js

import { TextScramble } from '../../components/ui/TextScramble.js';

export class InteractionManager {
    constructor() {
        this.activeCursor = null;
        this.scrambleEffects = new Map();
        this.magneticTargets = new Set();
        this.glitchTargets = new Set();
        this.handleMagneticEnter = this.handleMagneticEnter.bind(this);
        this.handleMagneticLeave = this.handleMagneticLeave.bind(this);
        this.handleGlitchEnter = this.handleGlitchEnter.bind(this);
        this.handleGlitchLeave = this.handleGlitchLeave.bind(this);
    }

    setActiveCursor(cursor) {
        this.activeCursor = cursor;
    }

    initGlobalInteractions() {
        this.initMagneticTargets();
        this.initGlitchText();
    }

    handleMagneticEnter(event) {
        if (this.activeCursor && typeof this.activeCursor.enterMagneticMode === 'function') {
            this.activeCursor.enterMagneticMode(event.currentTarget);
        }
    }

    handleMagneticLeave() {
        if (this.activeCursor && typeof this.activeCursor.exitMagneticMode === 'function') {
            this.activeCursor.exitMagneticMode();
        }
    }

    handleGlitchEnter(event) {
        const effect = this.scrambleEffects.get(event.currentTarget);
        if (effect) {
            effect.startGlitch(0.4);
        }
    }

    handleGlitchLeave(event) {
        const effect = this.scrambleEffects.get(event.currentTarget);
        if (effect) {
            effect.stopGlitch();
        }
    }
    
    initMagneticTargets() {
        const targets = document.querySelectorAll('.magnetic-target');
        targets.forEach(target => {
            target.addEventListener('mouseenter', this.handleMagneticEnter);
            target.addEventListener('mouseleave', this.handleMagneticLeave);
            this.magneticTargets.add(target);
        });
    }

    initGlitchText() {
        const targets = document.querySelectorAll('.glitch-hover, .nav-link, .page-link');
        
        targets.forEach(target => {
            // Esclude i link all'interno della navbar dall'effetto glitch al passaggio del mouse
            if (target.closest('#chimera-navbar')) {
                return; 
            }

            if (this.scrambleEffects.has(target)) return;

            const effect = new TextScramble(target);
            this.scrambleEffects.set(target, effect);

            target.addEventListener('mouseenter', this.handleGlitchEnter);
            target.addEventListener('mouseleave', this.handleGlitchLeave);
            this.glitchTargets.add(target);
        });
    }

    destroy() {
        this.scrambleEffects.forEach(effect => effect.stopGlitch());
        this.scrambleEffects.clear();

        this.magneticTargets.forEach(target => {
            target.removeEventListener('mouseenter', this.handleMagneticEnter);
            target.removeEventListener('mouseleave', this.handleMagneticLeave);
        });
        this.magneticTargets.clear();

        this.glitchTargets.forEach(target => {
            target.removeEventListener('mouseenter', this.handleGlitchEnter);
            target.removeEventListener('mouseleave', this.handleGlitchLeave);
        });
        this.glitchTargets.clear();
    }
}