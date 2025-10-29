// assets/js/modules/cursors/pacman/components/Player.js

import { CONFIG } from '../config.js';
import { isIntersectingLine } from '../utils.js';

export class Player {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        this.prevX = this.x;
        this.prevY = this.y;
        this.angle = 0;
        this.radius = CONFIG.PLAYER_RADIUS;
        this.lives = CONFIG.MAX_LIVES;
        this.isRespawning = false;
        this.respawnTimer = 0;
        this.isBoosting = false;
        this.boostTimer = 0;
        this.boostAngle = 0;
        this.boostCooldownTimer = 0;
        this.mouthAnimationTimer = 0;
    }
    
    update(deltaTime, mouse, magneticTarget) {
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.isBoosting) {
            this.updateBoost(deltaTime);
        } else if (!this.isRespawning) {
            this.updateNormalMovement(deltaTime, mouse, magneticTarget);
        }
       
        if (this.isRespawning) {
            if ((this.respawnTimer -= deltaTime) <= 0) {
                this.isRespawning = false;
            }
        } else if (this.boostCooldownTimer > 0) {
             this.boostCooldownTimer -= deltaTime;
        }

        this.mouthAnimationTimer += deltaTime;
    }

    updateNormalMovement(deltaTime, mouse, magneticTarget) {
        let targetX = mouse.x;
        let targetY = mouse.y;
        let lerpAmount = CONFIG.LERP_AMOUNT;

        if (magneticTarget) {
            const rect = magneticTarget.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
            lerpAmount = CONFIG.MAGNETIC_LERP_AMOUNT;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const lerpFactor = 1 - Math.exp(-lerpAmount * 60 * deltaTime);
        
        this.x += dx * lerpFactor;
        this.y += dy * lerpFactor;
        
        const angleDx = mouse.x - this.x;
        const angleDy = mouse.y - this.y;
        this.angle = Math.atan2(angleDy, angleDx);
    }

    updateBoost(deltaTime) {
        if ((this.boostTimer -= deltaTime) <= 0) {
            this.isBoosting = false;
            return;
        }
        const boostVel = CONFIG.BOOST_SPEED * deltaTime;
        this.x += Math.cos(this.boostAngle) * boostVel;
        this.y += Math.sin(this.boostAngle) * boostVel;
    }
    
    startBoost() {
        if (this.isBoosting || this.boostCooldownTimer > 0 || this.isRespawning) return null;
        this.isBoosting = true;
        this.boostTimer = CONFIG.BOOST_DURATION;
        this.boostAngle = this.angle;
        this.boostCooldownTimer = CONFIG.BOOST_COOLDOWN;
        return { type: 'warpRing', x: this.x, y: this.y };
    }
    
    takeDamage() {
        if (this.isRespawning) return true;
        this.isBoosting = false;
        this.lives--;
        if (this.lives <= 0) return false;
        this.isRespawning = true;
        this.respawnTimer = CONFIG.RESPAWN_DURATION;
        return true;
    }
    
    isIntersecting(entity) {
        if (!this.isBoosting) return false;
        // isIntersectingLine expects objects: (p1, p2, circle, radius)
        const p1 = { x: this.prevX, y: this.prevY };
        const p2 = { x: this.x, y: this.y };
        const circle = { x: entity.x, y: entity.y };
        const radius = (entity.radius || 0) + this.radius;
        return isIntersectingLine(p1, p2, circle, radius);
    }

    draw(ctx, globalAlpha) {
        const isVisible = !(this.isRespawning && Math.floor(this.respawnTimer * 10) % 2 === 0);
        if (!isVisible) return;

        const idleAlpha = 1 - globalAlpha;
        if (idleAlpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = idleAlpha;
            this.drawFollowerCircle(ctx);
            ctx.restore();
        }

        if (globalAlpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = globalAlpha;
            this.drawPacman(ctx);
            if (this.isBoosting) this.drawBoostTrail(ctx);
            ctx.restore();
        }
    }

    drawPacman(ctx, override = {}) {
        const mouthAngle = this.isBoosting ? Math.PI / 3.5 : (Math.sin(this.mouthAnimationTimer * CONFIG.MOUTH_ANIMATION_SPEED) + 1) / 2 * (Math.PI / 4) + 0.1;
        ctx.save();
        ctx.globalAlpha = override.alpha || 1;
        ctx.translate(override.x || this.x, override.y || this.y);
        ctx.rotate(override.angle || this.angle);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, mouthAngle, -mouthAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.strokeStyle = override.color || (this.isBoosting ? CONFIG.THEME.boost : CONFIG.THEME.wireframe);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }
    
    drawBoostTrail(ctx) {
        const boostProgress = this.boostTimer / CONFIG.BOOST_DURATION;
        for (let i = 1; i <= 3; i++) {
            const t = i / 3;
            const distance = 25 * t;
            const x = this.x - Math.cos(this.boostAngle) * distance;
            const y = this.y - Math.sin(this.boostAngle) * distance;
            this.drawPacman(ctx, { x, y, angle: this.boostAngle, color: CONFIG.THEME.boost, alpha: (1 - t) * 0.4 * boostProgress });
        }
    }

    drawFollowerCircle(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}