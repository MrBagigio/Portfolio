
// ConversationManager.js - Gestisce il contesto della conversazione per Mantis

const CONTEXT_TIMEOUT_MS = 90000; // 90 secondi
const MAX_FOLLOW_UPS = 3; // Massimo numero di follow-up per conversazione

// Stati della Macchina a Stati Finiti (FSM)
const CONVERSATION_STATES = {
    IDLE: 'idle',
    AWAITING_ENTITY: 'awaiting_entity',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    PROCESSING: 'processing',
    ERROR: 'error',
    DORMANT: 'dormant' // Nuovo stato per timeout graduale
};

// Dialog Graph: ogni transizione ha una guard condition (funzione che restituisce true/false)
const DIALOG_TRANSITIONS = {
    [CONVERSATION_STATES.IDLE]: [
        {
            to: CONVERSATION_STATES.PROCESSING,
            guard: (context, data) => true // Sempre permesso
        },
        {
            to: CONVERSATION_STATES.AWAITING_ENTITY,
            guard: (context, data) => data?.awaitingFor // Solo se specificato cosa aspettare
        }
    ],
    [CONVERSATION_STATES.AWAITING_ENTITY]: [
        {
            to: CONVERSATION_STATES.PROCESSING,
            guard: (context, data) => data?.entityProvided // Solo se l'entità è stata fornita
        },
        {
            to: CONVERSATION_STATES.IDLE,
            guard: (context, data) => data?.cancelFollowUp // Solo se l'utente vuole cancellare
        },
        {
            to: CONVERSATION_STATES.ERROR,
            guard: (context, data) => data?.error // Solo in caso di errore
        }
    ],
    [CONVERSATION_STATES.AWAITING_CONFIRMATION]: [
        {
            to: CONVERSATION_STATES.PROCESSING,
            guard: (context, data) => data?.confirmed // Solo se confermato
        },
        {
            to: CONVERSATION_STATES.IDLE,
            guard: (context, data) => data?.cancelConfirmation // Solo se cancellato
        },
        {
            to: CONVERSATION_STATES.ERROR,
            guard: (context, data) => data?.error
        }
    ],
    [CONVERSATION_STATES.PROCESSING]: [
        {
            to: CONVERSATION_STATES.IDLE,
            guard: (context, data) => data?.completed // Solo se completato
        },
        {
            to: CONVERSATION_STATES.AWAITING_ENTITY,
            guard: (context, data) => data?.awaitingFor // Se serve altra info
        },
        {
            to: CONVERSATION_STATES.AWAITING_CONFIRMATION,
            guard: (context, data) => data?.needsConfirmation // Se serve conferma
        },
        {
            to: CONVERSATION_STATES.ERROR,
            guard: (context, data) => data?.error
        }
    ],
    [CONVERSATION_STATES.ERROR]: [
        {
            to: CONVERSATION_STATES.IDLE,
            guard: (context, data) => true // Sempre permesso tornare allo stato iniziale
        }
    ],
    [CONVERSATION_STATES.DORMANT]: [
        {
            to: CONVERSATION_STATES.IDLE,
            guard: (context, data) => data?.resume // Solo se l'utente riprende
        }
    ]
};

class ConversationManager {
    constructor(nluModule = null) {
        // EventEmitter functionality
        this.events = {};

        // State Stack per gestire conversazioni nidificate
        this.stateStack = [{
            context: {
                lastIntent: null,
                lastEntities: {},
                lastResponse: null,
                topic: null,
                subTopic: null,
                timestamp: Date.now()
            },
            state: CONVERSATION_STATES.IDLE,
            awaitingFor: null,
            followUpCount: 0,
            conversationFlow: []
        }];

        this.conversationHistory = [];
        this.flowPatterns = new Map();
        this.nluModule = nluModule; // Dependency injection per NLU
        this.conversationInsights = {
            successfulFlows: new Map(),
            failedFlows: new Map(),
            intentSequences: new Map(),
            topicTransitions: new Map()
        };

        // Carica insights persistenti
        this.loadPersistedInsights();
    }

    // === GESTIONE STATE STACK ===

    getCurrentState() {
        return this.stateStack[this.stateStack.length - 1];
    }

    pushState(newContext = {}) {
        const currentState = this.getCurrentState();
        const newStateFrame = {
            context: {
                ...currentState.context,
                ...newContext,
                timestamp: Date.now()
            },
            state: CONVERSATION_STATES.IDLE,
            awaitingFor: null,
            followUpCount: 0,
            conversationFlow: []
        };
        this.stateStack.push(newStateFrame);
        return newStateFrame;
    }

    popState() {
        if (this.stateStack.length > 1) {
            const poppedState = this.stateStack.pop();
            // Salva nella cronologia prima di rimuovere
            this.conversationHistory.push({
                ...poppedState,
                endedAt: Date.now(),
                type: 'nested_conversation'
            });
            return poppedState;
        }
        return null;
    }

    // === MACCHINA A STATI FINITI (DIALOG GRAPH) ===

    canTransition(fromState, toState, context = null, data = {}) {
        const transitions = DIALOG_TRANSITIONS[fromState];
        if (!transitions) return false;

        const validTransition = transitions.find(transition =>
            transition.to === toState && transition.guard(context || this.getCurrentState().context, data)
        );

        return !!validTransition;
    }

    transitionTo(newState, data = {}) {
        const currentFrame = this.getCurrentState();
        const context = currentFrame.context;

        if (!this.canTransition(currentFrame.state, newState, context, data)) {
            console.warn(`[ConversationManager] Transizione non valida: ${currentFrame.state} -> ${newState}`, { context, data });
            return false;
        }

        const oldState = currentFrame.state;
        currentFrame.state = newState;

        // Aggiorna dati specifici dello stato
        if (data.awaitingFor) currentFrame.awaitingFor = data.awaitingFor;
        if (data.followUpCount !== undefined) currentFrame.followUpCount = data.followUpCount;
        if (data.confirmed !== undefined) currentFrame.confirmed = data.confirmed;
        if (data.needsConfirmation !== undefined) currentFrame.needsConfirmation = data.needsConfirmation;

        // Emetti evento di cambio stato
        this.emit('stateChanged', {
            from: oldState,
            to: newState,
            context: context,
            data: data
        });

        return true;
    }

    updateContext(intent, entities, response, options = {}) {
        const currentFrame = this.getCurrentState();

        // Se è una nuova conversazione principale, salva quella precedente
        if (currentFrame.context.lastIntent && !options.isNested) {
            this.conversationHistory.push({
                ...currentFrame,
                endedAt: Date.now()
            });

            // Mantieni solo ultime 10 conversazioni
            if (this.conversationHistory.length > 10) {
                this.conversationHistory.shift();
            }
        }

        // Determina topic e sub-topic
        const topicInfo = this.determineTopic(intent, entities);

        // Aggiorna il contesto corrente
        currentFrame.context = {
            lastIntent: intent,
            lastEntities: entities,
            lastResponse: response,
            topic: topicInfo.topic,
            subTopic: topicInfo.subTopic,
            timestamp: Date.now()
        };

        // Resetta stato se non è una conversazione nidificata
        if (!options.isNested) {
            currentFrame.state = CONVERSATION_STATES.IDLE;
            currentFrame.awaitingFor = null;
            currentFrame.followUpCount = 0;
            currentFrame.conversationFlow = [{ intent, entities, timestamp: Date.now() }];
        } else {
            currentFrame.conversationFlow.push({ intent, entities, timestamp: Date.now() });
        }

        // Aggiorna pattern di flusso e insights
        // this.updateFlowPatterns(intent, entities); // Metodo non implementato
        this.updateConversationInsights(intent, entities, response, options.success);

        // Salva insights periodicamente (ogni 10 aggiornamenti)
        if (this.conversationHistory.length % 10 === 0) {
            this.savePersistedInsights();
        }
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

    updateConversationInsights(intent, entities, response, success = true) {
        const currentFrame = this.getCurrentState();
        const prevIntent = currentFrame.context.lastIntent;

        // Traccia sequenze di intenti (n-grammi)
        if (prevIntent) {
            const sequenceKey = `${prevIntent}->${intent}`;
            const currentCount = this.conversationInsights.intentSequences.get(sequenceKey) || 0;
            this.conversationInsights.intentSequences.set(sequenceKey, currentCount + 1);
        }

        // Traccia transizioni di topic
        if (prevIntent) {
            const prevTopic = this.determineTopic(prevIntent, currentFrame.context.lastEntities).topic;
            const currentTopic = this.determineTopic(intent, entities).topic;

            if (prevTopic !== currentTopic) {
                const transitionKey = `${prevTopic}->${currentTopic}`;
                const currentCount = this.conversationInsights.topicTransitions.get(transitionKey) || 0;
                this.conversationInsights.topicTransitions.set(transitionKey, currentCount + 1);
            }
        }

        // Traccia successi/fallimenti
        const flowKey = this.getCurrentFlowSignature();
        if (success) {
            const currentCount = this.conversationInsights.successfulFlows.get(flowKey) || 0;
            this.conversationInsights.successfulFlows.set(flowKey, currentCount + 1);
        } else {
            const currentCount = this.conversationInsights.failedFlows.get(flowKey) || 0;
            this.conversationInsights.failedFlows.set(flowKey, currentCount + 1);
        }
    }

    getCurrentFlowSignature() {
        const currentFrame = this.getCurrentState();
        return currentFrame.conversationFlow.map(step => step.intent).join('->');
    }

    askFor(entityType, question, options = {}) {
        const currentFrame = this.getCurrentState();

        if (currentFrame.followUpCount >= MAX_FOLLOW_UPS) {
            return "Mi dispiace, ho fatto troppe domande. Possiamo ricominciare da capo?";
        }

        // Transizione allo stato di attesa
        if (!this.transitionTo(CONVERSATION_STATES.AWAITING_ENTITY, {
            awaitingFor: entityType,
            followUpCount: currentFrame.followUpCount + 1
        })) {
            return "Mi dispiace, non posso gestire questa richiesta al momento.";
        }

        currentFrame.context.timestamp = Date.now();
        currentFrame.followUpOptions = options;

        // Se sono fornite opzioni di validazione, salvalo per l'estrazione
        if (options.validValues) {
            currentFrame.validValues = options.validValues;
        }

        return question;
    }

    handleFollowUp(text) {
        const currentFrame = this.getCurrentState();

        if (this.isContextExpired() || currentFrame.state !== CONVERSATION_STATES.AWAITING_ENTITY) {
            this.resetCurrentFrame();
            return null;
        }

        const awaitedEntity = currentFrame.awaitingFor;

        // Delega completamente all'NLU per l'estrazione dell'entità
        if (!this.nluModule || !this.nluModule.extractEntity) {
            console.error('[ConversationManager] NLU module not available for entity extraction');
            this.transitionTo(CONVERSATION_STATES.ERROR, { error: 'NLU unavailable' });
            return "Mi dispiace, al momento non posso elaborare la tua risposta.";
        }

        const entityValue = this.nluModule.extractEntity(text, awaitedEntity, currentFrame.validValues);

        // Transizione allo stato di processamento
        this.transitionTo(CONVERSATION_STATES.PROCESSING, { entityProvided: !!entityValue });

        // Aggiorna il flusso della conversazione
        currentFrame.conversationFlow.push({
            type: 'follow_up',
            awaitedEntity,
            providedValue: entityValue,
            timestamp: Date.now()
        });

        // Resetta lo stato di attesa
        currentFrame.state = CONVERSATION_STATES.IDLE;
        currentFrame.awaitingFor = null;

        return {
            intent: currentFrame.context.lastIntent,
            entities: {
                ...currentFrame.context.lastEntities,
                [awaitedEntity]: entityValue
            },
            isFollowUp: true,
            followUpCount: currentFrame.followUpCount
        };
    }

    extractEntityFromFollowUp(text, entityType, validValues = []) {
        // Questo metodo è stato rimosso - ora si usa solo l'NLU module
        throw new Error('extractEntityFromFollowUp is deprecated. Use NLU module instead.');
    }

    getContext() {
        const currentFrame = this.getCurrentState();
        if (this.isContextExpired()) {
            this.resetCurrentFrame();
        }
        return {
            ...currentFrame.context,
            state: currentFrame.state,
            awaitingFor: currentFrame.awaitingFor,
            followUpCount: currentFrame.followUpCount,
            stackDepth: this.stateStack.length
        };
    }

    isContextExpired() {
        const currentFrame = this.getCurrentState();
        return (Date.now() - currentFrame.context.timestamp) > CONTEXT_TIMEOUT_MS;
    }

    getConversationInsights() {
        const insights = {
            commonTopics: {},
            commonFlows: {},
            avgFollowUps: 0,
            totalConversations: this.conversationHistory.length,
            successfulSequences: {},
            failedSequences: {},
            topicTransitions: {},
            intentSequences: {},
            stackDepth: this.stateStack.length
        };

        // Analizza topic comuni
        this.conversationHistory.forEach(conv => {
            if (conv.context?.topic) {
                insights.commonTopics[conv.context.topic] = (insights.commonTopics[conv.context.topic] || 0) + 1;
            }
        });

        // Analizza pattern di flusso comuni
        this.flowPatterns.forEach((count, pattern) => {
            insights.commonFlows[pattern] = count;
        });

        // Analizza sequenze di successo
        this.conversationInsights.successfulFlows.forEach((count, sequence) => {
            insights.successfulSequences[sequence] = count;
        });

        // Analizza sequenze di fallimento
        this.conversationInsights.failedFlows.forEach((count, sequence) => {
            insights.failedSequences[sequence] = count;
        });

        // Analizza transizioni di topic
        this.conversationInsights.topicTransitions.forEach((count, transition) => {
            insights.topicTransitions[transition] = count;
        });

        // Analizza sequenze di intenti
        this.conversationInsights.intentSequences.forEach((count, sequence) => {
            insights.intentSequences[sequence] = count;
        });

        // Calcola media follow-up
        const totalFollowUps = this.conversationHistory.reduce((sum, conv) => sum + (conv.followUpCount || 0), 0);
        insights.avgFollowUps = insights.totalConversations > 0 ? totalFollowUps / insights.totalConversations : 0;

        return insights;
    }

    suggestNextInteraction() {
        const insights = this.getConversationInsights();
        const currentFrame = this.getCurrentState();
        const currentTopic = currentFrame.context.topic;

        // Modello di Policy Decisionale
        const candidates = this.generateSuggestionCandidates(currentTopic, insights);

        if (candidates.length === 0) return null;

        // Calcola punteggio per ogni candidato
        const scoredCandidates = candidates.map(candidate => ({
            ...candidate,
            score: this.calculateSuggestionScore(candidate, insights, currentFrame)
        }));

        // Ordina per punteggio decrescente
        scoredCandidates.sort((a, b) => b.score - a.score);

        const bestCandidate = scoredCandidates[0];

        return {
            message: bestCandidate.message,
            suggestedIntent: bestCandidate.intent,
            confidence: bestCandidate.score,
            factors: bestCandidate.factors
        };
    }

    generateSuggestionCandidates(currentTopic, insights) {
        const candidates = [];

        // Candidati basati sui topic più comuni
        Object.entries(insights.commonTopics).forEach(([topic, count]) => {
            const topicSuggestions = {
                'projects': [
                    { intent: 'openProject', message: 'Vuoi esplorare altri progetti nel portfolio?' },
                    { intent: 'searchProjects', message: 'Hai progetti specifici in mente da cercare?' }
                ],
                'interface': [
                    { intent: 'setTheme', message: 'Vuoi personalizzare ulteriormente l\'interfaccia?' },
                    { intent: 'setCursor', message: 'Vuoi provare un cursore diverso?' }
                ],
                'development': [
                    { intent: 'analyzeCode', message: 'Hai altre curiosità tecniche?' },
                    { intent: 'codeSnippet', message: 'Vuoi vedere esempi di codice?' }
                ],
                'external': [
                    { intent: 'getWeather', message: 'Vuoi sapere il meteo?' },
                    { intent: 'getGeneralKnowledge', message: 'Hai altre domande?' }
                ]
            };

            if (topicSuggestions[topic]) {
                candidates.push(...topicSuggestions[topic]);
            }
        });

        // Candidati basati sui flussi di successo
        Object.entries(insights.successfulSequences).forEach(([sequence, count]) => {
            const lastIntent = sequence.split('->').pop();
            const sequenceSuggestions = {
                'openProject': { intent: 'openProject', message: 'Basandomi sulle tue preferenze, vuoi vedere altri progetti?' },
                'setTheme': { intent: 'setTheme', message: 'Ti piace cambiare il tema spesso, vuoi provarne uno nuovo?' },
                'navigate': { intent: 'navigate', message: 'Vuoi visitare altre sezioni del sito?' }
            };

            if (sequenceSuggestions[lastIntent]) {
                candidates.push(sequenceSuggestions[lastIntent]);
            }
        });

        return candidates;
    }

    calculateSuggestionScore(candidate, insights, currentFrame) {
        let score = 0;
        const factors = {};

        // Fattore 1: Successo storico
        const successRate = insights.successfulSequences[candidate.intent] || 0;
        const totalAttempts = successRate + (insights.failedSequences[candidate.intent] || 0);
        const historicalSuccess = totalAttempts > 0 ? successRate / totalAttempts : 0.5;
        score += historicalSuccess * 0.4;
        factors.historicalSuccess = historicalSuccess;

        // Fattore 2: Novità (non ripetere azioni recenti)
        const recentIntents = currentFrame.conversationFlow.slice(-3).map(step => step.intent);
        const isRecent = recentIntents.includes(candidate.intent);
        const noveltyBonus = isRecent ? 0.3 : 1.0;
        score += noveltyBonus * 0.2;
        factors.novelty = noveltyBonus;

        // Fattore 3: Contesto corrente
        const contextRelevance = this.calculateContextRelevance(candidate.intent, currentFrame);
        score += contextRelevance * 0.3;
        factors.contextRelevance = contextRelevance;

        // Fattore 4: Frequenza topic
        const topicFrequency = insights.commonTopics[currentFrame.context.topic] || 0;
        const topicBonus = Math.min(topicFrequency / 10, 1.0); // Max 1.0
        score += topicBonus * 0.1;
        factors.topicFrequency = topicBonus;

        return Math.min(score, 1.0); // Max score = 1.0
    }

    calculateContextRelevance(intent, currentFrame) {
        // Calcola quanto l'intent è rilevante rispetto al contesto corrente
        const contextMappings = {
            'projects': ['openProject', 'searchProjects'],
            'interface': ['setTheme', 'setCursor'],
            'development': ['analyzeCode', 'codeSnippet', 'gitStatus'],
            'navigation': ['navigate'],
            'external': ['getWeather', 'getGeneralKnowledge', 'getNewsHeadlines']
        };

        const relevantIntents = contextMappings[currentFrame.context.topic] || [];
        return relevantIntents.includes(intent) ? 1.0 : 0.5;
    }

    resetCurrentFrame() {
        // Resetta solo il frame corrente, mantiene lo stack
        const currentFrame = this.getCurrentState();
        currentFrame.context = {
            lastIntent: null,
            lastEntities: {},
            lastResponse: null,
            topic: null,
            subTopic: null,
            timestamp: Date.now()
        };
        currentFrame.state = CONVERSATION_STATES.IDLE;
        currentFrame.awaitingFor = null;
        currentFrame.followUpCount = 0;
        currentFrame.conversationFlow = [];
        this.emit('frameReset');
    }

    resetFullStack() {
        // Cancella l'intero stateStack e riporta tutto allo stato iniziale
        this.stateStack = [{
            context: {
                lastIntent: null,
                lastEntities: {},
                lastResponse: null,
                topic: null,
                subTopic: null,
                timestamp: Date.now()
            },
            state: CONVERSATION_STATES.IDLE,
            awaitingFor: null,
            followUpCount: 0,
            conversationFlow: []
        }];
        this.conversationHistory = [];
        this.emit('fullReset');
    }

    // === RILEVAMENTO AUTOMATICO DIGRESSIONI ===

    detectAndHandleDigression(intent, entities) {
        const currentFrame = this.getCurrentState();

        // Se siamo in attesa di un'entità e l'intent ricevuto non la soddisfa
        if (currentFrame.state === CONVERSATION_STATES.AWAITING_ENTITY) {
            const awaitedEntity = currentFrame.awaitingFor;

            // Verifica se questo intent potrebbe soddisfare l'attesa
            const couldSatisfyWaiting = this.intentCouldSatisfyEntity(intent, entities, awaitedEntity);

            if (!couldSatisfyWaiting) {
                // È una digressione! Crea automaticamente una conversazione nidificata
                console.log(`[ConversationManager] Digressione rilevata: ${intent} durante attesa di ${awaitedEntity}`);
                this.startNestedConversation(intent, entities);
                this.emit('digressionDetected', {
                    originalIntent: currentFrame.context.lastIntent,
                    digressionIntent: intent,
                    awaitedEntity: awaitedEntity
                });
                return true; // Digressione gestita
            }
        }

        return false; // Nessuna digressione
    }

    intentCouldSatisfyEntity(intent, entities, awaitedEntity) {
        // Logica per determinare se l'intent corrente potrebbe soddisfare l'entità attesa
        const entityMapping = {
            'projectName': ['openProject', 'searchProjects'],
            'sectionName': ['navigate'],
            'theme': ['setTheme'],
            'cursor': ['setCursor']
        };

        const relevantIntents = entityMapping[awaitedEntity] || [];
        return relevantIntents.includes(intent) && entities[awaitedEntity];
    }

    // Metodo migliorato per gestire input con rilevamento digressioni
    processInput(intent, entities, response = null, options = {}) {
        // Prima controlla se è un intent di correzione
        const correctionResult = this.handleCorrectionIntent(intent, entities);
        if (correctionResult) return correctionResult;

        // Poi controlla se è una digressione
        if (this.detectAndHandleDigression(intent, entities)) {
            return {
                type: 'digression_started',
                message: 'Capisco che vuoi cambiare argomento. Dimmi pure, poi torniamo alla conversazione precedente.'
            };
        }

        // Se siamo in stato dormiente, riprendi
        if (this.getCurrentState().state === CONVERSATION_STATES.DORMANT) {
            const resumeResult = this.resumeFromDormant();
            if (resumeResult) return resumeResult;
        }

        // Controlla timeout
        const timeoutCheck = this.checkTimeoutAndHandle();
        if (timeoutCheck) return timeoutCheck;

        // Gestisci normalmente l'input
        this.updateContext(intent, entities, response, options);

        // Salva l'azione pendente per possibili conferme future
        const currentFrame = this.getCurrentState();
        currentFrame.pendingAction = { intent, entities, response, options };

        // Se serve conferma e confidenza è media, chiedi conferma
        if (options.confidence && options.confidence > 0.6 && options.confidence < 0.8) {
            this.transitionTo(CONVERSATION_STATES.AWAITING_CONFIRMATION, { needsConfirmation: true });
            return {
                type: 'confirmation_needed',
                message: `Ho capito che vuoi ${this.intentToDescription(intent, entities)}. È corretto?`,
                intent: intent,
                entities: entities
            };
        }

        return {
            type: 'processed',
            intent: intent,
            entities: entities
        };
    }

    // === GESTIONE CONFERMA E CORREZIONE ===

    handleConfirmation(confirmed, correctionData = null) {
        const currentFrame = this.getCurrentState();

        if (currentFrame.state !== CONVERSATION_STATES.AWAITING_CONFIRMATION) {
            return { type: 'error', message: 'Nessuna conferma in attesa.' };
        }

        if (confirmed) {
            // Conferma ricevuta, procedi con l'azione originale
            this.transitionTo(CONVERSATION_STATES.PROCESSING, { confirmed: true });
            this.emit('confirmationAccepted', currentFrame.pendingAction);
            return {
                type: 'confirmed',
                message: 'Perfetto! Procedo con la tua richiesta.',
                action: currentFrame.pendingAction
            };
        } else if (correctionData) {
            // Correzione ricevuta, aggiorna e chiedi nuovamente
            this.transitionTo(CONVERSATION_STATES.IDLE, { cancelConfirmation: true });
            this.emit('correctionReceived', correctionData);
            return {
                type: 'corrected',
                message: 'Capito, grazie per la correzione. Come posso aiutarti ora?',
                correction: correctionData
            };
        } else {
            // Conferma rifiutata senza correzione
            this.transitionTo(CONVERSATION_STATES.IDLE, { cancelConfirmation: true });
            this.emit('confirmationRejected');
            return {
                type: 'cancelled',
                message: 'Va bene, cancelliamo questa azione. Cosa posso fare per te?'
            };
        }
    }

    handleCorrectionIntent(correctionIntent, correctionEntities) {
        const currentFrame = this.getCurrentState();

        // Gestisci intenti di correzione come "deny", "correct", "no"
        if (['deny', 'correct', 'no', 'wrong'].includes(correctionIntent)) {
            if (currentFrame.state === CONVERSATION_STATES.AWAITING_CONFIRMATION) {
                return this.handleConfirmation(false, correctionEntities);
            } else if (currentFrame.state === CONVERSATION_STATES.AWAITING_ENTITY) {
                // L'utente sta correggendo l'entità attesa
                this.transitionTo(CONVERSATION_STATES.IDLE, { cancelFollowUp: true });
                this.emit('followUpCancelled', { reason: 'user_correction' });
                return {
                    type: 'followup_cancelled',
                    message: 'Va bene, ricominciamo. Cosa volevi chiedermi?'
                };
            }
        }

        return null; // Non è un intent di correzione
    }

    // Metodo per ottenere il contesto completo dello stack
    getFullContext() {
        return {
            stack: this.stateStack.map(frame => ({
                context: frame.context,
                state: frame.state,
                awaitingFor: frame.awaitingFor,
                followUpCount: frame.followUpCount
            })),
            history: this.conversationHistory,
            insights: this.getConversationInsights()
        };
    }

    // === GESTIONE PERSISTENZA INSIGHTS ===

    loadPersistedInsights() {
        try {
            const persisted = localStorage.getItem('conversationInsights');
            if (persisted) {
                const data = JSON.parse(persisted);
                // Converti le mappe da oggetti
                this.conversationInsights.successfulFlows = new Map(Object.entries(data.successfulFlows || {}));
                this.conversationInsights.failedFlows = new Map(Object.entries(data.failedFlows || {}));
                this.conversationInsights.intentSequences = new Map(Object.entries(data.intentSequences || {}));
                this.conversationInsights.topicTransitions = new Map(Object.entries(data.topicTransitions || {}));
                console.log('[ConversationManager] Insights persistenti caricati');
            }
        } catch (error) {
            console.warn('[ConversationManager] Errore caricamento insights persistenti:', error);
        }
    }

    savePersistedInsights() {
        try {
            const data = {
                successfulFlows: Object.fromEntries(this.conversationInsights.successfulFlows),
                failedFlows: Object.fromEntries(this.conversationInsights.failedFlows),
                intentSequences: Object.fromEntries(this.conversationInsights.intentSequences),
                topicTransitions: Object.fromEntries(this.conversationInsights.topicTransitions),
                lastSaved: Date.now()
            };
            localStorage.setItem('conversationInsights', JSON.stringify(data));
        } catch (error) {
            console.warn('[ConversationManager] Errore salvataggio insights:', error);
        }
    }

    // === GESTIONE TIMEOUT GRADUALE ===

    checkTimeoutAndHandle() {
        const currentFrame = this.getCurrentState();
        const timeSinceLastActivity = Date.now() - currentFrame.context.timestamp;

        if (timeSinceLastActivity > CONTEXT_TIMEOUT_MS) {
            // Timeout completo: vai in stato dormiente
            this.transitionTo(CONVERSATION_STATES.DORMANT);
            this.emit('conversationTimeout', { dormant: true });
            return {
                type: 'timeout',
                message: 'La conversazione è entrata in stato dormiente. Digita qualcosa per riprendere.',
                dormant: true
            };
        } else if (timeSinceLastActivity > CONTEXT_TIMEOUT_MS * 0.8) {
            // Avvicinandosi al timeout: re-engagement proattivo
            this.emit('reengagementPrompt', {
                timeRemaining: Math.round((CONTEXT_TIMEOUT_MS - timeSinceLastActivity) / 1000)
            });
            return {
                type: 'reengagement',
                message: `Ehi, sei ancora lì? Stavamo parlando di ${currentFrame.context.topic || 'qualcosa'}. Vuoi continuare?`,
                timeRemaining: Math.round((CONTEXT_TIMEOUT_MS - timeSinceLastActivity) / 1000)
            };
        }

        return null;
    }

    resumeFromDormant() {
        if (this.getCurrentState().state === CONVERSATION_STATES.DORMANT) {
            this.transitionTo(CONVERSATION_STATES.IDLE, { resume: true });
            this.emit('conversationResumed');
            return {
                type: 'resumed',
                message: `Bentornato! Stavamo parlando di ${this.getCurrentState().context.topic || 'qualcosa'}. Come posso aiutarti?`
            };
        }
        return null;
    }

    // === EVENT EMITTER FUNCTIONALITY ===

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    emit(event, data = {}) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[ConversationManager] Errore nell'evento ${event}:`, error);
            }
        });
    }
}

export default ConversationManager;
