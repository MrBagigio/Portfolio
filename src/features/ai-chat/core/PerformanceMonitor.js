/**
 * PerformanceMonitor.js - Monitoraggio Performance e Cache Intelligente
 * Sistema completo per monitoraggio prestazioni e caching ottimizzato
 */

export class PerformanceMonitor {
    constructor(config = {}) {
        this.config = {
            enableMonitoring: true,
            metricsRetention: 3600000, // 1 ora
            alertThresholds: {
                responseTime: 5000, // 5 secondi
                memoryUsage: 300 * 1024 * 1024, // 300MB (increased for AI system)
                cpuUsage: 80, // 80%
                errorRate: 5 // 5 errori al minuto
            },
            samplingRate: 0.1, // 10% delle operazioni
            enableCache: true,
            cacheStrategy: 'lru',
            ...config
        };

        // Metriche raccolte
        this.metrics = {
            responseTimes: [],
            memoryUsage: [],
            cpuUsage: [],
            errorRates: [],
            throughput: [],
            customMetrics: new Map()
        };

        // Cache intelligente
        this.cache = new IntelligentCache({
            strategy: this.config.cacheStrategy,
            maxSize: 1000,
            ttl: 10 * 60 * 1000 // 10 minuti
        });

        // Monitor attivi
        this.monitors = new Map();

        // Alert attivi
        this.activeAlerts = new Set();

        // Statistiche aggregate
        this.aggregatedStats = {
            totalOperations: 0,
            totalErrors: 0,
            averageResponseTime: 0,
            peakMemoryUsage: 0,
            uptime: Date.now()
        };

        // Inizializzazione
        if (this.config.enableMonitoring) {
            this._startSystemMonitoring();
        }
    }

    /**
     * Monitoraggio di una operazione
     */
    async monitor(operation, context = {}) {
        if (!this.config.enableMonitoring) {
            return await operation();
        }

        const startTime = Date.now();
        const operationId = this._generateOperationId();
        const shouldSample = Math.random() < this.config.samplingRate;

        // Controlla cache prima dell'esecuzione
        const cacheKey = this._generateCacheKey(operation, context);
        if (this.config.enableCache && cacheKey) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this._recordMetric('cache_hit', Date.now() - startTime);
                return cached;
            }
        }

        try {
            const result = await operation();

            const duration = Date.now() - startTime;

            // Registra metriche
            if (shouldSample) {
                this._recordMetric('response_time', duration, { operationId, ...context });
                this._recordMetric('operation_success', 1, { operationId });
            }

            // Salva in cache se appropriato
            if (this.config.enableCache && cacheKey && this._shouldCache(result)) {
                this.cache.set(cacheKey, result, { duration, context });
            }

            // Aggiorna statistiche aggregate
            this.aggregatedStats.totalOperations++;
            this.aggregatedStats.averageResponseTime =
                (this.aggregatedStats.averageResponseTime + duration) / 2;

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;

            if (shouldSample) {
                this._recordMetric('response_time', duration, { operationId, error: true, ...context });
                this._recordMetric('operation_error', 1, { operationId, errorType: error.constructor.name });
            }

            this.aggregatedStats.totalErrors++;

            // Controlla soglie alert
            this._checkAlertThresholds();

            throw error;
        }
    }

    /**
     * Decoratore per metodi
     */
    monitorMethod(componentName) {
        return (target, propertyKey, descriptor) => {
            const originalMethod = descriptor.value;

            descriptor.value = async function(...args) {
                const operation = () => originalMethod.apply(this, args);
                const context = {
                    component: componentName,
                    method: propertyKey,
                    argsCount: args.length
                };

                return await this._performanceMonitor.monitor(operation, context);
            };

            return descriptor;
        };
    }

    /**
     * Inizio monitoraggio di un componente
     */
    startComponentMonitoring(componentName, component) {
        if (this.monitors.has(componentName)) {
            return;
        }

        const monitor = {
            componentName,
            startTime: Date.now(),
            metrics: {
                operations: 0,
                errors: 0,
                averageResponseTime: 0
            },
            healthChecks: []
        };

        // Wrap metodi del componente
        if (component && typeof component === 'object') {
            this._wrapComponentMethods(component, componentName);
        }

        this.monitors.set(componentName, monitor);
    }

    /**
     * Monitoraggio risorse di sistema
     */
    _startSystemMonitoring() {
        // Monitoraggio memoria
        setInterval(() => {
            if (performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize;
                this._recordMetric('memory_usage', memoryUsage);

                this.aggregatedStats.peakMemoryUsage =
                    Math.max(this.aggregatedStats.peakMemoryUsage, memoryUsage);

                this._checkMemoryThreshold(memoryUsage);
            }
        }, 30000); // Ogni 30 secondi

        // Monitoraggio CPU (se disponibile)
        if ('cpu' in performance) {
            setInterval(() => {
                // Implementazione specifica per browser/Node
                this._recordMetric('cpu_usage', performance.cpu);
            }, 60000); // Ogni minuto
        }

        // Pulizia periodica metriche vecchie
        setInterval(() => {
            this._cleanupOldMetrics();
        }, this.config.metricsRetention / 4);
    }

    /**
     * Registrazione metrica
     */
    _recordMetric(name, value, metadata = {}) {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            metadata
        };

        // Aggiungi alla categoria appropriata
        if (!this.metrics[name]) {
            this.metrics[name] = [];
        }

        this.metrics[name].push(metric);

        // Mantieni limite dimensione
        if (this.metrics[name].length > 1000) {
            this.metrics[name] = this.metrics[name].slice(-500);
        }

        // Metriche custom
        if (metadata.custom) {
            const customKey = metadata.custom;
            if (!this.metrics.customMetrics.has(customKey)) {
                this.metrics.customMetrics.set(customKey, []);
            }
            this.metrics.customMetrics.get(customKey).push(metric);
        }
    }

    /**
     * Controllo soglie alert
     */
    _checkAlertThresholds() {
        const now = Date.now();
        const lastMinute = now - 60000;

        // Response time alert
        const recentResponseTimes = this.metrics.responseTimes?.filter(
            m => m.timestamp > lastMinute
        ) || [];

        if (recentResponseTimes.length > 0) {
            const avgResponseTime = recentResponseTimes.reduce((sum, m) => sum + m.value, 0) / recentResponseTimes.length;
            if (avgResponseTime > this.config.alertThresholds.responseTime) {
                this._triggerAlert('high_response_time', {
                    average: avgResponseTime,
                    threshold: this.config.alertThresholds.responseTime
                });
            }
        }

        // Error rate alert
        const recentErrors = this.metrics.operation_error?.filter(
            m => m.timestamp > lastMinute
        ) || [];

        const errorRate = recentErrors.length;
        if (errorRate > this.config.alertThresholds.errorRate) {
            this._triggerAlert('high_error_rate', {
                errors: errorRate,
                threshold: this.config.alertThresholds.errorRate
            });
        }
    }

    _checkMemoryThreshold(memoryUsage) {
        if (memoryUsage > this.config.alertThresholds.memoryUsage) {
            this._triggerAlert('high_memory_usage', {
                usage: memoryUsage,
                threshold: this.config.alertThresholds.memoryUsage
            });
        }
    }

    _triggerAlert(type, data) {
        const alertKey = `${type}_${Date.now()}`;

        if (this.activeAlerts.has(alertKey)) return;

        this.activeAlerts.add(alertKey);

        console.warn(`[PerformanceMonitor] ALERT: ${type}`, data);

        // In produzione, potrebbe inviare notifiche o logs
        // Auto-resolve dopo 5 minuti
        setTimeout(() => {
            this.activeAlerts.delete(alertKey);
        }, 300000);
    }

    /**
     * Cache intelligente
     */
    _shouldCache(result) {
        // Non cachare errori o risultati vuoti
        if (!result || result.error) return false;

        // Non cachare risultati troppo grandi
        const size = JSON.stringify(result).length;
        if (size > 1024 * 1024) return false; // 1MB max

        return true;
    }

    _generateCacheKey(operation, context) {
        try {
            // Crea chiave basata su funzione e argomenti
            const funcString = operation.toString();
            const contextString = JSON.stringify(context, Object.keys(context).sort());
            return btoa(funcString + contextString).substring(0, 32);
        } catch (error) {
            return null;
        }
    }

    /**
     * Wrap metodi componente
     */
    _wrapComponentMethods(component, componentName) {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(component))
            .filter(name => typeof component[name] === 'function' && name !== 'constructor');

        for (const methodName of methods) {
            const originalMethod = component[methodName];
            const monitor = this.monitors.get(componentName);

            component[methodName] = async (...args) => {
                const startTime = Date.now();

                try {
                    const result = await originalMethod.apply(component, args);
                    const duration = Date.now() - startTime;

                    // Aggiorna metriche componente
                    monitor.metrics.operations++;
                    monitor.metrics.averageResponseTime =
                        (monitor.metrics.averageResponseTime + duration) / 2;

                    return result;
                } catch (error) {
                    monitor.metrics.errors++;
                    throw error;
                }
            };
        }
    }

    /**
     * Pulizia metriche vecchie
     */
    _cleanupOldMetrics() {
        const cutoff = Date.now() - this.config.metricsRetention;

        for (const [metricName, metrics] of Object.entries(this.metrics)) {
            if (Array.isArray(metrics)) {
                this.metrics[metricName] = metrics.filter(m => m.timestamp > cutoff);
            }
        }

        // Pulisci cache
        this.cache.cleanup();
    }

    /**
     * Utilità
     */
    _generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * API di reporting
     */
    getMetrics(timeRange = 3600000) { // Default: ultima ora
        const cutoff = Date.now() - timeRange;
        const result = {};

        for (const [metricName, metrics] of Object.entries(this.metrics)) {
            if (Array.isArray(metrics)) {
                const recent = metrics.filter(m => m.timestamp > cutoff);
                result[metricName] = {
                    count: recent.length,
                    average: recent.length > 0 ?
                        recent.reduce((sum, m) => sum + m.value, 0) / recent.length : 0,
                    min: recent.length > 0 ? Math.min(...recent.map(m => m.value)) : 0,
                    max: recent.length > 0 ? Math.max(...recent.map(m => m.value)) : 0,
                    recent
                };
            }
        }

        return result;
    }

    getComponentHealth() {
        const health = {};

        for (const [componentName, monitor] of this.monitors) {
            const uptime = Date.now() - monitor.startTime;
            const errorRate = monitor.metrics.operations > 0 ?
                (monitor.metrics.errors / monitor.metrics.operations) * 100 : 0;

            health[componentName] = {
                status: errorRate > 5 ? 'unhealthy' : 'healthy',
                uptime,
                operations: monitor.metrics.operations,
                errors: monitor.metrics.errors,
                errorRate: `${errorRate.toFixed(2)}%`,
                averageResponseTime: monitor.metrics.averageResponseTime
            };
        }

        return health;
    }

    getSystemHealth() {
        const memoryUsage = performance.memory?.usedJSHeapSize || 0;
        const uptime = Date.now() - this.aggregatedStats.uptime;

        return {
            status: this.activeAlerts.size > 0 ? 'warning' : 'healthy',
            uptime,
            memoryUsage,
            peakMemoryUsage: this.aggregatedStats.peakMemoryUsage,
            totalOperations: this.aggregatedStats.totalOperations,
            totalErrors: this.aggregatedStats.totalErrors,
            averageResponseTime: this.aggregatedStats.averageResponseTime,
            activeAlerts: Array.from(this.activeAlerts),
            cacheStats: this.cache.getStats()
        };
    }

    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Ottimizzazioni
     */
    optimize() {
        // Ottimizza cache
        this.cache.optimize();

        // Forza garbage collection se disponibile
        if (global.gc) {
            global.gc();
        }

        // Pulisci metriche vecchie
        this._cleanupOldMetrics();

        return { success: true };
    }

    /**
     * Export/import configurazione
     */
    exportConfig() {
        return {
            config: { ...this.config },
            aggregatedStats: { ...this.aggregatedStats },
            timestamp: Date.now()
        };
    }

    importConfig(data) {
        if (data.config) {
            this.config = { ...this.config, ...data.config };
        }

        if (data.aggregatedStats) {
            this.aggregatedStats = { ...this.aggregatedStats, ...data.aggregatedStats };
        }

        return { success: true };
    }

    /**
     * Reset
     */
    reset() {
        this.metrics = {
            responseTimes: [],
            memoryUsage: [],
            cpuUsage: [],
            errorRates: [],
            throughput: [],
            customMetrics: new Map()
        };

        this.cache.clear();
        this.activeAlerts.clear();
        this.aggregatedStats = {
            totalOperations: 0,
            totalErrors: 0,
            averageResponseTime: 0,
            peakMemoryUsage: 0,
            uptime: Date.now()
        };

        return { success: true };
    }
}

/**
 * Cache Intelligente con strategie multiple
 */
class IntelligentCache {
    constructor(options = {}) {
        this.options = {
            strategy: 'lru',
            maxSize: 1000,
            ttl: 10 * 60 * 1000,
            ...options
        };

        this.cache = new Map();
        this.accessOrder = []; // Per LRU
        this.accessCount = new Map(); // Per LFU
        this.metadata = new Map();

        // Statistiche
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            size: 0
        };
    }

    set(key, value, metadata = {}) {
        const now = Date.now();

        // Rimuovi se esiste già
        if (this.cache.has(key)) {
            this._remove(key);
        }

        // Evict se necessario
        if (this.cache.size >= this.options.maxSize) {
            this._evict();
        }

        // Salva
        this.cache.set(key, value);
        this.metadata.set(key, {
            timestamp: now,
            ttl: metadata.ttl || this.options.ttl,
            accessCount: 0,
            lastAccess: now,
            size: this._estimateSize(value),
            ...metadata
        });

        // Aggiorna strategia
        this._updateStrategy(key);

        this.stats.sets++;
        this.stats.size = this.cache.size;
    }

    get(key) {
        if (!this.cache.has(key)) {
            this.stats.misses++;
            return null;
        }

        const metadata = this.metadata.get(key);
        const now = Date.now();

        // Controlla TTL
        if (now - metadata.timestamp > metadata.ttl) {
            this._remove(key);
            this.stats.misses++;
            return null;
        }

        // Aggiorna accesso
        metadata.lastAccess = now;
        metadata.accessCount++;
        this._updateStrategy(key);

        this.stats.hits++;
        return this.cache.get(key);
    }

    delete(key) {
        if (this._remove(key)) {
            this.stats.deletes++;
            this.stats.size = this.cache.size;
            return true;
        }
        return false;
    }

    clear() {
        this.cache.clear();
        this.metadata.clear();
        this.accessOrder = [];
        this.accessCount.clear();
        this.stats.size = 0;
    }

    cleanup() {
        const now = Date.now();
        const toRemove = [];

        for (const [key, metadata] of this.metadata) {
            if (now - metadata.timestamp > metadata.ttl) {
                toRemove.push(key);
            }
        }

        for (const key of toRemove) {
            this._remove(key);
        }

        this.stats.size = this.cache.size;
    }

    optimize() {
        // Riordina per strategia corrente
        const entries = Array.from(this.cache.entries());

        switch (this.options.strategy) {
            case 'lru':
                entries.sort((a, b) => {
                    const aMeta = this.metadata.get(a[0]);
                    const bMeta = this.metadata.get(b[0]);
                    return bMeta.lastAccess - aMeta.lastAccess;
                });
                break;
            case 'lfu':
                entries.sort((a, b) => {
                    const aMeta = this.metadata.get(a[0]);
                    const bMeta = this.metadata.get(b[0]);
                    return bMeta.accessCount - aMeta.accessCount;
                });
                break;
            case 'size':
                entries.sort((a, b) => {
                    const aMeta = this.metadata.get(a[0]);
                    const bMeta = this.metadata.get(b[0]);
                    return aMeta.size - bMeta.size; // Più piccoli prima
                });
                break;
        }

        // Ricostruisci cache
        this.clear();
        for (const [key, value] of entries.slice(0, this.options.maxSize)) {
            this.cache.set(key, value);
            this.metadata.set(key, this.metadata.get(key));
        }

        this.stats.size = this.cache.size;
    }

    getStats() {
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

        return {
            ...this.stats,
            hitRate,
            totalSize: Array.from(this.metadata.values())
                .reduce((sum, meta) => sum + meta.size, 0)
        };
    }

    _remove(key) {
        if (!this.cache.has(key)) return false;

        this.cache.delete(key);
        this.metadata.delete(key);

        // Rimuovi da strutture strategia
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessCount.delete(key);

        return true;
    }

    _evict() {
        let keyToEvict;

        switch (this.options.strategy) {
            case 'lru':
                keyToEvict = this.accessOrder.shift();
                break;
            case 'lfu':
                // Trova meno frequentemente usato
                let minCount = Infinity;
                for (const [key, count] of this.accessCount) {
                    if (count < minCount) {
                        minCount = count;
                        keyToEvict = key;
                    }
                }
                break;
            case 'fifo':
                keyToEvict = this.cache.keys().next().value;
                break;
            case 'size':
                // Evict più grande
                let maxSize = 0;
                for (const [key, metadata] of this.metadata) {
                    if (metadata.size > maxSize) {
                        maxSize = metadata.size;
                        keyToEvict = key;
                    }
                }
                break;
            default:
                keyToEvict = this.cache.keys().next().value;
        }

        if (keyToEvict) {
            this._remove(keyToEvict);
        }
    }

    _updateStrategy(key) {
        switch (this.options.strategy) {
            case 'lru':
                const index = this.accessOrder.indexOf(key);
                if (index !== -1) {
                    this.accessOrder.splice(index, 1);
                }
                this.accessOrder.push(key);
                break;
            case 'lfu':
                // Access count già aggiornato nel get
                break;
        }
    }

    _estimateSize(value) {
        try {
            return JSON.stringify(value).length;
        } catch (error) {
            return 1000; // Default
        }
    }
}