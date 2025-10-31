/**
 * ConfigManager.js - Sistema di Configurazione Centralizzato
 * Gestione centralizzata di tutti i parametri e configurazioni dell'AI
 */

/**
 * Adapter per localStorage come fallback
 */
class LocalStorageAdapter {
    constructor() {
        this.prefix = 'glitchy_config_';
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

export class ConfigManager {
    constructor(storageAdapter = null) {
        this.storage = storageAdapter || new LocalStorageAdapter();
        this.configs = new Map();
        this.validators = new Map();
        this.listeners = new Map();
        this.schemas = new Map();

        // Configurazioni di default
        this.defaultConfigs = {
            ai: this.createAIDefaults(),
            ui: this.createUIDefaults(),
            performance: this.createPerformanceDefaults(),
            learning: this.createLearningDefaults(),
            interaction: this.createInteractionDefaults(),
            analytics: this.createAnalyticsDefaults()
        };

        // Inizializzazione
        this.initializeConfigs();
    }

    /**
     * Configurazioni AI di default
     */
    createAIDefaults() {
        return {
            reasoning: {
                maxDepth: 5,
                confidenceThreshold: 0.7,
                explorationRate: 0.3,
                reasoningTimeout: 5000,
                enableAbductive: true,
                enableInductive: true,
                enableDeductive: true
            },
            semantic: {
                maxTokens: 1000,
                contextWindow: 512,
                similarityThreshold: 0.8,
                entityConfidence: 0.75,
                sentimentThreshold: 0.6,
                topicClustering: true
            },
            memory: {
                maxEntries: 10000,
                compressionThreshold: 1000,
                cleanupInterval: 3600000, // 1 ora
                retentionPeriod: 604800000, // 7 giorni
                indexUpdateInterval: 300000 // 5 minuti
            },
            planning: {
                maxGoals: 10,
                planningDepth: 3,
                optimizationTimeout: 3000,
                riskTolerance: 0.5,
                goalDecomposition: true,
                alternativePlans: 3
            },
            personality: {
                baseTraits: {
                    curiosity: 0.8,
                    creativity: 0.7,
                    empathy: 0.6,
                    assertiveness: 0.5,
                    adaptability: 0.9
                },
                dynamicAdjustment: true,
                moodInfluence: 0.4,
                contextAwareness: 0.8
            },
            conversation: {
                maxTurns: 50,
                responseTimeout: 10000,
                followUpEnabled: true,
                contextRetention: 0.9,
                topicShifting: true
            }
        };
    }

    /**
     * Configurazioni UI di default
     */
    createUIDefaults() {
        return {
            animations: {
                enabled: true,
                duration: 300,
                easing: 'ease-out',
                reducedMotion: false
            },
            themes: {
                current: 'dark',
                available: ['dark', 'light', 'cyberpunk'],
                autoSwitch: false
            },
            layout: {
                responsive: true,
                breakpoints: {
                    mobile: 768,
                    tablet: 1024,
                    desktop: 1440
                },
                gridSystem: 'css-grid'
            },
            accessibility: {
                highContrast: false,
                textSize: 'normal',
                keyboardNavigation: true,
                screenReader: true,
                colorBlind: false
            },
            notifications: {
                enabled: true,
                soundEnabled: false,
                vibrationEnabled: false,
                position: 'top-right'
            }
        };
    }

    /**
     * Configurazioni performance di default
     */
    createPerformanceDefaults() {
        return {
            caching: {
                enabled: true,
                maxSize: 50 * 1024 * 1024, // 50MB
                ttl: 3600000, // 1 ora
                compression: true
            },
            optimization: {
                lazyLoading: true,
                virtualization: true,
                debouncing: {
                    input: 300,
                    scroll: 100,
                    resize: 200
                }
            },
            monitoring: {
                enabled: true,
                metrics: ['responseTime', 'memoryUsage', 'cpuUsage'],
                samplingRate: 0.1,
                alertThresholds: {
                    responseTime: 5000,
                    memoryUsage: 100 * 1024 * 1024, // 100MB
                    cpuUsage: 80
                }
            },
            throttling: {
                maxConcurrent: 3,
                queueSize: 10,
                timeout: 30000
            }
        };
    }

    /**
     * Configurazioni apprendimento di default
     */
    createLearningDefaults() {
        return {
            reinforcement: {
                enabled: true,
                learningRate: 0.01,
                discountFactor: 0.9,
                explorationRate: 0.1,
                rewardFunction: 'balanced'
            },
            adaptation: {
                enabled: true,
                adaptationRate: 0.5,
                feedbackLoop: true,
                contextLearning: true
            },
            knowledge: {
                updateInterval: 86400000, // 24 ore
                validationEnabled: true,
                sourcePrioritization: ['user', 'system', 'external'],
                confidenceThreshold: 0.8
            },
            personalization: {
                enabled: true,
                profileUpdateInterval: 3600000, // 1 ora
                preferenceLearning: true,
                behaviorAnalysis: true
            }
        };
    }

    /**
     * Configurazioni interazione di default
     */
    createInteractionDefaults() {
        return {
            input: {
                modes: ['text', 'voice', 'gesture'],
                validation: true,
                sanitization: true,
                autocomplete: true
            },
            output: {
                formats: ['text', 'html', 'markdown'],
                richContent: true,
                multimedia: true,
                progressiveDisclosure: true
            },
            feedback: {
                enabled: true,
                types: ['explicit', 'implicit', 'behavioral'],
                collection: 'continuous',
                analysis: true
            },
            engagement: {
                gamification: true,
                achievements: true,
                progressTracking: true,
                socialFeatures: false
            }
        };
    }

    /**
     * Configurazioni analytics di default
     */
    createAnalyticsDefaults() {
        return {
            tracking: {
                enabled: true,
                anonymized: true,
                consentRequired: true,
                retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 anno
            },
            metrics: {
                userEngagement: true,
                aiPerformance: true,
                systemHealth: true,
                conversion: false
            },
            reporting: {
                realTime: true,
                dashboards: true,
                alerts: true,
                exportFormats: ['json', 'csv', 'pdf']
            },
            privacy: {
                dataMinimization: true,
                purposeLimitation: true,
                consentManagement: true,
                dataPortability: true
            }
        };
    }

    /**
     * Inizializzazione configurazioni
     */
    async initializeConfigs() {
        // Carica configurazioni salvate
        for (const [category, defaults] of Object.entries(this.defaultConfigs)) {
            try {
                const saved = await this.storage.get(`config_${category}`);
                const config = saved ? { ...defaults, ...saved } : defaults;
                this.configs.set(category, config);
            } catch (error) {
                console.error(`[ConfigManager] Error loading ${category} config:`, error);
                this.configs.set(category, defaults);
            }
        }

        console.log('[ConfigManager] Configurations initialized');
    }

    /**
     * Lettura configurazione
     */
    get(path, defaultValue = null) {
        const parts = path.split('.');
        const category = parts[0];
        const configPath = parts.slice(1);

        const config = this.configs.get(category);
        if (!config) return defaultValue;

        let current = config;
        for (const key of configPath) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }

        return current;
    }

    /**
     * Impostazione configurazione
     */
    async set(path, value, options = {}) {
        const {
            validate = true,
            persist = true,
            notify = true
        } = options;

        try {
            const parts = path.split('.');
            const category = parts[0];
            const configPath = parts.slice(1);

            if (!this.configs.has(category)) {
                throw new Error(`Unknown configuration category: ${category}`);
            }

            // Validazione
            if (validate) {
                const validation = await this.validateConfig(path, value);
                if (!validation.valid) {
                    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
                }
            }

            // Aggiornamento configurazione
            const config = this.configs.get(category);
            this.setNestedValue(config, configPath, value);

            // Persistenza
            if (persist) {
                await this.storage.set(`config_${category}`, config);
            }

            // Notifica listeners
            if (notify) {
                await this.notifyListeners(path, value);
            }

            return { success: true };

        } catch (error) {
            console.error('[ConfigManager] Set config error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Impostazione configurazione batch
     */
    async setBatch(updates, options = {}) {
        const results = [];

        for (const [path, value] of Object.entries(updates)) {
            const result = await this.set(path, value, { ...options, notify: false });
            results.push({ path, ...result });
        }

        // Notifica singola volta
        if (options.notify !== false) {
            await this.notifyListeners('batch', updates);
        }

        return results;
    }

    /**
     * Reset configurazione
     */
    async reset(category = null, options = {}) {
        const { persist = true, notify = true } = options;

        try {
            if (category) {
                // Reset categoria singola
                if (!this.defaultConfigs[category]) {
                    throw new Error(`Unknown category: ${category}`);
                }

                this.configs.set(category, { ...this.defaultConfigs[category] });

                if (persist) {
                    await this.storage.set(`config_${category}`, this.configs.get(category));
                }
            } else {
                // Reset tutte le categorie
                for (const [cat, defaults] of Object.entries(this.defaultConfigs)) {
                    this.configs.set(cat, { ...defaults });

                    if (persist) {
                        await this.storage.set(`config_${cat}`, this.configs.get(cat));
                    }
                }
            }

            if (notify) {
                await this.notifyListeners('reset', { category });
            }

            return { success: true };

        } catch (error) {
            console.error('[ConfigManager] Reset error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sottoscrizione cambiamenti configurazione
     */
    subscribe(path, callback, options = {}) {
        const { immediate = false } = options;

        const subscriptionId = `config_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }

        this.listeners.get(path).push({
            id: subscriptionId,
            callback,
            active: true
        });

        // Chiamata immediata se richiesta
        if (immediate) {
            const currentValue = this.get(path);
            callback(currentValue, { type: 'initial', path });
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
     * Aggiunta validatore
     */
    addValidator(path, validator) {
        this.validators.set(path, validator);
    }

    /**
     * Aggiunta schema validazione
     */
    addSchema(path, schema) {
        this.schemas.set(path, schema);
    }

    /**
     * Validazione configurazione
     */
    async validateConfig(path, value) {
        const errors = [];

        // Validatore specifico
        const validator = this.validators.get(path);
        if (validator) {
            const result = await validator(value);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        // Schema validation
        const schema = this.schemas.get(path);
        if (schema) {
            const schemaResult = this.validateAgainstSchema(value, schema);
            if (!schemaResult.valid) {
                errors.push(...schemaResult.errors);
            }
        }

        // Validatori di tipo
        const typeValidator = this.getTypeValidator(path);
        if (typeValidator) {
            const result = await typeValidator(value);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validatori di tipo per configurazioni comuni
     */
    getTypeValidator(path) {
        const typeValidators = {
            'ai.reasoning.maxDepth': (value) => ({
                valid: Number.isInteger(value) && value > 0 && value <= 10,
                errors: ['Max depth must be an integer between 1 and 10']
            }),
            'ai.reasoning.confidenceThreshold': (value) => ({
                valid: typeof value === 'number' && value >= 0 && value <= 1,
                errors: ['Confidence threshold must be a number between 0 and 1']
            }),
            'performance.caching.maxSize': (value) => ({
                valid: Number.isInteger(value) && value > 0,
                errors: ['Cache max size must be a positive integer']
            }),
            'ui.animations.duration': (value) => ({
                valid: Number.isInteger(value) && value >= 0 && value <= 5000,
                errors: ['Animation duration must be between 0 and 5000ms']
            })
        };

        return typeValidators[path];
    }

    /**
     * Validazione contro schema JSON
     */
    validateAgainstSchema(value, schema) {
        const errors = [];

        // Tipo base
        if (schema.type && typeof value !== schema.type) {
            errors.push(`Expected type ${schema.type}, got ${typeof value}`);
        }

        // Range numerico
        if (schema.type === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(`Value must be >= ${schema.minimum}`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(`Value must be <= ${schema.maximum}`);
            }
        }

        // Array
        if (schema.type === 'array') {
            if (!Array.isArray(value)) {
                errors.push('Value must be an array');
            } else {
                if (schema.minItems !== undefined && value.length < schema.minItems) {
                    errors.push(`Array must have at least ${schema.minItems} items`);
                }
                if (schema.maxItems !== undefined && value.length > schema.maxItems) {
                    errors.push(`Array must have at most ${schema.maxItems} items`);
                }
            }
        }

        // Enum
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Value must be one of: ${schema.enum.join(', ')}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Notifica listeners
     */
    async notifyListeners(path, value) {
        const listeners = this.listeners.get(path) || [];

        for (const listener of listeners) {
            if (listener.active) {
                try {
                    await listener.callback(value, { path, type: 'update' });
                } catch (error) {
                    console.error('[ConfigManager] Listener error:', error);
                }
            }
        }

        // Notifica listeners wildcard
        const wildcardListeners = this.listeners.get('*') || [];
        for (const listener of wildcardListeners) {
            if (listener.active) {
                try {
                    await listener.callback(value, { path, type: 'update', wildcard: true });
                } catch (error) {
                    console.error('[ConfigManager] Wildcard listener error:', error);
                }
            }
        }
    }

    /**
     * Utilità per valori nested
     */
    setNestedValue(obj, path, value) {
        let current = obj;

        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[path[path.length - 1]] = value;
    }

    /**
     * Esportazione configurazioni
     */
    async exportConfigs() {
        const exportData = {};

        for (const [category, config] of this.configs) {
            exportData[category] = this.deepClone(config);
        }

        return {
            configs: exportData,
            timestamp: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Importazione configurazioni
     */
    async importConfigs(data, options = {}) {
        const { merge = true, validate = true } = options;

        try {
            if (!data.configs) {
                throw new Error('Invalid import data: missing configs');
            }

            for (const [category, configData] of Object.entries(data.configs)) {
                if (!this.configs.has(category)) {
                    console.warn(`[ConfigManager] Unknown category in import: ${category}`);
                    continue;
                }

                let newConfig;
                if (merge) {
                    const currentConfig = this.configs.get(category);
                    newConfig = this.deepMerge(currentConfig, configData);
                } else {
                    newConfig = configData;
                }

                // Validazione se richiesta
                if (validate) {
                    for (const [key, value] of Object.entries(this.flattenConfig(newConfig))) {
                        const path = `${category}.${key}`;
                        const validation = await this.validateConfig(path, value);
                        if (!validation.valid) {
                            throw new Error(`Validation failed for ${path}: ${validation.errors.join(', ')}`);
                        }
                    }
                }

                this.configs.set(category, newConfig);
                await this.storage.set(`config_${category}`, newConfig);
            }

            await this.notifyListeners('import', data);
            return { success: true };

        } catch (error) {
            console.error('[ConfigManager] Import error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Utilità
     */
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('[ConfigManager] Deep clone error:', error);
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

    flattenConfig(obj, prefix = '') {
        const flattened = {};

        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenConfig(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        }

        return flattened;
    }

    /**
     * Stato e monitoraggio
     */
    getStatus() {
        return {
            categories: Array.from(this.configs.keys()),
            listeners: Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            validators: this.validators.size,
            schemas: this.schemas.size
        };
    }

    getConfigSummary() {
        const summary = {};

        for (const [category, config] of this.configs) {
            summary[category] = {
                keys: Object.keys(this.flattenConfig(config)).length,
                size: JSON.stringify(config).length
            };
        }

        return summary;
    }
}