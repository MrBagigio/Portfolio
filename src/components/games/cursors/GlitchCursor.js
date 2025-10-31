// assets/js/modules/cursors/GlitchCursor.js

import { GlitchGame } from './glitch/GlitchGame.js';

export class GlitchCursor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.isActive = false;
            return;
        }

        try {
            this.game = new GlitchGame(canvasId);
            this.isActive = this.game.isActive;
        } catch (err) {
            console.error("Errore fatale durante l'inizializzazione di GlitchGame:", err);
            this.game = null;
            this.isActive = false;
        }
    }

    init() {
        if (!this.isActive || !this.game) return;
        document.body.classList.add('glitch-cursor-active');
        this.game.start();
    }

    destroy() {
        if (!this.isActive || !this.game) return;
        document.body.classList.remove('glitch-cursor-active');
        this.game.stop();
    }

    enterMagneticMode(targetElement) {
        if (!this.isActive || !this.game) return;
        this.game.setMagneticTarget(targetElement);
        targetElement.classList.add('is-magnet-locked');
    }

    exitMagneticMode(targetElement) {
        if (!this.isActive || !this.game) return;
        this.game.clearMagneticTarget(targetElement);
        if (targetElement) {
            targetElement.classList.remove('is-magnet-locked');
        }
    }
}