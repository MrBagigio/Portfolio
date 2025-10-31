// assets/js/modules/cursors/pacman/managers/WaveManager.js
import { shuffleArray } from '../utils.js';
export class WaveManager {
    constructor() { this.waveConfig = [ { count: 1, types: ['blinky'] }, { count: 2, types: ['blinky', 'pinky'] }, { count: 3, types: ['blinky', 'pinky', 'clyde'] }, { count: 3, types: ['blinky', 'pinky', 'inky'] }, { count: 4, types: ['blinky', 'pinky', 'clyde', 'spooky'] }, { count: 4, types: ['blinky', 'pinky', 'inky', 'spooky'] }, { count: 5, types: ['blinky', 'pinky', 'clyde', 'inky', 'spooky'] } ]; }
    getWave(waveNumber) { const waveIndex = Math.min(waveNumber - 1, this.waveConfig.length - 1); const config = this.waveConfig[waveIndex]; const typesToSpawn = shuffleArray([...config.types]); let result = []; for (let i = 0; i < config.count; i++) { result.push(typesToSpawn[i % typesToSpawn.length]); } return result; }
}