// assets/js/modules/cursors/asteroids/entities/ai/AlienAI.js

import { CONFIG } from '../../config.js';
import { Bullet } from '../Bullet.js';

export class AlienAI {
    constructor(ship) {
        this.ship = ship; // Riferimento alla nave che controlla
        this.pathTimer = Math.random() * 100; // Randomizza l'inizio del pattern
        this.shootCooldown = 120 + Math.random() * 60;
    }

    update(player) {
        this.pathTimer++;
        this.ship.y += Math.sin(this.pathTimer * 0.05) * 0.5; // Movimento sinusoidale

        // Controlla se è fuori schermo
        if ((this.ship.vx > 0 && this.ship.x > window.innerWidth + this.ship.radius * 2) ||
            (this.ship.vx < 0 && this.ship.x < -this.ship.radius * 2)) {
            this.ship.shouldBeRemoved = true;
        }

        // Logica di sparo
        if (--this.shootCooldown <= 0 && player && !player.isRespawning) {
            this.shootCooldown = 120 + Math.random() * 60;
            const angle = Math.atan2(player.y - this.ship.y, player.x - this.ship.x);
            
            return new Bullet({
                x: this.ship.x,
                y: this.ship.y,
                vx: Math.cos(angle) * CONFIG.ENEMY_BULLET_SPEED,
                vy: Math.sin(angle) * CONFIG.ENEMY_BULLET_SPEED,
                radius: CONFIG.ENEMY_BULLET_RADIUS,
                color: '#33FF33',
                owner: 'enemy'
            });
        }
        
        return null; // Non spara questo frame
    }
}