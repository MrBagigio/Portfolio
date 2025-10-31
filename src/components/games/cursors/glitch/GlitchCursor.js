// assets/js/modules/cursors/glitch/GlitchCursor.js

import { GlitchGame } from './GlitchGame.js';

export class GlitchCursor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.state = { isActive: false };
            return;
        }

        try {
            this.game = new GlitchGame(canvasId);
            this.state = { isActive: this.game.isActive };
        } catch (err) {
            console.error("Errore fatale durante l'inizializzazione di GlitchGame:", err);
            this.game = null;
            this.state = { isActive: false };
        }
    }

    init() {
        if (!this.state.isActive || !this.game) return;
        document.body.classList.add('js-glitch-cursor-active');
        this.game.start();
    }

    destroy() {
        if (!this.state.isActive || !this.game) return;
        document.body.classList.remove('js-glitch-cursor-active');
        this.game.stop();
    }

    enterMagneticMode(targetElement) {
        if (!this.state.isActive || !this.game) return;
        this.game.setMagneticTarget(targetElement);
        targetElement.classList.add('is-magnet-locked');
    }

    exitMagneticMode(targetElement) {
        if (!this.state.isActive || !this.game) return;
        this.game.clearMagneticTarget(targetElement);
        if (targetElement) {
            targetElement.classList.remove('is-magnet-locked');
        }
    }
}