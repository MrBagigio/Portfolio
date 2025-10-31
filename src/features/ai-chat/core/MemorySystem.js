/**
 * MemorySystem.js - Sistema di Memoria Unificato
 * Gestione efficiente della memoria episodica, semantica e di lavoro tramite OptimizedStorage.
 */
export class MemorySystem {
    constructor(options = {}) {
        const { storage, maxMemoryItems = 10000, enableCompression = true } = options;
        // Assumiamo che `storage` sia un'istanza di OptimizedStorage, che viene iniettata.
        this.storage = storage;
        this.config = {
            maxEpisodicMemory: maxMemoryItems,
            maxSemanticMemory: 500,
            workingMemorySize: 50,
            compressionEnabled: enableCompression,
            autoCleanup: true,
            cleanupInterval: 300000 // 5 minuti
        };
        this.workingMemory = new Map();
        this.initializeMemory();
    }

    /**
     * Inizializzazione del sistema di memoria. Ora si assicura solo che lo storage sia pronto.
     */
    async initializeMemory() {
        try {
            if (!this.storage) {
                throw new Error("OptimizedStorage instance was not provided to MemorySystem.");
            }
            await this.storage.initialize();
            console.log('[MemorySystem] Memory System initialized and connected to storage.');
        } catch (error) {
            console.error('[MemorySystem] Error initializing memory storage:', error);
        }
    }

    /**
     * Memorizzazione unificata. Scrive direttamente nello storage.
     */
    async store(type, data, metadata = {}) {
        try {
            const entry = {
                id: this.generateId(),
                // TODO: Implementare la logica di compressione se necessaria
                data: data,
                timestamp: Date.now(),
                type,
                metadata: {
                    ...metadata,
                    accessCount: 0,
                    lastAccess: Date.now()
                }
            };
            if (type === 'working') {
                this.storeWorking(entry);
                return entry.id;
            }
            const result = await this.storage.store(entry);
            if (!result.success) {
                throw new Error(result.error || 'Failed to store entry in OptimizedStorage');
            }
            return entry.id;
        } catch (error) {
            console.error(`[MemorySystem] Error storing ${type} memory:`, error);
            throw error;
        }
    }

    /**
     * Recupero unificato con ricerca intelligente tramite lo storage.
     */
    async retrieve(type, query, options = {}) {
        const {
            limit = 10,
            minConfidence = 0.5,
            includeMetadata = false
        } = options;
        try {
            if (type === 'working') {
                return this.retrieveWorking(query);
            }
            const searchResult = await this.storage.search({
                text: query,
                type: type,
                limit: limit,
                minConfidence: minConfidence
            });
            const results = searchResult.results || [];
            for (const result of results) {
                await this.updateAccessStats(result.id, type);
            }
            return results.map(result => ({
                id: result.id,
                data: includeMetadata ? result : result.data,
                confidence: result.relevanceScore || 0.5,
                metadata: includeMetadata ? result.metadata : undefined
            }));
        } catch (error) {
            console.error(`[MemorySystem] Error retrieving ${type} memory:`, error);
            return [];
        }
    }

    /**
     * Ricerca avanzata che sfrutta la ricerca full-text dello storage.
     */
    async search(query, options = {}) {
        const {
            types = ['episodic', 'semantic'],
            limit = 20,
            sortBy = 'relevance'
        } = options;
        const allResults = [];
        for (const type of types) {
            const searchResponse = await this.storage.searchFullText(query, { limit });
            if (searchResponse) {
                allResults.push(...searchResponse.map(r => ({ ...r, source: type })));
            }
        }
        const sorted = this.sortResults(allResults, sortBy);
        return this.deduplicateResults(sorted).slice(0, limit);
    }

    /**
     * Memoria di lavoro - contesto corrente
     */
    storeWorking(entry) {
        if (this.workingMemory.size >= this.config.workingMemorySize) {
            const lruKey = Array.from(this.workingMemory.entries())
                .sort(([, a], [, b]) => (a.metadata?.lastAccess || 0) - (b.metadata?.lastAccess || 0))[0][0];
            this.workingMemory.delete(lruKey);
        }
        this.workingMemory.set(entry.id, entry);
    }

    retrieveWorking(query) {
        const results = [];
        for (const [id, entry] of this.workingMemory) {
            const score = this.scoreWorkingMatch(entry, query);
            if (score > 0) {
                results.push({
                    id,
                    data: entry.data,
                    confidence: score,
                    metadata: entry.metadata
                });
            }
        }
        return results.sort((a, b) => b.confidence - a.confidence);
    }

    scoreWorkingMatch(entry, query) {
        const queryStr = typeof query === 'string' ? query.toLowerCase() : JSON.stringify(query).toLowerCase();
        const entryStr = JSON.stringify(entry.data).toLowerCase();
        return entryStr.includes(queryStr) ? 0.8 : 0;
    }

    /**
     * Utilità
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    sortResults(results, sortBy) {
        if (sortBy === 'relevance') {
            return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
        return results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(el => {
            const duplicate = seen.has(el.id);
            seen.add(el.id);
            return !duplicate;
        });
    }

    async updateAccessStats(entryId, type) {
        // Placeholder: In un'implementazione reale, si potrebbe usare una coda di aggiornamento
        // per non rallentare le operazioni di lettura.
        return;
    }

    // TODO: Implementare la logica di compressione se necessaria
    async compress(data) { return data; }
    async decompress(data) { return data; }
}
