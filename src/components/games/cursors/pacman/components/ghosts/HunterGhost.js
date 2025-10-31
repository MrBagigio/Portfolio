// assets/js/modules/cursors/pacman/components/ghosts/HunterGhost.js

import { Ghost } from './Ghost.js';
import { CONFIG } from '../../config.js';

export class HunterGhost extends Ghost {
    constructor(type, canvas, radius = 10) {
        const { x, y, entryX, entryY } = HunterGhost.getSpawnPosition(type, canvas);
        super(x, y, radius);
        
        this.isHunter = true;
        this.type = type;
        this.canvas = canvas;
        this.state = 'entering';
        this.entryPoint = { x: entryX, y: entryY };
        this.target = { x, y };
        this.isEnraged = false;
        this.speedFactor = 1.0;
        this.isAiming = false;
        this.spawnTimer = 0;
        this.lastDebug = 0;
        
        this.vx = 0;
        this.vy = 0;

        this.scatterTarget = this.getScatterTarget(canvas);
    }

    getScatterTarget(canvas) {
        const margin = 50;
        if (this.type === 'blinky') return { x: canvas.width - margin, y: margin };
        if (this.type === 'pinky') return { x: margin, y: margin };
        if (this.type === 'clyde') return { x: margin, y: canvas.height - margin };
        if (this.type === 'inky') return { x: canvas.width - margin, y: canvas.height - margin };
        return { x: canvas.width / 2, y: canvas.height / 2 };
    }

    static getSpawnPosition(type, canvas) {
        let x, y, entryX, entryY;
        const m = 50;
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = -20; y = Math.random() * canvas.height; entryX = m; entryY = y; }
        else if (side === 1) { x = canvas.width + 20; y = Math.random() * canvas.height; entryX = canvas.width - m; entryY = y; }
        else if (side === 2) { x = Math.random() * canvas.width; y = -20; entryX = x; entryY = m; }
        else { x = Math.random() * canvas.width; y = canvas.height + 20; entryX = x; entryY = canvas.height - m; }
        return { x, y, entryX, entryY };
    }
    
    update(deltaTime, player, gameState, boundaries, dependencies) {
        this.spawnTimer += deltaTime;
        
        if (this.state === 'entering' && this.spawnTimer > 5) {
            this.state = 'active';
        }

        let actions = [];
        if (this.state === 'entering') {
            this.target = this.entryPoint;
            if (Math.hypot(this.x - this.target.x, this.y - this.target.y) < 15) {
                this.state = 'active';
            }
        } else if (this.state === 'retreating') {
            const retreatTarget = HunterGhost.getSpawnPosition(this.type, this.canvas);
            this.target = { x: retreatTarget.x, y: retreatTarget.y };
            if (Math.hypot(this.x - this.target.x, this.y - this.target.y) < 15) {
                this.markForRemoval();
            }
        } else {
            if (gameState.aiState === 'scatter') {
                this.target = this.scatterTarget;
            } else {
                // CORREZIONE: Assicuriamoci che 'player' sia disponibile prima di chiamare l'AI
                if (!player || typeof player.x !== 'number') {
                    // Se non abbiamo il player, fallback allo scatter target per evitare crash
                    this.target = this.scatterTarget;
                    actions = [];
                } else {
                    // Passiamo l'oggetto dependencies che riceviamo
                    actions = this.updateAI(deltaTime, player, gameState.mouse, gameState, dependencies);
                }
            }
        }

    // I fantasmi entrano in "enraged" solo mentre il giocatore sta effettivamente
    // eseguendo un boost (player.isBoosting). Usare boostCooldownTimer causava
    // l'enraged per tutta la durata del cooldown e rendeva i comportamenti
    // frenetici/incoerenti.
    this.isEnraged = !!(player && player.isBoosting);
        this.moveTowardsTarget(deltaTime, gameState.score, boundaries);
        this.enforceBounds();
        return actions;
    }
    
    updateAI(deltaTime, player, mouse, gameState, dependencies) {
        return [];
    }

    moveTowardsTarget(deltaTime, score, boundaries) {
        let currentSpeed = Math.min(CONFIG.HUNTER_MAX_SPEED, CONFIG.HUNTER_BASE_SPEED + (score / CONFIG.HUNTER_SCORE_SPEED_BONUS));
        if (this.isEnraged) currentSpeed *= CONFIG.HUNTER_ENRAGE_FACTOR;
        currentSpeed *= this.speedFactor;
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        
        let moveX = dx;
        let moveY = dy;

        const avoidance = this.calculateAvoidance(boundaries);
        moveX += avoidance.x * CONFIG.AI_OBSTACLE_AVOIDANCE_FORCE;
        moveY += avoidance.y * CONFIG.AI_OBSTACLE_AVOIDANCE_FORCE;

        const dist = Math.hypot(moveX, moveY);
        
        if (dist > 1) {
            this.vx = (moveX / dist) * currentSpeed;
            this.vy = (moveY / dist) * currentSpeed;
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
        }
    }

    calculateAvoidance(boundaries) {
        const avoidanceVector = { x: 0, y: 0 };
        if (!boundaries) return avoidanceVector;
        
        const feelerLength = this.radius * 3;
        const speed = Math.hypot(this.vx, this.vy);
        const feelerX = this.x + (speed > 0 ? this.vx / speed : 0) * feelerLength;
        const feelerY = this.y + (speed > 0 ? this.vy / speed : 0) * feelerLength;

        for (const rect of boundaries) {
            if (feelerX > rect.left && feelerX < rect.right && feelerY > rect.top && feelerY < rect.bottom) {
                avoidanceVector.x = feelerX - (rect.left + rect.width / 2);
                avoidanceVector.y = feelerY - (rect.top + rect.height / 2);
                
                const mag = Math.hypot(avoidanceVector.x, avoidanceVector.y);
                if (mag > 0) {
                    avoidanceVector.x /= mag;
                    avoidanceVector.y /= mag;
                }
                return avoidanceVector;
            }
        }
        return avoidanceVector;
    }

    retreat() {
        this.state = 'retreating';
    }
    
    enforceBounds() {
        const buffer = 20;
        if (this.type === 'spooky') {
            if (this.x < -buffer) this.x = this.canvas.width + buffer;
            if (this.x > this.canvas.width + buffer) this.x = -buffer;
            if (this.y < -buffer) this.y = this.canvas.height + buffer;
            if (this.y > this.canvas.height + buffer) this.y = -buffer;
        } else {
            this.x = Math.max(buffer, Math.min(this.canvas.width - buffer, this.x));
            this.y = Math.max(buffer, Math.min(this.canvas.height - buffer, this.y));
        }
    }

    draw(ctx) {
        const isFlickering = this.isEnraged && Math.floor(performance.now() / 100) % 2 === 0;
        if (isFlickering) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.isAiming) {
            ctx.globalAlpha = (Math.sin(performance.now() * 0.03) * 0.5 + 0.5);
        }

        ctx.strokeStyle = CONFIG.THEME.ghosts[this.type];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI, 0);
        ctx.lineTo(this.radius, this.radius);
        ctx.lineTo(this.radius / 2, this.radius - this.radius / 4);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius / 2, this.radius - this.radius / 4);
        ctx.lineTo(-this.radius, this.radius);
        ctx.closePath();
        ctx.stroke();
        this.drawEyes(ctx);
        ctx.restore();
    }

    drawEyes(ctx) {
        ctx.beginPath();
        ctx.moveTo(-this.radius / 1.5, -this.radius / 3);
        ctx.lineTo(-this.radius / 4, -this.radius / 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.radius / 1.5, -this.radius / 3);
        ctx.lineTo(this.radius / 4, -this.radius / 5);
        ctx.stroke();
    }
}