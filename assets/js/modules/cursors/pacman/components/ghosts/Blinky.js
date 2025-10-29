// assets/js/modules/cursors/pacman/components/ghosts/Blinky.js
import { HunterGhost } from './HunterGhost.js';
import { CONFIG } from '../../config.js';

export class Blinky extends HunterGhost {
    constructor(canvas) { super('blinky', canvas); }
    
    // CORRETTO: Firma del metodo standardizzata
    updateAI(deltaTime, player, mouse, gameState, dependencies) {
        const p = CONFIG.BLINKY_AIM_PREDICTION;
        const targetX = (player.x * (1 - p)) + (mouse.x * p);
        const targetY = (player.y * (1 - p)) + (mouse.y * p);
        
        this.target.x = targetX;
        this.target.y = targetY;
        this.speedFactor = 1.0;
        
        if (Math.hypot(this.x - player.x, this.y - player.y) < CONFIG.BLINKY_LUNGE_DISTANCE) {
            this.speedFactor = CONFIG.BLINKY_LUNGE_FACTOR;
        }
        return []; // Deve sempre restituire un array
    }
}