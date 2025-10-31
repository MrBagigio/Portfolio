/**
 * nlu_pipeline.js
 * Nuova architettura NLU basata su pipeline modulare
 */

// === COMPONENTI DELLA PIPELINE ===

/**
 * Tokenizer: Spezza il testo in token
 */
class Tokenizer {
    tokenize(text) {
        // Rimuovi punteggiatura e dividi in parole
        const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
        return cleanText.split(/\s+/).filter(token => token.length > 0);
    }

    tokenizeWithPositions(text) {
        const tokens = [];
        const words = text.toLowerCase().split(/\s+/);

        let position = 0;
        for (const word of words) {
            if (word.length > 0) {
                tokens.push({
                    text: word,
                    start: position,
                    end: position + word.length,
                    original: text.substring(position, position + word.length)
                });
                position += word.length + 1; // +1 per lo spazio
            }
        }

        return tokens;
    }
}

/**
 * Synonym Expander: Espande i token con i loro sinonimi
 */
class SynonymExpander {
    constructor(synonymMap) {
        this.synonymMap = synonymMap;
    }

    expand(tokens) {
        const expandedTokens = [];

        for (const token of tokens) {
            const synonyms = this.synonymMap[token.text] || [token.text];
            expandedTokens.push({
                ...token,
                synonyms: synonyms,
                expanded: synonyms
            });
        }

        return expandedTokens;
    }
}

/**
 * Named Entity Recognizer (NER): Identifica le entità nel testo
 */
class NamedEntityRecognizer {
    constructor(entityConfig) {
        this.entityConfig = entityConfig;
        this.entityPatterns = this.buildEntityPatterns();
    }

    buildEntityPatterns() {
        const patterns = {};

        for (const [entityType, config] of Object.entries(this.entityConfig)) {
            patterns[entityType] = {
                values: new Set(config.values || []),
                normalization: config.normalization || {},
                fuzzyMatching: config.fuzzyMatching !== false,
                caseSensitive: config.caseSensitive || false
            };
        }

        return patterns;
    }

    recognize(extendedTokens) {
        const entities = [];

        for (const token of extendedTokens) {
            for (const [entityType, pattern] of Object.entries(this.entityPatterns)) {
                let matchedValue = null;

                // Controllo corrispondenza esatta
                if (pattern.values.has(token.text)) {
                    matchedValue = token.text;
                }

                // Controllo normalizzazione
                if (!matchedValue && pattern.normalization[token.text]) {
                    matchedValue = pattern.normalization[token.text];
                }

                // Fuzzy matching se abilitato
                if (!matchedValue && pattern.fuzzyMatching) {
                    for (const value of pattern.values) {
                        const distance = this.levenshteinDistance(token.text, value);
                        const maxLength = Math.max(token.text.length, value.length);
                        const score = 1 - (distance / maxLength);

                        if (score > 0.8) { // Soglia configurabile
                            matchedValue = value;
                            break;
                        }
                    }
                }

                if (matchedValue) {
                    entities.push({
                        type: entityType,
                        value: matchedValue,
                        original: token.text,
                        position: token.start,
                        confidence: 0.9
                    });
                    break; // Un token può appartenere a una sola entità
                }
            }
        }

        return entities;
    }

    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
}

/**
 * Intent Classifier: Determina l'intent più probabile
 */
class IntentClassifier {
    constructor(intentConfig) {
        this.intentConfig = intentConfig;
        this.intentPatterns = this.buildIntentPatterns();
    }

    buildIntentPatterns() {
        const patterns = {};

        for (const [intentName, config] of Object.entries(this.intentConfig)) {
            patterns[intentName] = {
                regex: (config.regex || []).map(r => new RegExp(r, 'i')),
                keywords: new Set(config.keywords || []),
                entityDependencies: config.entityDependencies || [],
                weights: config.confidenceWeights || {
                    regex: 0.9,
                    keyword: 0.7,
                    entity: 0.8
                }
            };
        }

        return patterns;
    }

    classify(extendedTokens, entities, contextManager) {
        const scores = {};

        // Inizializza punteggi per tutti gli intent
        for (const intentName of Object.keys(this.intentPatterns)) {
            scores[intentName] = {
                regex: 0,
                keyword: 0,
                entity: 0,
                context: 0,
                total: 0
            };
        }

        // 1. Regex matching
        const fullText = extendedTokens.map(t => t.text).join(' ');
        for (const [intentName, pattern] of Object.entries(this.intentPatterns)) {
            for (const regex of pattern.regex) {
                if (regex.test(fullText)) {
                    scores[intentName].regex = pattern.weights.regex;
                    break;
                }
            }
        }

        // 2. Keyword matching con TF-IDF semplificato
        const tokenTexts = extendedTokens.flatMap(t => t.expanded);
        const keywordCounts = {};

        for (const token of tokenTexts) {
            for (const [intentName, pattern] of Object.entries(this.intentPatterns)) {
                if (pattern.keywords.has(token)) {
                    keywordCounts[intentName] = (keywordCounts[intentName] || 0) + 1;
                }
            }
        }

        for (const [intentName, count] of Object.entries(keywordCounts)) {
            const pattern = this.intentPatterns[intentName];
            const keywordScore = (count / tokenTexts.length) * pattern.weights.keyword;
            scores[intentName].keyword = Math.min(keywordScore, pattern.weights.keyword);
        }

        // 3. Entity matching
        const entityTypes = entities.map(e => e.type);
        for (const [intentName, pattern] of Object.entries(this.intentPatterns)) {
            const matchedEntities = pattern.entityDependencies.filter(dep =>
                entityTypes.includes(dep)
            );
            if (matchedEntities.length > 0) {
                scores[intentName].entity = pattern.weights.entity *
                    (matchedEntities.length / pattern.entityDependencies.length);
            }
        }

        // 4. Context boosting
        const contextHints = contextManager.getContextualHints();
        for (const token of tokenTexts) {
            if (contextHints.includes(token)) {
                for (const intentName of Object.keys(scores)) {
                    scores[intentName].context += 0.1;
                }
            }
        }

        // Calcola punteggio totale e applica softmax
        for (const [intentName, score] of Object.entries(scores)) {
            score.total = score.regex + score.keyword + score.entity + score.context;
        }

        const intents = Object.keys(scores);
        const totals = intents.map(name => Math.exp(scores[name].total));
        const sum = totals.reduce((a, b) => a + b, 0);

        const probabilities = {};
        intents.forEach((name, i) => {
            probabilities[name] = totals[i] / sum;
        });

        // Trova l'intent con probabilità più alta
        const bestIntent = intents.reduce((a, b) =>
            probabilities[a] > probabilities[b] ? a : b
        );

        return {
            intent: bestIntent,
            confidence: probabilities[bestIntent],
            scores: probabilities,
            details: scores[bestIntent]
        };
    }
}

/**
 * Confidence Scorer: Calcola e normalizza i punteggi di confidenza
 */
class ConfidenceScorer {
    score(classification, entities, contextManager) {
        let confidence = classification.confidence;

        // Boost basato su entità presenti
        if (entities.length > 0) {
            confidence += 0.1;
        }

        // Penalità per ambiguità (più intent probabili)
        const highProbabilityIntents = Object.values(classification.scores)
            .filter(prob => prob > 0.2).length;

        if (highProbabilityIntents > 1) {
            confidence -= 0.1 * (highProbabilityIntents - 1);
        }

        // Boost contestuale
        const recentEntities = contextManager.getRecentEntities();
        const hasRecentEntity = entities.some(entity =>
            recentEntities.includes(entity.value)
        );

        if (hasRecentEntity) {
            confidence += 0.15;
        }

        return Math.max(0.1, Math.min(0.95, confidence));
    }
}

/**
 * Context Updater: Aggiorna lo stato conversazionale
 */
class ContextUpdater {
    update(contextManager, intent, entities, confidence) {
        contextManager.updateContext(intent, entities.reduce((acc, entity) => {
            acc[entity.type] = entity.value;
            return acc;
        }, {}), confidence);
    }
}

/**
 * Sentiment Analyzer: Analizza il sentiment del testo
 */
class SentimentAnalyzer {
    analyze(text) {
        const positiveWords = ['bene', 'ottimo', 'fantastico', 'bravo', 'grazie', 'perfetto', 'geniale', 'wow', 'incredibile', 'meraviglioso', 'splendido'];
        const negativeWords = ['male', 'terribile', 'orribile', 'pessimo', 'schifo', 'odio', 'fastidio', 'noioso', 'rotto', 'bug', 'errore'];

        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;

        for (const word of words) {
            if (positiveWords.includes(word)) positiveScore++;
            if (negativeWords.includes(word)) negativeScore++;
        }

        const total = positiveScore + negativeScore;
        if (total === 0) return 'neutral';

        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }
}

/**
 * Command Chain Parser: Gestisce comandi concatenati
 */
class CommandChainParser {
    constructor(pipeline) {
        this.pipeline = pipeline;
    }

    parse(text) {
        const separators = [' e poi ', ' e quindi ', ' poi ', ' quindi ', ';', ' e '];
        let commands = [text];

        for (const separator of separators) {
            if (text.toLowerCase().includes(separator)) {
                commands = text.split(new RegExp(separator, 'i'))
                    .map(cmd => cmd.trim())
                    .filter(cmd => cmd.length > 0);
                break;
            }
        }

        if (commands.length > 1) {
            const parsedCommands = commands.map(cmd => this.pipeline.process(cmd));
            return {
                intent: 'compoundCommand',
                entities: { commands: parsedCommands },
                confidence: 0.8,
                sentiment: 'neutral',
                commandCount: commands.length
            };
        }

        return null;
    }
}

// === PIPELINE PRINCIPALE ===

export class NLUPipeline {
    constructor(config = null) {
        this.config = config;
        this.components = {};
        this.contextManager = new ContextManager();
    }

    async initialize() {
        if (!this.config) {
            throw new Error('Configuration must be provided to NLUPipeline constructor');
        }

        // Inizializza componenti
        this.components.tokenizer = new Tokenizer();
        this.components.synonymExpander = new SynonymExpander(this.config.synonyms);
        this.components.ner = new NamedEntityRecognizer(this.config.entities);
        this.components.intentClassifier = new IntentClassifier(this.config.intents);
        this.components.confidenceScorer = new ConfidenceScorer();
        this.components.contextUpdater = new ContextUpdater();
        this.components.sentimentAnalyzer = new SentimentAnalyzer();
        this.components.chainParser = new CommandChainParser(this);

        console.log('[NLUPipeline] Initialized with', Object.keys(this.config.intents).length, 'intents');
    }

    async process(text) {
        // 1. Controlla se è un comando concatenato
        const chainResult = this.components.chainParser.parse(text);
        if (chainResult) {
            return chainResult;
        }

        // 2. Tokenizzazione
        const tokens = this.components.tokenizer.tokenizeWithPositions(text);

        // 3. Espansione sinonimi
        const extendedTokens = this.components.synonymExpander.expand(tokens);

        // 4. Named Entity Recognition
        const entities = this.components.ner.recognize(extendedTokens);

        // 5. Intent Classification
        const classification = this.components.intentClassifier.classify(
            extendedTokens,
            entities,
            this.contextManager
        );

        // 6. Confidence Scoring
        const confidence = this.components.confidenceScorer.score(
            classification,
            entities,
            this.contextManager
        );

        // 7. Sentiment Analysis
        const sentiment = this.components.sentimentAnalyzer.analyze(text);

        // 8. Context Update
        this.components.contextUpdater.update(
            this.contextManager,
            classification.intent,
            entities,
            confidence
        );

        // Estrai entità in formato legacy per compatibilità
        const entityMap = {};
        entities.forEach(entity => {
            entityMap[entity.type] = entity.value;
        });

        return {
            intent: classification.intent,
            entities: entityMap,
            confidence: confidence,
            sentiment: sentiment,
            metadata: {
                entities: entities,
                scores: classification.scores,
                tokens: extendedTokens
            }
        };
    }

    // Metodi di utilità per retrocompatibilità
    getContext() {
        return this.contextManager.context;
    }

    updateContext(intent, entities, confidence) {
        this.contextManager.updateContext(intent, entities, confidence);
    }
}

// === GESTIONE CONTESTO EVOLUTA ===

class ContextManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.context = {
            currentTopic: null,
            recentEntities: [],
            conversationHistory: [],
            userPreferences: {},
            lastIntent: null,
            confidence: 0,
            conversationState: 'idle', // idle, awaiting_response, awaiting_entity, etc.
            stateData: null // dati specifici dello stato
        };
    }

    updateContext(intent, entities, confidence) {
        this.context.lastIntent = intent;
        this.context.confidence = confidence;

        // Aggiorna entità recenti
        Object.keys(entities).forEach(key => {
            if (entities[key]) {
                this.context.recentEntities.unshift(entities[key]);
                this.context.recentEntities = this.context.recentEntities.slice(0, 5);
            }
        });

        // Determina topic corrente
        this.updateTopic(intent, entities);

        // Aggiorna stato conversazionale
        this.updateConversationState(intent, entities);
    }

    updateTopic(intent, entities) {
        const topicMap = {
            'openProject': 'projects',
            'navigate': 'navigation',
            'searchProjects': 'projects',
            'setCursor': 'interface',
            'setTheme': 'interface',
            'analyzeCode': 'development',
            'gitStatus': 'development',
            'getWeather': 'external',
            'systemInfo': 'system',
            'calculate': 'math',
            'codeSnippet': 'development'
        };

        this.context.currentTopic = topicMap[intent] || null;
    }

    updateConversationState(intent, entities) {
        // Logica per gestire stati conversazionali complessi
        switch (intent) {
            case 'searchProjects':
                this.context.conversationState = 'awaiting_project_selection';
                this.context.stateData = { searchResults: [] }; // In produzione, popolato dai risultati
                break;
            case 'getWeather':
                if (!entities.location) {
                    this.context.conversationState = 'awaiting_entity';
                    this.context.stateData = { missingEntity: 'location' };
                }
                break;
            default:
                this.context.conversationState = 'idle';
                this.context.stateData = null;
        }
    }

    getContextualHints() {
        const hints = [];

        if (this.context.currentTopic === 'projects') {
            hints.push('progetto', 'portfolio', 'lavoro', 'tecnologia');
        } else if (this.context.currentTopic === 'interface') {
            hints.push('cursore', 'tema', 'colore', 'aspetto');
        } else if (this.context.currentTopic === 'development') {
            hints.push('codice', 'git', 'repository', 'programmare');
        }

        return hints;
    }

    getRecentEntities() {
        return this.context.recentEntities;
    }

    getConversationState() {
        return {
            state: this.context.conversationState,
            data: this.context.stateData
        };
    }
}