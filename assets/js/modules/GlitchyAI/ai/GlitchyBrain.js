/**
 * GlitchyBrain.js
 * Il cervello centrale di Glitchy. Gestisce la memoria a breve e lungo termine,
 * le preferenze dell'utente, l'apprendimento e il contesto della conversazione.
 */
import ReinforcementLearner from './ReinforcementLearner.js';
import PredictiveEngine from './PredictiveEngine.js';
import DynamicPersonality from './DynamicPersonality.js';
import MemoryAnalyzer from './MemoryAnalyzer.js';

export default class GlitchyBrain {
    constructor() {
        this.userPreferences = this.loadPreferences();
        this.conversationMemory = this.loadMemory();
        this.longTermMemory = this.loadLongTermMemory();
        this.contextualMemory = new Map(); // Memoria contestuale per topic specifici
        this.episodicMemory = this.loadEpisodicMemory(); // Memoria episodica avanzata
        this.reinforcementLearner = new ReinforcementLearner(); // Apprendimento per rinforzo
        this.predictiveEngine = new PredictiveEngine(); // Sistema predittivo
        this.dynamicPersonality = new DynamicPersonality(); // Personalità dinamica
        this.memoryAnalyzer = new MemoryAnalyzer();
        this.uiState = {
            currentSection: 'hero',
            scrollDepth: 0,
            timeOnPage: 0,
            interactions: [],
            lastActivity: Date.now()
        };
        this.analytics = {
            commandsUsed: {},
            featuresAccessed: {},
            responseTimes: [],
            userSatisfaction: [],
            conversationEpisodes: [],
            reinforcementRewards: [],
            commandHistory: [] // Aggiunto per analyzeConversationPatterns
        };
    }

    loadLongTermMemory() {
        try {
            return JSON.parse(localStorage.getItem('glitchy_long_term_memory') || '[]');
        } catch (e) {
            return [];
        }
    }

    loadEpisodicMemory() {
        try {
            return JSON.parse(localStorage.getItem('glitchy_episodic_memory') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveEpisodicMemory() {
        try {
            localStorage.setItem('glitchy_episodic_memory', JSON.stringify(this.episodicMemory));
        } catch (e) {
            console.warn('Failed to save episodic memory');
        }
    }

    addEpisodicMemory(episode) {
        const episodicEntry = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            context: {
                timeOfDay: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                currentSection: this.uiState.currentSection,
                conversationLength: this.conversationMemory.length
            },
            interaction: episode,
            emotionalState: {
                userSatisfaction: episode.satisfaction || 3,
                aiMood: this.dynamicPersonality.getCurrentMood(),
                sentiment: episode.sentiment || 'neutral'
            },
            outcome: {
                success: episode.success !== false,
                responseQuality: episode.responseQuality || 'neutral',
                userEngagement: episode.userEngagement || 'neutral'
            }
        };

        this.episodicMemory.push(episodicEntry);

        if (this.episodicMemory.length > 200) {
            this.episodicMemory = this.episodicMemory.slice(-200);
        }

        this.saveEpisodicMemory();

        this.predictiveEngine.recordOutcome(
            episodicEntry.context,
            episodicEntry.interaction.intent,
            episodicEntry.outcome.success
        );
    }

    findSimilarEpisodes(currentContext, limit = 3) {
        const currentTime = new Date().getHours();
        const currentDay = new Date().getDay();

        return this.episodicMemory
            .filter(episode => {
                const timeDiff = Math.abs(episode.context.timeOfDay - currentTime);
                const dayDiff = Math.abs(episode.context.dayOfWeek - currentDay);
                const sectionMatch = episode.context.currentSection === currentContext.currentSection;
                return timeDiff <= 2 && dayDiff <= 1 && sectionMatch;
            })
            .sort((a, b) => {
                const scoreA = (a.emotionalState.userSatisfaction * 0.4) +
                    (a.outcome.success ? 1 : 0) * 0.3 +
                    (1 / (Date.now() - a.timestamp) * 1000000) * 0.3;

                const scoreB = (b.emotionalState.userSatisfaction * 0.4) +
                    (b.outcome.success ? 1 : 0) * 0.3 +
                    (1 / (Date.now() - b.timestamp) * 1000000) * 0.3;
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    generateContextualInsights() {
        const insights = {
            bestTimes: {},
            preferredSections: {},
            successPatterns: {},
            emotionalPatterns: {}
        };

        this.episodicMemory.forEach(episode => {
            const hour = episode.context.timeOfDay;
            if (!insights.bestTimes[hour]) {
                insights.bestTimes[hour] = { total: 0, successful: 0, satisfaction: 0 };
            }
            insights.bestTimes[hour].total++;
            if (episode.outcome.success) insights.bestTimes[hour].successful++;
            insights.bestTimes[hour].satisfaction += episode.emotionalState.userSatisfaction;

            const section = episode.context.currentSection;
            if (!insights.preferredSections[section]) {
                insights.preferredSections[section] = { total: 0, satisfaction: 0 };
            }
            insights.preferredSections[section].total++;
            insights.preferredSections[section].satisfaction += episode.emotionalState.userSatisfaction;

            const intent = episode.interaction.intent;
            if (!insights.successPatterns[intent]) {
                insights.successPatterns[intent] = { total: 0, successful: 0 };
            }
            insights.successPatterns[intent].total++;
            if (episode.outcome.success) insights.successPatterns[intent].successful++;
        });

        Object.keys(insights.bestTimes).forEach(hour => {
            const data = insights.bestTimes[hour];
            data.successRate = data.successful / data.total;
            data.avgSatisfaction = data.satisfaction / data.total;
        });
        Object.keys(insights.preferredSections).forEach(section => {
            const data = insights.preferredSections[section];
            data.avgSatisfaction = data.satisfaction / data.total;
        });
        Object.keys(insights.successPatterns).forEach(intent => {
            const data = insights.successPatterns[intent];
            data.successRate = data.successful / data.total;
        });
        return insights;
    }

    loadPreferences() {
        try {
            return JSON.parse(localStorage.getItem('glitchy_preferences') || '{}');
        } catch (e) {
            return {};
        }
    }

    loadMemory() {
        try {
            return JSON.parse(localStorage.getItem('glitchy_memory') || '[]');
        } catch (e) {
            return [];
        }
    }

    saveLongTermMemory() {
        const importantMemories = this.longTermMemory.filter(memory =>
            memory.importance > 0.5 || memory.frequency > 3
        ).slice(-100);
        localStorage.setItem('glitchy_long_term_memory', JSON.stringify(importantMemories));
    }

    addToLongTermMemory(memory) {
        const existingIndex = this.longTermMemory.findIndex(m =>
            m.topic === memory.topic && m.type === memory.type
        );
        if (existingIndex >= 0) {
            const existing = this.longTermMemory[existingIndex];
            existing.frequency = (existing.frequency || 1) + 1;
            existing.lastUpdated = Date.now();
            existing.importance = Math.min((existing.importance || 0.5) + 0.1, 1.0);
        } else {
            this.longTermMemory.push({
                ...memory,
                frequency: 1,
                importance: 0.5,
                firstLearned: Date.now(),
                lastUpdated: Date.now()
            });
        }
        this.saveLongTermMemory();
    }

    getRelevantMemories(topic, limit = 5) {
        return this.longTermMemory
            .filter(memory => memory.topic === topic || !topic)
            .sort((a, b) => {
                const scoreA = (a.importance * 0.6) + (Math.min(a.frequency / 10, 1) * 0.4);
                const scoreB = (b.importance * 0.6) + (Math.min(b.frequency / 10, 1) * 0.4);
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    addContextualMemory(topic, key, value) {
        if (!this.contextualMemory.has(topic)) {
            this.contextualMemory.set(topic, new Map());
        }
        this.contextualMemory.get(topic).set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 0
        });
    }

    getContextualMemory(topic, key) {
        const topicMemory = this.contextualMemory.get(topic);
        if (topicMemory && topicMemory.has(key)) {
            const memory = topicMemory.get(key);
            memory.accessCount++;
            memory.lastAccessed = Date.now();
            return memory.value;
        }
        return null;
    }

    analyzeConversationPatterns() {
        const patterns = {
            commonIntents: {},
            timePatterns: {},
            sentimentTrends: [],
            commandSequences: [],
            favoriteTopics: {}
        };
        const recentCommands = this.analytics.commandHistory.slice(-20);
        recentCommands.forEach((cmd, index) => {
            if (cmd.intent) {
                patterns.commonIntents[cmd.intent] = (patterns.commonIntents[cmd.intent] || 0) + 1;
            }
            const hour = new Date(cmd.timestamp).getHours();
            patterns.timePatterns[hour] = (patterns.timePatterns[hour] || 0) + 1;
            if (index > 0) {
                const prevCmd = recentCommands[index - 1];
                const sequence = `${prevCmd.intent}->${cmd.intent}`;
                patterns.commandSequences.push(sequence);
            }
        });
        const recentSentiments = this.analytics.userSatisfaction.slice(-10);
        if (recentSentiments.length >= 2) {
            const trend = recentSentiments[recentSentiments.length - 1] - recentSentiments[0];
            patterns.sentimentTrends.push(trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable');
        }
        return patterns;
    }

    generatePersonalizedResponse(baseResponse, userMessage, intent = 'unknown') {
        const patterns = this.analyzeConversationPatterns();
        let enhancedResponse = baseResponse;
        const personalityMods = this.dynamicPersonality.generatePersonalityModifiers();

        const currentState = {
            intent: intent,
            sentiment: this.analyzeSentiment(userMessage),
            timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
        };

        const availableTones = ['helpful', 'sarcastic', 'excited', 'empathetic', 'neutral'];
        const optimalTone = this.reinforcementLearner.getBestActionForState(currentState) || 'neutral';
        const similarEpisodes = this.findSimilarEpisodes({ currentSection: this.uiState.currentSection });

        const favoriteTopic = Object.keys(patterns.favoriteTopics || {}).reduce((a, b) => (patterns.favoriteTopics[a] > patterns.favoriteTopics[b] ? a : b), null);

        if (favoriteTopic && Math.random() > (1 - personalityMods.creativity)) {
            const topicEnhancements = {
                'projects': ['Vedo che ti interessano i miei progetti. '],
                'interface': ['Ti piace personalizzare l\'interfaccia? '],
                'development': ['Il mondo dello sviluppo ti appassiona! ']
            };
            if (topicEnhancements[favoriteTopic]) {
                enhancedResponse = topicEnhancements[favoriteTopic][0] + enhancedResponse;
            }
        }
        if (personalityMods.empathy > 0.6 && similarEpisodes.length > 0) {
            const recentEpisode = similarEpisodes[0];
            if (recentEpisode.emotionalState.userSatisfaction > 4) {
                enhancedResponse += ' Sono felice che ti stia piacendo!';
            }
        }
        if (personalityMods.creativity > 0.7 && Math.random() > 0.8) {
            const creativeAdditions = [' 🚀', ' ✨', ' 🎯'];
            enhancedResponse += creativeAdditions[Math.floor(Math.random() * creativeAdditions.length)];
        }
        if (optimalTone !== 'neutral') {
            enhancedResponse = this.applyTone(enhancedResponse, optimalTone, personalityMods);
        }
        return enhancedResponse;
    }

    applyTone(response, tone, personalityMods) {
        let modifiedResponse = response;
        switch (tone) {
            case 'helpful':
                if (personalityMods.helpfulness > 0.6) modifiedResponse += ' Posso aiutarti con altro?';
                break;
            case 'sarcastic':
                if (personalityMods.sarcasm > 0.4) modifiedResponse = modifiedResponse.replace(/perfetto|bene|ok/gi, match => `${match}... suppongo`);
                break;
            case 'excited':
                if (personalityMods.creativity > 0.5) modifiedResponse = 'Wow! ' + modifiedResponse;
                break;
            case 'empathetic':
                if (personalityMods.empathy > 0.6) modifiedResponse += ' Capisco perfettamente.';
                break;
        }
        return modifiedResponse;
    }

    extractToneFromResponse(response) {
        if (!response) return 'neutral';
        const lowerResponse = response.toLowerCase();
        if (lowerResponse.includes('suppongo') || lowerResponse.includes('...')) return 'sarcastic';
        if (lowerResponse.includes('wow') || lowerResponse.includes('incredibile')) return 'excited';
        if (lowerResponse.includes('capisco')) return 'empathetic';
        if (lowerResponse.includes('posso aiutarti')) return 'helpful';
        return 'neutral';
    }

    saveMemory() {
        const recentMemory = this.conversationMemory.slice(-50);
        localStorage.setItem('glitchy_memory', JSON.stringify(recentMemory));
    }

    learnPreference(key, value, confidence = 1) {
        this.userPreferences[key] = { value, confidence, lastUpdated: Date.now() };
        this.savePreferences();
    }

    getPreference(key) {
        return this.userPreferences[key];
    }

    learnFromCommand(command, success = true) {
        if (!success) return;
        const { intent, payload } = command;
        if (intent === 'set-cursor' && payload) this.learnPreference('favoriteCursor', payload, 0.1);
        if (intent === 'open-project' && payload) this.learnPreference('favoriteProject', payload, 0.15);
        if (intent === 'set-theme' && payload) this.learnPreference('preferredTheme', payload, 0.1);
        if (intent) {
            this.analytics.commandsUsed[intent] = (this.analytics.commandsUsed[intent] || 0) + 1;
        }
    }

    evaluateUserSatisfaction(response, userMessage) {
        let satisfaction = 3;
        if (response.ok) satisfaction += 1; else satisfaction -= 1;
        if (response.msg && response.msg.includes('Perfetto')) satisfaction += 0.5;
        if (response.msg && response.msg.includes('Errore')) satisfaction -= 0.5;
        const sentiment = this.analyzeSentiment(userMessage);
        if (sentiment === 'positive') satisfaction += 0.3;
        if (sentiment === 'negative') satisfaction -= 0.3;
        satisfaction = Math.max(1, Math.min(5, satisfaction));
        this.analytics.userSatisfaction.push(satisfaction);
        if (this.analytics.userSatisfaction.length > 50) this.analytics.userSatisfaction.shift();
        this.dynamicPersonality.adaptToFeedback(satisfaction, sentiment, 'general');
        const lastCommand = this.conversationMemory[this.conversationMemory.length - 1];
        if (lastCommand) {
            const reward = (satisfaction - 3) * 0.5;
            const currentState = { intent: lastCommand.intent || 'unknown', sentiment: lastCommand.sentiment || 'neutral' };
            const nextState = { intent: 'unknown', sentiment: sentiment };
            const toneUsed = this.extractToneFromResponse(response.msg);
            this.reinforcementLearner.updateQValue(currentState, toneUsed, reward, nextState);
        }
        return satisfaction;
    }

    analyzeSentiment(text) {
        if (!text) return 'neutral';
        const positiveWords = ['ottimo', 'perfetto', 'bene', 'grazie', 'bravo', 'fantastico'];
        const negativeWords = ['male', 'errore', 'no', 'cattivo', 'pessimo'];
        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    addToMemory(interaction) {
        this.conversationMemory.push({ ...interaction, timestamp: Date.now() });
        this.saveMemory();
    }

    updateUIState(updates) {
        Object.assign(this.uiState, updates);
        this.uiState.lastActivity = Date.now();
    }

    getContextualSuggestions() {
        const suggestions = [];
        const { currentSection } = this.uiState;
        if (currentSection === 'hero') {
            suggestions.push({ text: "Vuoi esplorare i miei progetti?", actions: ['navigate', 'projects'] });
        }
        if (currentSection === 'projects') {
            suggestions.push({ text: "Prova 'apri progetto Biosphaera'", actions: ['open-project', 'biosphaera'] });
        }
        return suggestions.slice(0, 2);
    }

    analyzeUserBehavior() {
        const sessionDuration = (Date.now() - this.uiState.lastActivity) / 1000;
        if (sessionDuration > 300) {
            return { type: 'reengagement', message: "Ehi, sei ancora lì?" };
        }
        return null;
    }

    savePreferences() {
        localStorage.setItem('glitchy_preferences', JSON.stringify(this.userPreferences));
    }
}