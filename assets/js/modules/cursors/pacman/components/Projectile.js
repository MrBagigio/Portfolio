// assets/js/modules/cursors/pacman/components/Projectile.js
import { CONFIG } from '../config.js';

export class Projectile {
    constructor(x, y, angle, type = 'normal', speed = CONFIG.SPOOKY_PROJECTILE_SPEED) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.type = type;
        this.isDead = false;
        this.life = 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        if (type === 'seeking') { this.vx *= 0.8; this.vy *= 0.8; }
        // Determine color based on type (configurable)
        this.color = (type === 'seeking') ? CONFIG.THEME.ghosts.spooky : (CONFIG.THEME.ghosts.blinky || CONFIG.THEME.wireframe);
    }

    update(deltaTime, player) {
        if (this.type === 'seeking') {
            const dX = player.x - this.x;
            const dY = player.y - this.y;
            const targetAngle = Math.atan2(dY, dX);
            const currentAngle = Math.atan2(this.vy, this.vx);
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            const newAngle = currentAngle + angleDiff * CONFIG.SPOOKY_SEEKING_TURN_RATE;
            const speed = Math.hypot(this.vx, this.vy);
            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;
        }
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.life -= deltaTime;
        if (this.life <= 0 || this.x < -10 || this.x > window.innerWidth + 10 || this.y < -10 || this.y > window.innerHeight + 10) this.isDead = true;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color || CONFIG.THEME.ghosts.spooky;
        ctx.fill();
    }

    // CORREZIONE: Aggiunto il metodo mancante per la rimozione
    markForRemoval() { this.isDead = true; }
}