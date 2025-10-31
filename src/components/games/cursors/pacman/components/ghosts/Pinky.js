// assets/js/modules/cursors/pacman/components/ghosts/Pinky.js
import { HunterGhost } from './HunterGhost.js';
import { CONFIG } from '../../config.js';

export class Pinky extends HunterGhost {
    constructor(canvas) { super('pinky', canvas); }
    
    // CORRETTO: Firma del metodo standardizzata
    updateAI(deltaTime, player, mouse, gameState, dependencies) {
        this.target.x = player.x + Math.cos(player.angle) * CONFIG.PINKY_AIM_PREDICTION_DISTANCE;
        this.target.y = player.y + Math.sin(player.angle) * CONFIG.PINKY_AIM_PREDICTION_DISTANCE;
        return [];
    }
}