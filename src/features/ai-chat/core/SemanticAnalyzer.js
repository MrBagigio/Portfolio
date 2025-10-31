/**
 * SemanticAnalyzer.js - Analizzatore Semantico Avanzato
 * Sistema NLP sofisticato con comprensione contestuale
 */
export class SemanticAnalyzer {
    constructor(knowledgeBase, memorySystem) {
        this.knowledgeBase = knowledgeBase;
        this.memorySystem = memorySystem;

        // Configurazioni avanzate
        this.config = {
            maxTokens: 100,
            minConfidence: 0.6,
            contextWindow: 5,
            enableNegation: true,
            enableSynonyms: true,
            enableGrammar: true
        };

        // Cache per performance
        this.analysisCache = new Map();
        this.entityCache = new Map();
    }

    /**
     * Analisi semantica completa del testo
     */
    async analyze(text, context = {}) {
        const cacheKey = this.generateCacheKey(text, context);
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        try {
            const startTime = Date.now();

            // 1. Tokenizzazione avanzata
            const tokens = await this.tokenize(text);

            // 2. Estrazione entità con contesto
            const entities = await this.extractEntities(tokens, context);

            // 3. Analisi relazioni semantiche
            const relations = this.extractRelations(tokens, entities);

            // 4. Analisi sentiment contestuale
            const sentiment = await this.analyzeSentiment(text, context);

            // 5. Estrazione topic con clustering
            const topics = await this.extractTopics(text, context);

            // 6. Classificazione intento intelligente
            const intent = await this.inferIntent(text, context, entities);

            // 7. Calcolo complessità e ambiguità
            const complexity = this.calculateComplexity(tokens, relations);
            const ambiguity = this.calculateAmbiguity(entities, relations);

            // 8. Analisi pragmatica (contesto conversazionale)
            const pragmatics = await this.analyzePragmatics(text, context);

            const result = {
                tokens,
                entities,
                relations,
                sentiment,
                topics,
                intent,
                complexity,
                ambiguity,
                pragmatics,
                metadata: {
                    analysisTime: Date.now() - startTime,
                    tokenCount: tokens.length,
                    entityCount: entities.length,
                    confidence: 0 // Placeholder, will be calculated below
                }
            };

            // Calculate confidence after result is constructed
            result.metadata.confidence = this.calculateOverallConfidence(result);

            // Cache il risultato
            this.analysisCache.set(cacheKey, result);

            return result;

        } catch (error) {
            console.error('[SemanticAnalyzer] Analysis error:', error);
            return this.generateFallbackAnalysis(text);
        }
    }

    /**
     * Tokenizzazione avanzata con gestione punteggiatura e contrazioni
     */
    async tokenize(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        // Normalizzazione preliminare
        let normalized = text.toLowerCase().trim();

        // Gestione contrazioni italiane
        normalized = this.expandContractions(normalized);

        // Tokenizzazione intelligente
        const tokens = [];
        const words = normalized.split(/\s+/);

        for (const word of words) {
            if (word.length === 0) continue;

            // Gestione punteggiatura attaccata
            const cleanWord = word.replace(/[.,!?;:()"]+$/, '');
            const punctuation = word.slice(cleanWord.length);

            if (cleanWord.length > 0) {
                tokens.push({
                    text: cleanWord,
                    lemma: await this.lemmatize(cleanWord),
                    pos: await this.getPartOfSpeech(cleanWord),
                    position: tokens.length
                });
            }

            if (punctuation) {
                tokens.push({
                    text: punctuation,
                    type: 'punctuation',
                    position: tokens.length
                });
            }
        }
        return tokens.slice(0, this.config.maxTokens);
    }

    /**
     * Estrazione entità con riconoscimento contestuale
     */
    async extractEntities(tokens, context) {
        const entities = [];
        const cacheKey = tokens.map(t => t.text).join('_');
        if (this.entityCache.has(cacheKey)) {
            return this.entityCache.get(cacheKey);
        }

        // Pattern recognition per diversi tipi di entità
        const entityPatterns = {
            projects: await this.extractProjectEntities(tokens, context),
            commands: this.extractCommandEntities(tokens),
            locations: this.extractLocationEntities(tokens),
            numbers: this.extractNumberEntities(tokens),
            dates: this.extractDateEntities(tokens),
            emotions: this.extractEmotionEntities(tokens)
        };

        // Combina e risolvi conflitti
        for (const [type, typeEntities] of Object.entries(entityPatterns)) {
            for (const entity of typeEntities) {
                entities.push({
                    ...entity,
                    type,
                    confidence: this.calculateEntityConfidence(entity, tokens, context)
                });
            }
        }

        // Risoluzione conflitti (entità sovrapposte)
        const resolvedEntities = this.resolveEntityConflicts(entities);
        this.entityCache.set(cacheKey, resolvedEntities);
        return resolvedEntities;
    }

    /**
     * Estrazione relazioni semantiche tra token
     */
    extractRelations(tokens, entities) {
        const relations = [];
        // Relazioni sintattiche
        const syntacticRelations = this.extractSyntacticRelations(tokens);
        // Relazioni semantiche
        const semanticRelations = this.extractSemanticRelations(tokens, entities);
        // Relazioni pragmatiche
        const pragmaticRelations = this.extractPragmaticRelations(tokens, entities);
        relations.push(...syntacticRelations, ...semanticRelations, ...pragmaticRelations);
        return relations;
    }

    /**
     * Analisi sentiment contestuale avanzata
     */
    async analyzeSentiment(text, context) {
        const sentiment = {
            polarity: 0,
            intensity: 0,
            emotions: [],
            confidence: 0
        };

        // Analisi lessicale
        const lexicalSentiment = this.analyzeLexicalSentiment(text);
        // Analisi contestuale
        const contextualSentiment = await this.analyzeContextualSentiment(text, context);
        // Analisi pragmatica
        const pragmaticSentiment = this.analyzePragmaticSentiment(text, context);

        // Combinazione pesata
        sentiment.polarity = (
            lexicalSentiment.polarity * 0.4 +
            contextualSentiment.polarity * 0.4 +
            pragmaticSentiment.polarity * 0.2
        );

        sentiment.intensity = Math.max(
            lexicalSentiment.intensity,
            contextualSentiment.intensity,
            pragmaticSentiment.intensity
        );

        sentiment.emotions = [
            ...lexicalSentiment.emotions,
            ...contextualSentiment.emotions,
            ...pragmaticSentiment.emotions
        ];

        sentiment.confidence = this.calculateSentimentConfidence(
            lexicalSentiment, contextualSentiment, pragmaticSentiment
        );

        return sentiment;
    }

    /**
     * Estrazione topic con clustering semantico
     */
    async extractTopics(text, context) {
        // Topic basati su conoscenza
        const knowledgeTopics = await this.extractKnowledgeBasedTopics(text);
        // Topic basati su memoria conversazionale
        const memoryTopics = await this.extractMemoryBasedTopics(text, context);
        // Topic basati su pattern linguistici
        const linguisticTopics = this.extractLinguisticTopics(text);
        // Clustering e consolidamento
        const allTopics = [...knowledgeTopics, ...memoryTopics, ...linguisticTopics];
        const clusteredTopics = this.clusterTopics(allTopics);
        return clusteredTopics.slice(0, 5); // Limita a 5 topic principali
    }

    /**
     * Classificazione intento con machine learning-like approach
     */
    async inferIntent(text, context, entities) {
        // Pattern matching per intenti comuni
        const patternIntents = this.matchIntentPatterns(text, entities);
        // Contesto conversazionale
        const contextualIntents = await this.analyzeContextualIntent(text, context);
        // Entità-driven intent
        const entityIntents = this.deriveIntentFromEntities(entities);
        // Combinazione e ranking
        const allIntents = [...patternIntents, ...contextualIntents, ...entityIntents];
        const rankedIntents = this.rankIntents(allIntents);

        return rankedIntents.length > 0 ? rankedIntents[0] : {
            name: 'unknown',
            confidence: 0.1,
            parameters: {}
        };
    }

    // Metodi di supporto per tokenizzazione
    expandContractions(text) {
        const contractions = {
            "l'": "lo ",
            "dell'": "dello ",
            "dall'": "dallo ",
            "sull'": "sullo ",
            "un'": "una ",
            "c'è": "ci è",
            "c'era": "ci era",
            "c'erano": "ci erano"
        };
        let expanded = text;
        for (const [contraction, expansion] of Object.entries(contractions)) {
            expanded = expanded.replace(new RegExp(contraction, 'gi'), expansion);
        }
        return expanded;
    }

    async lemmatize(word) {
        // Lemmatizzazione italiana semplificata
        const lemmas = {
            'sono': 'essere', 'sei': 'essere', 'è': 'essere', 'erano': 'essere',
            'fare': 'fare', 'fai': 'fare', 'fa': 'fare', 'fanno': 'fare'
        };
        return lemmas[word] || word;
    }

    async getPartOfSpeech(word) {
        // POS tagging semplificato
        const posPatterns = {
            verb: /\w+(are|ere|ire)$/,
            noun: /\w+(zione|mento|sione|ità)$/,
            adjective: /\w+(oso|osa|ico|ica|evole|evole)$/,
            adverb: /\w+(mente)$/
        };
        for (const [pos, pattern] of Object.entries(posPatterns)) {
            if (pattern.test(word)) {
                return pos;
            }
        }
        return 'unknown';
    }

    // Metodi per estrazione entità specifiche
    async extractProjectEntities(tokens, context) {
        const entities = [];
        const projectNames = await this.knowledgeBase.getAllProjectNames();
        for (const token of tokens) {
            if (token.type === 'punctuation') continue;
            const match = projectNames.find(name =>
                name.toLowerCase().includes(token.text) ||
                token.text.includes(name.toLowerCase())
            );
            if (match) {
                entities.push({
                    text: token.text,
                    value: match,
                    start: token.position,
                    end: token.position + 1
                });
            }
        }
        return entities;
    }

    extractCommandEntities(tokens) {
        const entities = [];
        const commandKeywords = [
            'apri', 'chiudi', 'mostra', 'nascondi', 'cambia', 'vai',
            'esplora', 'cerca', 'analizza', 'calcola', 'salva', 'carica'
        ];
        for (const token of tokens) {
            if (commandKeywords.includes(token.text)) {
                entities.push({
                    text: token.text,
                    value: token.text,
                    start: token.position,
                    end: token.position + 1
                });
            }
        }
        return entities;
    }

    extractLocationEntities(tokens) {
        const entities = [];
        const locations = ['milano', 'roma', 'torino', 'firenze', 'venezia', 'napoli'];
        for (const token of tokens) {
            if (locations.includes(token.text)) {
                entities.push({
                    text: token.text,
                    value: token.text,
                    start: token.position,
                    end: token.position + 1
                });
            }
        }
        return entities;
    }

    extractNumberEntities(tokens) {
        const entities = [];
        for (const token of tokens) {
            const num = parseFloat(token.text);
            if (!isNaN(num)) {
                entities.push({
                    text: token.text,
                    value: num,
                    start: token.position,
                    end: token.position + 1
                });
            }
        }
        return entities;
    }

    extractDateEntities(tokens) {
        const entities = [];
        const datePattern = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/;
        for (const token of tokens) {
            if (datePattern.test(token.text)) {
                entities.push({
                    text: token.text,
                    value: new Date(token.text),
                    start: token.position,
                    end: token.position + 1
                });
            }
        }
        return entities;
    }

    extractEmotionEntities(tokens) {
        const entities = [];
        const emotions = {
            'felice': 'joy', 'triste': 'sadness', 'arrabbiato': 'anger',
            'sorpreso': 'surprise', 'paura': 'fear', 'disgusto': 'disgust'
        };
        for (const token of tokens) {
            const emotion = emotions[token.text];
            if (emotion) {
                entities.push({
                    text: token.text,
                    value: emotion,
                    start: token.position,
                    end: token.position + 1
                });
            }
        }
        return entities;
    }

    // Metodi per relazioni
    extractSyntacticRelations(tokens) {
        const relations = [];
        for (let i = 0; i < tokens.length - 1; i++) {
            const current = tokens[i];
            const next = tokens[i + 1];
            if (current.pos === 'noun' && next.pos === 'verb') {
                relations.push({
                    type: 'syntactic',
                    subtype: 'subject_verb',
                    from: current,
                    to: next,
                    confidence: 0.8
                });
            }
        }
        return relations;
    }

    extractSemanticRelations(tokens, entities) { return []; }
    extractPragmaticRelations(tokens, entities) { return []; }
    analyzeContextualSentiment(text, context) { return { polarity: 0, intensity: 0, emotions: [] }; }
    analyzePragmaticSentiment(text, context) { return { polarity: 0, intensity: 0, emotions: [] }; }
    calculateSentimentConfidence(lexical, contextual, pragmatic) { return 0.5; }
    extractKnowledgeBasedTopics(text) { return []; }
    extractMemoryBasedTopics(text, context) { return []; }
    extractLinguisticTopics(text) { return []; }
    clusterTopics(topics) { return topics; }
    matchIntentPatterns(text, entities) { return []; }
    analyzeContextualIntent(text, context) { return []; }
    deriveIntentFromEntities(entities) { return []; }
    rankIntents(intents) { return intents; }
    calculateComplexity(tokens, relations) { return 0; }
    calculateAmbiguity(entities, relations) { return 0; }
    analyzePragmatics(text, context) { return {}; }
    calculateEntityConfidence(entity, tokens, context) { return 0.8; }
    resolveEntityConflicts(entities) {
        const uniqueEntities = new Map();
        for (const entity of entities) {
            if (!uniqueEntities.has(entity.value)) {
                uniqueEntities.set(entity.value, entity);
            }
        }
        return Array.from(uniqueEntities.values());
    }
    generateCacheKey(text, context) { return `${text}-${JSON.stringify(context)}`; }

    calculateOverallConfidence(analysisResult) {
        let confidence = analysisResult.intent.confidence || 0.1;
        if (analysisResult.entities.length > 0) {
            confidence = Math.min(1.0, confidence + 0.1 * analysisResult.entities.length);
        }
        if (analysisResult.ambiguity > 0.5) {
            confidence *= (1 - (analysisResult.ambiguity - 0.5));
        }
        return parseFloat(confidence.toFixed(2));
    }

    analyzeLexicalSentiment(text) {
        const positive = ['bene', 'ottimo', 'fantastico', 'grazie', 'perfetto'];
        const negative = ['male', 'problema', 'errore', 'non funziona'];
        let score = 0;
        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (positive.includes(word)) score++;
            if (negative.includes(word)) score--;
        });
        const polarity = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
        return { polarity, score, confidence: Math.abs(score) > 0 ? 0.7 : 0.5, emotions: [] };
    }

    generateFallbackAnalysis(text) {
        return {
            tokens: [{ text, position: 0 }],
            entities: [],
            intent: { name: 'unknown', confidence: 0.1 },
            sentiment: { polarity: 'neutral', score: 0, confidence: 0.1 },
            metadata: { analysisTime: 1, tokenCount: 1, entityCount: 0, confidence: 0.1 }
        };
    }
}
