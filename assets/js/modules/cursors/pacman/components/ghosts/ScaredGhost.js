// assets/js/modules/cursors/pacman/components/ghosts/ScaredGhost.js
import { Ghost } from './Ghost.js';
import { CONFIG } from '../../config.js';

export class ScaredGhost extends Ghost {
    constructor(player, mouse) {
        const dx = mouse.x - player.x; const dy = mouse.y - player.y; const dist = Math.hypot(dx, dy);
        let spawnX = mouse.x, spawnY = mouse.y, pushVx = 0, pushVy = 0;
        if (dist > 1) {
            const normDx = dx / dist, normDy = dy / dist;
            spawnX += normDx * CONFIG.SCARED_GHOST_SPAWN_OFFSET; spawnY += normDy * CONFIG.SCARED_GHOST_SPAWN_OFFSET;
            pushVx = normDx * CONFIG.SCARED_GHOST_SPAWN_PUSH_SPEED; pushVy = normDy * CONFIG.SCARED_GHOST_SPAWN_PUSH_SPEED;
        }
        super(spawnX, spawnY);
        this.state = 'spawning';
        this.life = CONFIG.SCARED_GHOST_LIFETIME;
        this.pushVx = pushVx; this.pushVy = pushVy;
        this.spawnProgress = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = Math.random() * 2 + 1;
        this.shape = CONFIG.SCARED_GHOST_SHAPES[Math.floor(Math.random() * CONFIG.SCARED_GHOST_SHAPES.length)];
        this.colorHue = 190 + Math.random() * 80;
        this.alpha = 1;
    }
    
    update(deltaTime, player) {
        this.life -= deltaTime;
        if (this.state !== 'kamikaze' && this.life < CONFIG.SCARED_GHOST_KAMIKAZE_THRESHOLD && this.state !== 'eaten') {
            this.state = 'kamikaze';
        }
        if (this.state === 'eaten') {
            this.alpha -= 2 * deltaTime;
            if (this.alpha <= 0) this.markForRemoval();
            return []; // Nessuna azione
        }

        if (this.life <= 0) {
            this.markForRemoval();
            // Restituisce un'azione per creare particelle E un'esplosione per la collisione
            return [
                { type: 'create_particles', payload: { x: this.x, y: this.y, count: 25, color: CONFIG.THEME.ghosts.kamikazeEnd } },
                { type: 'spawn_explosion', payload: { x: this.x, y: this.y } }
            ];
        }

        let finalVx = 0, finalVy = 0;
        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        
        if (this.state === 'kamikaze') {
            const dx = player.x - this.x, dy = player.y - this.y;
            if (distToPlayer > 1) {
                finalVx = (dx / distToPlayer) * CONFIG.SCARED_GHOST_BASE_SPEED * CONFIG.SCARED_GHOST_KAMIKAZE_FACTOR;
                finalVy = (dy / distToPlayer) * CONFIG.SCARED_GHOST_BASE_SPEED * CONFIG.SCARED_GHOST_KAMIKAZE_FACTOR;
            }
        } else {
            this.wanderTimer -= deltaTime;
            if (this.wanderTimer <= 0) { this.wanderAngle = Math.random() * Math.PI * 2; this.wanderTimer = Math.random() * 2 + 1; }
            finalVx += Math.cos(this.wanderAngle) * CONFIG.SCARED_GHOST_WANDER_SPEED;
            finalVy += Math.sin(this.wanderAngle) * CONFIG.SCARED_GHOST_WANDER_SPEED;
            if (this.state === 'spawning') {
                this.spawnProgress += deltaTime / CONFIG.SCARED_GHOST_SPAWN_DURATION;
                finalVx += this.pushVx * (1 - this.spawnProgress);
                finalVy += this.pushVy * (1 - this.spawnProgress);
                if (this.spawnProgress >= 1) { this.spawnProgress = 1; this.state = 'scared'; }
            } else if (distToPlayer < 150) {
                const dx = this.x - player.x, dy = this.y - player.y;
                if (distToPlayer > 1) {
                    finalVx += (dx / distToPlayer) * CONFIG.SCARED_GHOST_BASE_SPEED;
                    finalVy += (dy / distToPlayer) * CONFIG.SCARED_GHOST_BASE_SPEED;
                }
            }
            let pushX = 0, pushY = 0, m = CONFIG.SCARED_GHOST_EDGE_AVOIDANCE_MARGIN;
            if (this.x < m) pushX = 1; else if (this.x > window.innerWidth - m) pushX = -1;
            if (this.y < m) pushY = 1; else if (this.y > window.innerHeight - m) pushY = -1;
            finalVx += pushX * CONFIG.SCARED_GHOST_BASE_SPEED;
            finalVy += pushY * CONFIG.SCARED_GHOST_BASE_SPEED;
        }
        this.x += finalVx * deltaTime;
        this.y += finalVy * deltaTime;

        return [];
    }

    onEaten() { this.state = 'eaten'; }

    draw(ctx) {
        const scale = this.spawnProgress !== undefined ? this.spawnProgress : 1;
        if (scale <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.state === 'eaten') ctx.globalAlpha = this.alpha;
        
        let color;
        if (this.state === 'kamikaze') {
            // Progress [0..1] as ghost approaches explosion time
            const progress = Math.min(1, Math.max(0, 1 - (this.life / CONFIG.SCARED_GHOST_KAMIKAZE_THRESHOLD)));
            // Transition hue towards red (0) as progress increases
            const hue = this.colorHue * (1 - progress);
            const lightness = 65 - (20 * progress);
            color = `hsla(${hue}, 100%, ${lightness}%, 0.95)`;
            // Flash white when very near to explosion for emphasis
            if (this.life < 0.5 && Math.floor(this.life * 20) % 2 === 0) color = 'white';
        } else {
            color = `hsla(${this.colorHue}, 100%, 70%, 0.9)`;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -performance.now() / 50;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * scale, Math.PI, 0);
        this.shape.forEach(p => ctx.lineTo(p.x * this.radius * scale, p.y * this.radius * scale));
        ctx.closePath();
        ctx.stroke();

        if (scale > 0.5) {
            ctx.beginPath();
            ctx.arc(-this.radius * scale / 2.5, -this.radius * scale / 4, 1.5 * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(this.radius * scale / 2.5, -this.radius * scale / 4, 1.5 * scale, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw a small bomb icon above the head when kamikaze
        if (this.state === 'kamikaze') {
            const bx = 0, by = -this.radius * scale * 1.6;
            ctx.save();
            // bomb body
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(bx, by, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
            // fuse
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + 3 * scale, by - 2 * scale);
            ctx.lineTo(bx + 8 * scale, by - 8 * scale);
            ctx.stroke();
            // little spark
            ctx.fillStyle = 'yellow';
            if (Math.floor(performance.now() / 150) % 2 === 0) ctx.fillRect(bx + 7 * scale, by - 9 * scale, 2 * scale, 2 * scale);
            ctx.restore();
        }
        ctx.restore();
    }
}