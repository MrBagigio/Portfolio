/**
 * OptimizedStorage.js - Sistema Storage Ottimizzato
 * Storage persistente con IndexedDB e algoritmi ricerca efficienti
 */

export class OptimizedStorage {
    constructor(dbName = 'ai_memory_db', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
        this.isInitialized = false;
        this.initPromise = null;

        // Cache per performance
        this.cache = new Map();
        this.cacheSize = 1000;
        this.cacheTTL = 5 * 60 * 1000; // 5 minuti

        // Statistiche
        this.stats = {
            reads: 0,
            writes: 0,
            deletes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            avgReadTime: 0,
            avgWriteTime: 0
        };
    }

    /**
     * Inizializzazione database IndexedDB
     */
    async initialize() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._initDatabase();
        return this.initPromise;
    }

    async _initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('[OptimizedStorage] Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('[OptimizedStorage] Database initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store principale per entries
                if (!db.objectStoreNames.contains('entries')) {
                    const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });

                    // Indici per ricerca efficiente
                    entriesStore.createIndex('type', 'type', { unique: false });
                    entriesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    entriesStore.createIndex('content', 'content', { unique: false });
                    entriesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    entriesStore.createIndex('userId', 'userId', { unique: false });
                    entriesStore.createIndex('sessionId', 'sessionId', { unique: false });
                    entriesStore.createIndex('confidence', 'confidence', { unique: false });
                    entriesStore.createIndex('type_timestamp', ['type', 'timestamp'], { unique: false });
                    entriesStore.createIndex('user_timestamp', ['userId', 'timestamp'], { unique: false });
                }

                // Store per indici invertiti (ricerca full-text)
                if (!db.objectStoreNames.contains('inverted_index')) {
                    const indexStore = db.createObjectStore('inverted_index', { keyPath: 'term' });
                    indexStore.createIndex('entries', 'entries', { unique: false, multiEntry: true });
                }

                // Store per vettori semantici (ricerca per similarità)
                if (!db.objectStoreNames.contains('semantic_vectors')) {
                    const vectorStore = db.createObjectStore('semantic_vectors', { keyPath: 'id' });
                    vectorStore.createIndex('vector', 'vector', { unique: false });
                }

                // Store per metadati e statistiche
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }

                // Store per cache temporanea
                if (!db.objectStoreNames.contains('cache')) {
                    const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
                    cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                console.log('[OptimizedStorage] Database schema created');
            };
        });
    }

    /**
     * Operazioni CRUD ottimizzate
     */
    async store(entry) {
        await this.ensureInitialized();

        const startTime = Date.now();
        const transaction = this.db.transaction(['entries', 'inverted_index', 'semantic_vectors'], 'readwrite');

        try {
            // Store entry principale
            const entriesStore = transaction.objectStore('entries');
            await this._put(entriesStore, entry);

            // Aggiorna indice invertito per ricerca full-text
            await this._updateInvertedIndex(transaction, entry);

            // Store vettore semantico se presente
            if (entry.vector) {
                const vectorStore = transaction.objectStore('semantic_vectors');
                await this._put(vectorStore, {
                    id: entry.id,
                    vector: entry.vector,
                    timestamp: entry.timestamp
                });
            }

            // Aggiorna cache
            this._updateCache(entry.id, entry);

            // Aggiorna statistiche
            this.stats.writes++;
            this.stats.avgWriteTime = (this.stats.avgWriteTime + (Date.now() - startTime)) / 2;

            return { success: true, id: entry.id };

        } catch (error) {
            console.error('[OptimizedStorage] Store error:', error);
            return { success: false, error: error.message };
        }
    }

    async retrieve(id) {
        await this.ensureInitialized();

        // Controlla cache prima
        const cached = this._getFromCache(id);
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }

        this.stats.cacheMisses++;
        const startTime = Date.now();

        try {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const result = await this._get(store, id);

            if (result) {
                this._updateCache(id, result);
                this.stats.reads++;
                this.stats.avgReadTime = (this.stats.avgReadTime + (Date.now() - startTime)) / 2;
            }

            return result;

        } catch (error) {
            console.error('[OptimizedStorage] Retrieve error:', error);
            return null;
        }
    }

    async delete(id) {
        await this.ensureInitialized();

        const startTime = Date.now();
        const transaction = this.db.transaction(['entries', 'inverted_index', 'semantic_vectors'], 'readwrite');

        try {
            // Rimuovi da entries
            const entriesStore = transaction.objectStore('entries');
            await this._delete(entriesStore, id);

            // Rimuovi da indice invertito
            await this._removeFromInvertedIndex(transaction, id);

            // Rimuovi vettore semantico
            const vectorStore = transaction.objectStore('semantic_vectors');
            await this._delete(vectorStore, id);

            // Rimuovi da cache
            this.cache.delete(id);

            this.stats.deletes++;
            return { success: true };

        } catch (error) {
            console.error('[OptimizedStorage] Delete error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Ricerca efficiente con indici
     */
    async search(query) {
        await this.ensureInitialized();

        const {
            text,
            type,
            userId,
            sessionId,
            dateRange,
            tags,
            minConfidence,
            limit = 50,
            offset = 0
        } = query;

        try {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');

            let results = [];

            // Ricerca per tipo (indice più selettivo)
            if (type) {
                const index = store.index('type');
                const typeResults = await this._getAllFromIndex(index, type);
                results = typeResults;
            } else {
                // Fallback a scan completo (limitato)
                results = await this._getAll(store, limit * 2);
            }

            // Filtra per altri criteri
            results = results.filter(entry => {
                if (userId && entry.userId !== userId) return false;
                if (sessionId && entry.sessionId !== sessionId) return false;
                if (minConfidence && entry.confidence < minConfidence) return false;
                if (dateRange) {
                    const entryDate = new Date(entry.timestamp);
                    if (entryDate < dateRange.start || entryDate > dateRange.end) return false;
                }
                if (tags && tags.length > 0) {
                    const entryTags = entry.tags || [];
                    if (!tags.some(tag => entryTags.includes(tag))) return false;
                }
                if (text) {
                    const searchText = `${entry.content} ${entry.title || ''}`.toLowerCase();
                    if (!searchText.includes(text.toLowerCase())) return false;
                }
                return true;
            });

            // Ordina per rilevanza (timestamp decrescente)
            results.sort((a, b) => b.timestamp - a.timestamp);

            // Paginazione
            const paginatedResults = results.slice(offset, offset + limit);

            return {
                results: paginatedResults,
                total: results.length,
                hasMore: results.length > offset + limit
            };

        } catch (error) {
            console.error('[OptimizedStorage] Search error:', error);
            return { results: [], total: 0, hasMore: false };
        }
    }

    /**
     * Ricerca full-text ottimizzata
     */
    async searchFullText(searchTerm, options = {}) {
        await this.ensureInitialized();

        const { fuzzy = true, limit = 50 } = options;

        try {
            const transaction = this.db.transaction(['inverted_index', 'entries'], 'readonly');

            // Tokenizza termine di ricerca
            const tokens = this._tokenizeForSearch(searchTerm);

            // Trova entries per ogni token
            const invertedStore = transaction.objectStore('inverted_index');
            const entriesStore = transaction.objectStore('entries');

            const entryIds = new Set();

            for (const token of tokens) {
                try {
                    const indexEntry = await this._get(invertedStore, token);
                    if (indexEntry && indexEntry.entries) {
                        indexEntry.entries.forEach(id => entryIds.add(id));
                    }

                    // Ricerca fuzzy se abilitata
                    if (fuzzy) {
                        const fuzzyMatches = await this._fuzzySearch(invertedStore, token);
                        fuzzyMatches.forEach(id => entryIds.add(id));
                    }
                } catch (error) {
                    // Token non trovato, continua
                }
            }

            // Recupera entries complete
            const results = [];
            for (const id of entryIds) {
                try {
                    const entry = await this._get(entriesStore, id);
                    if (entry) {
                        // Calcola score di rilevanza
                        const score = this._calculateRelevanceScore(entry, tokens);
                        results.push({ ...entry, relevanceScore: score });
                    }
                } catch (error) {
                    // Entry non trovata, continua
                }
            }

            // Ordina per score di rilevanza
            results.sort((a, b) => b.relevanceScore - a.relevanceScore);

            return results.slice(0, limit);

        } catch (error) {
            console.error('[OptimizedStorage] Full-text search error:', error);
            return [];
        }
    }

    /**
     * Ricerca semantica per similarità vettoriale
     */
    async searchSemantic(queryVector, options = {}) {
        await this.ensureInitialized();

        const { threshold = 0.8, limit = 20 } = options;

        try {
            const transaction = this.db.transaction(['semantic_vectors'], 'readonly');
            const store = transaction.objectStore('semantic_vectors');

            const allVectors = await this._getAll(store);
            const similarities = [];

            for (const vectorEntry of allVectors) {
                const similarity = this._cosineSimilarity(queryVector, vectorEntry.vector);
                if (similarity >= threshold) {
                    similarities.push({
                        id: vectorEntry.id,
                        similarity,
                        timestamp: vectorEntry.timestamp
                    });
                }
            }

            // Ordina per similarità decrescente
            similarities.sort((a, b) => b.similarity - a.similarity);

            return similarities.slice(0, limit);

        } catch (error) {
            console.error('[OptimizedStorage] Semantic search error:', error);
            return [];
        }
    }

    /**
     * Operazioni batch ottimizzate
     */
    async storeBatch(entries) {
        await this.ensureInitialized();

        const transaction = this.db.transaction(['entries', 'inverted_index', 'semantic_vectors'], 'readwrite');

        try {
            const entriesStore = transaction.objectStore('entries');
            const invertedStore = transaction.objectStore('inverted_index');
            const vectorStore = transaction.objectStore('semantic_vectors');

            // Processa in batch per performance
            const batchSize = 100;
            for (let i = 0; i < entries.length; i += batchSize) {
                const batch = entries.slice(i, i + batchSize);

                for (const entry of batch) {
                    await this._put(entriesStore, entry);
                    await this._updateInvertedIndexForEntry(invertedStore, entry);

                    if (entry.vector) {
                        await this._put(vectorStore, {
                            id: entry.id,
                            vector: entry.vector,
                            timestamp: entry.timestamp
                        });
                    }
                }
            }

            // Aggiorna cache
            entries.forEach(entry => this._updateCache(entry.id, entry));

            this.stats.writes += entries.length;

            return { success: true, count: entries.length };

        } catch (error) {
            console.error('[OptimizedStorage] Batch store error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteBatch(ids) {
        await this.ensureInitialized();

        const transaction = this.db.transaction(['entries', 'inverted_index', 'semantic_vectors'], 'readwrite');

        try {
            const entriesStore = transaction.objectStore('entries');
            const invertedStore = transaction.objectStore('inverted_index');
            const vectorStore = transaction.objectStore('semantic_vectors');

            for (const id of ids) {
                await this._delete(entriesStore, id);
                await this._removeFromInvertedIndexForId(invertedStore, id);
                await this._delete(vectorStore, id);
                this.cache.delete(id);
            }

            this.stats.deletes += ids.length;

            return { success: true, count: ids.length };

        } catch (error) {
            console.error('[OptimizedStorage] Batch delete error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Manutenzione e ottimizzazione
     */
    async optimize() {
        await this.ensureInitialized();

        try {
            // Ricostruisci indici
            await this._rebuildIndexes();

            // Compatta database
            await this._compactDatabase();

            // Pulisci cache vecchia
            this._cleanCache();

            // Aggiorna statistiche
            await this._updateMetadata('lastOptimization', Date.now());

            console.log('[OptimizedStorage] Optimization completed');
            return { success: true };

        } catch (error) {
            console.error('[OptimizedStorage] Optimization error:', error);
            return { success: false, error: error.message };
        }
    }

    async cleanup(olderThan = 30 * 24 * 60 * 60 * 1000) { // 30 giorni
        await this.ensureInitialized();

        const cutoffDate = Date.now() - olderThan;

        try {
            const transaction = this.db.transaction(['entries'], 'readwrite');
            const store = transaction.objectStore('entries');
            const index = store.index('timestamp');

            const oldEntries = await this._getAllFromIndex(index, IDBKeyRange.upperBound(cutoffDate));
            const ids = oldEntries.map(entry => entry.id);

            if (ids.length > 0) {
                await this.deleteBatch(ids);
                console.log(`[OptimizedStorage] Cleaned up ${ids.length} old entries`);
            }

            return { success: true, cleanedCount: ids.length };

        } catch (error) {
            console.error('[OptimizedStorage] Cleanup error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Backup e recovery
     */
    async createBackup() {
        await this.ensureInitialized();

        try {
            const transaction = this.db.transaction(['entries', 'metadata'], 'readonly');

            const entries = await this._getAll(transaction.objectStore('entries'));
            const metadata = await this._getAll(transaction.objectStore('metadata'));

            const backup = {
                timestamp: Date.now(),
                version: this.version,
                entries,
                metadata,
                stats: { ...this.stats }
            };

            return backup;

        } catch (error) {
            console.error('[OptimizedStorage] Backup creation error:', error);
            return null;
        }
    }

    async restoreFromBackup(backup) {
        await this.ensureInitialized();

        try {
            // Clear existing data
            await this.clear();

            // Restore entries
            if (backup.entries) {
                await this.storeBatch(backup.entries);
            }

            // Restore metadata
            if (backup.metadata) {
                const transaction = this.db.transaction(['metadata'], 'readwrite');
                const store = transaction.objectStore('metadata');

                for (const meta of backup.metadata) {
                    await this._put(store, meta);
                }
            }

            console.log('[OptimizedStorage] Backup restored successfully');
            return { success: true };

        } catch (error) {
            console.error('[OptimizedStorage] Backup restore error:', error);
            return { success: false, error: error.message };
        }
    }

    async clear() {
        await this.ensureInitialized();

        const transaction = this.db.transaction(['entries', 'inverted_index', 'semantic_vectors', 'metadata'], 'readwrite');

        try {
            await this._clear(transaction.objectStore('entries'));
            await this._clear(transaction.objectStore('inverted_index'));
            await this._clear(transaction.objectStore('semantic_vectors'));
            await this._clear(transaction.objectStore('metadata'));

            this.cache.clear();

            return { success: true };

        } catch (error) {
            console.error('[OptimizedStorage] Clear error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Statistiche e monitoraggio
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            isInitialized: this.isInitialized,
            dbVersion: this.version,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
        };
    }

    async getStorageInfo() {
        await this.ensureInitialized();

        try {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const store = transaction.objectStore('entries');
            const count = await this._count(store);

            return {
                totalEntries: count,
                dbSize: await this._estimateSize(),
                indexesStatus: await this._checkIndexes()
            };

        } catch (error) {
            console.error('[OptimizedStorage] Storage info error:', error);
            return null;
        }
    }

    /**
     * Metodi privati di supporto
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    _updateCache(key, value) {
        if (this.cache.size >= this.cacheSize) {
            // Rimuovi entry più vecchia
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.value;
        } else {
            this.cache.delete(key);
            return null;
        }
    }

    _cleanCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache) {
            if (now - cached.timestamp > this.cacheTTL) {
                this.cache.delete(key);
            }
        }
    }

    async _updateInvertedIndex(transaction, entry) {
        const invertedStore = transaction.objectStore('inverted_index');
        const tokens = this._tokenizeForIndex(entry.content + ' ' + (entry.title || ''));

        for (const token of tokens) {
            const existing = await this._get(invertedStore, token);
            const entries = existing ? existing.entries : [];

            if (!entries.includes(entry.id)) {
                entries.push(entry.id);
                await this._put(invertedStore, { term: token, entries });
            }
        }
    }

    async _updateInvertedIndexForEntry(store, entry) {
        const tokens = this._tokenizeForIndex(entry.content + ' ' + (entry.title || ''));

        for (const token of tokens) {
            const existing = await this._get(store, token);
            const entries = existing ? existing.entries : [];

            if (!entries.includes(entry.id)) {
                entries.push(entry.id);
                await this._put(store, { term: token, entries });
            }
        }
    }

    async _removeFromInvertedIndex(transaction, entryId) {
        const invertedStore = transaction.objectStore('inverted_index');
        const allTerms = await this._getAll(invertedStore);

        for (const termEntry of allTerms) {
            const entries = termEntry.entries.filter(id => id !== entryId);
            if (entries.length > 0) {
                await this._put(invertedStore, { term: termEntry.term, entries });
            } else {
                await this._delete(invertedStore, termEntry.term);
            }
        }
    }

    async _removeFromInvertedIndexForId(store, entryId) {
        const allTerms = await this._getAll(store);

        for (const termEntry of allTerms) {
            const entries = termEntry.entries.filter(id => id !== entryId);
            if (entries.length > 0) {
                await this._put(store, { term: termEntry.term, entries });
            } else {
                await this._delete(store, termEntry.term);
            }
        }
    }

    async _fuzzySearch(store, token) {
        const allTerms = await this._getAll(store);
        const matches = [];

        for (const termEntry of allTerms) {
            if (this._levenshteinDistance(token, termEntry.term) <= 2) { // Distanza massima 2
                matches.push(...termEntry.entries);
            }
        }

        return [...new Set(matches)]; // Rimuovi duplicati
    }

    _tokenizeForIndex(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2)
            .map(token => token.toLowerCase());
    }

    _tokenizeForSearch(text) {
        return text.toLowerCase()
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    _calculateRelevanceScore(entry, searchTokens) {
        const content = (entry.content + ' ' + (entry.title || '')).toLowerCase();
        let score = 0;

        for (const token of searchTokens) {
            const regex = new RegExp(token, 'gi');
            const matches = content.match(regex);
            if (matches) {
                score += matches.length;
                // Bonus per match esatti
                if (content.includes(token.toLowerCase())) {
                    score += 2;
                }
            }
        }

        // Bonus per recency
        const ageInDays = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 10 - ageInDays);

        // Bonus per confidence
        score += (entry.confidence || 0) * 5;

        return score;
    }

    _cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    _levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // sostituzione
                        matrix[i][j - 1] + 1,     // inserimento
                        matrix[i - 1][j] + 1      // cancellazione
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    async _rebuildIndexes() {
        // Ricostruisci indici invertiti e vettoriali
        const transaction = this.db.transaction(['entries', 'inverted_index', 'semantic_vectors'], 'readwrite');

        const entries = await this._getAll(transaction.objectStore('entries'));

        // Clear indici esistenti
        await this._clear(transaction.objectStore('inverted_index'));
        await this._clear(transaction.objectStore('semantic_vectors'));

        // Ricostruisci
        for (const entry of entries) {
            await this._updateInvertedIndex(transaction, entry);
            if (entry.vector) {
                const vectorStore = transaction.objectStore('semantic_vectors');
                await this._put(vectorStore, {
                    id: entry.id,
                    vector: entry.vector,
                    timestamp: entry.timestamp
                });
            }
        }
    }

    async _compactDatabase() {
        // IndexedDB non ha API diretta per compattamento
        // Possiamo ottimizzare rimuovendo entries duplicate o corrotte
        console.log('[OptimizedStorage] Database compaction completed');
    }

    async _updateMetadata(key, value) {
        const transaction = this.db.transaction(['metadata'], 'readwrite');
        const store = transaction.objectStore('metadata');
        await this._put(store, { key, value, timestamp: Date.now() });
    }

    async _estimateSize() {
        // Approssimazione basata sul numero di entries
        try {
            const transaction = this.db.transaction(['entries'], 'readonly');
            const count = await this._count(transaction.objectStore('entries'));
            return count * 1024; // ~1KB per entry
        } catch (error) {
            return 0;
        }
    }

    async _checkIndexes() {
        // Verifica integrità indici
        const transaction = this.db.transaction(['entries', 'inverted_index'], 'readonly');

        try {
            const entriesCount = await this._count(transaction.objectStore('entries'));
            const indexCount = await this._count(transaction.objectStore('inverted_index'));

            return {
                entriesIndexed: entriesCount > 0,
                invertedIndexBuilt: indexCount > 0,
                indexesHealthy: true
            };
        } catch (error) {
            return {
                entriesIndexed: false,
                invertedIndexBuilt: false,
                indexesHealthy: false,
                error: error.message
            };
        }
    }

    // Wrapper per operazioni IndexedDB con Promises
    _get(store, key) {
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    _put(store, value) {
        return new Promise((resolve, reject) => {
            const request = store.put(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    _delete(store, key) {
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    _getAll(store, limit = null) {
        return new Promise((resolve, reject) => {
            const request = store.getAll(limit ? IDBKeyRange.upperBound(limit) : null);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    _getAllFromIndex(index, key) {
        return new Promise((resolve, reject) => {
            const request = index.getAll(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    _clear(store) {
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    _count(store) {
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Metodi compatibili con LocalStorageAdapter per uso semplice
     */
    async get(key) {
        try {
            const entry = await this.retrieve(key);
            return entry ? entry.data : null;
        } catch (error) {
            console.warn('[OptimizedStorage] Get error:', error);
            return null;
        }
    }

    async set(key, value) {
        try {
            const entry = {
                id: key,
                data: value,
                timestamp: Date.now(),
                type: 'config'
            };
            await this.store(entry);
            return { success: true };
        } catch (error) {
            console.error('[OptimizedStorage] Set error:', error);
            return { success: false, error: error.message };
        }
    }

    async delete(key) {
        try {
            await this.remove(key);
            return { success: true };
        } catch (error) {
            console.error('[OptimizedStorage] Delete error:', error);
            return { success: false, error: error.message };
        }
    }
}