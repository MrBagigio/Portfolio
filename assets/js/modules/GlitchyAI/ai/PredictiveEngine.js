/**
 * PredictiveEngine.js
 * Motore predittivo per anticipare le esigenze dell'utente basandosi
 * su pattern di comportamento e contesto.
 */
export default class PredictiveEngine {
    constructor() {
        this.patterns = this.loadPatterns();
        this.predictions = [];
        this.confidenceThreshold = 0.6;
    }

    loadPatterns() {
        const saved = localStorage.getItem('glitchy_patterns');
        try {
            return saved ? JSON.parse(saved) : {
                timeBased: {},
                sequenceBased: {},
                contextBased: {}
            };
        } catch (e) {
            console.warn('Failed to load predictive patterns, starting fresh.');
            return { timeBased: {}, sequenceBased: {}, contextBased: {} };
        }
    }

    savePatterns() {
        try {
            localStorage.setItem('glitchy_patterns', JSON.stringify(this.patterns));
        } catch (e) {
            console.warn('Failed to save predictive patterns.');
        }
    }

    learnPattern(type, key, outcome, confidence = 1) {
        if (!this.patterns[type]) {
            this.patterns[type] = {};
        }
        if (!this.patterns[type][key]) {
            this.patterns[type][key] = {};
        }

        this.patterns[type][key][outcome] = (this.patterns[type][key][outcome] || 0) + confidence;
        this.savePatterns();
    }

    predictNextAction(currentContext) {
        const predictions = [];
        const { currentSection, lastIntent } = currentContext;

        // Predizione basata sul tempo
        const hour = new Date().getHours();
        const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        
        if (this.patterns.timeBased[timeSlot]) {
            const timePredictions = Object.entries(this.patterns.timeBased[timeSlot])
                .sort(([, a], [, b]) => b - a)
                .slice(0, 2);

            timePredictions.forEach(([action, confidence]) => {
                const totalConfidence = Object.values(this.patterns.timeBased[timeSlot]).reduce((a, b) => a + b, 0);
                const normalizedConfidence = totalConfidence > 0 ? confidence / totalConfidence : 0;
                
                if (normalizedConfidence > this.confidenceThreshold) {
                    predictions.push({
                        action,
                        confidence: normalizedConfidence,
                        reason: `Basato sui tuoi pattern di utilizzo della ${timeSlot}`
                    });
                }
            });
        }

        // Predizione basata sul contesto attuale
        const contextKey = `${currentSection}_${lastIntent || 'none'}`;
        if (this.patterns.contextBased[contextKey]) {
            const contextPredictions = Object.entries(this.patterns.contextBased[contextKey])
                .sort(([, a], [, b]) => b - a)
                .slice(0, 1);
            
            contextPredictions.forEach(([action, confidence]) => {
                const totalConfidence = Object.values(this.patterns.contextBased[contextKey]).reduce((a, b) => a + b, 0);
                const normalizedConfidence = totalConfidence > 0 ? confidence / totalConfidence : 0;
                
                if (normalizedConfidence > this.confidenceThreshold) {
                    predictions.push({
                        action,
                        confidence: normalizedConfidence,
                        reason: `Basato sul contesto attuale (sezione e ultimo comando)`
                    });
                }
            });
        }
        
        // Rimuovi duplicati e ordina per confidenza
        const uniquePredictions = Array.from(new Map(predictions.map(p => [p.action, p])).values());
        return uniquePredictions.sort((a, b) => b.confidence - a.confidence).slice(0, 2); // Max 2 previsioni
    }

    recordOutcome(context, action, success) {
        if (!context || !action) return;

        // Apprendimento basato sul tempo
        const hour = new Date().getHours();
        const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        this.learnPattern('timeBased', timeSlot, action, success ? 1 : 0.3);

        // Apprendimento basato sul contesto (sezione e ultimo intent)
        const contextKey = `${context.currentSection}_${context.lastIntent || 'none'}`;
        this.learnPattern('contextBased', contextKey, action, success ? 1 : 0.5);
    }
}