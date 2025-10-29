// assets/js/modules/cursors/pacman/components/ghosts/Inky.js
import { HunterGhost } from './HunterGhost.js';
import { CONFIG } from '../../config.js';

export class Inky extends HunterGhost {
    constructor(canvas) {
        super('inky', canvas);
    }

    // CORRETTO: Firma del metodo standardizzata
    updateAI(deltaTime, player, mouse, gameState, dependencies) {
        const { blinky } = dependencies;
        if (blinky) {
            const pivotX = player.x + Math.cos(player.angle) * CONFIG.INKY_BLINKY_DEPENDENCY_DISTANCE;
            const pivotY = player.y + Math.sin(player.angle) * CONFIG.INKY_BLINKY_DEPENDENCY_DISTANCE;
            this.target.x = blinky.x + (pivotX - blinky.x) * 2;
            this.target.y = blinky.y + (pivotY - blinky.y) * 2;
        } else {
            const p = CONFIG.BLINKY_AIM_PREDICTION;
            this.target.x = (player.x * (1 - p)) + (mouse.x * p);
            this.target.y = (player.y * (1 - p)) + (mouse.y * p);
        }
        return [];
    }
}