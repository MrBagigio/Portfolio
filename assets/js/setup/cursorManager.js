// assets/js/setup/cursorManager.js

import { AsteroidsCursor } from '../modules/cursors/AsteroidsCursor.js';
import { PacmanCursor } from '../modules/cursors/PacmanCursor.js';

let activeCursorInstance = null;

function setupCursorCanvases() {
    const pacmanCanvas = document.getElementById('pacman-cursor-canvas');
    const asteroidsCanvas = document.getElementById('asteroids-cursor-canvas');
    if (pacmanCanvas) pacmanCanvas.style.display = 'none';
    if (asteroidsCanvas) asteroidsCanvas.style.display = 'none';
}

export function initCursor(options = {}) {
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

    // Se viene richiesto un nome di cursore esplicito, usalo; altrimenti scegli casualmente
    if (requestedCursorName === 'Pacman') {
        selectedCursorClass = PacmanCursor;
        canvasId = 'pacman-cursor-canvas';
        cursorName = 'Pacman';
    } else if (requestedCursorName === 'Asteroids') {
        selectedCursorClass = AsteroidsCursor;
        canvasId = 'asteroids-cursor-canvas';
        cursorName = 'Asteroids';
    } else {
        // --- MODIFICA CHIAVE: Assegna il nome PRIMA, in modo che sia sempre valido ---
        if (Math.random() < 0.5) {
            selectedCursorClass = PacmanCursor;
            canvasId = 'pacman-cursor-canvas';
            cursorName = 'Pacman'; // Nome assegnato
        } else {
            selectedCursorClass = AsteroidsCursor;
            canvasId = 'asteroids-cursor-canvas';
            cursorName = 'Asteroids'; // Nome assegnato
        }
    }

    canvasElement = document.getElementById(canvasId);

    if (canvasElement) {
        try {
            activeCursorInstance = new selectedCursorClass(canvasId);

            const canActivate = cursorName === 'Pacman'
                ? !(activeCursorInstance && activeCursorInstance.state && activeCursorInstance.state.isActive === false)
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
    
    // Fallback nel caso in cui anche il canvas non venga trovato
    return { instance: null, name: cursorName || 'Default', activate: () => {} };
}