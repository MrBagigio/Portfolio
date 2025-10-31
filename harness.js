// harness.js - Logic for the Cursor Test Harness

import { initCursor } from './src/setup/initialization/cursorManager.js';
import { InteractionManager } from './src/core/interactions/InteractionManager.js';

const log = (message) => {
    document.getElementById('log').innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
};

let activeCursorInstance = null;
let interactionManager = new InteractionManager();

function cleanup() {
    if (activeCursorInstance && typeof activeCursorInstance.destroy === 'function') {
        activeCursorInstance.destroy();
        log(`Cursor destroyed: ${activeCursorInstance.constructor.name}`);
    } else if (activeCursorInstance) {
        log(`WARNING: Cursor ${activeCursorInstance.constructor.name} does not have a destroy method! Potential memory leak.`);
    }
    activeCursorInstance = null;
}

async function initializeCursor(name) {
    cleanup();
    log(`Initializing cursor: ${name}...`);
    
    // Simuliamo l'attivazione manuale
    const cursorData = initCursor({ force: name, deferActivation: true });
    
    if (cursorData && cursorData.instance) {
        activeCursorInstance = cursorData.instance;
        
        // Attivazione manuale
        if (typeof activeCursorInstance.activate === 'function') {
            activeCursorInstance.activate();
            log(`Cursor activated: ${name}`);
        } else {
            log(`WARNING: Cursor ${name} has no activate method.`);
        }
        
        interactionManager.setActiveCursor(activeCursorInstance);
        interactionManager.initGlobalInteractions(); // Re-inizializza le interazioni
        log(`InteractionManager updated for ${name}.`);
    } else {
        log(`ERROR: Failed to initialize cursor: ${name}`);
    }
}

// Aggiungiamo controlli specifici per Asteroids
document.getElementById('controls').innerHTML += `
    <button id="stress-magnetic">Stress Test Magnetic</button>
    <button id="stress-destroy">Stress Test Destroy</button>
`;

// --- Event Listeners for Controls ---
document.getElementById('init-pacman').addEventListener('click', () => initializeCursor('Pacman'));
document.getElementById('init-asteroids').addEventListener('click', () => initializeCursor('Asteroids'));
document.getElementById('init-default').addEventListener('click', () => initializeCursor('default'));
document.getElementById('destroy-cursor').addEventListener('click', () => {
    cleanup();
    log('Manual cleanup requested.');
});

document.getElementById('add-element').addEventListener('click', () => {
    log('Adding a new dynamic magnetic element...');
    const newEl = document.createElement('div');
    newEl.className = 'magnetic-target';
    newEl.textContent = `Dynamic Magnetic ${Date.now() % 100}`;
    document.getElementById('test-area').appendChild(newEl);
    
    // Re-inizializziamo le interazioni per includere il nuovo elemento
    interactionManager.initGlobalInteractions();
    log('Re-initialized interactions for new element.');
});

// --- Asteroids Specific Stress Tests ---
document.getElementById('stress-magnetic').addEventListener('click', () => {
    if (!activeCursorInstance || !(activeCursorInstance.game && activeCursorInstance.game.constructor.name.includes('Asteroids'))) {
        log('ERROR: Asteroids cursor not active. Initialize it first.');
        return;
    }
    log('Starting Magnetic Stress Test for 5 seconds...');
    const target = document.querySelector('.magnetic-target');
    if (!target) {
        log('ERROR: No magnetic target found.');
        return;
    }

    const interval = 50; // Switch state every 50ms
    let isInside = false;
    const startTime = Date.now();

    const stressInterval = setInterval(() => {
        if (Date.now() - startTime > 5000) {
            clearInterval(stressInterval);
            log('Magnetic Stress Test finished.');
            return;
        }

        if (isInside) {
            activeCursorInstance.exitMagneticMode();
            log('-> Exit Magnetic');
        } else {
            activeCursorInstance.enterMagneticMode(target);
            log('-> Enter Magnetic');
        }
        isInside = !isInside;
    }, interval);
});

document.getElementById('stress-destroy').addEventListener('click', () => {
    log('Starting Destroy Stress Test...');
    let iterations = 10;
    const interval = 200; // Re-create every 200ms

    const stressInterval = setInterval(async () => {
        if (iterations <= 0) {
            clearInterval(stressInterval);
            log('Destroy Stress Test finished.');
            return;
        }
        
        log(`--- Iteration ${11 - iterations} ---`);
        await initializeCursor('Asteroids');
        // Simulate some game activity before destroying
        if (activeCursorInstance && activeCursorInstance.game) {
            activeCursorInstance.game.ship.shoot();
        }
        setTimeout(cleanup, interval / 2);

        iterations--;
    }, interval);
});

document.getElementById('torture-test-layout').addEventListener('click', () => {
    log('TORTURE TEST: Creating a layout that is almost entirely a bounce zone.');
    const testArea = document.getElementById('test-area');
    testArea.innerHTML = ''; // Pulisce l'area
    const giantBounce = document.createElement('div');
    giantBounce.className = 'interactive-bounce';
    giantBounce.style.width = '90%';
    giantBounce.style.height = '250px';
    giantBounce.style.position = 'absolute';
    giantBounce.style.left = '5%';
    giantBounce.textContent = 'GIANT BOUNCE ZONE';
    testArea.appendChild(giantBounce);

    // Forza l'aggiornamento delle boundaries nel gioco, se attivo
    if (activeCursorInstance && typeof activeCursorInstance.game.setBounceBoundaries === 'function') {
        activeCursorInstance.game.setBounceBoundaries('.interactive-bounce');
        log('Updated game boundaries for torture test.');
    }
});

log('Harness ready. Select a cursor to begin testing.');
