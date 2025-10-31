// assets/js/modules/cursors/pacman/managers/EntityManager.js

import { CONFIG } from '../config.js';
import { ScaredGhost } from '../components/ghosts/ScaredGhost.js';
import { Projectile } from '../components/Projectile.js';
import { Blinky, Pinky, Clyde, Inky, Spooky } from '../components/index.js';
import { Particle, WarpRing } from '../components/Effects.js';

export class EntityManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    get hunterCount() {
        return this.hunters.length;
    }

    getCollidableEntities() {
        return {
            hunters: this.hunters,
            scaredGhosts: this.scaredGhosts,
            projectiles: this.projectiles,
        };
    }

    add(entity) {
        this.entities.push(entity);
        if (entity.isHunter) this.hunters.push(entity);
        if (entity instanceof ScaredGhost) this.scaredGhosts.push(entity);
        if (entity instanceof Projectile) this.projectiles.push(entity);
    }

    update(deltaTime, player, gameState, boundaries) {
        const allActions = [];
        const blinky = this.hunters.find(h => h.type === 'blinky');

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            const entityActions = entity.update(deltaTime, player, gameState, boundaries, { blinky });
            
            if (entityActions && entityActions.length > 0) {
                allActions.push(...entityActions);
            }

            if (entity.isDead) {
                const removedEntity = this.entities.splice(i, 1)[0];
                // Remove from typed lists only if found (safely handle indexOf === -1)
                if (removedEntity.isHunter) {
                    const idx = this.hunters.indexOf(removedEntity);
                    if (idx >= 0) this.hunters.splice(idx, 1);
                }
                if (removedEntity instanceof ScaredGhost) {
                    const idx = this.scaredGhosts.indexOf(removedEntity);
                    if (idx >= 0) this.scaredGhosts.splice(idx, 1);
                }
                if (removedEntity instanceof Projectile) {
                    const idx = this.projectiles.indexOf(removedEntity);
                    if (idx >= 0) this.projectiles.splice(idx, 1);
                }
            }
        }
        return allActions;
    }

    draw(ctx) {
        for (const entity of this.entities) {
            entity.draw(ctx);
        }
    }
    
    addEffect(effect) {
        if (effect.type === 'warpRing') this.add(new WarpRing(effect.x, effect.y));
    }

    spawnScaredGhost(deltaTime, player, mouse) {
        // Ensure spawn timer is a number
        this.scaredGhostSpawnTimer = this.scaredGhostSpawnTimer || 0;
        const distanceToMouse = Math.hypot(mouse.x - player.x, mouse.y - player.y);
        if (this.scaredGhosts.length < CONFIG.MAX_SCARED_GHOSTS_ON_SCREEN && distanceToMouse > 2 && (this.scaredGhostSpawnTimer += deltaTime) > CONFIG.SCARED_GHOST_SPAWN_INTERVAL) {
            this.scaredGhostSpawnTimer = 0;
            this.add(new ScaredGhost(player, mouse));
        }
    }

    spawnHunter(type) {
        const hunterConstructors = {
            blinky: Blinky, pinky: Pinky, clyde: Clyde, inky: Inky, spooky: Spooky
        };
        const Ctor = hunterConstructors[type && type.toLowerCase()];
        if (typeof Ctor === 'function') {
            this.add(new Ctor(this.canvas));
        }
    }
    
    fireProjectile(payload) {
        this.add(new Projectile(payload.x, payload.y, payload.angle, payload.type, payload.speed));
    }

    // createParticles: optionally force creation (ignore global cap) for large explosions
    createParticles(x, y, count, color, force = false) {
        // Prevent unbounded particle inflation by capping active particles
        const MAX_PARTICLES = 300;
        let activeParticles = 0;
        for (const e of this.entities) if (e instanceof Particle) activeParticles++;
        for (let i = 0; i < count; i++) {
            if (!force && activeParticles >= MAX_PARTICLES) break;
            this.add(new Particle(x, y, color));
            activeParticles++;
        }
    }
    
    clearScaredGhosts() {
        const ghostsToReturn = [...this.scaredGhosts];
        for (const ghost of ghostsToReturn) {
            ghost.markForRemoval();
        }
        return ghostsToReturn;
    }

    retreatAllHunters() {
        this.hunters.forEach(hunter => hunter.retreat());
    }
    
    reset() {
        this.entities = [];
        this.hunters = [];
        this.scaredGhosts = [];
        this.projectiles = [];
        this.scaredGhostSpawnTimer = 0;
    }
}