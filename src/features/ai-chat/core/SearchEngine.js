/**
 * SearchEngine.js - Motore di Ricerca Efficente
 * Algoritmi di ricerca ottimizzati con complessità sub-lineare
 */

export class SearchEngine {
    constructor(storageAdapter, config = {}) {
        this.storage = storageAdapter;
        this.config = {
            maxResults: 100,
            minScore: 0.1,
            fuzzyThreshold: 0.8,
            semanticThreshold: 0.7,
            cacheEnabled: true,
            ...config
        };

        // Cache per risultati ricerca
        this.queryCache = new Map();
        this.cacheSize = 500;
        this.cacheTTL = 10 * 60 * 1000; // 10 minuti

        // Statistiche performance
        this.stats = {
            totalQueries: 0,
            cacheHits: 0,
            avgQueryTime: 0,
            indexHits: 0,
            fullScans: 0
        };

        // Pool di worker per ricerche pesanti
        this.workerPool = [];
        this.maxWorkers = 2;
    }

    /**
     * Ricerca principale con query complessa
     */
    async search(query, options = {}) {
        const startTime = Date.now();
        this.stats.totalQueries++;

        const {
            type = 'hybrid',
            limit = this.config.maxResults,
            minScore = this.config.minScore,
            sortBy = 'relevance',
            filters = {}
        } = options;

        // Controlla cache
        const cacheKey = this._generateCacheKey(query, options);
        if (this.config.cacheEnabled) {
            const cached = this._getFromCache(cacheKey);
            if (cached) {
                this.stats.cacheHits++;
                return cached;
            }
        }

        try {
            let results = [];

            switch (type) {
                case 'text':
                    results = await this._textSearch(query, filters);
                    break;
                case 'semantic':
                    results = await this._semanticSearch(query, filters);
                    break;
                case 'hybrid':
                    results = await this._hybridSearch(query, filters);
                    break;
                case 'structured':
                    results = await this._structuredSearch(query, filters);
                    break;
                default:
                    results = await this._hybridSearch(query, filters);
            }

            // Filtra per score minimo
            results = results.filter(result => result.score >= minScore);

            // Ordina risultati
            results = this._sortResults(results, sortBy);

            // Limita risultati
            results = results.slice(0, limit);

            // Aggiungi metadata
            const searchResults = {
                results,
                total: results.length,
                queryTime: Date.now() - startTime,
                type,
                cacheHit: false
            };

            // Salva in cache
            if (this.config.cacheEnabled) {
                this._setCache(cacheKey, searchResults);
            }

            // Aggiorna statistiche
            this.stats.avgQueryTime = (this.stats.avgQueryTime + searchResults.queryTime) / 2;

            return searchResults;

        } catch (error) {
            console.error('[SearchEngine] Search error:', error);
            return {
                results: [],
                total: 0,
                queryTime: Date.now() - startTime,
                error: error.message,
                type
            };
        }
    }

    /**
     * Ricerca full-text ottimizzata
     */
    async _textSearch(query, filters) {
        const tokens = this._tokenizeQuery(query.text || query);
        const results = new Map();

        // Ricerca esatta per token principali
        for (const token of tokens) {
            const exactResults = await this.storage.searchFullText(token, {
                limit: this.config.maxResults * 2
            });

            for (const result of exactResults) {
                const existing = results.get(result.id) || { ...result, matches: [] };
                existing.matches.push({ token, type: 'exact', score: result.relevanceScore });
                results.set(result.id, existing);
            }
        }

        // Ricerca fuzzy per token simili
        if (this.config.fuzzyThreshold > 0) {
            for (const token of tokens) {
                if (token.length > 3) { // Solo per token significativi
                    const fuzzyResults = await this._fuzzyTextSearch(token, filters);

                    for (const result of fuzzyResults) {
                        if (!results.has(result.id)) {
                            const existing = results.get(result.id) || { ...result, matches: [] };
                            existing.matches.push({ token, type: 'fuzzy', score: result.score * 0.8 });
                            results.set(result.id, existing);
                        }
                    }
                }
            }
        }

        // Calcola score finale per ogni risultato
        const scoredResults = Array.from(results.values()).map(result => ({
            ...result,
            score: this._calculateTextScore(result, tokens)
        }));

        return scoredResults;
    }

    /**
     * Ricerca semantica per similarità vettoriale
     */
    async _semanticSearch(query, filters) {
        if (!query.vector && !query.text) {
            return [];
        }

        let queryVector;

        if (query.vector) {
            queryVector = query.vector;
        } else {
            // Genera vettore dalla query testuale
            queryVector = await this._generateQueryVector(query.text);
        }

        const semanticResults = await this.storage.searchSemantic(queryVector, {
            threshold: this.config.semanticThreshold,
            limit: this.config.maxResults * 2
        });

        // Recupera entries complete
        const results = [];
        for (const semanticResult of semanticResults) {
            const entry = await this.storage.retrieve(semanticResult.id);
            if (entry && this._matchesFilters(entry, filters)) {
                results.push({
                    ...entry,
                    score: semanticResult.similarity,
                    matchType: 'semantic',
                    semanticSimilarity: semanticResult.similarity
                });
            }
        }

        return results;
    }

    /**
     * Ricerca ibrida (testuale + semantica)
     */
    async _hybridSearch(query, filters) {
        // Esegui ricerche in parallelo
        const [textResults, semanticResults] = await Promise.all([
            this._textSearch(query, filters),
            this._semanticSearch(query, filters)
        ]);

        // Unisci risultati rimuovendo duplicati
        const resultsMap = new Map();

        // Aggiungi risultati testuali
        for (const result of textResults) {
            resultsMap.set(result.id, {
                ...result,
                hybridScore: result.score * 0.7 // Peso testuale
            });
        }

        // Aggiungi/fondi risultati semantici
        for (const result of semanticResults) {
            const existing = resultsMap.get(result.id);
            if (existing) {
                // Fondi risultati
                existing.hybridScore = Math.max(
                    existing.hybridScore,
                    result.score * 0.8 // Peso semantico più alto per risultati unici
                );
                existing.semanticSimilarity = result.semanticSimilarity;
                existing.matchTypes = [...(existing.matchTypes || [existing.matchType]), 'semantic'];
            } else {
                resultsMap.set(result.id, {
                    ...result,
                    hybridScore: result.score * 0.8
                });
            }
        }

        // Converti in array e ordina per score ibrido
        const hybridResults = Array.from(resultsMap.values())
            .map(result => ({
                ...result,
                score: result.hybridScore
            }))
            .sort((a, b) => b.score - a.score);

        return hybridResults;
    }

    /**
     * Ricerca strutturata con filtri avanzati
     */
    async _structuredSearch(query, filters) {
        const searchQuery = {
            type: query.type,
            userId: query.userId,
            sessionId: query.sessionId,
            dateRange: query.dateRange,
            tags: query.tags,
            minConfidence: query.minConfidence || 0,
            limit: this.config.maxResults * 2
        };

        // Aggiungi ricerca testuale se presente
        if (query.text) {
            searchQuery.text = query.text;
        }

        const storageResults = await this.storage.search(searchQuery);

        return storageResults.results.map(result => ({
            ...result,
            score: this._calculateStructuredScore(result, query),
            matchType: 'structured'
        }));
    }

    /**
     * Ricerca fuzzy per testo
     */
    async _fuzzyTextSearch(token, filters) {
        const results = [];
        const maxDistance = Math.max(1, Math.floor(token.length * 0.3)); // 30% della lunghezza

        // Genera variazioni del token
        const variations = this._generateFuzzyVariations(token, maxDistance);

        for (const variation of variations) {
            const variationResults = await this.storage.searchFullText(variation, {
                limit: Math.floor(this.config.maxResults / variations.length)
            });

            for (const result of variationResults) {
                if (this._matchesFilters(result, filters)) {
                    const distance = this._levenshteinDistance(token, variation);
                    const fuzzyScore = (1 - distance / token.length) * result.relevanceScore;

                    results.push({
                        ...result,
                        score: fuzzyScore,
                        fuzzyDistance: distance
                    });
                }
            }
        }

        // Rimuovi duplicati e ordina
        const uniqueResults = this._deduplicateResults(results);
        return uniqueResults.sort((a, b) => b.score - a.score);
    }

    /**
     * Genera variazioni fuzzy di un token
     */
    _generateFuzzyVariations(token, maxDistance) {
        const variations = new Set([token]);

        // Sostituzioni semplici
        for (let i = 0; i < token.length; i++) {
            for (let j = 0; j < 26; j++) {
                const newChar = String.fromCharCode(97 + j);
                if (newChar !== token[i]) {
                    const variation = token.substring(0, i) + newChar + token.substring(i + 1);
                    variations.add(variation);
                }
            }
        }

        // Cancellazioni
        for (let i = 0; i < token.length; i++) {
            const variation = token.substring(0, i) + token.substring(i + 1);
            variations.add(variation);
        }

        // Inserimenti
        for (let i = 0; i <= token.length; i++) {
            for (let j = 0; j < 26; j++) {
                const newChar = String.fromCharCode(97 + j);
                const variation = token.substring(0, i) + newChar + token.substring(i);
                variations.add(variation);
            }
        }

        return Array.from(variations).slice(0, 50); // Limita variazioni
    }

    /**
     * Genera vettore semantico per query testuale
     */
    async _generateQueryVector(text) {
        // Implementazione semplificata - in produzione userebbe un modello ML
        const tokens = this._tokenizeQuery(text);
        const vector = new Array(384).fill(0); // Dimensione vettore tipica

        // Hash semplice dei token in posizioni del vettore
        for (let i = 0; i < tokens.length; i++) {
            const hash = this._simpleHash(tokens[i]);
            const position = Math.abs(hash) % vector.length;
            vector[position] += 1;
        }

        // Normalizza vettore
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= magnitude;
            }
        }

        return vector;
    }

    /**
     * Calcola score per risultati testuali
     */
    _calculateTextScore(result, queryTokens) {
        const matches = result.matches || [];
        let totalScore = 0;
        let exactMatches = 0;
        let fuzzyMatches = 0;

        for (const match of matches) {
            if (match.type === 'exact') {
                totalScore += match.score;
                exactMatches++;
            } else if (match.type === 'fuzzy') {
                totalScore += match.score * 0.7; // Penalità per fuzzy
                fuzzyMatches++;
            }
        }

        // Bonus per match esatti multipli
        if (exactMatches > 1) {
            totalScore *= (1 + exactMatches * 0.1);
        }

        // Penalità per solo fuzzy matches
        if (exactMatches === 0 && fuzzyMatches > 0) {
            totalScore *= 0.5;
        }

        // Fattori aggiuntivi
        const content = result.content || '';
        const title = result.title || '';

        // Bonus per match nel titolo
        const titleMatches = queryTokens.filter(token =>
            title.toLowerCase().includes(token.toLowerCase())
        ).length;
        totalScore += titleMatches * 0.5;

        // Bonus per posizione (inizio contenuto)
        if (content.toLowerCase().indexOf(queryTokens[0].toLowerCase()) === 0) {
            totalScore *= 1.2;
        }

        // Normalizza per lunghezza contenuto (preferisci match concisi)
        const contentLength = content.length;
        if (contentLength > 1000) {
            totalScore *= Math.max(0.5, 1000 / contentLength);
        }

        return Math.min(totalScore, 1.0); // Cap a 1.0
    }

    /**
     * Calcola score per risultati strutturati
     */
    _calculateStructuredScore(result, query) {
        let score = 0.5; // Score base

        // Match per tipo
        if (query.type && result.type === query.type) {
            score += 0.2;
        }

        // Match per user/session
        if (query.userId && result.userId === query.userId) {
            score += 0.15;
        }

        if (query.sessionId && result.sessionId === query.sessionId) {
            score += 0.15;
        }

        // Match per tags
        if (query.tags && result.tags) {
            const matchingTags = query.tags.filter(tag => result.tags.includes(tag));
            score += matchingTags.length * 0.1;
        }

        // Recency bonus
        const ageInDays = (Date.now() - result.timestamp) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 0.1 - ageInDays * 0.01);

        // Confidence bonus
        if (result.confidence) {
            score += result.confidence * 0.1;
        }

        return Math.min(score, 1.0);
    }

    /**
     * Ordinamento risultati
     */
    _sortResults(results, sortBy) {
        switch (sortBy) {
            case 'relevance':
                return results.sort((a, b) => b.score - a.score);
            case 'recency':
                return results.sort((a, b) => b.timestamp - a.timestamp);
            case 'confidence':
                return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
            case 'type':
                return results.sort((a, b) => {
                    if (a.type !== b.type) return a.type.localeCompare(b.type);
                    return b.score - a.score;
                });
            default:
                return results.sort((a, b) => b.score - a.score);
        }
    }

    /**
     * Verifica filtri
     */
    _matchesFilters(entry, filters) {
        if (!filters || Object.keys(filters).length === 0) return true;

        for (const [key, value] of Object.entries(filters)) {
            switch (key) {
                case 'type':
                    if (entry.type !== value) return false;
                    break;
                case 'userId':
                    if (entry.userId !== value) return false;
                    break;
                case 'sessionId':
                    if (entry.sessionId !== value) return false;
                    break;
                case 'minConfidence':
                    if ((entry.confidence || 0) < value) return false;
                    break;
                case 'maxAge':
                    if (Date.now() - entry.timestamp > value) return false;
                    break;
                case 'tags':
                    if (!value.every(tag => entry.tags?.includes(tag))) return false;
                    break;
                case 'dateRange':
                    const entryDate = new Date(entry.timestamp);
                    if (entryDate < value.start || entryDate > value.end) return false;
                    break;
            }
        }

        return true;
    }

    /**
     * Tokenizzazione query
     */
    _tokenizeQuery(query) {
        if (typeof query !== 'string') return [];

        return query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 0 && token.length < 50)
            .slice(0, 10); // Max 10 token
    }

    /**
     * Rimozione duplicati risultati
     */
    _deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            if (seen.has(result.id)) return false;
            seen.add(result.id);
            return true;
        });
    }

    /**
     * Cache management
     */
    _generateCacheKey(query, options) {
        const queryStr = JSON.stringify(query, Object.keys(query).sort());
        const optionsStr = JSON.stringify(options, Object.keys(options).sort());
        return btoa(queryStr + optionsStr).substring(0, 32);
    }

    _getFromCache(key) {
        const cached = this.queryCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        } else {
            this.queryCache.delete(key);
            return null;
        }
    }

    _setCache(key, data) {
        if (this.queryCache.size >= this.cacheSize) {
            // Rimuovi entry più vecchia
            const firstKey = this.queryCache.keys().next().value;
            this.queryCache.delete(firstKey);
        }

        this.queryCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Utilità
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converte a 32bit
        }
        return hash;
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

    /**
     * Ricerca con worker (per ricerche pesanti)
     */
    async _searchWithWorker(query, options) {
        if (this.workerPool.length < this.maxWorkers) {
            // Crea nuovo worker
            const worker = new Worker('/search-worker.js');
            this.workerPool.push(worker);

            return new Promise((resolve, reject) => {
                worker.postMessage({ query, options });

                worker.onmessage = (e) => {
                    resolve(e.data);
                    this._releaseWorker(worker);
                };

                worker.onerror = (error) => {
                    reject(error);
                    this._releaseWorker(worker);
                };

                // Timeout
                setTimeout(() => {
                    reject(new Error('Search timeout'));
                    this._releaseWorker(worker);
                }, 30000);
            });
        } else {
            // Fallback a ricerca normale
            return this.search(query, options);
        }
    }

    _releaseWorker(worker) {
        const index = this.workerPool.indexOf(worker);
        if (index !== -1) {
            this.workerPool.splice(index, 1);
            worker.terminate();
        }
    }

    /**
     * Statistiche e monitoraggio
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.queryCache.size,
            activeWorkers: this.workerPool.length,
            cacheHitRate: this.stats.cacheHits / this.stats.totalQueries || 0
        };
    }

    clearCache() {
        this.queryCache.clear();
        return { success: true };
    }

    /**
     * Configurazione dinamica
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Aggiorna cache se necessario
        if (newConfig.cacheEnabled === false) {
            this.clearCache();
        }

        return { success: true };
    }

    /**
     * Cleanup risorse
     */
    destroy() {
        // Termina tutti i worker
        for (const worker of this.workerPool) {
            worker.terminate();
        }
        this.workerPool = [];

        // Pulisci cache
        this.clearCache();

        console.log('[SearchEngine] Destroyed');
    }
}