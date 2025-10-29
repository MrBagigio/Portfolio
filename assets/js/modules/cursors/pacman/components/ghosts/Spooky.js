// assets/js/modules/cursors/pacman/components/ghosts/Spooky.js
import { HunterGhost } from './HunterGhost.js';
import { CONFIG } from '../../config.js';

export class Spooky extends HunterGhost {
    constructor(canvas) {
        super('spooky', canvas);
        this.fireTimer = CONFIG.SPOOKY_FIRE_RATE + Math.random() * 2;
        this.strafeDirection = (Math.random() > 0.5 ? 1 : -1);
        this.strafeTimer = 2 + Math.random() * 3;
        this.isAiming = false;
        this.frenzyState = null;
        this.burstsLeft = 0;
        this.isBursting = false;
        this.aimTimer = 0;
        this.dashTarget = null;
    }

    updateAI(deltaTime, player, mouse, gameState, dependencies) {
        const actions = [];
        const dxToPlayer = player.x - this.x;
        const dyToPlayer = player.y - this.y;
        const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);

        if (this.isEnraged) {
            if (!this.frenzyState) {
                this.frenzyState = 'dashing';
                this.dashTarget = null;
            }
            let speedFactor = 1;
            switch (this.frenzyState) {
                case 'dashing':
                    if (!this.dashTarget) {
                        const angleToPlayer = Math.atan2(dyToPlayer, dxToPlayer);
                        const dashAngle = angleToPlayer + (Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1));
                        this.dashTarget = { x: this.x + Math.cos(dashAngle) * 150, y: this.y + Math.sin(dashAngle) * 150 };
                    }
                    this.target = this.dashTarget;
                    speedFactor = CONFIG.SPOOKY_DASH_SPEED / CONFIG.HUNTER_BASE_SPEED;
                    if (Math.hypot(this.x - this.dashTarget.x, this.y - this.dashTarget.y) < 20) {
                        this.frenzyState = 'aiming';
                        this.aimTimer = 0.25;
                    }
                    break;
                case 'aiming':
                    this.aimTimer -= deltaTime;
                    if (this.aimTimer <= 0) {
                        const angle = Math.atan2(dyToPlayer, dxToPlayer);
                        actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle, type: 'seeking', speed: CONFIG.SPOOKY_SNIPER_SHOT_SPEED } });
                        this.frenzyState = 'cooldown';
                        this.fireTimer = CONFIG.SPOOKY_ENRAGED_FIRE_RATE;
                    }
                    break;
                case 'cooldown':
                    this.fireTimer -= deltaTime;
                    if (this.fireTimer <= 0) {
                        this.frenzyState = 'dashing';
                        this.dashTarget = null;
                    }
                    break;
            }
            this.speedFactor = speedFactor;
            return actions;
        }

        if (this.frenzyState) {
            this.frenzyState = null;
            this.dashTarget = null;
        }

        this.fireTimer -= deltaTime;
        this.strafeTimer -= deltaTime;
        if (this.strafeTimer <= 0) {
            this.strafeDirection *= -1;
            this.strafeTimer = 3 + Math.random() * 4;
        }
        
        const normDx = distToPlayer > 1 ? dxToPlayer / distToPlayer : 0;
        const normDy = distToPlayer > 1 ? dyToPlayer / distToPlayer : 0;
        
        const kitePointX = player.x - normDx * CONFIG.SPOOKY_MIN_DISTANCE;
        const kitePointY = player.y - normDy * CONFIG.SPOOKY_MIN_DISTANCE;
        
        this.target = {
            x: kitePointX + (-normDy * this.strafeDirection) * 40,
            y: kitePointY + (normDx * this.strafeDirection) * 40
        };

        if (distToPlayer < CONFIG.SPOOKY_MIN_DISTANCE - 20) {
            this.target.x = this.x - dxToPlayer;
            this.target.y = this.y - dyToPlayer;
        }
        this.speedFactor = 0.85;

        if (this.isBursting) {
            if (this.fireTimer <= 0) {
                const angle = Math.atan2(dyToPlayer, dxToPlayer);
                actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle } });
                this.burstsLeft--;
                if (this.burstsLeft <= 0) {
                    this.isBursting = false;
                    this.fireTimer = CONFIG.SPOOKY_FIRE_RATE + Math.random();
                } else {
                    this.fireTimer = 0.1;
                }
            }
        } else if (this.fireTimer <= 0) {
            this.isAiming = true;
            if (this.fireTimer < -CONFIG.SPOOKY_AIM_TIME) {
                const attackType = ['spread', 'burst', 'seeking'][Math.floor(Math.random() * 3)];
                const angle = Math.atan2(dyToPlayer, dxToPlayer);
                switch (attackType) {
                    case 'spread':
                        actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle: angle - 0.2 } });
                        actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle: angle } });
                        actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle: angle + 0.2 } });
                        break;
                    case 'burst':
                        actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle } });
                        this.isBursting = true;
                        this.burstsLeft = 2;
                        this.fireTimer = 0.1;
                        break;
                    case 'seeking':
                        actions.push({ type: 'spawn_projectile', payload: { x: this.x, y: this.y, angle, type: 'seeking' } });
                        break;
                }
                if (!this.isBursting) {
                    this.fireTimer = CONFIG.SPOOKY_FIRE_RATE + Math.random();
                }
                this.isAiming = false;
            }
        } else {
            this.isAiming = false;
        }
        return actions;
    }

    drawEyes(ctx) {
        ctx.beginPath();
        ctx.arc(0, -this.radius / 4, this.radius / 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}