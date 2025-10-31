// assets/js/modules/cursors/AsteroidsCursor.js

import { AsteroidsGame } from './asteroids/AsteroidsGame.js';

export class AsteroidsCursor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.isActive = false;
            return;
        }
        this.game = new AsteroidsGame(canvasId);
        this.isActive = this.game.isActive;
    }

    init() {
        if (!this.isActive) return;
        document.body.classList.add('custom-cursor-active');
        this.game.start();
    }

    activate() {
        this.init();
    }

    destroy() {
        document.body.classList.remove('custom-cursor-active');
        if (!this.isActive) return;
        this.game.stop();
    }
    
    enterMagneticMode(targetElement) {
        if (!this.isActive || !this.game || this.game.magneticState !== 'none') return;
        this.game.magneticState = 'entering';
        this.game.attachedTarget = targetElement;
    }

    exitMagneticMode() {
        if (!this.isActive || !this.game) return;
        // Request exit transition. Final cleanup (re-enabling pointer events
        // and removing the attached target class) is handled by AsteroidsGame
        // when the visual exit transition completes to avoid pointer-event races.
        if (this.game.magneticState === 'active' || this.game.magneticState === 'entering') {
            this.game.magneticState = 'exiting';
        }
    }
}