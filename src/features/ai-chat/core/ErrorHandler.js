/**
 * ErrorHandler.js - Sistema di Gestione Errori Robusta
 * Gestione errori completa con fallback, recovery e monitoraggio
 */

export class ErrorHandler {
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 60000, // 1 minuto
            enableFallbacks: true,
            logErrors: true,
            alertThreshold: 10,
            ...config
        };

        // Circuit breaker state per componente
        this.circuitBreakers = new Map();

        // Statistiche errori
        this.errorStats = new Map();

        // Handlers personalizzati per tipo di errore
        this.errorHandlers = new Map();

        // Fallback functions
        this.fallbacks = new Map();

        // Recovery strategies
        this.recoveryStrategies = new Map();

        // Error buffer per analisi
        this.errorBuffer = [];
        this.maxBufferSize = 100;

        // Inizializzazione
        this._initializeDefaultHandlers();
        this._initializeDefaultFallbacks();
        this._initializeDefaultRecovery();
    }

    /**
     * Gestione principale errori con retry e fallback
     */
    async handle(operation, context = {}) {
        const operationId = this._generateOperationId();
        const startTime = Date.now();

        try {
            // Controlla circuit breaker
            if (this._isCircuitOpen(operation.name)) {
                return await this._executeFallback(operation, context, 'circuit_open');
            }

            // Esegui operazione con retry
            const result = await this._executeWithRetry(operation, context);

            // Reset circuit breaker su successo
            this._resetCircuitBreaker(operation.name);

            return result;

        } catch (error) {
            const errorInfo = {
                operationId,
                operation: operation.name,
                error: this._normalizeError(error),
                context,
                timestamp: Date.now(),
                duration: Date.now() - startTime,
                stackTrace: error.stack
            };

            // Registra errore
            this._logError(errorInfo);

            // Aggiorna circuit breaker
            this._updateCircuitBreaker(operation.name);

            // Prova recovery
            const recovered = await this._attemptRecovery(operation, errorInfo);
            if (recovered) {
                return recovered;
            }

            // Esegui fallback
            return await this._executeFallback(operation, context, errorInfo);
        }
    }

    /**
     * Esecuzione con retry logic
     */
    async _executeWithRetry(operation, context, attempt = 1) {
        try {
            return await operation.execute(context);
        } catch (error) {
            if (attempt < this.config.maxRetries && this._isRetryable(error)) {
                const delay = this._calculateRetryDelay(attempt);
                await this._delay(delay);

                return this._executeWithRetry(operation, context, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Tentativo di recovery automatico
     */
    async _attemptRecovery(operation, errorInfo) {
        const recoveryStrategy = this.recoveryStrategies.get(operation.name) ||
                                this.recoveryStrategies.get(errorInfo.error.type);

        if (!recoveryStrategy) return null;

        try {
            console.log(`[ErrorHandler] Attempting recovery for ${operation.name}`);
            const recovered = await recoveryStrategy(errorInfo);

            if (recovered) {
                console.log(`[ErrorHandler] Recovery successful for ${operation.name}`);
                this._logRecovery(errorInfo);
                return recovered;
            }
        } catch (recoveryError) {
            console.error('[ErrorHandler] Recovery failed:', recoveryError);
        }

        return null;
    }

    /**
     * Esecuzione fallback
     */
    async _executeFallback(operation, context, reason) {
        if (!this.config.enableFallbacks) {
            throw new Error(`Operation ${operation.name} failed and no fallback available`);
        }

        const fallback = this.fallbacks.get(operation.name) ||
                        this.fallbacks.get('default');

        if (!fallback) {
            throw new Error(`No fallback available for operation ${operation.name}`);
        }

        try {
            console.log(`[ErrorHandler] Executing fallback for ${operation.name}, reason:`, reason);
            const result = await fallback(context, reason);

            this._logFallback(operation.name, reason);
            return result;

        } catch (fallbackError) {
            console.error('[ErrorHandler] Fallback failed:', fallbackError);
            throw fallbackError;
        }
    }

    /**
     * Registrazione handler personalizzato per tipo di errore
     */
    registerErrorHandler(errorType, handler) {
        this.errorHandlers.set(errorType, handler);
    }

    /**
     * Registrazione fallback per operazione
     */
    registerFallback(operationName, fallbackFunction) {
        this.fallbacks.set(operationName, fallbackFunction);
    }

    /**
     * Registrazione strategia di recovery
     */
    registerRecoveryStrategy(key, strategy) {
        this.recoveryStrategies.set(key, strategy);
    }

    /**
     * Handlers di default
     */
    _initializeDefaultHandlers() {
        // Network errors
        this.registerErrorHandler('NetworkError', async (errorInfo) => {
            // Potrebbe provare riconnessione o cache
            console.log('[ErrorHandler] Handling network error');
        });

        // Timeout errors
        this.registerErrorHandler('TimeoutError', async (errorInfo) => {
            // Aumenta timeout per tentativi futuri
            console.log('[ErrorHandler] Handling timeout error');
        });

        // Validation errors
        this.registerErrorHandler('ValidationError', async (errorInfo) => {
            // Log per debugging
            console.warn('[ErrorHandler] Validation error:', errorInfo.error.message);
        });

        // Storage errors
        this.registerErrorHandler('StorageError', async (errorInfo) => {
            // Potrebbe provare storage alternativo
            console.log('[ErrorHandler] Handling storage error');
        });
    }

    /**
     * Fallback di default
     */
    _initializeDefaultFallbacks() {
        // Fallback generico
        this.registerFallback('default', async (context, reason) => {
            console.warn('[ErrorHandler] Using default fallback');
            return {
                success: false,
                fallback: true,
                reason: reason,
                timestamp: Date.now()
            };
        });

        // Fallback per operazioni di ricerca
        this.registerFallback('search', async (context, reason) => {
            return {
                results: [],
                total: 0,
                fallback: true,
                reason: reason,
                timestamp: Date.now()
            };
        });

        // Fallback per operazioni di storage
        this.registerFallback('store', async (context, reason) => {
            // Salva in memoria temporanea
            console.warn('[ErrorHandler] Using memory fallback for storage');
            return {
                success: true,
                fallback: true,
                stored: false,
                reason: reason,
                timestamp: Date.now()
            };
        });

        // Fallback per operazioni AI
        this.registerFallback('ai_reasoning', async (context, reason) => {
            return {
                response: 'Mi dispiace, al momento non posso elaborare la richiesta. Riprova più tardi.',
                confidence: 0,
                fallback: true,
                reason: reason,
                timestamp: Date.now()
            };
        });
    }

    /**
     * Strategie di recovery di default
     */
    _initializeDefaultRecovery() {
        // Recovery per errori di rete
        this.registerRecoveryStrategy('NetworkError', async (errorInfo) => {
            // Aspetta e riprova
            await this._delay(2000);
            // In produzione, potrebbe testare la connessione
            return null; // Lascia che sia l'operazione a decidere
        });

        // Recovery per errori di storage
        this.registerRecoveryStrategy('StorageError', async (errorInfo) => {
            // Prova a ricreare indici o compattare
            console.log('[ErrorHandler] Attempting storage recovery');
            return null;
        });

        // Recovery per errori di memoria
        this.registerRecoveryStrategy('memory', async (errorInfo) => {
            // Forza garbage collection se possibile
            if (global.gc) {
                global.gc();
                return { recovered: true };
            }
            return null;
        });
    }

    /**
     * Circuit Breaker Pattern
     */
    _isCircuitOpen(operationName) {
        const breaker = this.circuitBreakers.get(operationName);
        if (!breaker) return false;

        if (breaker.state === 'open') {
            if (Date.now() - breaker.lastFailTime > this.config.circuitBreakerTimeout) {
                // Prova half-open
                breaker.state = 'half-open';
                breaker.failCount = 0;
                return false;
            }
            return true;
        }

        return false;
    }

    _updateCircuitBreaker(operationName) {
        const breaker = this.circuitBreakers.get(operationName) || {
            failCount: 0,
            state: 'closed',
            lastFailTime: 0
        };

        breaker.failCount++;
        breaker.lastFailTime = Date.now();

        if (breaker.failCount >= this.config.circuitBreakerThreshold) {
            breaker.state = 'open';
            console.warn(`[ErrorHandler] Circuit breaker opened for ${operationName}`);
        }

        this.circuitBreakers.set(operationName, breaker);
    }

    _resetCircuitBreaker(operationName) {
        const breaker = this.circuitBreakers.get(operationName);
        if (breaker) {
            breaker.failCount = 0;
            breaker.state = 'closed';
        }
    }

    /**
     * Logging e monitoraggio errori
     */
    _logError(errorInfo) {
        // Aggiungi al buffer
        this.errorBuffer.push(errorInfo);
        if (this.errorBuffer.length > this.maxBufferSize) {
            this.errorBuffer.shift();
        }

        // Aggiorna statistiche
        const key = `${errorInfo.operation}:${errorInfo.error.type}`;
        const stats = this.errorStats.get(key) || {
            count: 0,
            lastOccurrence: 0,
            averageDuration: 0
        };

        stats.count++;
        stats.lastOccurrence = errorInfo.timestamp;
        stats.averageDuration = (stats.averageDuration + errorInfo.duration) / 2;

        this.errorStats.set(key, stats);

        // Log console se abilitato
        if (this.config.logErrors) {
            console.error('[ErrorHandler] Error logged:', {
                operation: errorInfo.operation,
                type: errorInfo.error.type,
                message: errorInfo.error.message,
                duration: errorInfo.duration
            });
        }

        // Alert se supera soglia
        if (stats.count >= this.config.alertThreshold) {
            this._triggerAlert(errorInfo, stats);
        }

        // Handler personalizzato
        const handler = this.errorHandlers.get(errorInfo.error.type);
        if (handler) {
            handler(errorInfo).catch(console.error);
        }
    }

    _logRecovery(errorInfo) {
        console.log(`[ErrorHandler] Recovery successful for ${errorInfo.operation}`);
    }

    _logFallback(operationName, reason) {
        console.log(`[ErrorHandler] Fallback executed for ${operationName}`);
    }

    _triggerAlert(errorInfo, stats) {
        console.error('[ErrorHandler] ALERT: High error rate detected', {
            operation: errorInfo.operation,
            errorType: errorInfo.error.type,
            count: stats.count,
            timeWindow: Date.now() - (stats.lastOccurrence - 60000) // Ultimo minuto
        });

        // In produzione, potrebbe inviare notifiche
    }

    /**
     * Utilità
     */
    _normalizeError(error) {
        if (error instanceof Error) {
            return {
                type: error.constructor.name,
                message: error.message,
                code: error.code,
                details: error.details
            };
        }

        if (typeof error === 'string') {
            return {
                type: 'Error',
                message: error,
                code: null,
                details: null
            };
        }

        return {
            type: 'UnknownError',
            message: 'Unknown error occurred',
            code: null,
            details: error
        };
    }

    _isRetryable(error) {
        const nonRetryableTypes = ['ValidationError', 'AuthenticationError', 'AuthorizationError'];
        return !nonRetryableTypes.includes(error.type);
    }

    _calculateRetryDelay(attempt) {
        // Exponential backoff con jitter
        const baseDelay = this.config.retryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * baseDelay;
        return Math.min(baseDelay + jitter, 30000); // Max 30 secondi
    }

    _generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Metodi di monitoraggio e analisi
     */
    getErrorStats() {
        return {
            totalErrors: this.errorBuffer.length,
            errorTypes: this._aggregateErrorTypes(),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            recentErrors: this.errorBuffer.slice(-10)
        };
    }

    getHealthStatus() {
        const now = Date.now();
        const lastHour = now - 3600000;

        const recentErrors = this.errorBuffer.filter(e => e.timestamp > lastHour);
        const errorRate = recentErrors.length / 36; // Errori per minuto

        const openCircuits = Array.from(this.circuitBreakers.values())
            .filter(cb => cb.state === 'open').length;

        return {
            status: errorRate > 5 || openCircuits > 2 ? 'unhealthy' : 'healthy',
            errorRate,
            openCircuits,
            totalErrors: this.errorBuffer.length,
            timestamp: now
        };
    }

    _aggregateErrorTypes() {
        const types = {};
        for (const error of this.errorBuffer) {
            const key = `${error.operation}:${error.error.type}`;
            types[key] = (types[key] || 0) + 1;
        }
        return types;
    }

    /**
     * Cleanup e manutenzione
     */
    cleanup(olderThan = 86400000) { // 24 ore
        const cutoff = Date.now() - olderThan;

        // Pulisci buffer errori
        this.errorBuffer = this.errorBuffer.filter(e => e.timestamp > cutoff);

        // Pulisci statistiche vecchie
        for (const [key, stats] of this.errorStats) {
            if (stats.lastOccurrence < cutoff) {
                this.errorStats.delete(key);
            }
        }

        // Reset circuit breaker vecchi
        for (const [operation, breaker] of this.circuitBreakers) {
            if (breaker.lastFailTime < cutoff) {
                this.circuitBreakers.delete(operation);
            }
        }

        return { success: true };
    }

    /**
     * Export/import configurazione
     */
    exportConfig() {
        return {
            config: { ...this.config },
            errorHandlers: Array.from(this.errorHandlers.entries()),
            fallbacks: Array.from(this.fallbacks.entries()),
            recoveryStrategies: Array.from(this.recoveryStrategies.entries()),
            timestamp: Date.now()
        };
    }

    importConfig(data) {
        if (data.config) {
            this.config = { ...this.config, ...data.config };
        }

        if (data.errorHandlers) {
            this.errorHandlers = new Map(data.errorHandlers);
        }

        if (data.fallbacks) {
            this.fallbacks = new Map(data.fallbacks);
        }

        if (data.recoveryStrategies) {
            this.recoveryStrategies = new Map(data.recoveryStrategies);
        }

        return { success: true };
    }

    /**
     * Reset completo
     */
    reset() {
        this.circuitBreakers.clear();
        this.errorStats.clear();
        this.errorBuffer = [];
        this._initializeDefaultHandlers();
        this._initializeDefaultFallbacks();
        this._initializeDefaultRecovery();

        return { success: true };
    }
}

/**
 * Error types comuni
 */
export class AIError extends Error {
    constructor(message, type = 'AIError', details = {}) {
        super(message);
        this.name = 'AIError';
        this.type = type;
        this.details = details;
        this.timestamp = Date.now();
    }
}

export class NetworkError extends AIError {
    constructor(message, details = {}) {
        super(message, 'NetworkError', details);
        this.name = 'NetworkError';
    }
}

export class StorageError extends AIError {
    constructor(message, details = {}) {
        super(message, 'StorageError', details);
        this.name = 'StorageError';
    }
}

export class ValidationError extends AIError {
    constructor(message, details = {}) {
        super(message, 'ValidationError', details);
        this.name = 'ValidationError';
    }
}

export class TimeoutError extends AIError {
    constructor(message, details = {}) {
        super(message, 'TimeoutError', details);
        this.name = 'TimeoutError';
    }
}

/**
 * Wrapper per operazioni con gestione errori
 */
export function withErrorHandling(operation, errorHandler) {
    return async function(...args) {
        return await errorHandler.handle({
            name: operation.name,
            execute: () => operation.apply(this, args)
        }, { args });
    };
}

/**
 * Decorator per metodi con gestione errori
 */
export function errorHandled(errorHandler) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args) {
            return await errorHandler.handle({
                name: `${target.constructor.name}.${propertyKey}`,
                execute: () => originalMethod.apply(this, args)
            }, { args });
        };

        return descriptor;
    };
}