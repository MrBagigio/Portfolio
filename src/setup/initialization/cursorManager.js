// src/setup/initialization/cursorManager.js

import { AsteroidsCursor } from '../../components/games/cursors/AsteroidsCursor.js';
import { PacmanCursor } from '../../components/games/cursors/PacmanCursor.js';
import { GlitchCursor } from '../../components/games/cursors/GlitchCursor.js';
import { SimpleCursor } from '../../components/games/cursors/simple/SimpleCursor.js';

let activeCursorInstance = null;

function isMobileDevice() {
    return window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function setupCursorCanvases() {
    const pacmanCanvas = document.getElementById('pacman-cursor-canvas');
    const asteroidsCanvas = document.getElementById('asteroids-cursor-canvas');
    const glitchCanvas = document.getElementById('glitch-cursor-canvas');
    if (pacmanCanvas) pacmanCanvas.style.display = 'none';
    if (asteroidsCanvas) asteroidsCanvas.style.display = 'none';
    if (glitchCanvas) glitchCanvas.style.display = 'none';
}

export function initCursor(options = {}) {
    // Non inizializzare cursori su dispositivi mobili
    if (isMobileDevice()) {
        return { instance: null, name: 'Default', activate: () => {} };
    }
    
    const { deferActivation = false, cursorName: requestedCursorName = null } = options;
    if (activeCursorInstance && typeof activeCursorInstance.destroy === 'function') {
        activeCursorInstance.destroy();
    }
    
    setupCursorCanvases();
    
    let selectedCursorClass;
    let canvasId;
    let canvasElement;
    let cursorName;
    let activated = false;

    // Se viene richiesto un nome di cursore esplicito, usalo; altrimenti usa default
    if (requestedCursorName === 'Pacman') {
        selectedCursorClass = PacmanCursor;
        canvasId = 'pacman-cursor-canvas';
        cursorName = 'Pacman';
    } else if (requestedCursorName === 'Asteroids') {
        selectedCursorClass = AsteroidsCursor;
        canvasId = 'asteroids-cursor-canvas';
        cursorName = 'Asteroids';
    } else if (requestedCursorName === 'Glitch') {
        selectedCursorClass = GlitchCursor;
        canvasId = 'glitch-cursor-canvas';
        cursorName = 'Glitch';
    } else if (requestedCursorName === 'Simple') {
        selectedCursorClass = SimpleCursor;
        canvasId = 'simple-cursor-canvas';
        cursorName = 'Simple';
    } else {
        // Default: nessun cursore speciale attivo
        cursorName = 'Default';
        canvasId = null;
        selectedCursorClass = null;
    }

    canvasElement = document.getElementById(canvasId);

    if (canvasElement) {
        try {
            activeCursorInstance = new selectedCursorClass(canvasId);

            const canActivate = cursorName === 'Pacman'
                ? !(activeCursorInstance && activeCursorInstance.state && activeCursorInstance.state.isActive === false)
                : cursorName === 'Glitch'
                ? !(activeCursorInstance && activeCursorInstance.isActive === false)
                : !(activeCursorInstance && activeCursorInstance.isActive === false);

            const activate = () => {
                if (activated) return;
                activated = true;

                if (!canActivate) {
                    canvasElement.style.display = 'none';
                    return;
                }

                canvasElement.style.display = 'block';
                if (cursorName === 'Pacman') {
                    document.body.classList.add('js-pacman-cursor-active');
                } else if (cursorName === 'Glitch') {
                    document.body.classList.add('js-glitch-cursor-active');
                } else if (cursorName === 'Simple') {
                    document.body.classList.add('js-simple-cursor-active');
                } else {
                    document.body.classList.add('custom-cursor-active');
                }
                if (activeCursorInstance && typeof activeCursorInstance.init === 'function') {
                    activeCursorInstance.init();
                }
            };

            if (!deferActivation) {
                activate();
            }

            const exposedInstance = canActivate ? activeCursorInstance : null;
            return { instance: exposedInstance, name: cursorName, activate };
        } catch (error) {
            console.error(`[CursorManager] Impossibile creare l'istanza di ${selectedCursorClass.name}:`, error);
            canvasElement.style.display = 'none';
            // Restituisce il nome anche se l'istanza fallisce, così il preloader non crasha
            return { instance: null, name: cursorName, activate: () => {} };
        }
    }
    
    // Caso default: nessun canvas, nessun cursore speciale
    return { instance: null, name: cursorName, activate: () => {} };
}