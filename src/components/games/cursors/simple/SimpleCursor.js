// src/components/games/cursors/simple/SimpleCursor.js

import { SimpleGame } from './SimpleGame.js';

export class SimpleCursor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.state = { isActive: false };
            return;
        }

        try {
            this.game = new SimpleGame(canvasId);
            this.state = { isActive: this.game.isActive };
        } catch (err) {
            console.error('Errore durante l\'inizializzazione di SimpleGame:', err);
            this.game = null;
            this.state = { isActive: false };
        }
    }

    init() {
        if (!this.state.isActive || !this.game) return;
        document.body.classList.add('js-simple-cursor-active');
        this.game.start();
    }

    destroy() {
        if (!this.state.isActive || !this.game) return;
        document.body.classList.remove('js-simple-cursor-active');
        this.game.destroy();
    }

    enterMagneticMode(targetElement) { if (this.game) this.game.setMagneticTarget && this.game.setMagneticTarget(targetElement); }
    exitMagneticMode(targetElement) { if (this.game) this.game.clearMagneticTarget && this.game.clearMagneticTarget(targetElement); }
}
