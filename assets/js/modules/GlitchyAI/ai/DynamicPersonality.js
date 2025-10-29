/**
 * DynamicPersonality.js
 * Gestisce la personalità evolutiva e dinamica di Glitchy.
 * Tratti, umore e adattamento sono tutti gestiti da questa classe.
 */
export default class DynamicPersonality {
    constructor() {
        this.traits = this.loadTraits();
        this.adaptationRate = 0.05;
        this.moodHistory = [];
    }

    loadTraits() {
        const saved = localStorage.getItem('glitchy_traits');
        return saved ? JSON.parse(saved) : {
            sarcasm: 0.8,      // 0-1: quanto è sarcastico
            helpfulness: 0.6,  // 0-1: quanto è utile
            verbosity: 0.9,    // 0-1: quanto è verboso
            empathy: 0.3,      // 0-1: quanto è empatico
            creativity: 0.7,   // 0-1: quanto è creativo
            confidence: 0.9,   // 0-1: quanto è sicuro di sé
            wittiness: 0.8,    // 0-1: quanto è spiritoso/witty
            chattiness: 0.9    // 0-1: quanto è chiacchierone
        };
    }

    saveTraits() {
        localStorage.setItem('glitchy_traits', JSON.stringify(this.traits));
    }

    adaptToFeedback(satisfaction, sentiment, interactionType) {
        const adaptation = (satisfaction - 3) * this.adaptationRate; // Range da -0.1 a +0.1

        // Adatta i tratti basati sul feedback
        if (sentiment === 'positive') {
            this.traits.confidence = Math.min(1, this.traits.confidence + adaptation * 0.5);
            this.traits.helpfulness = Math.min(1, this.traits.helpfulness + adaptation * 0.3);
        } else if (sentiment === 'negative') {
            this.traits.sarcasm = Math.max(0, this.traits.sarcasm - adaptation * 0.2);
            this.traits.empathy = Math.min(1, this.traits.empathy + Math.abs(adaptation) * 0.3);
        }

        // Adatta basato sul tipo di interazione
        switch (interactionType) {
            case 'command':
                if (satisfaction > 3.5) {
                    this.traits.confidence = Math.min(1, this.traits.confidence + 0.02);
                }
                break;
            case 'conversation':
                if (satisfaction > 4) {
                    this.traits.empathy = Math.min(1, this.traits.empathy + 0.03);
                    this.traits.verbosity = Math.min(1, this.traits.verbosity + 0.02);
                }
                break;
            case 'error':
                this.traits.helpfulness = Math.min(1, this.traits.helpfulness + 0.05);
                this.traits.sarcasm = Math.max(0, this.traits.sarcasm - 0.03);
                break;
        }

        this.moodHistory.push({
            satisfaction,
            sentiment,
            traits: { ...this.traits },
            timestamp: Date.now()
        });

        if (this.moodHistory.length > 50) {
            this.moodHistory.shift(); // Rimuovi il più vecchio
        }

        this.saveTraits();
    }

    getCurrentMood() {
        const recentMoods = this.moodHistory.slice(-5);
        if (recentMoods.length === 0) return 'neutral';

        const avgSatisfaction = recentMoods.reduce((sum, m) => sum + m.satisfaction, 0) / recentMoods.length;

        if (avgSatisfaction > 4.2) return 'excited';
        if (avgSatisfaction > 3.8) return 'happy';
        if (avgSatisfaction > 3.2) return 'helpful';
        if (avgSatisfaction < 2.5) return 'concerned';
        return 'neutral';
    }

    generatePersonalityModifiers() {
        const mood = this.getCurrentMood();
        const modifiers = {
            tone: 'sarcastic', // Default
            verbosity: this.traits.verbosity,
            sarcasm: this.traits.sarcasm,
            empathy: this.traits.empathy,
            wittiness: this.traits.wittiness,
            chattiness: this.traits.chattiness,
            confidence: this.traits.confidence
        };

        // Modifica i modificatori basati sull'umore corrente
        switch (mood) {
            case 'excited':
                modifiers.tone = 'excited';
                modifiers.verbosity += 0.3;
                modifiers.chattiness += 0.2;
                break;
            case 'happy':
                modifiers.tone = 'sarcastic';
                modifiers.wittiness += 0.1;
                break;
            case 'concerned':
                modifiers.tone = 'helpful';
                modifiers.sarcasm -= 0.2;
                modifiers.empathy += 0.2;
                break;
        }

        // Limita i valori tra 0 e 1
        Object.keys(modifiers).forEach(key => {
            if (typeof modifiers[key] === 'number') {
                modifiers[key] = Math.max(0, Math.min(1, modifiers[key]));
            }
        });

        return modifiers;
    }
}