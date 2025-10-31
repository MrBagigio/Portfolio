/**
 * GlobalEventManager.js
 * Centralizza la gestione degli eventi globali (window, document)
 * per disaccoppiare i componenti e migliorare la manutenibilità.
 */

import EventBus from '../../utils/events/EventBus.js';

class GlobalEventManager {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) {
            return;
        }

        console.log('[GlobalEventManager] Initializing global event listeners...');

        // Mappatura degli eventi da catturare e ri-pubblicare
        const eventsToForward = [
            // Window events
            { target: window, event: 'resize', newEvent: 'global:resize' },
            { target: window, event: 'scroll', newEvent: 'global:scroll', options: { passive: true } },
            { target: window, event: 'mousemove', newEvent: 'global:mousemove', options: { passive: true } },
            { target: window, event: 'mousedown', newEvent: 'global:mousedown' },
            { target: window, event: 'mouseup', newEvent: 'global:mouseup' },
            { target: window, event: 'keydown', newEvent: 'global:keydown' },
            { target: window, event: 'load', newEvent: 'global:load' },

            // Document events
            { target: document, event: 'click', newEvent: 'global:click' },
            { target: document, event: 'DOMContentLoaded', newEvent: 'global:domcontentloaded' }
        ];

        eventsToForward.forEach(({ target, event, newEvent, options }) => {
            target.addEventListener(event, (e) => {
                EventBus.emit(newEvent, e);
            }, options || {});
        });

        this.isInitialized = true;
        console.log('[GlobalEventManager] Global event listeners initialized.');
    }
}

// Esportiamo un'istanza singleton
export const globalEventManager = new GlobalEventManager();
