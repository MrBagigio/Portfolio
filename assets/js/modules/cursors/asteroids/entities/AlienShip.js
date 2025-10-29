// assets/js/modules/cursors/asteroids/entities/AlienShip.js

import { CONFIG } from '../config.js';
import { AlienAI } from './ai/AlienAI.js'; // Importa la nuova AI

export class AlienShip {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.ALIEN_SHIP_RADIUS;
        this.health = CONFIG.ALIEN_SHIP_HEALTH;
        this.vx = (x < window.innerWidth / 2) ? 1.5 : -1.5;
        this.vy = 0;
        this.shouldBeRemoved = false;
        this.color = '#33FF33';
        this.spawnProgress = 0; // Aggiunto per l'animazione di spawn

        this.ai = new AlienAI(this); // Crea un'istanza dell'AI
    }

    update(player, boundaries) {
        // Anima lo spawn
        if (this.spawnProgress < 1) {
            this.spawnProgress += 0.04;
        }

        // Applica il movimento base
        this.x += this.vx;
        this.y += this.vy;

        // Delega le decisioni complesse (movimento verticale, sparo) all'AI
        const bullet = this.ai.update(player);
        
        this.wrapEntity();

        return bullet; // Ritorna un proiettile se l'AI ha deciso di sparare
    }

    draw(ctx) {
        if (this.spawnProgress < 0.1) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Applica la scala durante lo spawn
        const scale = this.spawnProgress;
        ctx.scale(scale, scale);

        const r = this.radius;
        const mainBodyHeight = r * 0.5;
        const domeRadius = r * 0.7;
        
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;

        // Corpo
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.quadraticCurveTo(0, mainBodyHeight, r, 0);
        ctx.quadraticCurveTo(0, -mainBodyHeight, -r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cupola
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -domeRadius * 0.3, domeRadius, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.shouldBeRemoved = true;
        }
        return null; // Non genera detriti
    }

    wrapEntity() {
        const margin = this.radius;
        const scrollY = window.scrollY;
        const viewHeight = window.innerHeight;

        if (this.x < -margin) this.x = window.innerWidth + margin;
        if (this.x > window.innerWidth + margin) this.x = -margin;
        
        if (this.y < scrollY - margin) this.y = scrollY + viewHeight + margin;
        if (this.y > scrollY + viewHeight + margin) this.y = scrollY - margin;
    }
}