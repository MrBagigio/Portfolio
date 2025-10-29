
// ConversationManager.js - Gestisce il contesto della conversazione per Mantis

const CONTEXT_TIMEOUT_MS = 90000; // 90 secondi
const MAX_FOLLOW_UPS = 3; // Massimo numero di follow-up per conversazione

class ConversationManager {
    constructor() {
        this.context = {
            lastIntent: null,
            lastEntities: {},
            lastResponse: null,
            isAwaitingResponse: false,
            awaitingFor: null, // es. 'projectName'
            followUpCount: 0,
            conversationFlow: [], // Traccia il flusso della conversazione
            topic: null,
            subTopic: null,
            timestamp: Date.now()
        };
        this.conversationHistory = [];
        this.flowPatterns = new Map(); // Pattern di flusso di conversazione
    }

    updateContext(intent, entities, response) {
        // Salva il contesto precedente nella cronologia
        if (this.context.lastIntent) {
            this.conversationHistory.push({
                ...this.context,
                endedAt: Date.now()
            });
            
            // Mantieni solo ultime 10 conversazioni
            if (this.conversationHistory.length > 10) {
                this.conversationHistory.shift();
            }
        }

        // Determina topic e sub-topic
        const topicInfo = this.determineTopic(intent, entities);
        
        this.context = {
            lastIntent: intent,
            lastEntities: entities,
            lastResponse: response,
            isAwaitingResponse: false,
            awaitingFor: null,
            followUpCount: 0,
            conversationFlow: [{ intent, entities, timestamp: Date.now() }],
            topic: topicInfo.topic,
            subTopic: topicInfo.subTopic,
            timestamp: Date.now()
        };

        // Aggiorna pattern di flusso
        this.updateFlowPatterns(intent, entities);
    }

    determineTopic(intent, entities) {
        const topicMap = {
            'openProject': { topic: 'projects', subTopic: entities.projectName || 'general' },
            'navigate': { topic: 'navigation', subTopic: entities.sectionName || 'general' },
            'searchProjects': { topic: 'projects', subTopic: 'search' },
            'setCursor': { topic: 'interface', subTopic: 'cursor' },
            'setTheme': { topic: 'interface', subTopic: 'theme' },
            'analyzeCode': { topic: 'development', subTopic: 'analysis' },
            'gitStatus': { topic: 'development', subTopic: 'versioning' },
            'getWeather': { topic: 'external', subTopic: 'weather' },
            'systemInfo': { topic: 'system', subTopic: 'info' },
            'calculate': { topic: 'math', subTopic: 'calculation' },
            'codeSnippet': { topic: 'development', subTopic: 'examples' }
        };

        return topicMap[intent] || { topic: 'general', subTopic: 'unknown' };
    }

    updateFlowPatterns(intent, entities) {
        const key = `${this.context.topic || 'general'}_${intent}`;
        const currentCount = this.flowPatterns.get(key) || 0;
        this.flowPatterns.set(key, currentCount + 1);
    }

    isContextExpired() {
        return (Date.now() - this.context.timestamp) > CONTEXT_TIMEOUT_MS;
    }

    askFor(entityType, question, options = {}) {
        if (this.context.followUpCount >= MAX_FOLLOW_UPS) {
            return "Mi dispiace, ho fatto troppe domande. Possiamo ricominciare da capo?";
        }

        this.context.isAwaitingResponse = true;
        this.context.awaitingFor = entityType;
        this.context.followUpCount++;
        this.context.timestamp = Date.now();
        
        // Aggiungi opzioni di contesto per risposte più intelligenti
        this.context.followUpOptions = options;
        
        return question;
    }

    handleFollowUp(text) {
        if (this.isContextExpired() || !this.context.isAwaitingResponse) {
            this.reset();
            return null;
        }

        const awaitedEntity = this.context.awaitingFor;
        const previousIntent = this.context.lastIntent;
        
        // Estrazione avanzata dell'entità dal testo di follow-up
        const entityValue = this.extractEntityFromFollowUp(text, awaitedEntity);
        
        // Aggiorna il flusso della conversazione
        this.context.conversationFlow.push({
            type: 'follow_up',
            awaitedEntity,
            providedValue: entityValue,
            timestamp: Date.now()
        });

        this.context.isAwaitingResponse = false;
        this.context.awaitingFor = null;

        return {
            intent: previousIntent,
            entities: {
                ...this.context.lastEntities,
                [awaitedEntity]: entityValue
            },
            isFollowUp: true,
            followUpCount: this.context.followUpCount
        };
    }

    extractEntityFromFollowUp(text, entityType) {
        const trimmedText = text.trim();
        
        // Per diversi tipi di entità, usa strategie diverse
        switch (entityType) {
            case 'projectName':
                // Cerca nomi di progetti nella Knowledge Base o usa fuzzy matching
                const projectNames = ['biosphaera', 'lp', 'portfolio'];
                for (const name of projectNames) {
                    if (trimmedText.toLowerCase().includes(name)) {
                        return name;
                    }
                }
                // Fallback: prendi la prima parola significativa
                const words = trimmedText.split(/\s+/);
                return words.find(word => word.length > 2) || trimmedText;
                
            case 'cursorType':
                const cursors = ['pacman', 'asteroids', 'default'];
                for (const cursor of cursors) {
                    if (trimmedText.toLowerCase().includes(cursor)) {
                        return cursor;
                    }
                }
                return 'default';
                
            case 'technology':
                const techs = ['javascript', 'webgl', 'three.js', 'react', 'vue'];
                for (const tech of techs) {
                    if (trimmedText.toLowerCase().includes(tech)) {
                        return tech;
                    }
                }
                return trimmedText;
                
            case 'location':
                // Per il meteo, cerca città comuni o usa il testo come città
                const commonCities = ['roma', 'milano', 'napoli', 'torino', 'firenze'];
                for (const city of commonCities) {
                    if (trimmedText.toLowerCase().includes(city)) {
                        return city;
                    }
                }
                return trimmedText;
                
            default:
                // Default: pulisci il testo e restituiscilo
                return trimmedText.replace(/[^\w\s-]/g, '').trim();
        }
    }

    getContext() {
        if (this.isContextExpired()) {
            this.reset();
        }
        return this.context;
    }

    getConversationInsights() {
        const insights = {
            commonTopics: {},
            commonFlows: {},
            avgFollowUps: 0,
            totalConversations: this.conversationHistory.length
        };

        // Analizza topic comuni
        this.conversationHistory.forEach(conv => {
            if (conv.topic) {
                insights.commonTopics[conv.topic] = (insights.commonTopics[conv.topic] || 0) + 1;
            }
        });

        // Analizza pattern di flusso comuni
        this.flowPatterns.forEach((count, pattern) => {
            insights.commonFlows[pattern] = count;
        });

        // Calcola media follow-up
        const totalFollowUps = this.conversationHistory.reduce((sum, conv) => sum + (conv.followUpCount || 0), 0);
        insights.avgFollowUps = insights.totalConversations > 0 ? totalFollowUps / insights.totalConversations : 0;

        return insights;
    }

    suggestNextInteraction() {
        const insights = this.getConversationInsights();
        
        // Suggerisci basato sui pattern osservati
        const topTopic = Object.keys(insights.commonTopics)
            .reduce((a, b) => insights.commonTopics[a] > insights.commonTopics[b] ? a : b, null);
        
        const suggestions = {
            'projects': ['Vuoi vedere altri progetti?', 'openProject'],
            'interface': ['Vuoi cambiare qualcos\'altro nell\'interfaccia?', 'setTheme'],
            'development': ['Hai altre domande tecniche?', 'analyzeCode'],
            'external': ['Vuoi altre informazioni esterne?', 'getWeather']
        };

        if (topTopic && suggestions[topTopic]) {
            return {
                message: suggestions[topTopic][0],
                suggestedIntent: suggestions[topTopic][1]
            };
        }

        return null;
    }

    reset() {
        this.context = {
            lastIntent: null,
            lastEntities: {},
            lastResponse: null,
            isAwaitingResponse: false,
            awaitingFor: null,
            followUpCount: 0,
            conversationFlow: [],
            topic: null,
            subTopic: null,
            timestamp: Date.now()
        };
    }
}

export default new ConversationManager();
