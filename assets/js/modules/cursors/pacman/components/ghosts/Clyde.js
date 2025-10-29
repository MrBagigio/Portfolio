// assets/js/modules/cursors/pacman/components/ghosts/Clyde.js
import { HunterGhost } from './HunterGhost.js';
import { CONFIG } from '../../config.js';

export class Clyde extends HunterGhost {
    constructor(canvas) { super('clyde', canvas); }
    
    // CORRETTO: Firma del metodo standardizzata
    updateAI(deltaTime, player, mouse, gameState, dependencies) {
        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        
        if (!this.isEnraged && distToPlayer < CONFIG.CLYDE_FEAR_DISTANCE) {
            this.target.x = this.x - (player.x - this.x);
            this.target.y = this.y - (player.y - this.y);
        } else {
            const p = CONFIG.BLINKY_AIM_PREDICTION;
            this.target.x = (player.x * (1 - p)) + (mouse.x * p);
            this.target.y = (player.y * (1 - p)) + (mouse.y * p);
        }
        return [];
    }
}