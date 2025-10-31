// src/services/telemetry/TelemetryService.js
import { TextScramble } from '../../components/ui/TextScramble.js';

class TelemetryManager {
    constructor() {
        if (TelemetryManager.instance) {
            return TelemetryManager.instance;
        }
        this.telemetryElements = new Map();
        this.scramblers = new Map();
        this.prefersReducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
        TelemetryManager.instance = this;
    }

    register(element) {
        if (!element || !element.dataset.telemetryId) return;
        const id = element.dataset.telemetryId;
        this.telemetryElements.set(id, element);

        if (!this.prefersReducedMotion) {
            this.scramblers.set(id, new TextScramble(element));
        }
    }

    update(id, value) {
        const element = this.telemetryElements.get(id);
        if (!element) return;

        const scrambler = this.scramblers.get(id);
        if (scrambler) {
            scrambler.setText(value);
        } else {
            element.textContent = value;
        }
    }

    batchUpdate(updates) {
        for (const [id, value] of Object.entries(updates)) {
            this.update(id, value);
        }
    }
}

export const telemetry = new TelemetryManager();
