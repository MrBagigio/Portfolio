/**
 * StateManager.js - Gestore Stato Controllato
 * Sistema centralizzato per gestione stato cognitivo e UI con pattern controllato
 */

/**
 * Adapter per localStorage come fallback
 */
class LocalStorageAdapter {
    constructor() {
        this.prefix = 'glitchy_state_';
    }

    async get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('[LocalStorageAdapter] Get error:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return { success: true };
        } catch (error) {
            console.error('[LocalStorageAdapter] Set error:', error);
            return { success: false, error: error.message };
        }
    }

    async delete(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return { success: true };
        } catch (error) {
            console.error('[LocalStorageAdapter] Delete error:', error);
            return { success: false, error: error.message };
        }
    }
}

export class StateManager {
    constructor(options = {}) {
        const { storage, enableSnapshots = true, maxHistorySize = 100 } = options;
        this.storage = storage || new LocalStorageAdapter();
        this.listeners = new Map();
        this.validators = new Map();
        this.transformers = new Map();

        // Stato corrente
        this.state = {
            cognitive: this.createInitialCognitiveState(),
            ui: this.createInitialUIState(),
            session: this.createInitialSessionState()
        };

        // Middleware per aggiornamenti
        this.middleware = [];

        // Configurazioni
        this.config = {
            persistenceEnabled: true,
            validationEnabled: true,
            middlewareEnabled: true,
            maxHistorySize: 50,
            autoSave: true,
            autoSaveInterval: 30000 // 30 secondi
        };

        // Cronologia stati per undo/redo
        this.history = [];
        this.historyIndex = -1;

        // Inizializzazione
        this.initializeState();
        this.startAutoSave();
    }

    /**
     * Creazione stati iniziali
     */
    createInitialCognitiveState() {
        return {
            currentFocus: null,
            attentionLevel: 1.0,
            curiosityLevel: 0.8,
            confidenceLevel: 0.9,
            reasoningDepth: 3,
            contextStack: [],
            activeGoals: [],
            workingMemory: new Map(),
            emotionalState: {
                mood: 'neutral',
                intensity: 0.5,
                valence: 0
            },
            metaCognition: {
                selfAwareness: 0.7,
                learningProgress: 0,
                adaptationRate: 0.5
            }
        };
    }

    createInitialUIState() {
        return {
            currentSection: 'hero',
            scrollDepth: 0,
            timeOnPage: 0,
            interactions: [],
            lastActivity: Date.now(),
            theme: 'dark',
            accessibility: {
                textSize: 'normal',
                contrast: 'normal'
            },
            animations: {
                enabled: true,
                reducedMotion: false
            },
            notifications: {
                enabled: true,
                soundEnabled: false
            }
        };
    }

    createInitialSessionState() {
        return {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            userId: null,
            preferences: {},
            capabilities: {},
            constraints: {},
            achievements: [],
            statistics: {
                interactions: 0,
                commandsExecuted: 0,
                goalsAchieved: 0,
                learningEvents: 0
            }
        };
    }

    /**
     * Inizializzazione stato da storage
     */
    async initializeState() {
        if (!this.config.persistenceEnabled) return;

        try {
            const savedState = await this.storage.get('ai_state');
            if (savedState) {
                // Mergia stato salvato con stato iniziale
                this.state = this.deepMerge(this.state, savedState);
                console.log('[StateManager] State loaded from storage');
            }

            // Carica cronologia se disponibile
            const savedHistory = await this.storage.get('state_history');
            if (savedHistory && Array.isArray(savedHistory)) {
                this.history = savedHistory.slice(-this.config.maxHistorySize);
                this.historyIndex = this.history.length - 1;
            }

        } catch (error) {
            console.error('[StateManager] Error loading state:', error);
            // Continua con stato iniziale
        }
    }

    /**
     * Aggiornamento controllato dello stato
     */
    async update(path, value, options = {}) {
        const {
            validate = this.config.validationEnabled,
            persist = this.config.persistenceEnabled,
            notify = true,
            metadata = {}
        } = options;

        try {
            // Crea snapshot per cronologia
            const snapshot = this.createStateSnapshot();

            // Prepara aggiornamento
            const update = {
                path: Array.isArray(path) ? path : path.split('.'),
                value,
                timestamp: Date.now(),
                metadata
            };

            // Applica middleware
            if (this.config.middlewareEnabled) {
                for (const middleware of this.middleware) {
                    const result = await middleware(update, this.state);
                    if (result === false) {
                        throw new Error('Middleware blocked update');
                    }
                    if (result && typeof result === 'object') {
                        update.value = result.value || update.value;
                    }
                }
            }

            // Valida aggiornamento
            if (validate) {
                const validation = await this.validateUpdate(update);
                if (!validation.valid) {
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }
            }

            // Applica trasformazione se presente
            const transformedValue = await this.applyTransformers(update);

            // Applica aggiornamento allo stato
            this.applyUpdateToState(update.path, transformedValue);

            // Aggiungi alla cronologia
            this.addToHistory(snapshot);

            // Persisti se richiesto
            if (persist) {
                await this.persistState();
            }

            // Notifica listeners
            if (notify) {
                await this.notifyListeners(update);
            }

            return { success: true, update };

        } catch (error) {
            console.error('[StateManager] Update error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Lettura controllata dello stato
     */
    get(path = null, options = {}) {
        const { defaultValue = null, transform = true } = options;

        try {
            if (!path) {
                return this.deepClone(this.state);
            }

            const pathArray = Array.isArray(path) ? path : path.split('.');
            let current = this.state;

            for (const key of pathArray) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    return defaultValue;
                }
            }

            // Applica trasformatori di lettura se richiesti
            return transform ? this.applyReadTransformers(pathArray, current) : current;

        } catch (error) {
            console.error('[StateManager] Get error:', error);
            return defaultValue;
        }
    }

    /**
     * Sottoscrizione a cambiamenti di stato
     */
    subscribe(path, callback, options = {}) {
        const {
            immediate = false,
            once = false,
            filter = null
        } = options;

        const subscriptionId = this.generateSubscriptionId();
        const subscription = {
            id: subscriptionId,
            path: Array.isArray(path) ? path : path.split('.'),
            callback,
            once,
            filter,
            active: true
        };

        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(subscription);

        // Chiamata immediata se richiesta
        if (immediate) {
            const currentValue = this.get(path);
            if (currentValue !== null) {
                callback(currentValue, { type: 'initial', path });
            }
        }

        return subscriptionId;
    }

    /**
     * Rimozione sottoscrizione
     */
    unsubscribe(subscriptionId) {
        for (const [path, subscriptions] of this.listeners) {
            const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
            if (index !== -1) {
                subscriptions.splice(index, 1);
                if (subscriptions.length === 0) {
                    this.listeners.delete(path);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Undo/Redo functionality
     */
    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    async undo() {
        if (!this.canUndo()) {
            return { success: false, error: 'Cannot undo' };
        }

        this.historyIndex--;
        const previousState = this.history[this.historyIndex];

        this.state = this.deepClone(previousState);
        await this.persistState();

        return { success: true, state: this.state };
    }

    async redo() {
        if (!this.canRedo()) {
            return { success: false, error: 'Cannot redo' };
        }

        this.historyIndex++;
        const nextState = this.history[this.historyIndex];

        this.state = this.deepClone(nextState);
        await this.persistState();

        return { success: true, state: this.state };
    }

    /**
     * Middleware system
     */
    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Validation system
     */
    addValidator(path, validator) {
        const pathKey = Array.isArray(path) ? path.join('.') : path;
        this.validators.set(pathKey, validator);
    }

    /**
     * Transformation system
     */
    addTransformer(path, transformer) {
        const pathKey = Array.isArray(path) ? path.join('.') : path;
        this.transformers.set(pathKey, transformer);
    }

    /**
     * Metodi privati di supporto
     */
    async validateUpdate(update) {
        const errors = [];
        const pathKey = update.path.join('.');

        // Validatori specifici per path
        const validator = this.validators.get(pathKey);
        if (validator) {
            const result = await validator(update.value, this.state);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        // Validatori generici per tipo
        const typeValidator = this.getTypeValidator(update.path);
        if (typeValidator) {
            const result = await typeValidator(update.value);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    getTypeValidator(path) {
        const typeValidators = {
            'cognitive.attentionLevel': (value) => ({
                valid: typeof value === 'number' && value >= 0 && value <= 1,
                errors: ['Attention level must be a number between 0 and 1']
            }),
            'cognitive.confidenceLevel': (value) => ({
                valid: typeof value === 'number' && value >= 0 && value <= 1,
                errors: ['Confidence level must be a number between 0 and 1']
            }),
            'ui.currentSection': (value) => ({
                valid: typeof value === 'string' && value.length > 0,
                errors: ['Current section must be a non-empty string']
            })
        };

        return typeValidators[path.join('.')];
    }

    async applyTransformers(update) {
        let value = update.value;
        const pathKey = update.path.join('.');

        const transformer = this.transformers.get(pathKey);
        if (transformer) {
            value = await transformer(value, this.state);
        }

        return value;
    }

    applyReadTransformers(path, value) {
        // Trasformatori di lettura (es. formattazione)
        const pathKey = path.join('.');
        const transformer = this.transformers.get(`${pathKey}:read`);

        if (transformer) {
            return transformer(value);
        }

        return value;
    }

    applyUpdateToState(path, value) {
        let current = this.state;

        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[path[path.length - 1]] = value;
    }

    async notifyListeners(update) {
        const pathKey = update.path.join('.');
        const value = this.get(pathKey);

        // Notifica listeners per path esatto
        const exactListeners = this.listeners.get(pathKey) || [];
        for (const listener of exactListeners) {
            if (listener.active) {
                try {
                    await listener.callback(value, {
                        type: 'update',
                        path: pathKey,
                        update
                    });

                    if (listener.once) {
                        listener.active = false;
                    }
                } catch (error) {
                    console.error('[StateManager] Listener error:', error);
                }
            }
        }

        // Notifica listeners per path parziale (wildcard)
        for (const [listenerPath, listeners] of this.listeners) {
            if (listenerPath !== pathKey && pathKey.startsWith(listenerPath)) {
                for (const listener of listeners) {
                    if (listener.active) {
                        try {
                            await listener.callback(value, {
                                type: 'update',
                                path: pathKey,
                                partial: true,
                                update
                            });
                        } catch (error) {
                            console.error('[StateManager] Partial listener error:', error);
                        }
                    }
                }
            }
        }

        // Pulizia listeners inattivi
        this.cleanupInactiveListeners();
    }

    createStateSnapshot() {
        return this.deepClone(this.state);
    }

    addToHistory(snapshot) {
        // Rimuovi entries future se siamo in mezzo alla cronologia
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(snapshot);
        this.historyIndex++;

        // Mantieni limite dimensione
        if (this.history.length > this.config.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    async persistState() {
        if (!this.config.persistenceEnabled) return;

        try {
            await this.storage.set('ai_state', this.state);
            await this.storage.set('state_history', this.history);
        } catch (error) {
            console.error('[StateManager] Persistence error:', error);
        }
    }

    startAutoSave() {
        if (this.config.autoSave) {
            setInterval(() => {
                this.persistState();
            }, this.config.autoSaveInterval);
        }
    }

    cleanupInactiveListeners() {
        for (const [path, listeners] of this.listeners) {
            const activeListeners = listeners.filter(l => l.active);
            if (activeListeners.length === 0) {
                this.listeners.delete(path);
            } else if (activeListeners.length !== listeners.length) {
                this.listeners.set(path, activeListeners);
            }
        }
    }

    /**
     * Utilità
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('[StateManager] Deep clone error:', error);
            return obj;
        }
    }

    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Metodi di controllo e monitoraggio
     */
    getStatus() {
        return {
            stateSize: JSON.stringify(this.state).length,
            historySize: this.history.length,
            activeListeners: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            validators: this.validators.size,
            transformers: this.transformers.size,
            middleware: this.middleware.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }

    getStateSummary() {
        return {
            cognitive: {
                focus: this.state.cognitive.currentFocus,
                attention: this.state.cognitive.attentionLevel,
                confidence: this.state.cognitive.confidenceLevel,
                goals: this.state.cognitive.activeGoals.length,
                mood: this.state.cognitive.emotionalState.mood
            },
            ui: {
                section: this.state.ui.currentSection,
                theme: this.state.ui.theme,
                interactions: this.state.ui.interactions.length
            },
            session: {
                duration: Date.now() - this.state.session.startTime,
                interactions: this.state.session.statistics.interactions,
                achievements: this.state.session.achievements.length
            }
        };
    }

    /**
     * Metodi di reset e pulizia
     */
    async reset(type = 'all') {
        switch (type) {
            case 'cognitive':
                this.state.cognitive = this.createInitialCognitiveState();
                break;
            case 'ui':
                this.state.ui = this.createInitialUIState();
                break;
            case 'session':
                this.state.session = this.createInitialSessionState();
                break;
            case 'all':
                this.state = {
                    cognitive: this.createInitialCognitiveState(),
                    ui: this.createInitialUIState(),
                    session: this.createInitialSessionState()
                };
                this.history = [];
                this.historyIndex = -1;
                break;
        }

        await this.persistState();
        return { success: true, type };
    }

    async clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        await this.storage.remove('state_history');
        return { success: true };
    }

    /**
     * Configurazione
     */
    configure(options) {
        if (typeof options.persistenceEnabled === 'boolean') this.config.persistenceEnabled = options.persistenceEnabled;
        if (typeof options.validationEnabled === 'boolean') this.config.validationEnabled = options.validationEnabled;
        if (typeof options.middlewareEnabled === 'boolean') this.config.middlewareEnabled = options.middlewareEnabled;
        if (options.maxHistorySize) this.config.maxHistorySize = options.maxHistorySize;
        if (typeof options.autoSave === 'boolean') this.config.autoSave = options.autoSave;
        if (options.autoSaveInterval) this.config.autoSaveInterval = options.autoSaveInterval;
    }

    /**
     * Metodi di import/export
     */
    async exportState() {
        return {
            state: this.deepClone(this.state),
            history: this.deepClone(this.history),
            config: { ...this.config },
            timestamp: Date.now()
        };
    }

    async importState(data) {
        try {
            if (data.state) {
                this.state = this.deepMerge(this.state, data.state);
            }
            if (data.history) {
                this.history = data.history.slice(-this.config.maxHistorySize);
                this.historyIndex = this.history.length - 1;
            }
            if (data.config) {
                this.configure(data.config);
            }

            await this.persistState();
            return { success: true };
        } catch (error) {
            console.error('[StateManager] Import error:', error);
            return { success: false, error: error.message };
        }
    }
}