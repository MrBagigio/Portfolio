// File: /assets/js/modules/GlitchyAI/NLU.js

// Importiamo la base di conoscenza per renderla disponibile all'NLU
import { KNOWLEDGE_BASE } from '../knowledge/knowledgeBase.js';

// Importiamo la configurazione NLU migliorata
import { intents, entities, synonyms, recognizeIntent } from './nlu_config.js';

// Istanza globale della pipeline (semplificata)
let conversationHistory = [];

/**
 * Funzione di inizializzazione semplificata
 */
export async function initNLU() {
    try {
        console.log('[NLU] Inizializzazione NLU migliorata...');
        conversationHistory = [];
        console.log('[NLU] NLU inizializzata con successo');
        return true;
    } catch (error) {
        console.error('[NLU] Errore durante l\'inizializzazione:', error);
        return false;
    }
}

/**
 * Funzione principale di parsing migliorata
 */
export async function parse(text) {
    try {
        // Usa la nuova logica di riconoscimento
        const recognition = recognizeIntent(text, conversationHistory);

        // Estrai entità
        const extractedEntities = extractEntities(text);

        // Analizza sentiment
        const sentiment = analyzeSentiment(text);

        const result = {
            intent: recognition.intent,
            entities: extractedEntities,
            confidence: recognition.confidence,
            sentiment: sentiment
        };

        // Aggiorna storia conversazionale
        conversationHistory.push({
            text,
            intent: recognition.intent,
            timestamp: Date.now()
        });

        // Limita storia a ultime 10 interazioni
        if (conversationHistory.length > 10) {
            conversationHistory.shift();
        }

        return result;
    } catch (error) {
        console.error('[NLU] Errore durante il parsing:', error);
        return {
            intent: 'unknown',
            entities: {},
            confidence: 0.1,
            sentiment: 'neutral'
        };
    }
}

/**
 * Estrae entità dal testo
 */
function extractEntities(text) {
    const extracted = {};
    const lowerText = text.toLowerCase();

    for (const [entityType, entityConfig] of Object.entries(entities)) {
        const patterns = entityConfig.patterns || [];
        for (const pattern of patterns) {
            if (lowerText.includes(pattern.toLowerCase())) {
                const normalized = entityConfig.normalization[pattern] || pattern;
                extracted[entityType] = normalized;
                break; // Prendi la prima corrispondenza
            }
        }
    }

    return extracted;
}

/**
 * Analizza sentiment del testo
 */
function analyzeSentiment(text) {
    const positiveWords = ['bene', 'ottimo', 'fantastico', 'grazie', 'perfetto', 'grande', 'buono'];
    const negativeWords = ['male', 'terribile', 'noioso', 'brutto', 'cattivo', 'pessimo'];

    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
}

// Esporta per compatibilità
export const contextManager = {
    getContextualHints: () => [],
    getRecentEntities: () => [],
    getCurrentTopic: () => null,
};