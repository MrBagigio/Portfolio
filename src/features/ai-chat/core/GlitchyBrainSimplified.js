/**
 * GlitchyBrainSimplified.js - AI Orchestrator Semplificato
 * Versione ottimizzata con moduli essenziali per intelligenza avanzata
 */

import { KNOWLEDGE_BASE } from '../knowledge/knowledgeBase.js';
import { ConfigManager } from './ConfigManager.js';
import { MemorySystem } from './MemorySystem.js';
import { OptimizedStorage } from './OptimizedStorage.js';
import { initNLU, parse } from '../nlu/NLU.js';
import { LLMIntegration } from './LLMIntegration.js';
import { RateLimiter, InputSanitizer, SECURE_CONFIG } from './SecureConfig.js';

export class GlitchyBrainSimplified {
    constructor(config = {}) {
        this.config = {
            enableLLM: true,
            enableMemory: true,
            enableLearning: true,
            maxResponseTime: 5000,
            ...config
        };

        this.modules = {};
        this.isInitialized = false;
        this.conversationHistory = [];

        // Stato UI per compatibilità
        this.uiState = {
            theme: 'dark',
            language: 'it',
            soundEnabled: true,
            animationsEnabled: true
        };

        // Sicurezza
        this.rateLimiter = new RateLimiter();
        this.inputSanitizer = new InputSanitizer();
    }

    /**
     * Inizializzazione semplificata
     */
    async initialize() {
        try {
            console.log('[GlitchyBrain] Initializing simplified AI...');

            // Configurazione
            try {
                this.modules.config = new ConfigManager();
            } catch (error) {
                console.warn('[GlitchyBrain] ConfigManager failed, using defaults:', error.message);
                this.modules.config = { get: () => ({}), set: () => {} };
            }

            // Memoria (se abilitata)
            if (this.config.enableMemory) {
                try {
                    const storage = new OptimizedStorage();
                    this.modules.memory = new MemorySystem({
                        storage: storage,
                        maxMemoryItems: 1000,
                        enableCompression: false // Semplificato
                    });
                } catch (error) {
                    console.warn('[GlitchyBrain] MemorySystem failed, disabling memory:', error.message);
                    this.config.enableMemory = false;
                }
            }

            // NLU
            const nluInit = await initNLU();
            if (!nluInit) {
                throw new Error('NLU initialization failed');
            }

            // LLM Integration
            if (this.config.enableLLM) {
                try {
                    this.modules.llm = new LLMIntegration({
                        apiKey: SECURE_CONFIG.openai.apiKey, // Da configurazione sicura
                        fallbackEnabled: true
                    });
                    this.modules.llm.setKnowledgeBase(KNOWLEDGE_BASE);
                } catch (error) {
                    console.warn('[GlitchyBrain] LLM integration failed, disabling:', error.message);
                    this.config.enableLLM = false;
                }
            }

            this.isInitialized = true;
            console.log('[GlitchyBrain] Simplified AI initialized successfully');

        } catch (error) {
            console.error('[GlitchyBrain] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Processa input utente
     */
    async processInput(input) {
        if (!this.isInitialized) {
            throw new Error('AI not initialized');
        }

        // Rate limiting
        if (!this.rateLimiter.canMakeRequest()) {
            const remainingTime = Math.ceil(this.rateLimiter.getRemainingTime() / 1000);
            return `Troppe richieste. Riprova tra ${remainingTime} secondi.`;
        }

        try {
            // Sanitizza input
            const sanitizedInput = this.inputSanitizer.sanitize(input);

            if (!sanitizedInput) {
                return "Input non valido. Riprova con testo normale.";
            }

            // Timeout per risposta
            const responsePromise = this._generateResponse(sanitizedInput);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Response timeout')), this.config.maxResponseTime)
            );

            const response = await Promise.race([responsePromise, timeoutPromise]);

            // Aggiorna storia
            this._updateHistory(sanitizedInput, response);

            return response;

        } catch (error) {
            console.error('[GlitchyBrain] Processing error:', error);
            return "Mi dispiace, si è verificato un errore. Riprova!";
        }
    }

    async _generateResponse(input) {
        // Prima, parsing NLU per intent specifici
        const nluResult = await parse(input);

        // Se intent è semplice (navigazione, comandi), gestisci direttamente
        if (this._isSimpleIntent(nluResult.intent)) {
            return this._handleSimpleIntent(nluResult);
        }

        // Altrimenti, usa LLM per risposta intelligente
        if (this.modules.llm) {
            const context = {
                intent: nluResult.intent,
                entities: nluResult.entities,
                history: this.conversationHistory.slice(-3)
            };
            return await this.modules.llm.generateResponse(input, context);
        }

        // Fallback
        return "Non ho capito bene. Puoi riformulare?";
    }

    _isSimpleIntent(intent) {
        const simpleIntents = ['navigate', 'setCursor', 'setTheme', 'openProject', 'playSound'];
        return simpleIntents.includes(intent);
    }

    _handleSimpleIntent(nluResult) {
        // Logica semplificata per intent diretti
        switch (nluResult.intent) {
            case 'navigate':
                return `Navigando verso ${nluResult.entities.sectionName || 'la sezione richiesta'}...`;
            case 'setCursor':
                return `Cambiando cursore a ${nluResult.entities.cursorType || 'tipo richiesto'}...`;
            case 'setTheme':
                return `Cambiando tema a ${nluResult.entities.theme || 'tema richiesto'}...`;
            case 'openProject':
                return `Aprendo progetto ${nluResult.entities.projectName || 'richiesto'}...`;
            case 'playSound':
                return `Riproducendo suono ${nluResult.entities.soundName || 'richiesto'}...`;
            default:
                return "Comando ricevuto!";
        }
    }

    _sanitizeInput(input) {
        // Ora gestito da InputSanitizer
        return input;
    }

    _updateHistory(input, response) {
        this.conversationHistory.push({
            input,
            response,
            timestamp: Date.now()
        });
        if (this.conversationHistory.length > 20) {
            this.conversationHistory.shift();
        }
    }

    /**
     * Genera risposta personalizzata basata su contesto
     */
    async generatePersonalizedResponse(baseMessage, userInput, context = '') {
        try {
            // Versione semplificata: restituisce il messaggio base con piccole variazioni
            let personalizedMessage = baseMessage;

            // Aggiungi un tocco di personalità occasionalmente
            if (Math.random() > 0.8) {
                personalizedMessage += ' ??';
            }

            return personalizedMessage;
        } catch (error) {
            console.error('[GlitchyBrain] Error generating personalized response:', error);
            return baseMessage; // Fallback al messaggio base
        }
    }

    /**
     * Valuta soddisfazione utente (versione semplificata)
     */
    evaluateUserSatisfaction(response, userInput) {
        try {
            let score = 3.0; // Punteggio base neutro

            // Analizza qualità della risposta
            if (response.ok === false) {
                score -= 1.0; // Penalità per risposte di errore
            }

            if (response.msg) {
                const msgLength = response.msg.length;
                if (msgLength < 10) score -= 0.5; // Troppo breve
                else if (msgLength > 500) score -= 0.3; // Troppo lungo
                else if (msgLength > 50 && msgLength < 200) score += 0.5; // Lunghezza ideale
            }

            // Limita punteggio tra 1 e 5
            return Math.max(1.0, Math.min(5.0, score));

        } catch (error) {
            console.warn('[GlitchyBrain] Error evaluating satisfaction:', error);
            return 3.0; // Default neutro
        }
    }

    /**
     * Aggiungi memoria episodica (versione semplificata)
     */
    async addEpisodicMemory(memoryData) {
        try {
            if (!this.modules.memory) return;

            const episode = {
                timestamp: Date.now(),
                type: 'interaction',
                data: memoryData
            };

            await this.modules.memory.store('episodic', episode);

        } catch (error) {
            console.warn('[GlitchyBrain] Error adding episodic memory:', error);
        }
    }

    /**
     * Analizza sentiment (versione semplificata)
     */
    analyzeSentiment(text) {
        // Versione semplificata: analisi base
        if (!text) return 'neutral';

        const lowerText = text.toLowerCase();
        if (lowerText.includes('bene') || lowerText.includes('buono') || lowerText.includes('ottimo')) {
            return 'positive';
        } else if (lowerText.includes('male') || lowerText.includes('cattivo') || lowerText.includes('terribile')) {
            return 'negative';
        }
        return 'neutral';
    }

    /**
     * Genera risposta locale (versione semplificata)
     */
    async generateLocalResponse(text, intent, entities) {
        // Risposte locali semplificate
        const responses = {
            'greeting': 'Ciao! Sono Glitchy, il tuo assistente AI. Come posso aiutarti?',
            'help': 'Posso aiutarti con navigazione, progetti, o rispondere alle tue domande!',
            'goodbye': 'Arrivederci! Torna presto.'
        };

        return responses[intent] || 'Comando ricevuto!';
    }

    /**
     * Gestione log conversazioni (versione semplificata)
     */
    getConversationLog() {
        return this.conversationHistory;
    }

    exportConversationLog() {
        return JSON.stringify(this.conversationHistory, null, 2);
    }

    clearConversationLog() {
        this.conversationHistory = [];
    }

    /**
     * Ottieni stato AI
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            modules: Object.keys(this.modules),
            historyLength: this.conversationHistory.length
        };
    }
}