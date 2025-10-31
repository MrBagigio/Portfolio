// assets/js/modules/cursors/asteroids/entities/Asteroid.js

import { CONFIG } from '../config.js';

function generateAsteroidShape() {
    const shape = [];
    const points = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noisyRadius = 0.7 + Math.random() * 0.6;
        shape.push({ x: Math.cos(angle) * noisyRadius, y: Math.sin(angle) * noisyRadius });
    }
    return shape;
}

export class Asteroid {
    constructor({ x, y, vx, vy, type = 'normal' }) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.shape = generateAsteroidShape();
        this.spawnProgress = 0;
        this.shouldBeRemoved = false;

        switch (type) {
            case 'fast': this.health = 1; this.vx *= 2.5; this.vy *= 2.5; this.radius = 25; this.color = '#FFFFFF'; break;
            case 'large': this.health = 5; this.vx *= 0.5; this.vy *= 0.5; this.radius = 60; this.color = '#FFFFFF'; break;
            case 'homing': this.health = 2; this.radius = CONFIG.ASTEROID_BASE_RADIUS; this.color = '#FF6347'; break;
            case 'debris': this.health = 1; this.radius = 15; this.color = '#A9A9A9'; break;
            default: this.health = CONFIG.ASTEROID_BASE_HEALTH; this.radius = CONFIG.ASTEROID_BASE_RADIUS; this.color = '#FFFFFF'; break;
        }
    }

    update(player, boundaries) {
        if (this.type === 'homing' && player) {
            const angleToShip = Math.atan2(player.y - this.y, player.x - this.x);
            this.vx += Math.cos(angleToShip) * 0.02;
            this.vy += Math.sin(angleToShip) * 0.02;
            const speed = Math.hypot(this.vx, this.vy);
            if (speed > 1.2) { this.vx = (this.vx / speed) * 1.2; this.vy = (this.vy / speed) * 1.2; }
        }

        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        if (this.spawnProgress < 1) this.spawnProgress += 0.05;

        this.handleBoundaries(boundaries);
    }
    
    handleBoundaries(boundaries) {
        let bounced = false;
        if (boundaries && boundaries.length > 0) {
            for (const rect of boundaries) {
                const closestX = Math.max(rect.left, Math.min(this.x, rect.right));
                const closestY = Math.max(rect.top, Math.min(this.y, rect.bottom));
                const distance = Math.hypot(this.x - closestX, this.y - closestY);

                if (distance < this.radius) {
                    const overlapX = this.radius - Math.abs(this.x - closestX);
                    const overlapY = this.radius - Math.abs(this.y - closestY);

                    if (overlapX < overlapY) {
                        this.vx *= -1;
                        this.x += this.vx > 0 ? overlapX : -overlapX;
                    } else {
                        this.vy *= -1;
                        this.y += this.vy > 0 ? overlapY : -overlapY;
                    }
                    bounced = true;
                    break;
                }
            }
        }

        if (!bounced) {
             this.wrapEntity(boundaries);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        this.shape.forEach((point, j) => {
            const px = point.x * this.radius * this.spawnProgress;
            const py = point.y * this.radius * this.spawnProgress;
            ctx[j === 0 ? 'moveTo' : 'lineTo'](px, py);
        });
        ctx.closePath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.shouldBeRemoved = true;
            if (this.type === 'large' || this.type === 'normal') {
                const debrisCount = this.type === 'large' ? 3 : 2;
                const newDebris = [];
                for (let i = 0; i < debrisCount; i++) {
                    const speed = CONFIG.DEBRIS_SPEED_MULTIPLIER;
                    newDebris.push(new Asteroid({
                        x: this.x,
                        y: this.y,
                        vx: (Math.random() * 2 - 1) * speed,
                        vy: (Math.random() * 2 - 1) * speed,
                        type: 'debris'
                    }));
                }
                return newDebris;
            }
        }
        return null;
    }

    wrapEntity(boundaries) {
        const margin = this.radius;
        const scrollY = window.scrollY;
        const viewHeight = window.innerHeight;

        const oldX = this.x;
        const oldY = this.y;

        if (this.x < -margin) this.x = window.innerWidth + margin;
        if (this.x > window.innerWidth + margin) this.x = -margin;
        
        // Controlla se l'asteroide è uscito dalla vista verticale
        if (this.y < scrollY - margin) this.y = scrollY + viewHeight + margin;
        if (this.y > scrollY + viewHeight + margin) this.y = scrollY - margin;

        // If wrapped position collides with boundaries, remove the asteroid
        if (boundaries && boundaries.length > 0) {
            for (const rect of boundaries) {
                const closestX = Math.max(rect.left, Math.min(this.x, rect.right));
                const closestY = Math.max(rect.top, Math.min(this.y, rect.bottom));
                const distance = Math.hypot(this.x - closestX, this.y - closestY);
                if (distance < this.radius) {
                    this.shouldBeRemoved = true;
                    return;
                }
            }
        }
    }
}