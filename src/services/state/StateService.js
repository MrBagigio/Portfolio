// StateService.js - Manages application state
export class StateService {
    constructor() {
        this.currentCursor = 'default';
        this.lastCursor = null;
        this.auditLog = [];
    }

    getCurrentCursor() {
        return this.currentCursor;
    }

    setCurrentCursor(type) {
        this.lastCursor = this.currentCursor;
        this.currentCursor = type;
        this.auditLog.push({ action: 'setGameCursor', at: Date.now(), cursor: type });
    }

    undoCursor() {
        if (!this.lastCursor) return false;
        const prev = this.lastCursor;
        this.lastCursor = null;
        this.setCurrentCursor(prev);
        this.auditLog.push({ action: 'undoCursor', at: Date.now(), prev });
        return prev;
    }

    logAction(action, payload) {
        console.log('[StateService]', action, payload || '');
        this.auditLog.push({ action, at: Date.now(), payload });
    }
}