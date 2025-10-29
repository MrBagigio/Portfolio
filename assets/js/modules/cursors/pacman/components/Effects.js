// assets/js/modules/cursors/pacman/components/Effects.js
import { CONFIG } from '../config.js';

// Classe base per effetti a tempo
class Effect {
    constructor(x, y, life = 0.5) {
        this.x = x;
        this.y = y;
        this.life = life;
        this.maxLife = life;
        this.isDead = false;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        // Implementato dalle classi figlie
    }
}

// Effetto particellare generico
export class Particle extends Effect {
    constructor(x, y, color) {
        super(x, y, Math.random() * 0.5 + 0.25); // Durata particella
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 120 + 60;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 1.5 + 0.5;
        this.color = color;
    }

    update(deltaTime) {
        super.update(deltaTime); // Gestisce la durata della vita
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        const alpha = this.life / this.maxLife;
        // Evitiamo manipolazioni fragili della stringa colore: usiamo globalAlpha
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color || 'rgba(255, 255, 255, 1)';
        ctx.fill();
        ctx.restore();
    }
}

// Effetto anello del boost
export class WarpRing extends Effect {
    constructor(x, y) {
        super(x, y, 0.4); // Durata dell'anello
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        const easedProgress = Math.pow(progress, 0.5);
        const currentRadius = easedProgress * 80;
        const currentAlpha = 1 - progress;
        const currentLineWidth = 3 * currentAlpha;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 255, ${currentAlpha})`; // Usa il colore del tema boost
        ctx.lineWidth = currentLineWidth;
        ctx.stroke();
        ctx.restore();
    }
}