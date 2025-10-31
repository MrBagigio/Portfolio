// assets/js/modules/cursors/asteroids/managers/WaveManager.js
import { Asteroid } from '../entities/Asteroid.js';
import { AlienShip } from '../entities/AlienShip.js';
export class WaveManager {
    static waveConfig = [ { message: "WAVE 1", asteroids: { normal: 5 } }, { message: "WAVE 2", asteroids: { normal: 7, fast: 2 } }, { message: "WAVE 3", asteroids: { normal: 5, large: 2 } }, { message: "WAVE 4", alienShips: 1, alienShipDelay: 1500 }, { message: "WAVE 5", asteroids: { normal: 8, homing: 1 } }, { message: "WAVE 6", asteroids: { fast: 10 }, alienShips: 1, alienShipDelay: 1500 }, { message: "WAVE 7", asteroids: { large: 4, homing: 2 } }, { message: "WAVE 8", alienShips: 3, alienShipDelay: 1500 }, { message: "WAVE 9", asteroids: { normal: 10, fast: 5, large: 3, homing: 3 }, alienShips: 2, alienShipDelay: 1000 }, { message: "FINAL WAVE", asteroids: { large: 5, homing: 5 }, alienShips: 4, alienShipDelay: 800 } ];
    constructor() { this.reset(); }
    reset() { this.currentWave = -1; this.isTransitioning = false; }
    startNextWave(boundaries) {
        if (this.currentWave >= WaveManager.waveConfig.length - 1) { return { event: 'game_win' }; }
        this.currentWave++;
        this.isTransitioning = true;
        const waveData = WaveManager.waveConfig[this.currentWave];
        const entitiesToSpawn = [];
        let maxDelay = 0;
        const initialDelay = 2500;

        if (waveData.asteroids) {
            Object.entries(waveData.asteroids).forEach(([type, count]) => {
                for (let i = 0; i < count; i++) {
                    const pos = this._getSpawnPosition(boundaries, type); // Passa il tipo
                    // pos now returns page coordinates (y includes scrollY)
                    // Aim roughly towards page-center (use viewport center + scroll)
                    const centerY = window.innerHeight / 2 + window.scrollY;
                    const centerX = window.innerWidth / 2 + window.scrollX;
                    const angleToCenter = Math.atan2(centerY - pos.y, centerX - pos.x);
                    const vx = Math.cos(angleToCenter) * (0.5 + Math.random() * 0.5);
                    const vy = Math.sin(angleToCenter) * (0.5 + Math.random() * 0.5);
                    const delay = initialDelay;
                    entitiesToSpawn.push({ entity: new Asteroid({ x: pos.x, y: pos.y, vx, vy, type }), delay });
                    if (delay > maxDelay) maxDelay = delay;
                }
            });
        }

        if (waveData.alienShips) {
            const shipSpawnDelay = waveData.alienShipDelay || 1500;
            for (let i = 0; i < waveData.alienShips; i++) {
                const x = Math.random() > 0.5 ? -50 + window.scrollX : window.innerWidth + 50 + window.scrollX;
                const y = (Math.random() * (window.innerHeight * 0.8) + (window.innerHeight * 0.1)) + window.scrollY;
                const delay = initialDelay + (i * shipSpawnDelay);
                entitiesToSpawn.push({ entity: new AlienShip(x, y), delay });
                if (delay > maxDelay) maxDelay = delay;
            }
        }

        // (Coins spawn on asteroid destruction now)

        setTimeout(() => { this.isTransitioning = false; }, maxDelay);
        return { entities: entitiesToSpawn };
    }

    _getSpawnRadius(type) {
        switch (type) {
            case 'fast': return 25;
            case 'large': return 60;
            case 'debris': return 15;
            default: return 35; // ASTEROID_BASE_RADIUS from config
        }
    }

    _isCircleCollidingWithRect(circle, rect) {
        const closestX = Math.max(rect.left, Math.min(circle.x, rect.right));
        const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom));
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
    }

    _getSpawnPosition(boundaries, entityType) {
        let x, y, isValid;
        let attempts = 0;
        const maxAttempts = 30; // Aumentato per sicurezza
        const radius = this._getSpawnRadius(entityType);

        do {
            isValid = true;
            const edge = Math.floor(Math.random() * 4);
            const margin = radius + 50; // Usa il raggio come margine
            const w = window.innerWidth;
            const h = window.innerHeight;

            switch (edge) {
                case 0: x = -margin; y = Math.random() * h; break;
                case 1: x = w + margin; y = Math.random() * h; break;
                case 2: y = -margin; x = Math.random() * w; break;
                case 3: y = h + margin; x = Math.random() * w; break;
            }

            const pageX = x + window.scrollX;
            const pageY = y + window.scrollY;

            if (boundaries) {
                const spawnCircle = { x: pageX, y: pageY, radius: radius };
                for (const rect of boundaries) {
                    if (this._isCircleCollidingWithRect(spawnCircle, rect)) {
                        isValid = false;
                        break;
                    }
                }
            }
            
            x = pageX;
            y = pageY;
            attempts++;

        } while (!isValid && attempts < maxAttempts);
        
        if (!isValid) {
            // Fallback: spawn anywhere in viewport, avoiding boundaries
            let fallbackAttempts = 0;
            const maxFallback = 50;
            do {
                isValid = true;
                x = Math.random() * window.innerWidth;
                y = Math.random() * window.innerHeight;
                const pageX = x + window.scrollX;
                const pageY = y + window.scrollY;
                const spawnCircle = { x: pageX, y: pageY, radius: radius };
                if (boundaries) {
                    for (const rect of boundaries) {
                        if (this._isCircleCollidingWithRect(spawnCircle, rect)) {
                            isValid = false;
                            break;
                        }
                    }
                }
                x = pageX;
                y = pageY;
                fallbackAttempts++;
            } while (!isValid && fallbackAttempts < maxFallback);
        }
        
        return { x, y };
    }
}