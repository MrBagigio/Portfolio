// assets/js/modules/cursors/asteroids/AsteroidsGame.js

import { CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { PowerUp } from './entities/PowerUp.js';
import { Asteroid } from './entities/Asteroid.js';
import { AlienShip } from './entities/AlienShip.js';
import { Coin } from './entities/Coin.js';
import { Particle } from './entities/Particle.js';
import { WaveManager } from './managers/WaveManager.js';
import { UIManager } from './managers/UIManager.js';
import { CollisionManager } from './managers/CollisionManager.js';
import { ParallaxBackground } from './managers/ParallaxBackground.js';

export class AsteroidsGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) { this.isActive = false; return; }
        
        this.ctx = this.canvas.getContext('2d');
        this.isActive = window.matchMedia("(pointer: fine)").matches;
        this.gameTime = 0;
        this.animationFrameId = null;
    this.lastTimestamp = null;
    this.delta = 0; // seconds

        this.spawnTimeouts = new Set();
        this.isGameOver = false;
        this.isShipMode = false;
        this.isShooting = false;
        this.isReturningToCursor = false;
        this.isPaused = false;
        this.magneticState = 'none'; // Stati: none, entering, active, exiting
        this.magneticTransition = 0; // 0 = visibile, 1 = invisibile
        this.score = 0;
        this.shake = { intensity: 0, duration: 0 };
    this.globalAlpha = 0;
        
        this.isMagnetic = false;
        this.attachedTarget = null;
        this.bounceBoundaries = [];

        this.mouse = { x: -100, y: -100 };
        this.prevMouse = { x: -100, y: -100 };
        this.mouseVelocity = { x: 0, y: 0 };

        this.player = new Player();
        this.entities = [];
        this.particles = [];
        
        this.waveManager = new WaveManager();
        this.uiManager = new UIManager();
        this.collisionManager = new CollisionManager();
        this.background = new ParallaxBackground();

        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }

    setBounceBoundaries(selector) {
        this.bounceBoundaries = [];
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const r = el.getBoundingClientRect();
            // Convert rect (viewport coords) to page coords so boundaries match entity page positions
            this.bounceBoundaries.push({ left: r.left + window.scrollX, right: r.right + window.scrollX, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY });
        });
    }

    start() {
        if (!this.isActive) return;
        this.addEventListeners();
        this.handleResize();
        this.reset();
        this.gameLoop();
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        cancelAnimationFrame(this.animationFrameId);
        this.removeEventListeners();
        this.clearAllTimeouts();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.clearAllTimeouts();
        this.isGameOver = false;
        this.isShipMode = false;
        this.score = 0;
        this.player.reset();
        this.entities = [];
        this.particles = [];
        this.waveManager.reset();
        this.uiManager.reset();
        // Non avviare la prima ondata qui, ma aspetta che il gioco si attivi
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.background.resize(this.canvas.width, this.canvas.height);
    }

    handleScroll() {
        // Rimosso: la logica è ora nel gameLoop
    }

    handleMouseMove(e) { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }

    handleMouseDown(e) {
        e.preventDefault();
        if (e.button === 0 && this.isShipMode && !this.isGameOver && !this.player.isRespawning) {
            this.isShooting = true;
        }
    }

    handleMouseUp(e) { if (e.button === 0) this.isShooting = false; }
    handleClick() { if (this.isGameOver) this.reset(); }

    addEventListeners() {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('click', this.handleClick);
    }
    removeEventListeners() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('click', this.handleClick);
    }
    
    gameLoop(timestamp) {
        if (!this.isActive) return;
        // Compute frame delta in seconds (clamped) so transitions are time-based
        this.delta = this.lastTimestamp ? Math.min(0.05, (timestamp - this.lastTimestamp) / 1000) : 0;
        this.lastTimestamp = timestamp;
        this.gameTime = timestamp;

        // Aggiorna dinamicamente i confini a ogni frame
        this.setBounceBoundaries('.interactive-bounce');

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.background.draw(this.ctx);

        this.ctx.save();
        this.applyShake();
        this.update();
        this.draw();
        this.ctx.restore();
        
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    update() {
        this.updateMouseVelocity();
        this.background.update(this.mouseVelocity, this.player);

        let targetX = this.mouse.x;
        let targetY = this.mouse.y;
        let lerpAmount = this.isShipMode ? CONFIG.LERP_AMOUNT_ACTIVE : CONFIG.LERP_AMOUNT_IDLE;

        // State machine for magnetic effect
        if (this.magneticState === 'entering' && this.attachedTarget) {
            const rect = this.attachedTarget.getBoundingClientRect();
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;
            lerpAmount = CONFIG.MAGNETIC_LERP_AMOUNT;

            const dx = targetX - this.player.x;
            const dy = targetY - this.player.y;
            // When close enough, start the shrink transition
            if (Math.hypot(dx, dy) < 10) {
                // Advance transition based on frame delta so animation duration is consistent
                this.magneticTransition += (this.delta / Math.max(0.0001, CONFIG.MAGNET_TRANSITION_TIME));
                if (this.magneticTransition >= 1) {
                    this.magneticTransition = 1;
                    this.magneticState = 'active';
                    this.isPaused = true;
                    this.attachedTarget.classList.add('is-magnet-locked');
                    this.canvas.style.pointerEvents = 'none'; // BUG FIX: Release the mouse
                }
            }
        } else if (this.magneticState === 'active') {
            // While active, game is paused. Update stops here.
            const rect = this.attachedTarget.getBoundingClientRect();
            this.player.x = rect.left + rect.width / 2;
            this.player.y = rect.top + rect.height / 2;
            return;
        } else if (this.magneticState === 'exiting') {
            // Start the grow transition (time-based)
            this.magneticTransition -= (this.delta / Math.max(0.0001, CONFIG.MAGNET_TRANSITION_TIME));
            if (this.magneticTransition <= 0) {
                this.magneticTransition = 0;
                this.magneticState = 'none';
                // Transition complete: resume game and re-enable pointer events so DOM can receive mouse events
                this.isPaused = false;
                if (this.canvas) this.canvas.style.pointerEvents = 'auto';
                if (this.attachedTarget) {
                    try { this.attachedTarget.classList.remove('is-magnet-locked'); } catch (e) {}
                    this.attachedTarget = null;
                }
            }
        }

        // If the game is paused (but not in transition), do nothing
        if (this.isPaused) {
            return;
        }

        this.player.update(targetX, targetY, lerpAmount);

        const distance = Math.hypot(this.mouse.x - this.player.x, this.mouse.y - this.player.y);
        const wasInShipMode = this.isShipMode;

        if (!this.isGameOver) {
            if (distance > this.player.radius) {
                this.isShipMode = true;
            } else {
                this.isShipMode = false;
            }
        } else {
            this.isShipMode = false;
        }
        
        // If game mode just activated, start the first wave
        if (this.isShipMode && !wasInShipMode) {
            const enemyCount = this.entities.some(e => e instanceof Asteroid || e instanceof AlienShip);
            if (!enemyCount && !this.waveManager.isTransitioning) {
                this.startNextWave();
            }
        }

        const targetAlpha = (this.isShipMode) ? 1 : 0;
        this.globalAlpha += (targetAlpha - this.globalAlpha) * 0.08;
        
        this.uiManager.update(this.isShipMode, this.player.isRespawning);

        if (this.globalAlpha < 0.01 && this.magneticTransition <= 0) {
            this.particles = [];
            return;
        }
        
        this.player.updatePowerUps(this.gameTime);

        if (this.player.powerUpState.laser.active && this.isShooting) {
            this.applyLaserDamage();
        } else {
            const newPlayerBullets = this.player.shoot(this.gameTime, this.isShooting, this.mouseVelocity);
            if (newPlayerBullets) this.entities.push(...newPlayerBullets);
        }

        const newEntities = [];
        for (const entity of this.entities) {
            const result = entity.update(this.player, this.bounceBoundaries);
            if (result) newEntities.push(...(Array.isArray(result) ? result : [result]));

            if (entity.constructor.name === 'Bullet' && entity.hitBoundary) {
                this.createImpactSpark(entity.x, entity.y);
            }
        }
        if (newEntities.length > 0) this.entities.push(...newEntities);

        this.particles.forEach(p => p.update());

        const collisionEvents = this.collisionManager.checkCollisions(this.player, this.entities);
        if (collisionEvents.length > 0) this.handleCollisionEvents(collisionEvents);

        this.entities = this.entities.filter(e => !e.shouldBeRemoved);
        this.particles = this.particles.filter(p => p.life > 0);

        const enemyCount = this.entities.some(e => e instanceof Asteroid || e instanceof AlienShip);
        if (this.isShipMode && !enemyCount && !this.waveManager.isTransitioning) {
            this.startNextWave();
        }
    }

    draw() {
        const cursorNormalAlpha = 1 - this.globalAlpha;
        if (cursorNormalAlpha > 0.01 && this.magneticState === 'none') {
            this.ctx.save();
            this.ctx.globalAlpha = cursorNormalAlpha;
            this.ctx.beginPath();
            const circleRadius = this.player.radius * (1 - this.globalAlpha);
            this.ctx.arc(this.player.x, this.player.y, Math.max(0.1, circleRadius), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * cursorNormalAlpha})`;
            this.ctx.stroke();
            this.ctx.restore();
        }

        const gameAlpha = this.globalAlpha;

        this.ctx.save();
        this.ctx.translate(-window.scrollX, -window.scrollY);
        this.ctx.globalAlpha = gameAlpha;

        if (gameAlpha > 0.01) {
            this.entities.forEach(entity => entity.draw(this.ctx, this.gameTime));
            this.particles.forEach(p => p.draw(this.ctx));

            if (this.player.powerUpState.laser.active && this.isShooting) {
                this.drawLaser();
            }
        }
        this.ctx.restore();

        const playerScale = (1 - this.magneticTransition) * this.globalAlpha;
        if (playerScale > 0.01) {
            this.player.draw(this.ctx, this.gameTime, this.mouseVelocity, this.isShipMode, playerScale);
        }
        
        this.uiManager.draw(this.ctx, { lives: this.player.lives, score: this.score, wave: this.waveManager.currentWave + 1, isGameOver: this.isGameOver, playerX: this.player.x, playerY: this.player.y, mouseX: this.mouse.x, mouseY: this.mouse.y });

        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.mouse.x, this.mouse.y, CONFIG.DOT_RADIUS, 0, Math.PI * 2);
        this.ctx.fill();
    }

    createImpactSpark(x, y) {
        for (let i = 0; i < 5; i++) { // Meno particelle per un effetto più piccolo
            this.particles.push(new Particle(x, y, 'rgba(255,255,255,0.7)', 20, { size: Math.random() * 1.5 }));
        }
    }

    createExplosion(x, y, color = 'white', count = CONFIG.PARTICLE_COUNT_EXPLOSION) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    handleCollisionEvents(events) {
        for (const event of events) {
            switch (event.type) {
                case 'bullet_hit_enemy':
                    event.bullet.shouldBeRemoved = true;
                    this.createExplosion(event.bullet.x, event.bullet.y, 'rgba(255,255,255,0.5)', 5);
                    const debris = event.enemy.takeDamage(1);
                    if (debris) this.entities.push(...debris);

                    if (event.enemy.shouldBeRemoved) {
                        const scoreValue = (event.enemy instanceof AlienShip) ? 300 : (event.enemy.type === 'large' ? 150 : (event.enemy.type === 'debris' ? 25 : 100));
                        this.score += scoreValue;
                        // score popup: convert page coords to screen coords
                        this.uiManager.addScorePopup(event.enemy.x - window.scrollX, event.enemy.y - window.scrollY, `+${scoreValue}`);
                        this.createExplosion(event.enemy.x, event.enemy.y, event.enemy.color);

                        // Spawn at most one pickup per enemy: prefer power-up, otherwise possibly spawn a coin.
                        let didSpawnPickup = false;
                        if (Math.random() < CONFIG.POWERUP_SPAWN_CHANCE) {
                            this.entities.push(new PowerUp(event.enemy.x, event.enemy.y));
                            didSpawnPickup = true;
                        }

                        // Only spawn a coin if we didn't already spawn a power-up from this enemy
                        if (!didSpawnPickup && Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
                            const coinValue = CONFIG.COIN_VALUE || 1;
                            this.entities.push(new Coin({ x: event.enemy.x, y: event.enemy.y, value: coinValue }));
                        }
                    }
                    break;
                case 'player_hit_enemy':
                    if (event.enemy.owner !== 'player') event.enemy.shouldBeRemoved = true;
                    this.triggerShake(30, 30);
                    this.createExplosion(this.player.x, this.player.y);
                    
                    const playerState = this.player.takeDamage();
                    
                    if (playerState.shieldBroken) {
                        this.uiManager.addHudNotification("SHIELD LOST!", '#00FFFF');
                        this.createExplosion(this.player.x, this.player.y, 'cyan', 40);
                    }
                    
                    if (playerState.playerHit && this.player.lives <= 0) {
                        this.isGameOver = true;
                        this.uiManager.showFinalScore(this.score);
                    }
                    this.isShipMode = false;
                    break;
                case 'player_collect_powerup':
                    event.powerUp.shouldBeRemoved = true;
                    this.player.activatePowerUp(event.powerUp.type, this.gameTime);
                    const powerUpInfo = { 'fireRate': 'FIRE RATE', 'tripleShot': 'TRIPLE SHOT', 'shield': 'SHIELD', 'bounce': 'BOUNCE SHOTS', 'laser': 'LASER' };
                    this.uiManager.addHudNotification(powerUpInfo[event.powerUp.type], event.powerUp.color);
                    break;
                case 'player_collect_coin':
                    if (event.coin) {
                        event.coin.shouldBeRemoved = true;
                        const value = event.coin.value || 1;
                        this.uiManager.addCredits(value);
                        // popup in screen-space
                        this.uiManager.addScorePopup(event.coin.x - window.scrollX, event.coin.y - window.scrollY, `+${value}C`);
                        const audio = document.getElementById('coin-audio');
                        if (audio && typeof audio.play === 'function') {
                            try {
                                audio.currentTime = 0;
                                // Se possibile, verifica rapidamente se il browser dichiara supporto (opzionale)
                                const canPlay = typeof audio.canPlayType === 'function' ? audio.canPlayType('audio/mpeg') || audio.canPlayType('audio/ogg') : true;
                                if (canPlay === '' || canPlay === 'no') {
                                    console.warn('[AsteroidsGame] Audio coin-audio potrebbe non essere supportato dal browser:', audio);
                                }
                                const p = audio.play();
                                if (p && typeof p.catch === 'function') p.catch(() => {});
                            } catch (e) {
                                // Ignora errori sincroni
                            }
                        }
                    }
                    break;
            }
        }
    }

    startNextWave() {
        const waveResult = this.waveManager.startNextWave(this.bounceBoundaries);
        if (waveResult.event === 'game_win') {
            this.uiManager.addNotification("YOU WIN!", "#FFD700", 300);
            this.isGameOver = true;
            this.uiManager.showFinalScore(this.score);
            return;
        }
        this.uiManager.triggerWaveFlash();
        if (waveResult.entities) {
            waveResult.entities.forEach(spawnEvent => {
                let timeoutId;
                const callback = () => {
                    if (this.isShipMode) {
                       this.entities.push(spawnEvent.entity);
                    }
                    this.spawnTimeouts.delete(timeoutId);
                };
                timeoutId = setTimeout(callback, spawnEvent.delay);
                this.spawnTimeouts.add(timeoutId);
            });
        }
    }

    updateMouseVelocity() { this.mouseVelocity.x = this.mouse.x - this.prevMouse.x; this.mouseVelocity.y = this.mouse.y - this.prevMouse.y; this.prevMouse.x = this.mouse.x; this.prevMouse.y = this.mouse.y; }
    clearAllTimeouts() { this.spawnTimeouts.forEach(clearTimeout); this.spawnTimeouts.clear(); }
    triggerShake(intensity, duration) { this.shake.intensity = Math.max(this.shake.intensity, intensity); this.shake.duration = Math.max(this.shake.duration, duration); }
    applyShake() { if (this.shake.duration > 0) { this.shake.duration--; const sx = (Math.random() - 0.5) * this.shake.intensity * (this.shake.duration / 10); const sy = (Math.random() - 0.5) * this.shake.intensity * (this.shake.duration / 10); this.ctx.translate(sx, sy); } else { this.shake.intensity = 0; } }
    applyLaserDamage() { const angle = this.player.angle; const startX = this.player.x + Math.cos(angle) * this.player.radius; const startY = this.player.y + Math.sin(angle) * this.player.radius; const endX = this.player.x + Math.cos(angle) * 2000; const endY = this.player.y + Math.sin(angle) * 2000; const enemies = this.entities.filter(e => e instanceof Asteroid || e instanceof AlienShip); for (const enemy of enemies) { const dist = Math.abs((endY - startY) * enemy.x - (endX - startX) * enemy.y + endX * startY - endY * startX) / Math.hypot(endY - startY, endX - startX); if (dist < enemy.radius) { const damageDealt = enemy.takeDamage(0.25); if (damageDealt) this.entities.push(...damageDealt); if (Math.random() < 0.2) { this.createExplosion(enemy.x, enemy.y, 'rgba(255,0,0,0.5)', 2); } } } }
    drawLaser() { const angle = this.player.angle; const startX = this.player.x + Math.cos(angle) * this.player.radius; const startY = this.player.y + Math.sin(angle) * this.player.radius; const endX = this.player.x + Math.cos(angle) * 2000; const endY = this.player.y + Math.sin(angle) * 2000; this.ctx.beginPath(); this.ctx.moveTo(startX, startY); this.ctx.lineTo(endX, endY); this.ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.random() * 0.5})`; this.ctx.lineWidth = 1 + Math.random() * 4; this.ctx.stroke(); }
}