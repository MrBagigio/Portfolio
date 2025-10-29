// assets/js/modules/cursors/pacman/PacmanGame.js

import { CONFIG } from './config.js';
import { Player } from './components/Player.js';
import { EntityManager } from './managers/EntityManager.js';
import { WaveManager } from './managers/WaveManager.js';
import { UIManager } from './managers/UIManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { ScaredGhost } from './components/ghosts/ScaredGhost.js';
import { debounce } from './utils.js';

export class PacmanGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas || !window.matchMedia("(pointer: fine)").matches) {
            this.isActive = false;
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.isActive = true;
        this.animationFrameId = null;

        this.gameState = {};
        this.globalAlpha = 0;
        
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.magneticTarget = null;
        this.isHoveringPowerUp = false;
        this.isMouseDown = false;
        this.bounceBoundaries = [];

        this.player = new Player();
        this.entityManager = new EntityManager(this.canvas);
        this.waveManager = new WaveManager();
        this.uiManager = new UIManager(this.ctx);
        this.collisionManager = new CollisionManager();

        this.animate = this.animate.bind(this);
    }

    start() {
        if (!this.isActive) return;
        this.resizeCanvas();
        this.addEventListeners();
        this.resetGame();
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        cancelAnimationFrame(this.animationFrameId);
        if (this.gameState.waveTransitionTimer) clearTimeout(this.gameState.waveTransitionTimer);
        this.removeEventListeners();
    }

    resetGame(isSoftReset = false) {
        if (!isSoftReset) {
            this.player.reset();
            this.uiManager.reset();
        }

        this.gameState = {
            ...this.gameState,
            lastTime: performance.now(),
            isGameOver: false,
            isGameActive: false, // Fonte di verità per lo stato di gioco
            score: isSoftReset ? this.gameState.score : 0,
            wave: isSoftReset ? this.gameState.wave : 0,
            isWaveTransition: false,
            waveTransitionTimer: null,
            shake: { intensity: 0, duration: 0 },
            aiState: 'scatter',
            aiStateTimer: CONFIG.AI_STATE_SCATTER_DURATION,
        };
        
        this.entityManager.reset();
        if (isSoftReset) {
            this.startNextWave();
        }
    }

    addEventListeners() {
        this.handleResize = debounce(() => this.resizeCanvas(), 250);
        this.handleScroll = debounce(() => this.handleScrollReset(), 100);
        this.handleMouseMove = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
        this.handleClick = () => { if (this.gameState.isGameOver) this.resetGame(); };
        this.handleMouseDown = (e) => { e.preventDefault(); if (e.button === 0) this.isMouseDown = true; };
        this.handleMouseUp = (e) => { if (e.button === 0) this.isMouseDown = false; };
        this.handleMouseOver = (e) => { if (e.target.closest('.pacman-powerup')) this.isHoveringPowerUp = true; };
        this.handleMouseOut = (e) => { if (e.target.closest('.pacman-powerup')) this.isHoveringPowerUp = false; };

        window.addEventListener('resize', this.handleResize);
        window.addEventListener('scroll', this.handleScroll);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('click', this.handleClick);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('mouseover', this.handleMouseOver);
        document.addEventListener('mouseout', this.handleMouseOut);
    }

    removeEventListeners() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('click', this.handleClick);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mouseover', this.handleMouseOver);
        document.removeEventListener('mouseout', this.handleMouseOut);
    }
    
    handleScrollReset() {
        this.resetGame(true);
    }

    setBounceBoundaries(selector) {
        this.bounceBoundaries = [];
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => this.bounceBoundaries.push(el.getBoundingClientRect()));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.setBounceBoundaries('.interactive-bounce');
    }

    animate(currentTime) {
        if (!this.isActive) return;
        this.animationFrameId = requestAnimationFrame(this.animate);
        
        let deltaTime = (currentTime - (this.gameState.lastTime || currentTime)) / 1000;
        if (deltaTime > CONFIG.MAX_DELTA_TIME) deltaTime = CONFIG.MAX_DELTA_TIME;
        this.gameState.lastTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.update(deltaTime);
        this.draw();
    }

    update(deltaTime) {
        const wasGameActive = this.gameState.isGameActive;
        const distanceToMouse = Math.hypot(this.mouse.x - this.player.x, this.mouse.y - this.player.y);

        if (this.magneticTarget) {
            this.gameState.isGameActive = true;
        } else if (!this.gameState.isGameOver) {
            this.gameState.isGameActive = distanceToMouse > this.player.radius;
        } else {
            this.gameState.isGameActive = false;
        }

        const targetAlpha = this.gameState.isGameActive ? 1 : 0;
        this.globalAlpha += (targetAlpha - this.globalAlpha) * CONFIG.FADE_SPEED;

        this.gameState.aiStateTimer -= deltaTime;
        if (this.gameState.aiStateTimer <= 0) {
            if (this.gameState.aiState === 'chase') {
                this.gameState.aiState = 'scatter';
                this.gameState.aiStateTimer = CONFIG.AI_STATE_SCATTER_DURATION;
            } else {
                this.gameState.aiState = 'chase';
                this.gameState.aiStateTimer = CONFIG.AI_STATE_CHASE_DURATION;
            }
        }

        // Aggiorniamo l'UI ogni frame così che popup/punteggi vengano puliti anche
        // quando il canvas è in transizione di alpha (evitiamo leak di score popups)
        if (this.uiManager && typeof this.uiManager.update === 'function') {
            this.uiManager.update(deltaTime);
        }

        if (this.gameState.isGameActive && !wasGameActive) {
            if (this.entityManager.hunterCount === 0 && !this.gameState.isWaveTransition) {
                this.startNextWave();
            }
        }
        
        this.player.update(deltaTime, this.mouse, this.magneticTarget);
        
        if (this.isMouseDown && this.gameState.isGameActive) {
            const effect = this.player.startBoost();
            if (effect) this.entityManager.addEffect(effect);
        }

        if (this.globalAlpha < 0.01) return;

    // Ensure AI code can access the current mouse position via gameState.mouse
    this.gameState.mouse = { x: this.mouse.x, y: this.mouse.y };
    const entityActions = this.entityManager.update(deltaTime, this.player, this.gameState, this.bounceBoundaries);
        this.processEntityActions(entityActions);
        
        this.handleCollisions();
        
        if (this.gameState.isGameActive && !this.player.isRespawning) {
            this.handlePowerUpCollection();
            this.entityManager.spawnScaredGhost(deltaTime, this.player, this.mouse);
            
            if (this.entityManager.hunterCount === 0 && !this.gameState.isWaveTransition) {
                this.gameState.isWaveTransition = true;
                this.gameState.waveTransitionTimer = setTimeout(() => this.startNextWave(), 2000);
            }
        }
    }

    draw() {
        this.ctx.save();
        this.applyShake();
        
        this.ctx.globalAlpha = this.globalAlpha;
        this.entityManager.draw(this.ctx);
        
        this.player.draw(this.ctx, this.globalAlpha);
        
        this.ctx.globalAlpha = 1;
        this.uiManager.draw(this.gameState, this.player, this.mouse, this.isHoveringPowerUp, this.globalAlpha);
        
        this.ctx.restore();
    }

    processEntityActions(actions) {
        if (!actions || !actions.length) return;
        actions.forEach(action => {
            if (action.type === 'spawn_projectile') {
                this.entityManager.fireProjectile(action.payload);
            } else if (action.type === 'create_particles') {
                this.entityManager.createParticles(action.payload.x, action.payload.y, action.payload.count, action.payload.color);
            } else if (action.type === 'spawn_explosion') {
                // Explosion: spawn particles and optionally hurt player if in range
                const { x, y, radius } = action.payload || {};
                this.entityManager.createParticles(x, y, 30, CONFIG.THEME.ghosts.kamikazeEnd);
                const explosionRadius = radius || CONFIG.SCARED_GHOST_EXPLOSION_RADIUS;
                if (this.player && Math.hypot(this.player.x - x, this.player.y - y) < explosionRadius) {
                    // Trigger player hit once (uses existing logic)
                    this.handlePlayerHit();
                }
            }
        });
    }

    startNextWave() {
        if (this.gameState.isGameOver) return;
        this.gameState.wave++;
        this.gameState.isWaveTransition = false;
        this.gameState.waveTransitionTimer = null;
        const huntersToSpawn = this.waveManager.getWave(this.gameState.wave);
        huntersToSpawn.forEach(type => this.entityManager.spawnHunter(type));
        this.uiManager.addScorePopup(this.canvas.width / 2, this.canvas.height / 2, `WAVE ${this.gameState.wave}`, 2);
    }

    handlePowerUpCollection() {
        const dist = Math.hypot(this.mouse.x - this.player.x, this.mouse.y - this.player.y);
        if (this.isHoveringPowerUp && dist < this.player.radius) {
            const eatenGhosts = this.entityManager.clearScaredGhosts();
            eatenGhosts.forEach(ghost => {
                this.gameState.score += 300;
                this.uiManager.addScorePopup(ghost.x, ghost.y, "+300");
                this.entityManager.createParticles(ghost.x, ghost.y, 15);
            });
            this.isHoveringPowerUp = false;
        }
    }

    handleCollisions() {
        const events = this.collisionManager.check(this.player, this.entityManager);
        let playerHitThisFrame = false;
        
        for (const event of events) {
            if (event.type === 'player_eats_scared_ghost') {
                event.enemy.onEaten();
                this.gameState.score += 100;
                this.uiManager.addScorePopup(event.enemy.x, event.enemy.y, "+100");
                this.entityManager.createParticles(event.enemy.x, event.enemy.y, 10);
            } else if (event.type === 'boost_hit_hunter') {
                if (event.enemy) {
                    event.enemy.markForRemoval();
                    this.gameState.score += 500;
                    this.uiManager.addScorePopup(event.enemy.x, event.enemy.y, "+500");
                    this.entityManager.createParticles(event.enemy.x, event.enemy.y, 40);
                    this.triggerShake(15, 15);
                }
            } else if (event.type === 'player_hit_hunter' || event.type === 'player_hit_projectile') {
                if (!playerHitThisFrame) {
                    this.handlePlayerHit();
                    playerHitThisFrame = true;
                }
                if (event.enemy) {
                    event.enemy.markForRemoval();
                }
            }
        }
    }

    handlePlayerHit() {
        if (this.player.isRespawning) return;
    this.triggerShake(30, 30);
    // Use forced particles for the player-death burst so it is always visible
    this.entityManager.createParticles(this.player.x, this.player.y, 40, null, true);

        const wasAlive = this.player.takeDamage();
        if (!wasAlive) {
            // All ghosts should explode visually, then we reset the wave.
            // Use the managed lists directly for reliability
            const huntersSnapshot = Array.isArray(this.entityManager.hunters) ? [...this.entityManager.hunters] : [];
            const scaredSnapshot = Array.isArray(this.entityManager.scaredGhosts) ? [...this.entityManager.scaredGhosts] : [];

            // Explode all hunters
            for (const hunter of huntersSnapshot) {
                if (hunter && typeof hunter.x === 'number' && typeof hunter.y === 'number') {
                    this.entityManager.createParticles(hunter.x, hunter.y, 25, CONFIG.THEME.ghosts.kamikazeEnd, true);
                    if (typeof hunter.markForRemoval === 'function') hunter.markForRemoval();
                }
            }

            // Explode all scared ghosts
            for (const scared of scaredSnapshot) {
                if (scared && typeof scared.x === 'number' && typeof scared.y === 'number') {
                    this.entityManager.createParticles(scared.x, scared.y, 25, CONFIG.THEME.ghosts.kamikazeEnd, true);
                    if (typeof scared.markForRemoval === 'function') scared.markForRemoval();
                }
            }

            // Also clear projectiles immediately
            const projSnapshot = Array.isArray(this.entityManager.projectiles) ? [...this.entityManager.projectiles] : [];
            for (const p of projSnapshot) {
                if (p && typeof p.markForRemoval === 'function') p.markForRemoval();
            }

            // Immediately remove the marked entities to stop them from moving
            this.entityManager.update(0, this.player, this.gameState, this.bounceBoundaries);

            // Reset del giocatore (ridà vite e posizione) e UI
            this.player.reset();
            this.uiManager.reset();

            // Impostiamo una transizione di onda: dopo un breve delay spawniamo
            // nuovamente la stessa ondata (non incrementiamo il contatore wave)
            this.gameState.isWaveTransition = true;
            if (this.gameState.waveTransitionTimer) clearTimeout(this.gameState.waveTransitionTimer);
            this.gameState.waveTransitionTimer = setTimeout(() => {
                this.gameState.isWaveTransition = false;
                // Spawn della stessa ondata (assicurarsi wave >= 1)
                const waveNumber = Math.max(1, this.gameState.wave || 1);
                const huntersToSpawn = this.waveManager.getWave(waveNumber);
                huntersToSpawn.forEach(type => this.entityManager.spawnHunter(type));
                this.uiManager.addScorePopup(this.canvas.width / 2, this.canvas.height / 2, `WAVE ${this.gameState.wave}`, 2);
            }, 500);
        } else {
            this.entityManager.retreatAllHunters();
        }
    }
    
    setMagneticTarget(target) { this.magneticTarget = target; }
    clearMagneticTarget(target) { if (this.magneticTarget === target) this.magneticTarget = null; }

    triggerShake(intensity, duration) { this.gameState.shake.intensity = Math.max(this.gameState.shake.intensity, intensity); this.gameState.shake.duration = Math.max(this.gameState.shake.duration, duration); }
    applyShake() { if (this.gameState.shake.duration > 0) { this.gameState.shake.duration--; const sx = (Math.random() - 0.5) * this.gameState.shake.intensity; const sy = (Math.random() - 0.5) * this.gameState.shake.intensity; this.ctx.translate(sx, sy); } }
}