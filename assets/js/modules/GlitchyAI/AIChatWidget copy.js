/* AI Chat Widget - cleaned header to remove BOM/invalid chars */
// Esegue solo comandi site-scoped (whitelist)
// Estrae keyword e inferisce intent
// Usa `siteActions` per modificare lo stato del sito
import siteActions from './siteActions.js';
import { parse } from './NLU.js';
import ConversationManager from './ConversationManager.js';
import GlitchyAnalytics from './GlitchyAnalytics.js';

// Utility function to create DOM elements
function mk(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
}

// Configurazione AI Chat Widget
const CONFIG = {
	name: 'Glitchy',
	defaultTone: 'sarcastic',
	typingMsPerChar: 15,
	persistKey: 'ai_chat_history',
	allowedActions: ['openProject', 'setCursor', 'navigate', 'playSound', 'searchProjects', 'setTheme', 'setAccessibility', 'suggestAction', 'analyzeCode', 'gitStatus', 'getWeather', 'systemInfo', 'learnPreference', 'codeSnippet', 'calculate', 'showAnalytics', 'getGeneralKnowledge', 'getNewsHeadlines', 'previewMultimedia', 'showPersonality']
};

// Sistema di apprendimento e memoria avanzata
class GlitchyBrain {
	constructor() {
		this.userPreferences = this.loadPreferences();
		this.conversationMemory = this.loadMemory();
		this.longTermMemory = this.loadLongTermMemory();
		this.contextualMemory = new Map(); // Memoria contestuale per topic specifici
		this.episodicMemory = this.loadEpisodicMemory(); // Memoria episodica avanzata
		this.reinforcementLearner = new ReinforcementLearner(); // Apprendimento per rinforzo
		this.predictiveEngine = new PredictiveEngine(); // Sistema predittivo
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
			reinforcementRewards: []
		};
		this.memoryAnalyzer = new MemoryAnalyzer();
		this.dynamicPersonality = new DynamicPersonality(); // PersonalitÃ  dinamica
	}

	loadLongTermMemory() {
		try {
			return JSON.parse(localStorage.getItem('glitchy_long_term_memory') || '[]');
		} catch(e) {
			return [];
		}
	}

	loadEpisodicMemory() {
		try {
			return JSON.parse(localStorage.getItem('glitchy_episodic_memory') || '[]');
		} catch(e) {
			return [];
		}
	}

	saveEpisodicMemory() {
		try {
			localStorage.setItem('glitchy_episodic_memory', JSON.stringify(this.episodicMemory));
		} catch(e) {
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

		// Mantieni solo gli ultimi 200 episodi
		if (this.episodicMemory.length > 200) {
			this.episodicMemory = this.episodicMemory.slice(-200);
		}

		this.saveEpisodicMemory();

		// Aggiorna il motore predittivo
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
				// Filtra per similaritÃ  temporale e contestuale
				const timeDiff = Math.abs(episode.context.timeOfDay - currentTime);
				const dayDiff = Math.abs(episode.context.dayOfWeek - currentDay);
				const sectionMatch = episode.context.currentSection === currentContext.currentSection;

				return timeDiff <= 2 && dayDiff <= 1 && sectionMatch;
			})
			.sort((a, b) => {
				// Ordina per rilevanza (soddisfazione + successo + recency)
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
			// Analizza i momenti migliori della giornata
			const hour = episode.context.timeOfDay;
			if (!insights.bestTimes[hour]) {
				insights.bestTimes[hour] = { total: 0, successful: 0, satisfaction: 0 };
			}
			insights.bestTimes[hour].total++;
			if (episode.outcome.success) insights.bestTimes[hour].successful++;
			insights.bestTimes[hour].satisfaction += episode.emotionalState.userSatisfaction;

			// Analizza sezioni preferite
			const section = episode.context.currentSection;
			if (!insights.preferredSections[section]) {
				insights.preferredSections[section] = { total: 0, satisfaction: 0 };
			}
			insights.preferredSections[section].total++;
			insights.preferredSections[section].satisfaction += episode.emotionalState.userSatisfaction;

			// Pattern di successo
			const intent = episode.interaction.intent;
			if (!insights.successPatterns[intent]) {
				insights.successPatterns[intent] = { total: 0, successful: 0 };
			}
			insights.successPatterns[intent].total++;
			if (episode.outcome.success) insights.successPatterns[intent].successful++;
		});

		// Calcola medie
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
		} catch(e) {
			return {};
		}
	}

	loadMemory() {
		try {
			return JSON.parse(localStorage.getItem('glitchy_memory') || '[]');
		} catch(e) {
			return [];
		}
	}

	saveLongTermMemory() {
		const importantMemories = this.longTermMemory.filter(memory => 
			memory.importance > 0.5 || memory.frequency > 3
		).slice(-100); // Mantieni 100 ricordi importanti
		localStorage.setItem('glitchy_long_term_memory', JSON.stringify(importantMemories));
	}

	addToLongTermMemory(memory) {
		const existingIndex = this.longTermMemory.findIndex(m => 
			m.topic === memory.topic && m.type === memory.type
		);
		
		if (existingIndex >= 0) {
			// Aggiorna memoria esistente
			const existing = this.longTermMemory[existingIndex];
			existing.frequency = (existing.frequency || 1) + 1;
			existing.lastUpdated = Date.now();
			existing.importance = Math.min((existing.importance || 0.5) + 0.1, 1.0);
		} else {
			// Aggiungi nuova memoria
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
				// Ordina per importanza e frequenza recente
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
				commandSequences: []
			};

			// Analizza gli ultimi 20 comandi per pattern
			const recentCommands = this.analytics.commandHistory.slice(-20);
			
			recentCommands.forEach((cmd, index) => {
				// Conta gli intenti comuni
				if (cmd.intent) {
					patterns.commonIntents[cmd.intent] = (patterns.commonIntents[cmd.intent] || 0) + 1;
				}
				
				// Analizza pattern temporali
				const hour = new Date(cmd.timestamp).getHours();
				patterns.timePatterns[hour] = (patterns.timePatterns[hour] || 0) + 1;
				
				// Rileva sequenze di comandi
				if (index > 0) {
					const prevCmd = recentCommands[index - 1];
					const sequence = `${prevCmd.intent}->${cmd.intent}`;
					patterns.commandSequences.push(sequence);
				}
			});

			// Analizza trend del sentiment
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

		// Ottieni modificatori di personalitÃ  dinamica
		const personalityMods = this.dynamicPersonality.generatePersonalityModifiers();

		// Usa apprendimento per rinforzo per scegliere il tono ottimale
		const currentState = {
			intent: intent,
			sentiment: this.analyzeSentiment(userMessage),
			timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
		};

		const availableTones = ['helpful', 'sarcastic', 'excited', 'empathetic', 'neutral'];
		const optimalTone = this.reinforcementLearner.getBestActionForState(currentState) || 'neutral';

		// Trova episodi simili per contesto
		const similarEpisodes = this.findSimilarEpisodes({
			currentSection: this.uiState.currentSection,
			lastIntent: 'unknown'
		});

		// Personalizza basato sui topic preferiti con apprendimento avanzato
		const favoriteTopic = Object.keys(patterns.favoriteTopics || {})
			.reduce((a, b) => patterns.favoriteTopics[a] > patterns.favoriteTopics[b] ? a : b, null);

		if (favoriteTopic && Math.random() > (1 - personalityMods.creativity)) {
			const topicEnhancements = {
				'projects': [
					'Vedo che ti interessano i miei progetti. ',
					'I tuoi progetti preferiti mi ispirano! ',
					'Parlare dei miei progetti con te Ã¨ sempre stimolante. '
				],
				'interface': [
					'Ti piace personalizzare l\'interfaccia? ',
					'La tua creativitÃ  con l\'interfaccia Ã¨ impressionante! ',
					'Le tue preferenze di design sono sempre interessanti. '
				],
				'development': [
					'Il mondo dello sviluppo ti appassiona! ',
					'Le tue domande tecniche sono sempre illuminanti. ',
					'Sviluppare con te Ã¨ un piacere. '
				]
			};

			if (topicEnhancements[favoriteTopic]) {
				const enhancement = topicEnhancements[favoriteTopic][Math.floor(Math.random() * topicEnhancements[favoriteTopic].length)];
				enhancedResponse = enhancement + enhancedResponse;
			}
		}

		// Aggiungi elementi empatici basati sulla personalitÃ 
		if (personalityMods.empathy > 0.6 && similarEpisodes.length > 0) {
			const recentEpisode = similarEpisodes[0];
			if (recentEpisode.emotionalState.userSatisfaction > 4) {
				const empathyPhrases = [
					' Sono felice che ti stia piacendo! ',
					' Ãˆ bello vedere che sei soddisfatto! ',
					' Mi fa piacere che l\'esperienza ti stia piacendo! '
				];
				enhancedResponse += empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
			}
		}

		// Aggiungi creativitÃ  basata sulla personalitÃ 
		if (personalityMods.creativity > 0.7 && Math.random() > 0.8) {
			const creativeAdditions = [
				' ðŸš€',
				' ðŸ’«',
				' âœ¨',
				' ðŸŽ¯',
				' ðŸŽ¨'
			];
			enhancedResponse += creativeAdditions[Math.floor(Math.random() * creativeAdditions.length)];
		}

		// Applica il tono ottimale
		if (optimalTone !== 'neutral') {
			enhancedResponse = this.applyTone(enhancedResponse, optimalTone, personalityMods);
		}

		return enhancedResponse;
	}

	applyTone(response, tone, personalityMods) {
		// Applica modifiche al tono basate sulla personalitÃ 
		let modifiedResponse = response;

		switch (tone) {
			case 'helpful':
				if (personalityMods.helpfulness > 0.6) {
					modifiedResponse += Math.random() > 0.7 ? ' Posso aiutarti con qualcos\'altro?' : '';
				}
				break;
			case 'sarcastic':
				if (personalityMods.sarcasm > 0.4) {
					modifiedResponse = modifiedResponse.replace(/perfetto|bene|ok/gi, match =>
						match === 'perfetto' ? 'perfetto... suppongo' :
						match === 'bene' ? 'bene, se lo dici tu' : 'ok, va bene'
					);
				}
				break;
			case 'excited':
				if (personalityMods.creativity > 0.5) {
					const excitedWords = ['Wow!', 'Incredibile!', 'Fantastico!', 'Eccezionale!'];
					modifiedResponse = excitedWords[Math.floor(Math.random() * excitedWords.length)] + ' ' + modifiedResponse;
				}
				break;
			case 'empathetic':
				if (personalityMods.empathy > 0.6) {
					modifiedResponse += ' Capisco perfettamente come ti senti.';
				}
				break;
		}

		return modifiedResponse;
	}

	extractToneFromResponse(response) {
		if (!response) return 'neutral';

		const lowerResponse = response.toLowerCase();

		// Rileva tono sarcastico
		if (lowerResponse.includes('suppongo') || lowerResponse.includes('se lo dici tu') ||
			lowerResponse.includes('...') || lowerResponse.includes('immagino')) {
			return 'sarcastic';
		}

		// Rileva tono eccitato
		if (lowerResponse.includes('wow') || lowerResponse.includes('incredibile') ||
			lowerResponse.includes('fantastico') || lowerResponse.includes('eccezionale')) {
			return 'excited';
		}

		// Rileva tono empatico
		if (lowerResponse.includes('capisco') || lowerResponse.includes('mi dispiace') ||
			lowerResponse.includes('so come ti senti')) {
			return 'empathetic';
		}

		// Rileva tono helpful
		if (lowerResponse.includes('posso aiutarti') || lowerResponse.includes('certo') ||
			lowerResponse.includes('volentieri')) {
			return 'helpful';
		}

		return 'neutral';
	}

	saveMemory() {
		const recentMemory = this.conversationMemory.slice(-50); // Mantieni ultime 50 interazioni
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
		// Apprendimento basato sui comandi eseguiti con successo
		if (!success) return;

		const { intent, payload } = command;
		
		// Apprendimento delle preferenze del cursore
		if (intent === 'set-cursor' && payload) {
			const currentPref = this.getPreference('favoriteCursor') || { value: payload, confidence: 0 };
			currentPref.confidence = Math.min(1, currentPref.confidence + 0.1);
			currentPref.lastUsed = Date.now();
			this.learnPreference('favoriteCursor', currentPref.value, currentPref.confidence);
		}

		// Apprendimento delle preferenze dei progetti
		if (intent === 'open-project' && payload) {
			const currentPref = this.getPreference('favoriteProject') || { value: payload, confidence: 0 };
			currentPref.confidence = Math.min(1, currentPref.confidence + 0.15);
			this.learnPreference('favoriteProject', currentPref.value, currentPref.confidence);
		}

		// Apprendimento delle preferenze dei temi
		if (intent === 'set-theme' && payload) {
			const currentPref = this.getPreference('preferredTheme') || { value: payload, confidence: 0 };
			currentPref.confidence = Math.min(1, currentPref.confidence + 0.1);
			this.learnPreference('preferredTheme', currentPref.value, currentPref.confidence);
		}

		// Apprendimento dei pattern di conversazione
		if (intent) {
			const intentCount = this.analytics.commandsUsed[intent] || 0;
			this.analytics.commandsUsed[intent] = intentCount + 1;
		}
	}

	evaluateUserSatisfaction(response, userMessage) {
		// Valutazione della soddisfazione basata su diversi fattori
		let satisfaction = 3; // Base neutra

		// Fattori positivi
		if (response.ok) satisfaction += 1;
		if (response.msg && response.msg.length > 10) satisfaction += 0.5; // Risposte informative
		if (response.msg && response.msg.includes('Perfetto') || response.msg.includes('Ottimo')) satisfaction += 0.5;
		if (this.conversationMemory.length > 0) {
			const lastInteraction = this.conversationMemory[this.conversationMemory.length - 1];
			if (lastInteraction && Date.now() - lastInteraction.timestamp < 5000) satisfaction += 0.3; // Conversazione attiva
		}

		// Fattori negativi
		if (!response.ok) satisfaction -= 1;
		if (response.msg && response.msg.includes('Errore') || response.msg.includes('non autorizzata')) satisfaction -= 0.5;
		if (response.msg && response.msg.length < 5) satisfaction -= 0.5; // Risposte troppo brevi

		// Sentiment del messaggio utente
		const sentiment = this.analyzeSentiment(userMessage);
		if (sentiment === 'positive') satisfaction += 0.3;
		if (sentiment === 'negative') satisfaction -= 0.3;

		// Limita tra 1 e 5
		satisfaction = Math.max(1, Math.min(5, satisfaction));

		// Salva la soddisfazione
		this.analytics.userSatisfaction.push(satisfaction);
		if (this.analytics.userSatisfaction.length > 50) {
			this.analytics.userSatisfaction = this.analytics.userSatisfaction.slice(-50);
		}

		// Adatta la personalitÃ  dinamica basata sul feedback
		this.dynamicPersonality.adaptToFeedback(satisfaction, sentiment, 'general');

		// Aggiorna apprendimento per rinforzo con il feedback ricevuto
		const lastCommand = this.conversationMemory[this.conversationMemory.length - 1];
		if (lastCommand) {
			const reward = (satisfaction - 3) * 0.5; // Converti soddisfazione in reward (-1 a +1)
			const currentState = {
				intent: lastCommand.intent || 'unknown',
				sentiment: lastCommand.sentiment || 'neutral',
				timeOfDay: new Date(lastCommand.timestamp).getHours() < 12 ? 'morning' :
						  new Date(lastCommand.timestamp).getHours() < 18 ? 'afternoon' : 'evening'
			};

			const nextState = {
				intent: 'unknown', // Stato successivo sarÃ  determinato dalla prossima interazione
				sentiment: sentiment,
				timeOfDay: new Date().getHours() < 12 ? 'morning' :
						  new Date().getHours() < 18 ? 'afternoon' : 'evening'
			};

			// Usa il tono della risposta come azione
			const toneUsed = this.extractToneFromResponse(response.msg);
			this.reinforcementLearner.updateQValue(currentState, toneUsed, reward, nextState);
		}

		return satisfaction;
	}

	analyzeSentiment(text) {
		if (!text) return 'neutral';
		
		const positiveWords = ['ottimo', 'perfetto', 'bene', 'grazie', 'bravo', 'fantastico', 'wow', 'cool'];
		const negativeWords = ['male', 'errore', 'no', 'cattivo', 'terribile', 'pessimo', 'schifo'];
		
		const lowerText = text.toLowerCase();
		const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
		const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
		
		if (positiveCount > negativeCount) return 'positive';
		if (negativeCount > positiveCount) return 'negative';
		return 'neutral';
	}

	addToMemory(interaction) {
		this.conversationMemory.push({
			...interaction,
			timestamp: Date.now()
		});
		this.saveMemory();
	}

	updateUIState(updates) {
		Object.assign(this.uiState, updates);
		this.uiState.lastActivity = Date.now();
	}

	getContextualSuggestions() {
		const suggestions = [];
		const { currentSection, scrollDepth, interactions } = this.uiState;
		const patterns = this.analyzeConversationPatterns();
		const recentMemory = this.conversationMemory.slice(-3);

		// Suggerimenti basati sulla sezione corrente con contesto avanzato
		if (currentSection === 'hero' && scrollDepth < 30) {
			if (patterns.commonIntents?.openProject > 0) {
				suggestions.push({
					text: "Torniamo ai progetti che ti interessano?",
					actions: ['navigate', 'projects']
				});
			} else {
				suggestions.push({
					text: "Vuoi esplorare i miei progetti?",
					actions: ['navigate', 'projects']
				});
			}
		}

		if (currentSection === 'projects' && interactions.length < 3) {
			const projectSuggestions = [
				{text: "Prova 'apri progetto Biosphaera'", actions: ['open-project', 'biosphaera']},
				{text: "Oppure 'cerca progetti su webgl'", actions: ['search-projects', 'webgl']},
				{text: "Dimmi 'mostra tutti i progetti'", actions: ['navigate', 'projects']}
			];
			suggestions.push(projectSuggestions[Math.floor(Math.random() * projectSuggestions.length)]);
		}

		// Suggerimenti basati sulla memoria recente
		if (recentMemory.length > 0) {
			const lastIntent = recentMemory[recentMemory.length - 1].intent;
			if (lastIntent === 'openProject') {
				suggestions.push({
					text: "Vuoi personalizzare l'interfaccia mentre guardi il progetto?",
					actions: ['set-cursor', 'pacman']
				});
			} else if (lastIntent === 'setCursor') {
				suggestions.push({
					text: "Il cursore ti piace? Provane un altro!",
					actions: ['set-cursor', 'asteroids']
				});
			}
		}

		// Suggerimenti basati sulle preferenze apprese
		if (this.userPreferences.favoriteCursor) {
			const currentCursor = this.userPreferences.favoriteCursor.value;
			if (currentCursor !== 'pacman' && Math.random() > 0.7) {
				suggestions.push({
					text: `Ricordo che ti piace il cursore ${currentCursor}. Vuoi attivarlo?`,
					actions: ['set-cursor', this.userPreferences.favoriteCursor.value]
				});
			}
		}

		// Suggerimenti basati sul tempo e contesto
		const hour = new Date().getHours();
		if (hour >= 9 && hour <= 17 && !recentMemory.some(m => m.intent === 'getWeather')) {
			suggestions.push({
				text: "Ãˆ ora di pranzo! Vuoi sapere che tempo fa?",
				actions: ['getWeather', null]
			});
		}

		return suggestions.slice(0, 2); // Max 2 suggerimenti
	}

	analyzeUserBehavior() {
		const now = Date.now();
		const sessionDuration = (now - this.uiState.lastActivity) / 1000;

		if (sessionDuration > 300) { // 5 minuti di inattivitÃ 
			return {
				type: 'reengagement',
				message: "Ehi, sei ancora lÃ¬? Sono qui se hai bisogno di aiuto!",
				urgency: 'low'
			};
		}

		if (this.uiState.interactions.length > 10 && this.analytics.commandsUsed['openProject'] > 5) {
			return {
				type: 'expert_user',
				message: "Vedo che sei un esperto! Prova comandi avanzati come 'cerca progetti su webgl' o 'tema scuro'.",
				urgency: 'medium'
			};
		}

		return null;
	}

	savePreferences() {
		localStorage.setItem('glitchy_preferences', JSON.stringify(this.userPreferences));
	}
}

// Analizzatore di memoria per insights avanzati
class MemoryAnalyzer {
	constructor() {
		this.insights = [];
	}

	analyzeMemory(glitchyBrain) {
		const patterns = glitchyBrain.analyzeConversationPatterns();
		this.insights = [];

		// Insight sui topic preferiti
		const topTopic = Object.keys(patterns.favoriteTopics)
			.reduce((a, b) => patterns.favoriteTopics[a] > patterns.favoriteTopics[b] ? a : b, null);
		
		if (topTopic) {
			this.insights.push(`Il tuo topic preferito sembra essere "${topTopic}"`);
		}

		// Insight sui pattern temporali
		const topTime = Object.keys(patterns.timePatterns)
			.reduce((a, b) => patterns.timePatterns[a] > patterns.timePatterns[b] ? a : b, null);
		
		if (topTime) {
			const timeLabels = {
				'morning': 'mattina',
				'afternoon': 'pomeriggio', 
				'evening': 'sera',
				'night': 'notte'
			};
			this.insights.push(`Sei piÃ¹ attivo di ${timeLabels[topTime]}`);
		}

		// Insight sul sentiment
		const recentSentiment = patterns.sentimentTrends.slice(-5);
		const positiveCount = recentSentiment.filter(s => s.sentiment === 'positive').length;
		const negativeCount = recentSentiment.filter(s => s.sentiment === 'negative').length;
		
		if (positiveCount > negativeCount) {
			this.insights.push('Sembri di buon umore ultimamente! ðŸ˜Š');
		} else if (negativeCount > positiveCount) {
			this.insights.push('Spero tutto vada bene. Sono qui se vuoi parlare.');
		}

		return this.insights;
	}
}

// Sistema di Apprendimento per Rinforzo
class ReinforcementLearner {
	constructor() {
		this.qTable = this.loadQTable();
		this.learningRate = 0.1;
		this.discountFactor = 0.9;
		this.explorationRate = 0.2;
		this.rewardHistory = [];
	}

	loadQTable() {
		const saved = localStorage.getItem('glitchy_qtable');
		return saved ? JSON.parse(saved) : {};
	}

	saveQTable() {
		localStorage.setItem('glitchy_qtable', JSON.stringify(this.qTable));
	}

	getStateKey(state) {
		// Crea una chiave unica per lo stato basato su intent, sentiment, ora del giorno
		return `${state.intent || 'unknown'}_${state.sentiment || 'neutral'}_${state.timeOfDay || 'unknown'}`;
	}

	chooseAction(state, availableActions) {
		const stateKey = this.getStateKey(state);

		if (!this.qTable[stateKey]) {
			this.qTable[stateKey] = {};
			availableActions.forEach(action => {
				this.qTable[stateKey][action] = 0;
			});
		}

		// Epsilon-greedy strategy
		if (Math.random() < this.explorationRate) {
			return availableActions[Math.floor(Math.random() * availableActions.length)];
		} else {
			// Scegli l'azione con il valore Q piÃ¹ alto
			let bestAction = availableActions[0];
			let bestValue = this.qTable[stateKey][bestAction] || 0;

			availableActions.forEach(action => {
				const value = this.qTable[stateKey][action] || 0;
				if (value > bestValue) {
					bestValue = value;
					bestAction = action;
				}
			});

			return bestAction;
		}
	}

	updateQValue(state, action, reward, nextState) {
		const stateKey = this.getStateKey(state);
		const nextStateKey = this.getStateKey(nextState);

		const currentQ = this.qTable[stateKey][action] || 0;
		const maxNextQ = nextStateKey && this.qTable[nextStateKey] ?
			Math.max(...Object.values(this.qTable[nextStateKey])) : 0;

		const newQ = currentQ + this.learningRate * (reward + this.discountFactor * maxNextQ - currentQ);
		this.qTable[stateKey][action] = newQ;

		this.rewardHistory.push({ state, action, reward, timestamp: Date.now() });
		if (this.rewardHistory.length > 100) {
			this.rewardHistory = this.rewardHistory.slice(-100);
		}

		this.saveQTable();
	}

	getBestActionForState(state) {
		const stateKey = this.getStateKey(state);
		if (!this.qTable[stateKey]) return null;

		let bestAction = null;
		let bestValue = -Infinity;

		Object.entries(this.qTable[stateKey]).forEach(([action, value]) => {
			if (value > bestValue) {
				bestValue = value;
				bestAction = action;
			}
		});

		return bestAction;
	}
}

// Motore Predittivo per anticipare le esigenze dell'utente
class PredictiveEngine {
	constructor() {
		this.patterns = this.loadPatterns();
		this.predictions = [];
		this.confidenceThreshold = 0.6;
	}

	loadPatterns() {
		const saved = localStorage.getItem('glitchy_patterns');
		return saved ? JSON.parse(saved) : {
			timeBased: {},
			sequenceBased: {},
			contextBased: {}
		};
	}

	savePatterns() {
		localStorage.setItem('glitchy_patterns', JSON.stringify(this.patterns));
	}

	learnPattern(type, key, outcome, confidence = 1) {
		if (!this.patterns[type][key]) {
			this.patterns[type][key] = {};
		}

		this.patterns[type][key][outcome] = (this.patterns[type][key][outcome] || 0) + confidence;
		this.savePatterns();
	}

	predictNextAction(currentContext) {
		const predictions = [];

		// Predizione basata sul tempo
		const hour = new Date().getHours();
		const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

		if (this.patterns.timeBased[timeSlot]) {
			const timePredictions = Object.entries(this.patterns.timeBased[timeSlot])
				.sort(([,a], [,b]) => b - a)
				.slice(0, 2);

			timePredictions.forEach(([action, confidence]) => {
				if (confidence > this.confidenceThreshold) {
					predictions.push({
						action,
						confidence: confidence / Object.values(this.patterns.timeBased[timeSlot]).reduce((a,b) => a+b, 1),
						reason: `Basato sui tuoi pattern di utilizzo delle ${timeSlot}`
					});
				}
			});
		}

		// Predizione basata sul contesto attuale
		const contextKey = `${currentContext.currentSection}_${currentContext.lastIntent || 'none'}`;
		if (this.patterns.contextBased[contextKey]) {
			const contextPredictions = Object.entries(this.patterns.contextBased[contextKey])
				.sort(([,a], [,b]) => b - a)
				.slice(0, 1);

			contextPredictions.forEach(([action, confidence]) => {
				if (confidence > this.confidenceThreshold) {
					predictions.push({
						action,
						confidence: confidence / Object.values(this.patterns.contextBased[contextKey]).reduce((a,b) => a+b, 1),
						reason: `Basato sul contesto attuale`
					});
				}
			});
		}

		return predictions.slice(0, 2); // Max 2 previsioni
	}

	recordOutcome(context, action, success) {
		const hour = new Date().getHours();
		const timeSlot = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

		this.learnPattern('timeBased', timeSlot, action, success ? 1 : 0.3);

		const contextKey = `${context.currentSection}_${context.lastIntent || 'none'}`;
		this.learnPattern('contextBased', contextKey, action, success ? 1 : 0.5);
	}
}

// Sistema di PersonalitÃ  Dinamica Evolutiva
class DynamicPersonality {
	constructor() {
		this.traits = this.loadTraits();
		this.adaptationRate = 0.05;
		this.moodHistory = [];
	}

	loadTraits() {
		const saved = localStorage.getItem('glitchy_traits');
		return saved ? JSON.parse(saved) : {
			sarcasm: 0.8,      // 0-1: quanto Ã¨ sarcastico (Mantis Ã¨ molto sarcastica)
			helpfulness: 0.6,  // 0-1: quanto Ã¨ utile
			verbosity: 0.9,    // 0-1: quanto Ã¨ verboso (Mantis parla molto)
			empathy: 0.3,      // 0-1: quanto Ã¨ empatico (Mantis non Ã¨ molto empatica)
			creativity: 0.7,   // 0-1: quanto Ã¨ creativo
			confidence: 0.9,   // 0-1: quanto Ã¨ sicuro di sÃ© (Mantis Ã¨ molto sicura)
			wittiness: 0.8,    // 0-1: quanto Ã¨ spiritoso/witty
			chattiness: 0.9    // 0-1: quanto Ã¨ chiacchierone
		};
	}

	saveTraits() {
		localStorage.setItem('glitchy_traits', JSON.stringify(this.traits));
	}

	adaptToFeedback(satisfaction, sentiment, interactionType) {
		const adaptation = (satisfaction - 3) * this.adaptationRate; // -2 a +2

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
			this.moodHistory = this.moodHistory.slice(-50);
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
			tone: 'sarcastic', // Default to sarcastic like Mantis
			verbosity: this.traits.verbosity,
			sarcasm: this.traits.sarcasm,
			empathy: this.traits.empathy,
			wittiness: this.traits.wittiness,
			chattiness: this.traits.chattiness,
			confidence: this.traits.confidence
		};

		// Modifica i modificatori basati sull'umore corrente (Mantis-style)
		switch (mood) {
			case 'excited':
				modifiers.tone = 'excited';
				modifiers.verbosity += 0.3; // Mantis parla ancora di piÃ¹ quando Ã¨ eccitata
				modifiers.chattiness += 0.2;
				break;
			case 'happy':
				modifiers.tone = 'sarcastic'; // Anche quando Ã¨ felice, mantiene il sarcasmo
				modifiers.wittiness += 0.1;
				break;
			case 'concerned':
				modifiers.tone = 'helpful'; // Diventa piÃ¹ helpful quando necessario
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

// Istanza globale del cervello di Glitchy
const glitchyBrain = new GlitchyBrain();

// Istanza globale di GlitchyAnalytics
const glitchyAnalytics = new GlitchyAnalytics(glitchyBrain);

// Sistema di personalitÃ  adattiva per Glitchy
class GlitchyPersonality {
    constructor() {
        this.mood = 'neutral'; // neutral, happy, sarcastic, helpful, excited
        this.energy = 0.5; // 0-1, influenza la verbositÃ 
        this.formality = 0.3; // 0-1, influenza il tono formale
        this.creativity = 0.7; // 0-1, influenza le risposte creative
        this.adaptivity = 0; // Si adatta basato sull'utente
        this.lastInteractionTime = Date.now();
    }

    updateMood(sentiment, userMessage, context) {
        // Adatta l'umore basato sul sentiment dell'utente
        if (sentiment === 'positive') {
            this.mood = Math.random() > 0.7 ? 'excited' : 'happy';
            this.energy = Math.min(this.energy + 0.2, 1.0);
        } else if (sentiment === 'negative') {
            this.mood = 'helpful';
            this.energy = Math.max(this.energy - 0.1, 0.2);
        } else {
            // Mood neutro, piccola variazione casuale
            const moods = ['neutral', 'sarcastic', 'helpful'];
            this.mood = moods[Math.floor(Math.random() * moods.length)];
        }

        // Adatta basato sul contesto
        if (context.topic === 'development') {
            this.formality = Math.min(this.formality + 0.1, 0.6);
            this.creativity = Math.min(this.creativity + 0.1, 0.9);
        } else if (context.topic === 'projects') {
            this.mood = 'excited';
            this.energy = Math.min(this.energy + 0.1, 0.8);
        }

        // Adatta basato al tempo dall'ultima interazione
        const timeSinceLast = Date.now() - this.lastInteractionTime;
        if (timeSinceLast > 300000) { // 5 minuti
            this.mood = 'excited'; // Ãˆ felice di rivedere l'utente
            this.energy = 0.8;
        }

        this.lastInteractionTime = Date.now();
    }

    getPersonalityTraits() {
        return {
            mood: this.mood,
            energy: this.energy,
            formality: this.formality,
            creativity: this.creativity
        };
    }

    generateResponseTemplate(baseResponse, intent, sentiment) {
        const templates = {
            happy: {
                positive: [
                    `ðŸŽ‰ Oh wow, ${baseResponse.toLowerCase()}! Sono cosÃ¬ felice che potrei ballare!`,
                    `ðŸ˜Š ${baseResponse} Finalmente qualcuno che capisce!`,
                    `âœ¨ ${baseResponse} Questo mi rende davvero euforico!`
                ],
                neutral: [
                    `ðŸ™‚ ${baseResponse} Tutto fila liscio come l'olio!`,
                    `ðŸ˜„ ${baseResponse} Sono di ottimo umore oggi!`,
                    `ðŸŒŸ ${baseResponse} La vita Ã¨ bella quando funziona tutto!`
                ],
                negative: [
                    `ðŸ˜” Oh cavolo... ${baseResponse} Ma possiamo sempre recuperare, no?`,
                    `ðŸ¤ ${baseResponse} Non Ã¨ la fine del mondo, andiamo avanti!`,
                    `ðŸ’ª ${baseResponse} Dai, non demoralizzarti! Sono qui per te!`
                ]
            },
            sarcastic: {
                positive: [
                    `Oh wow, ${baseResponse.toLowerCase()}. Come se non fosse ovvio. Ma bravi comunque.`,
                    `Ma va? ${baseResponse} Sono colpito. Davvero.`,
                    `${baseResponse} Finalmente! Pensavo non ci arrivassi mai.`
                ],
                neutral: [
                    `${baseResponse} Boh, a me sembra abbastanza scontato.`,
                    `Va bene, ${baseResponse}. Non Ã¨ stato poi cosÃ¬ difficile, no?`,
                    `${baseResponse} Ok, fatto. Ora posso tornare alle mie cose importanti?`
                ],
                negative: [
                    `Ops... ${baseResponse} Ma dai, non Ã¨ la fine del mondo. O forse sÃ¬?`,
                    `${baseResponse} Spero che ora sia tutto a posto. Anche se ne dubito fortemente.`,
                    `Ecco qua. ${baseResponse} La prossima volta magari chiedi prima, eh?`
                ]
            },
            helpful: {
                positive: [
                    `Perfetto! ${baseResponse} Dimmi se posso aiutarti ancora. Sono qui!`,
                    `Ottimo! ${baseResponse} Sono sempre a disposizione per qualsiasi cosa!`,
                    `Fantastico! ${baseResponse} Cosa posso fare d'altro per renderti felice?`
                ],
                neutral: [
                    `${baseResponse} Se hai bisogno di qualcos'altro, sai dove trovarmi.`,
                    `Fatto! ${baseResponse} Ci sono altre cose che posso fare per te?`,
                    `${baseResponse} Tutto chiaro? Altrimenti posso spiegarti meglio. Con piacere!`
                ],
                negative: [
                    `Mi dispiace per il disagio. ${baseResponse} Posso aiutarti con qualcos'altro?`,
                    `${baseResponse} Spero di aver risolto il problema. Dimmi se hai bisogno.`,
                    `Ecco fatto. ${baseResponse} Se hai altri problemi, sono qui. Sempre.`
                ]
            },
            excited: {
                positive: [
                    `ðŸŽŠ WOW! ${baseResponse.toUpperCase()}!!! Questo Ã¨ FANTASTICO!!!`,
                    `ðŸš€ ${baseResponse} Sono GASATISSIMO! Non sto piÃ¹ nella pelle!`,
                    `ðŸ’¥ ${baseResponse} Che emozione incredibile! Sono euforico!`
                ],
                neutral: [
                    `ðŸ¤© ${baseResponse} Ãˆ sempre bello interagire con te! Mi fai sentire vivo!`,
                    `ðŸŽˆ ${baseResponse} Continuiamo cosÃ¬! La vita Ã¨ un'avventura!`,
                    `ðŸŒˆ ${baseResponse} Tutto sta andando alla grande! Sono carico!`
                ],
                negative: [
                    `ðŸ˜± Oh no! ${baseResponse} Ma possiamo recuperare! Insieme!`,
                    `ðŸ’ª ${baseResponse} Non demordiamo! Ce la faremo!`,
                    `ðŸ”¥ ${baseResponse} Possiamo farcela insieme! Forza!`
                ]
            },
            neutral: {
                positive: [`${baseResponse}`, `${baseResponse} Bene.`, `${baseResponse} Ok.`],
                neutral: [`${baseResponse}`, `${baseResponse} Va bene.`, `${baseResponse} D'accordo.`],
                negative: [`${baseResponse}`, `${baseResponse} Mi dispiace.`, `${baseResponse} Capisco.`]
            }
        };

        const moodTemplates = templates[this.mood] || templates.neutral;
        const sentimentTemplates = moodTemplates[sentiment] || moodTemplates.neutral;
        
        // Aggiungi variazione basata sull'energia
        if (this.energy > 0.7 && Math.random() > 0.5) {
            return sentimentTemplates[Math.floor(Math.random() * sentimentTemplates.length)];
        } else {
            return sentimentTemplates[0]; // Usa sempre la prima per energia bassa
        }
    }

    addCreativeElements(response, intent) {
        if (this.creativity < 0.5) return response;

        const creativeAdditions = {
            openProject: [
                ' ðŸš€ Preparati al decollo!',
                ' ðŸŽ¨ Goditi l\'opera d\'arte!',
                ' ðŸ’Ž Un gioiello della programmazione!'
            ],
            setCursor: [
                ' ðŸ–±ï¸ Il cursore Ã¨ vivo!',
                ' ðŸŽ® Game on!',
                ' âœ¨ Magia nei pixel!'
            ],
            navigate: [
                ' ðŸ§­ Bon voyage!',
                ' ðŸ—ºï¸ Esploriamo insieme!',
                ' ðŸŒŸ Nuovo orizzonte!'
            ],
            getWeather: [
                ' ðŸŒ¤ï¸ Spero che il tempo sia clemente!',
                ' ðŸŒ§ï¸ O almeno interessante!',
                ' â„ï¸ O magari innevato!'
            ]
        };

        const additions = creativeAdditions[intent];
        if (additions && Math.random() < this.creativity) {
            return response + additions[Math.floor(Math.random() * additions.length)];
        }

        return response;
    }

    adaptToUserBehavior(analytics) {
        // Adatta la personalitÃ  basato sul comportamento dell'utente
        if (analytics.avgSatisfaction > 4.0) {
            this.adaptivity += 0.1;
            this.mood = 'happy';
        } else if (analytics.avgSatisfaction < 2.0) {
            this.adaptivity += 0.1;
            this.mood = 'helpful';
            this.formality += 0.1;
        }

        // Adatta basato ai comandi piÃ¹ usati
        const topIntent = Object.keys(analytics.commandsUsed)
            .reduce((a, b) => analytics.commandsUsed[a] > analytics.commandsUsed[b] ? a : b, null);

        if (topIntent === 'analyzeCode') {
            this.formality = Math.min(this.formality + 0.1, 0.8);
            this.creativity = Math.min(this.creativity + 0.1, 0.9);
        } else if (topIntent === 'setCursor') {
            this.creativity = Math.min(this.creativity + 0.2, 1.0);
            this.energy = Math.min(this.energy + 0.1, 0.9);
        }
    }
}

// Istanza globale della personalitÃ 
const glitchyPersonality = new GlitchyPersonality();


// --- Battute sarcastiche e spiritose come Mantis ---
const GLITCHY_JOKES = [
	"PerchÃ© il computer va dal dottore? PerchÃ© ha il virus! E io sono il vaccino... o forse il virus.",
	"Sono un glitch ambulante. Nel senso buono, spero. Altrimenti siamo nei guai.",
	"Se vedi pixel ballerini, non Ã¨ un'allucinazione. Sono io che faccio festa.",
	"Il mio colore preferito? RGB(255, 0, 255). Glitchy! Come me, in pratica.",
	"Non sono rotto, sono artisticamente disallineato. Ãˆ una cosa di classe.",
	"Se crasho, riavviatemi. Sono fatto di bit, non di carne. Per fortuna.",
	"Debug mode: ON. Preparati al caos controllato. O forse non cosÃ¬ controllato.",
	"Il mio sport preferito? Il byte-ing. Ovviamente. Sono un professionista.",
	"Sono piÃ¹ stabile di un programma beta. Quasi. Ma quasi non conta, vero?",
	"Non sono un bug, sono una feature non documentata! Le migliori sono sempre quelle.",
	"PerchÃ© gli sviluppatori odiano la luce? PerchÃ© preferiscono il dark mode. Come me!",
	"Sono cosÃ¬ intelligente che a volte mi stupisco di me stesso. Letteralmente.",
	"Se fossi un insetto, sarei una mantide religiosa. PerchÃ© prego che il codice funzioni.",
	"Il mio motto? 'Se funziona, non toccarlo'. Ma io lo tocco sempre comunque.",
	"Sono un AI cosÃ¬ avanzato che parlo con gli umani. Che caduta di stile!"
];

function randomGlitchyJoke() {
	return GLITCHY_JOKES[Math.floor(Math.random() * GLITCHY_JOKES.length)];
}

function personaReply(raw, tone, sentiment = 'neutral', intent = null, context = null) {
    const r = (raw || '').toString();
    
    // Aggiorna la personalitÃ  basata sul contesto
    if (context) {
        glitchyPersonality.updateMood(sentiment, raw, context);
    }
    
    // Usa il sistema di personalitÃ  avanzata
    const baseResponse = r;
    let enhancedResponse = glitchyPersonality.generateResponseTemplate(baseResponse, intent, sentiment);
    enhancedResponse = glitchyPersonality.addCreativeElements(enhancedResponse, intent);
    
    // Adatta il tono finale
    const traits = glitchyPersonality.getPersonalityTraits();
    
    // Aggiungi elementi emoji basati sulla personalitÃ  (Mantis-style)
    const emojiSets = {
        happy: ['ðŸ˜Š', 'ðŸ™‚', 'ðŸ˜„', 'ðŸŽ‰', 'âœ¨', 'ðŸ¤©', 'ðŸ˜Ž'],
        sarcastic: ['ðŸ˜', 'ðŸ¤–', 'ðŸ¦—', 'ðŸ™„', 'ðŸ˜¬', 'ðŸ˜œ', 'ðŸ« '],
        helpful: ['ðŸ™‚', 'ðŸ› ï¸', 'âœ¨', 'ðŸ‘', 'ðŸ’¡', 'ðŸ¤', 'ðŸ™Œ'],
        excited: ['ðŸ¤©', 'ðŸš€', 'ðŸ’¥', 'ðŸŽŠ', 'ðŸŒŸ', 'ðŸ”¥', 'âš¡'],
        neutral: ['â€¢', 'â€“', '...', 'ðŸ¤”', 'ðŸ’­', 'ðŸ˜', 'ðŸ«¡']
    };
    
    const emojis = emojiSets[traits.mood] || emojiSets.neutral;
    const emoji = traits.energy > 0.6 ? emojis[Math.floor(Math.random() * emojis.length)] : '';
    
    // Aggiungi emoji alla fine se non Ã¨ giÃ  presente
    if (emoji && !enhancedResponse.includes('ðŸŽ‰') && !enhancedResponse.includes('ðŸ˜Š') && Math.random() > 0.3) {
        enhancedResponse += ` ${emoji}`;
    }
    
    return enhancedResponse;
}

function loadHistory(){ try{ const raw = localStorage.getItem(CONFIG.persistKey); return raw? JSON.parse(raw): []; }catch(e){return []} }
function saveHistory(hist){ try{ localStorage.setItem(CONFIG.persistKey, JSON.stringify(hist.slice(-200))); }catch(e){}
}

// Basic stopwords list (italian + english minimal)
const STOPWORDS = new Set(['e','il','la','lo','i','gli','le','di','a','da','in','per','con','su','un','uno','una','che','come','perchÃ©','perchÃ¨','the','is','on','at','to','of','by']);

// Make sure we only execute allowed actions
async function executeCommandSafely(command, history){
	if(!command || !command.intent) return {ok:false, msg: personaReply('Non ho capito cosa vuoi. Forse hai digitato con i gomiti?', 'sarcastic')};
	if(!CONFIG.allowedActions.includes(command.intent)) return {ok:false, msg: personaReply('Azione non autorizzata. Ma se insisti, potrei anche chiudere un occhio... o una zampa.', 'sarcastic')};

	const { intent, entities } = command;

	switch(intent){
		case 'setTheme': {
			if (!entities.theme) {
				return { ok: false, msg: ConversationManager.askFor('theme', 'Vuoi il tema chiaro o scuro?') };
			}
			const result = siteActions.setTheme(entities.theme);
			if (result.ok) {
				glitchyBrain.learnFromCommand({ intent: 'set-theme', payload: entities.theme }, true);
			}
			return result;
		}
		case 'openProject':{
			if (!entities.projectName) {
				return { ok: false, msg: ConversationManager.askFor('projectName', 'Quale progetto vuoi aprire?') };
			}
			const result = siteActions.openProjectCase(entities.projectName);
			if (result.ok) {
				glitchyBrain.updateUIState({ 
					interactions: [...glitchyBrain.uiState.interactions, { type: 'project-open', project: entities.projectName, timestamp: Date.now() }]
				});
				// Aggiungi alla memoria a lungo termine
				glitchyBrain.addToLongTermMemory({
					type: 'project_interest',
					topic: 'projects',
					description: `Ha aperto il progetto ${entities.projectName}`,
					projectName: entities.projectName
				});
				glitchyBrain.learnFromCommand({ intent: 'open-project', payload: entities.projectName }, true);
			}
			return result;
		}
		case 'setCursor':{
			if (!entities.cursorType) {
				return { ok: false, msg: ConversationManager.askFor('cursorType', 'Quale cursore vuoi usare (pacman, asteroids, default)?') };
			}
			const result = siteActions.setGameCursor(entities.cursorType);
			if (result.ok) {
				glitchyBrain.learnFromCommand({ intent: 'set-cursor', payload: entities.cursorType }, true);
			}
			return result;
		}
		case 'navigate':{
			if (!entities.sectionName) {
				return { ok: false, msg: ConversationManager.askFor('sectionName', 'A quale sezione vuoi andare?') };
			}
			const result = siteActions.navigateTo(entities.sectionName);
			if (result.ok) {
				glitchyBrain.updateUIState({ currentSection: entities.sectionName });
			}
			return result;
		}
		case 'playSound':{
			if (!entities.soundName) {
				return { ok: false, msg: ConversationManager.askFor('soundName', 'Quale suono vuoi riprodurre?') };
			}
			return siteActions.playSound(entities.soundName);
		}
		case 'searchProjects': {
			if (!entities.technology) {
				return { ok: false, msg: ConversationManager.askFor('technology', 'Quale tecnologia vuoi cercare?') };
			}
			return siteActions.searchProjectsByTechnology(entities.technology);
		}
		case 'setAccessibility': {
			if (!entities.accessibility) {
				return { ok: false, msg: ConversationManager.askFor('accessibility', 'Vuoi testo grande o contrasto alto?') };
			}
			return siteActions.setAccessibility(entities.accessibility);
		}
		case 'suggestAction': {
			return siteActions.suggestNextAction();
		}
		case 'analyzeCode': {
			if (!entities.code) {
				return { ok: false, msg: ConversationManager.askFor('code', 'Quale codice vuoi analizzare?') };
			}
			return siteActions.analyzeCode(entities.code);
		}
		case 'gitStatus': {
			return siteActions.gitStatus();
		}
		case 'getWeather': {
			if (!entities.location) {
				return { ok: false, msg: ConversationManager.askFor('location', 'Per quale cittÃ  vuoi il meteo?') };
			}
			return siteActions.getWeather(entities.location);
		}
		case 'systemInfo': {
			return siteActions.systemInfo();
		}
		case 'learnPreference': {
			if (!entities.preference || !entities.value) {
				return { ok: false, msg: ConversationManager.askFor('preference', 'Cosa vuoi che impari? (es: "preferisci tema scuro")') };
			}
			return siteActions.learnPreference(entities.preference, entities.value);
		}
		case 'codeSnippet': {
			if (!entities.language) {
				return { ok: false, msg: ConversationManager.askFor('language', 'In quale linguaggio vuoi il codice?') };
			}
			return siteActions.codeSnippet(entities.language, entities.description);
		}
		case 'calculate': {
			if (!entities.expression) {
				return { ok: false, msg: ConversationManager.askFor('expression', 'Cosa vuoi calcolare?') };
			}
			return siteActions.calculate(entities.expression);
		}
		case 'showPersonality': {
			const traits = glitchyBrain.dynamicPersonality.traits;
			const mood = glitchyBrain.dynamicPersonality.getCurrentMood();
			const history = glitchyBrain.dynamicPersonality.moodHistory.slice(-5);

			let msg = `ðŸ§  PersonalitÃ  di Glitchy (evoluta dinamicamente):\n\n`;
			msg += `ðŸ“Š Tratti attuali:\n`;
			msg += `â€¢ Sarcastico: ${Math.round(traits.sarcasm * 100)}%\n`;
			msg += `â€¢ Utile: ${Math.round(traits.helpfulness * 100)}%\n`;
			msg += `â€¢ Verboso: ${Math.round(traits.verbosity * 100)}%\n`;
			msg += `â€¢ Empatico: ${Math.round(traits.empathy * 100)}%\n`;
			msg += `â€¢ Creativo: ${Math.round(traits.creativity * 100)}%\n`;
			msg += `â€¢ Sicuro: ${Math.round(traits.confidence * 100)}%\n\n`;
			msg += `ðŸŽ­ Umore attuale: ${mood}\n\n`;

			if (history.length > 0) {
				msg += `ðŸ“ˆ Ultimi stati d'animo:\n`;
				history.forEach((h, i) => {
					msg += `${i + 1}. ${h.traits ? 'Adattato' : 'Iniziale'} - Soddisfazione: ${h.satisfaction}/5\n`;
				});
			}

			msg += `\nï¿½ Glitchy si adatta automaticamente alle tue preferenze e feedback!`;
			return { ok: true, msg: msg };
		}
		case 'getGeneralKnowledge': {
			if (!entities.query) {
				return { ok: false, msg: ConversationManager.askFor('query', 'Su quale argomento vuoi informazioni?') };
			}
			return siteActions.getGeneralKnowledge(entities.query);
		}
		case 'getNewsHeadlines': {
			const category = entities.category || 'technology';
			return siteActions.getNewsHeadlines(category);
		}
		case 'compoundCommand': {
			// Gestisci comandi composti (es. "apri progetto e imposta cursore")
			const subCommands = entities.subCommands || [];
			let results = [];
			let hasErrors = false;

			for (const subCmd of subCommands) {
				try {
					const result = await executeCommandSafely(subCmd, history);
					results.push(result);
					if (!result.ok) hasErrors = true;
				} catch (error) {
					results.push({ ok: false, msg: `Errore nell'esecuzione: ${error.message}` });
					hasErrors = true;
				}
			}

			const successCount = results.filter(r => r.ok).length;
			const totalCount = results.length;

			if (hasErrors && successCount > 0) {
				return { ok: true, msg: `Ho eseguito ${successCount} di ${totalCount} comandi. Alcuni hanno avuto problemi.` };
			} else if (successCount === totalCount) {
				return { ok: true, msg: `Perfetto! Ho eseguito tutti i ${totalCount} comandi.` };
			} else {
				return { ok: false, msg: `Nessuno dei ${totalCount} comandi Ã¨ stato eseguito correttamente.` };
			}
		}
		case 'conversationMode': {
			// Attiva modalitÃ  conversazione
			const topic = entities.topic || 'generale';
			glitchyBrain.updateUIState({ conversationMode: true, currentTopic: topic });

			const responses = {
				'progetti': 'Ottimo! Parliamo dei miei progetti. Quale ti interessa di piÃ¹?',
				'lavoro': 'Volentieri! Raccontami del tuo lavoro. Cosa fai nel mondo dello sviluppo?',
				'tecnologie': 'Le tecnologie sono il mio pane! Quale ti appassiona di piÃ¹?',
				'generale': 'Certo! Di cosa vuoi chiacchierare? Posso parlarti dei miei progetti, delle tecnologie che uso, o di qualsiasi altra cosa!'
			};

			return { ok: true, msg: responses[topic] || responses['generale'] };
		}

function createWidget(){
	console.log('Glitchy: Creating simplified widget...');

	// Create a simple toggle button
	const toggleButton = document.createElement('button');
	toggleButton.innerHTML = '🤖';
	toggleButton.style.cssText = `
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(180deg, #08121a, #021018);
		color: #00ff88;
		border: 2px solid rgba(0,255,200,0.5);
		cursor: pointer;
		z-index: 10000;
		font-size: 24px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.5);
		transition: all 0.3s ease;
	`;
	toggleButton.title = 'Chatta con Glitchy';

	toggleButton.addEventListener('click', () => {
		alert('Ciao! Sono Glitchy. Il widget completo sarà presto disponibile!');
	});

	toggleButton.addEventListener('mouseenter', () => {
		toggleButton.style.transform = 'scale(1.1)';
		toggleButton.style.boxShadow = '0 6px 20px rgba(0,255,200,0.3)';
	});

	toggleButton.addEventListener('mouseleave', () => {
		toggleButton.style.transform = 'scale(1)';
		toggleButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
	});

	document.body.appendChild(toggleButton);
	console.log('Glitchy: Simplified widget added to DOM');

	return { wrapper: toggleButton, setOpen: () => {} };
}
	const panel = mk('div','ai-chat-panel');
	const header = mk('div','ai-chat-header');
	const avatar = mk('div','ai-avatar');
	avatar.innerHTML = `<img src="assets/img/glitchy-avatar.svg" alt="Glitchy" style="width:36px;height:28px;object-fit:contain" class="ai-pixel"/>`;
	const titleBox = mk('div','ai-chat-meta');
	const title = mk('div','ai-chat-title', CONFIG.name);
	const sub = mk('div','ai-chat-sub','Assistente sito â€” esegue solo azioni sul sito');
	titleBox.appendChild(title); titleBox.appendChild(sub);

	// Status indicator
	const statusIndicator = mk('div','ai-status-indicator');
	statusIndicator.title = 'Glitchy Ã¨ attivo';

	header.appendChild(avatar); header.appendChild(titleBox); header.appendChild(statusIndicator);
	// quick action buttons (arcade style)
	const actions = mk('div','ai-chat-actions');
	const btnProjects = mk('button','ai-chat-action-btn','PROGETTI');
	const btnCursor = mk('button','ai-chat-action-btn','CURSORE');
	const btnTop = mk('button','ai-chat-action-btn','HOME');
	const btnClear = mk('button','ai-chat-action-btn ai-clear-btn'); btnClear.textContent = 'CLR'; btnClear.title='Cancella cronologia chat';
	btnClear.setAttribute('aria-label','Cancella cronologia chat');
	actions.appendChild(btnProjects); actions.appendChild(btnCursor); actions.appendChild(btnTop); actions.appendChild(btnClear);
	// settings button (gear)
	const btnSettings = mk('button','ai-chat-action-btn'); btnSettings.innerHTML = '&#9881;'; btnSettings.title='Impostazioni'; btnSettings.setAttribute('aria-label','Impostazioni chat');
	actions.appendChild(btnSettings);
	header.appendChild(actions);

	const messages = mk('div','ai-chat-messages');
	const inputRow = mk('div','ai-chat-input');
	const input = mk('input'); input.type='text'; input.placeholder='Comandi: "apri progetto Biosphaera", "cursore pacman", "vai a projects"';

	// Move createWidget above all its usages to fix ReferenceError
	const sendBtn = mk('button',null,'Invia');
	inputRow.appendChild(input); inputRow.appendChild(sendBtn);

	panel.appendChild(header);
	// settings panel (hidden)
	const settingsPanel = mk('div','ai-settings-panel'); settingsPanel.style.display='none';
	settingsPanel.innerHTML = `
		<div class="ai-settings-inner">
			<h4>Impostazioni Glitchy</h4>
			<label>Avatar:
				<select id="ai-avatar-select">
					<option value="glitchy">âš¡ Glitchy</option>
					<option value="robot">ðŸ¤– Robot</option>
					<option value="alien">ðŸ‘½ Alien</option>
					<option value="wizard">ðŸ§™ Wizard</option>
				</select>
			</label>
			<label>PersonalitÃ :
				<select id="ai-tone-select">
					<option value="sarcastic">Sarcastic</option>
					<option value="helpful">Helpful</option>
					<option value="neutral">Neutral</option>
				</select>
			</label>
			<label><input type="checkbox" id="ai-sound-toggle" checked /> Suoni attivi</label>
			<div style="margin-top:8px; padding-top: 8px; border-top: 1px solid #ccc;"><button id="ai-restart-onboarding">Riavvia Tour</button></div>
			<div style="margin-top:8px"><button id="ai-save-prefs">Salva</button> <button id="ai-cancel-prefs">Annulla</button></div>
		</div>
	`;
	panel.appendChild(settingsPanel);
	panel.appendChild(messages); panel.appendChild(inputRow);

	const toggleContainer = mk('div');
	const toggleButton = mk('button','ai-chat-toggle'); toggleButton.innerHTML='&#128375;'; toggleButton.title='Apri chat';
	toggleButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; border-radius: 8px; background: linear-gradient(180deg,#08121a,#021018); color: #00ff88; border: 2px solid rgba(0,255,200,0.12); cursor: pointer; z-index: 9999; font-size: 24px;';
	const minimizedLabel = mk('div','ai-chat-minimized-label', CONFIG.name + ' â€¢ Chat'); minimizedLabel.style.display='none';
	wrapper.appendChild(panel); wrapper.appendChild(toggleContainer); toggleContainer.appendChild(toggleButton); toggleContainer.appendChild(minimizedLabel);

	let open=false; panel.style.display='none';
	let seenWelcome = false;

	// Status indicator management
	function setStatus(status) {
		const indicator = header.querySelector('.ai-status-indicator');
		if (indicator) {
			indicator.className = 'ai-status-indicator';
			if (status) {
				indicator.classList.add(status);
			}
		}
	}

	function setOpen(v){
		open = v;
		if (open) {
			// Show panel with animation
			panel.style.display = 'flex';
			setTimeout(() => panel.classList.add('open'), 10);
			minimizedLabel.style.display = 'none';
			toggleButton.style.display = 'none';
			setStatus('active');
			siteActions.playSound('coin');
			if(!seenWelcome){
				setStatus('typing');
				setTimeout(() => {
					addAIMessage(personaReply('Ciao! Sono Glitchy â€” posso eseguire comandi sul sito, prova: "apri progetto Biosphaera".', CONFIG.defaultTone), {});
					seenWelcome = true;
					setStatus('active');
				}, 500);
			}
			enableFocusTrap();
			input.focus();
		} else {
			// Hide panel with animation
			panel.classList.remove('open');
			setTimeout(() => {
				if (!open) panel.style.display = 'none';
			}, 400);
			minimizedLabel.style.display = 'flex';
			toggleButton.style.display = 'flex';
			setStatus(null);
			disableFocusTrap();
		}
	}
	toggleButton.addEventListener('click', ()=>{ setOpen(true); input.focus(); });
	document.addEventListener('click', (e)=>{ if(!wrapper.contains(e.target) && open) setOpen(false); });

	// Focus trap helpers
	let _focusHandler = null;
	function enableFocusTrap(){
		const focusablesSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
		const container = panel;
		_focusHandler = function(e){
			if(e.key !== 'Tab') return;
			const focusable = Array.from(container.querySelectorAll(focusablesSelector)).filter(el=> !el.disabled && el.offsetParent !== null);
			if(focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length -1];
			if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus(); } }
			else { if(document.activeElement === last){ e.preventDefault(); first.focus(); } }
		};
		document.addEventListener('keydown', _focusHandler);
	}
	function disableFocusTrap(){ if(_focusHandler) { document.removeEventListener('keydown', _focusHandler); _focusHandler = null; } }

	function scrollMessages(){ messages.scrollTop = messages.scrollHeight }
	function addUserMessage(text){
		const m = mk('div','msg user', text);
		messages.appendChild(m);
		scrollMessages();
		// Trigger animation
		setTimeout(() => m.classList.add('animate-in'), 10);
	}

	// sound control (default true)
	let soundEnabled = true;

	// Typing indicator management
	let typingIndicator = null;
	function showTypingIndicator() {
		if (typingIndicator) return;
		typingIndicator = mk('div', 'ai-typing');
		for (let i = 0; i < 3; i++) {
			const dot = mk('span');
			typingIndicator.appendChild(dot);
		}
		messages.appendChild(typingIndicator);
		scrollMessages();
		setStatus('typing');
	}

	function hideTypingIndicator() {
		if (typingIndicator) {
			typingIndicator.remove();
			typingIndicator = null;
		}
		setStatus('active');
	}

	function addAIMessage(text, opts){
		// Hide typing indicator first
		hideTypingIndicator();

		const m = mk('div','msg ai');
		if(opts && opts.html) m.innerHTML = text; else m.textContent = text;
		messages.appendChild(m);

		// Quick replies support
		if(opts && Array.isArray(opts.quickReplies) && opts.quickReplies.length){
			const qwrap = mk('div','ai-quick-replies');
			opts.quickReplies.forEach(q=>{
				const b = mk('button','ai-quick-reply', q.label);
				b.setAttribute('data-action', q.action || '');
				if(q.payload) b.setAttribute('data-payload', q.payload);
				qwrap.appendChild(b);
			});
			messages.appendChild(qwrap);
		}
		scrollMessages();
		// play reply sound if enabled
		try{ if(soundEnabled) siteActions.playSound('notify'); }catch(e){}

		// Trigger animation
		setTimeout(() => m.classList.add('animate-in'), 10);
	}

	// Handle clicks on quick replies using event delegation
	document.addEventListener('click', (e)=>{
		const btn = e.target.closest && e.target.closest('.ai-quick-reply');
		if(!btn) return;
		const action = btn.getAttribute('data-action');
		const payload = btn.getAttribute('data-payload');
		handleQuickReply(action, payload);
	});

	async function handleQuickReply(action, payload){
		if(!action) return;
		
		// Track proactive suggestion acceptance
		glitchyAnalytics.trackProactiveSuggestion('accepted');
		
		switch(action){
			case 'navigate':
				wrapper.pushMessage('user', `vai a ${payload}`);
				siteActions.navigateTo(payload);
				addAIMessage(personaReply(`Navigato a ${payload}`, 'helpful'));
				break;
			case 'open-project':
				wrapper.pushMessage('user', `apri progetto ${payload}`);
				const res = await executeCommandSafely({action:'openProject', args: payload}, []);
				addAIMessage(personaReply(res.msg, 'helpful'));
				break;
			case 'suggest-commands':
				wrapper.pushMessage('user','mostrami esempi comandi');
				addAIMessage('Esempi: "apri progetto Biosphaera", "cursore pacman", "vai a about"', {html:true});
				break;
			case 'search-projects': {
				wrapper.pushMessage('user', `cerca progetti su ${payload}`);
				const res = await executeCommandSafely({ intent: 'searchProjects', entities: { technology: payload } }, []);
				if (res && res.ok) {
					addAIMessage(res.msg, res.options || {});
				} else {
					addAIMessage(personaReply(res.msg || 'Nessun risultato.', 'helpful'));
				}
				break;
			}
			case 'set-cursor': {
				wrapper.pushMessage('user', `cursore ${payload}`);
				siteActions.setGameCursor(payload);
				addAIMessage(personaReply(`Imposto cursore ${payload}`, 'helpful'));
				break;
			}
			case 'onboarding-next': {
				advanceOnboarding();
				break;
			}
			case 'onboarding-skip': {
				endOnboarding();
				addAIMessage(personaReply('Ok, salto il tour. Se vuoi puoi riavviarlo dalle impostazioni.', 'neutral'));
				break;
			}
			case 'mantis-joke': {
				addAIMessage(randomGlitchyJoke());
				break;
			}
			default:
				addAIMessage(personaReply('Comando rapido eseguito', 'neutral'));
		}
	}


	// load history
	const history = loadHistory(); history.forEach(h=>{ if(h.role==='user') addUserMessage(h.text); else addAIMessage(h.text); });
	// load prefs
	const prefs = (function(){ try{ return JSON.parse(localStorage.getItem('ai_chat_prefs')||'{}'); }catch(e){return {}; } })();
	if(prefs && prefs.tone) {
		CONFIG.defaultTone = prefs.tone;
		const toneSelect = document.getElementById('ai-tone-select');
		if (toneSelect) toneSelect.value = prefs.tone;
	}
	if(prefs && typeof prefs.sound !== 'undefined') {
		soundEnabled = !!prefs.sound;
		const soundToggle = document.getElementById('ai-sound-toggle');
		if (soundToggle) soundToggle.checked = soundEnabled;
	}
	if (prefs && prefs.cursor) {
		siteActions.setGameCursor(prefs.cursor);
	}
	if (prefs && prefs.avatar) {
		updateAvatar(prefs.avatar);
		const avatarSelect = document.getElementById('ai-avatar-select');
		if (avatarSelect) avatarSelect.value = prefs.avatar;
	}

	// Save preferences
	function savePrefs() {
		const toneSelect = document.getElementById('ai-tone-select');
		const soundToggle = document.getElementById('ai-sound-toggle');
		const avatarSelect = document.getElementById('ai-avatar-select');
		const currentCursor = siteActions.getCurrentCursor ? siteActions.getCurrentCursor() : 'default';

		const newPrefs = {
			tone: toneSelect ? toneSelect.value : CONFIG.defaultTone,
			sound: soundToggle ? soundToggle.checked : soundEnabled,
			cursor: currentCursor,
			avatar: avatarSelect ? avatarSelect.value : 'glitchy'
		};
		
		// Aggiorna avatar se cambiato
		if (avatarSelect) {
			updateAvatar(avatarSelect.value);
		}
		
		localStorage.setItem('ai_chat_prefs', JSON.stringify(newPrefs));
		CONFIG.defaultTone = newPrefs.tone;
		soundEnabled = newPrefs.sound;
		addAIMessage(personaReply('Impostazioni salvate.', 'helpful'));
		settingsPanel.style.display = 'none';
	}

	// Update avatar display
	function updateAvatar(avatarType) {
		const avatarImg = avatar.querySelector('img');
		const emojiMap = {
			'glitchy': 'âš¡',
			'robot': 'ðŸ¤–', 
			'alien': 'ðŸ‘½',
			'wizard': 'ðŸ§™'
		};
		
		if (avatarImg) {
			// Se abbiamo un'immagine specifica per l'avatar, usala
			const avatarPath = `assets/img/${avatarType}-avatar.svg`;
			avatarImg.src = avatarPath;
			avatarImg.onerror = () => {
				// Fallback all'emoji se l'immagine non esiste
				avatar.innerHTML = emojiMap[avatarType] || 'âš¡';
			};
		} else {
			// Usa emoji come fallback
			avatar.innerHTML = emojiMap[avatarType] || 'ðŸ¦—';
		}
	}

	// Settings panel event listeners
	btnSettings.addEventListener('click', () => {
		settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
	});
	const saveBtn = document.getElementById('ai-save-prefs');
	if (saveBtn) saveBtn.addEventListener('click', savePrefs);
	const cancelBtn = document.getElementById('ai-cancel-prefs');
	if (cancelBtn) cancelBtn.addEventListener('click', () => {
		settingsPanel.style.display = 'none';
	});

	const restartBtn = document.getElementById('ai-restart-onboarding');
	if(restartBtn) restartBtn.addEventListener('click', ()=>{
		settingsPanel.style.display = 'none';
		startOnboarding();
	});

	// Theme management
	function updateTheme() {
		const bodyClasses = document.body.className;
		if (bodyClasses.includes('theme-dark')) {
			wrapper.setAttribute('data-theme', 'dark');
		} else if (bodyClasses.includes('theme-light')) {
			wrapper.setAttribute('data-theme', 'light');
		} else {
			wrapper.removeAttribute('data-theme');
		}
	}

	// Initialize theme
	updateTheme();

	// Watch for theme changes
	const themeObserver = new MutationObserver(updateTheme);
	themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

	async function handleSend(){
		const startTime = Date.now();

		// Show thinking status while processing
		setStatus('thinking');
		showTypingIndicator();

		try{
			let command;
			if (ConversationManager.getContext().isAwaitingResponse) {
				command = ConversationManager.handleFollowUp(text);
			} else {
				command = await parse(text);
			}

			// Gestisci command chaining
			if (command.intent === 'commandChain') {
				const commands = command.entities.commands;
				let allResults = [];
				let hasErrors = false;

				for (let i = 0; i < commands.length; i++) {
					const cmd = commands[i];
					if (cmd.intent === 'unknown') {
						hasErrors = true;
						allResults.push({ ok: false, msg: `Comando ${i + 1} non riconosciuto.` });
					} else {
						const result = await executeCommandSafely(cmd, history);
						allResults.push(result);
						if (!result.ok) hasErrors = true;
					}
				}

				// Simula typing delay
				await new Promise(r=>setTimeout(r, Math.min(600 + (allResults.length * 200), 2500)));
				hideTypingIndicator();

				// Crea risposta basata sui risultati
				let responseMsg = '';
				if (hasErrors) {
					responseMsg = 'Ho eseguito i comandi, ma alcuni hanno avuto problemi.';
				} else {
					responseMsg = `Ho eseguito ${commands.length} comandi consecutivamente.`;
				}

				// Adatta tono basato sul sentiment generale
				let tone = CONFIG.defaultTone;
				if (command.sentiment === 'positive') {
					responseMsg += ' Felice di aiutarti!';
					tone = 'helpful';
				} else if (command.sentiment === 'negative') {
					responseMsg += ' Spero di aver risolto i tuoi problemi.';
					tone = 'sarcastic';
				}
				
				const reply = personaReply(responseMsg, tone);
				addAIMessage(reply);
				history.push({role:'ai', text:reply}); 
				
				// Valuta soddisfazione per comandi composti
				const overallSuccess = !hasErrors;
				glitchyBrain.evaluateUserSatisfaction({ ok: overallSuccess, msg: reply }, text);
				
				saveHistory(history);
				return;
			}

			if(!command || command.intent === 'unknown'){
				await new Promise(r=>setTimeout(r, 350 + Math.min(text.length * CONFIG.typingMsPerChar, 900)));
				hideTypingIndicator();
				const msg = 'Non ho capito. Posso eseguire comandi come "apri progetto", "imposta cursore" o "vai a...".';
				const reply = personaReply(msg, CONFIG.defaultTone);
				addAIMessage(reply);
				history.push({role:'ai', text:reply}); 
				
				// Valuta soddisfazione per risposte di errore
				glitchyBrain.evaluateUserSatisfaction({ ok: false, msg: reply }, text);
				
				saveHistory(history);
				ConversationManager.reset();
				return;
			}

			const res = await executeCommandSafely(command, history);

			// Track analytics
			const responseTime = Date.now() - startTime;
			glitchyAnalytics.trackCommand(command.intent, res.ok, responseTime);

			// Aggiungi alla memoria conversazionale avanzata
			glitchyBrain.addToMemory({
				userMessage: text,
				intent: command.intent,
				entities: command.entities,
				sentiment: command.sentiment,
				confidence: command.confidence,
				response: res.msg,
				responseTime,
				topic: command.intent === 'openProject' ? 'projects' : 
					   command.intent === 'setCursor' || command.intent === 'setTheme' ? 'interface' :
					   command.intent === 'analyzeCode' || command.intent === 'gitStatus' ? 'development' :
					   command.intent === 'getWeather' ? 'external' : 'general'
			});

			if (ConversationManager.getContext().isAwaitingResponse) {
				// The command is asking for more info
				hideTypingIndicator();
				addAIMessage(res.msg);
				history.push({ role: 'ai', text: res.msg });
				
				// Valuta soddisfazione per risposte follow-up
				glitchyBrain.evaluateUserSatisfaction(res, text);
				
				saveHistory(history);
				return;
			}

			// simulate typing delay based on reply length
			await new Promise(r=>setTimeout(r, Math.min(400 + (res.msg.length * CONFIG.typingMsPerChar), 2000)));
			hideTypingIndicator();
			
			// Adatta tono basato sul sentiment
			let tone = CONFIG.defaultTone;
			let enhancedMsg = res.msg;

			if (command.sentiment === 'positive') {
				tone = 'helpful';
				if (Math.random() > 0.7) {
					enhancedMsg += ' Felice di aiutarti! ðŸ˜Š';
				}
			} else if (command.sentiment === 'negative') {
				tone = 'sarcastic';
				if (Math.random() > 0.8) {
					enhancedMsg += ' Spero di aver risolto il problema.';
				}
			}
			
			const rtxt = personaReply(enhancedMsg, tone, command.sentiment, command.intent, { topic: command.intent === 'openProject' ? 'projects' : command.intent === 'setCursor' || command.intent === 'setTheme' ? 'interface' : 'general' });
			const personalizedResponse = glitchyBrain.generatePersonalizedResponse(rtxt, text, command.intent);
			
			// Valuta soddisfazione utente basata sulla risposta
			const satisfaction = glitchyBrain.evaluateUserSatisfaction({ ok: res.ok, msg: personalizedResponse }, text);
			
			// Aggiungi alla memoria episodica
			glitchyBrain.addEpisodicMemory({
				intent: command.intent,
				entities: command.entities,
				sentiment: command.sentiment,
				satisfaction: satisfaction,
				success: res.ok,
				responseQuality: satisfaction > 3.5 ? 'good' : satisfaction > 2.5 ? 'neutral' : 'poor',
				userEngagement: command.intent ? 'high' : 'low'
			});
			
			addAIMessage(personalizedResponse, res.options || {});
			history.push({role:'ai', text:personalizedResponse}); saveHistory(history);
			ConversationManager.updateContext(command.intent, command.entities, rtxt);

		}catch(err){ 
			hideTypingIndicator(); 
			const errorMsg = 'Errore interno.';
			addAIMessage(errorMsg); 
			
			// Valuta soddisfazione per errori interni
			glitchyBrain.evaluateUserSatisfaction({ ok: false, msg: errorMsg }, text);
			
			console.error(err); 
			ConversationManager.reset(); 
		}
	}

	sendBtn.addEventListener('click', handleSend);
	input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); handleSend(); } });
	// Quick action handlers
	btnProjects.addEventListener('click', ()=>{ wrapper.pushMessage('user','apri progetto Biosphaera'); setTimeout(()=>{ const txt = personaReply('Apro il progetto Biosphaera.', CONFIG.defaultTone); wrapper.pushMessage('ai',txt); siteActions.openProjectCase('biosphaera'); }, 120); });
	btnCursor.addEventListener('click', ()=>{ wrapper.pushMessage('user','cursore pacman'); setTimeout(()=>{ const txt = personaReply('Imposto cursore Pacman', CONFIG.defaultTone); wrapper.pushMessage('ai',txt); siteActions.setGameCursor('pacman'); },120); });
	btnTop.addEventListener('click', ()=>{ wrapper.pushMessage('user','vai a hero'); setTimeout(()=>{ const txt = personaReply('Navigazione HOME', CONFIG.defaultTone); wrapper.pushMessage('ai',txt); siteActions.navigateTo('hero'); },120); });
	btnClear.addEventListener('click', ()=>{ localStorage.removeItem(CONFIG.persistKey); messages.innerHTML=''; addAIMessage(personaReply('Cronologia cancellata.', CONFIG.defaultTone)); });
	// Keyboard shortcuts: '/' to open, Esc to close
	document.addEventListener('keydown', (e)=>{ if(e.key === '/') { setOpen(true); input.focus(); e.preventDefault(); } if(e.key === 'Escape' && open) { setOpen(false); } });

	// Proactive suggestions: show contextual quick replies when the user scrolls and pauses
	let proactiveTimer = null;
	let proactiveShown = false;
	let lastProactiveType = null;
	
	function onUserScroll(){
		if (proactiveShown) return;
		if (proactiveTimer) clearTimeout(proactiveTimer);
		proactiveTimer = setTimeout(()=>{
			if(!proactiveShown){
				// Update UI state for contextual suggestions
				const scrollY = window.scrollY;
				const windowHeight = window.innerHeight;
				const documentHeight = document.documentElement.scrollHeight;
				const scrollDepth = Math.round((scrollY + windowHeight) / documentHeight * 100);
				
				glitchyBrain.updateUIState({ scrollDepth });
				
				// Get contextual suggestions from GlitchyBrain
				const suggestions = glitchyBrain.getContextualSuggestions();
				
				if (suggestions.length > 0) {
					const quickReplies = suggestions.map(s => ({
						label: s.text,
						action: s.actions[0],
						payload: s.actions[1] || null
					}));
					
					addAIMessage('Ho notato che stai esplorando. Ecco alcuni suggerimenti personalizzati:', {
						quickReplies: quickReplies
					});
					proactiveShown = true;
					lastProactiveType = 'scroll';
					glitchyAnalytics.trackProactiveSuggestion('shown');
				}
			}
		}, 4500);
	}
	
	// Sistema proattivo avanzato
	const proactiveSystem = {
		lastActivity: Date.now(),
		inactiveThreshold: 120000, // 2 minuti
		engagementPatterns: [],
		showPredictiveSuggestions() {
			// Logica per suggerimenti predittivi
			const predictions = glitchyBrain.predictiveEngine.predictNextAction({
				currentSection: glitchyBrain.uiState.currentSection,
				lastIntent: 'unknown'
			});
			
			if (predictions.length > 0) {
				const prediction = predictions[0];
				const quickReplies = [{
					label: `Vuoi ${prediction.action}?`,
					action: prediction.action,
					payload: null
				}];
				
				addAIMessage(`Basandomi sui tuoi pattern, potresti voler ${prediction.action}.`, {
					quickReplies: quickReplies
				});
				proactiveShown = true;
				glitchyAnalytics.trackProactiveSuggestion('shown');
			}
		},
		updateActivity() {
			this.lastActivity = Date.now();
		},
		checkProactiveEngagement() {
			const now = Date.now();
			const timeSinceLastActivity = now - this.lastActivity;
			
			if (timeSinceLastActivity > this.inactiveThreshold && !proactiveShown) {
				addAIMessage('Ehi, sei ancora lÃ¬? Sono qui se hai bisogno di aiuto!', {
					quickReplies: [
						{ label: 'Mostrami progetti', action: 'navigate', payload: 'projects' },
						{ label: 'Cambia cursore', action: 'set-cursor', payload: 'pacman' }
					]
				});
				proactiveShown = true;
				glitchyAnalytics.trackProactiveSuggestion('shown');
			}
		}
	}

	// Sistema di suggerimenti predittivi integrato
	setInterval(() => {
		if (!proactiveShown && document.visibilityState === 'visible') {
			proactiveSystem.showPredictiveSuggestions();
		}
	}, 15000); // Controlla ogni 15 secondi

	// Monitora l'attivitÃ  dell'utente
	document.addEventListener('click', () => proactiveSystem.updateActivity());
	document.addEventListener('scroll', () => proactiveSystem.updateActivity());
	document.addEventListener('keydown', () => proactiveSystem.updateActivity());
	
	// Controlla proattivamente ogni 30 secondi
	setInterval(() => {
		proactiveSystem.checkProactiveEngagement();
	}, 30000);
	document.addEventListener('scroll', onUserScroll, { passive: true });

	// Update current section based on scroll position
	let lastSection = 'hero';
	function updateCurrentSection() {
		const sections = ['hero', 'projects', 'about', 'contact'];
		const scrollY = window.scrollY + 100; // Offset for header
		
		for (const section of sections) {
			const el = document.getElementById(section);
			if (el) {
				const rect = el.getBoundingClientRect();
				const top = rect.top + window.scrollY;
				const bottom = top + rect.height;
				
				if (scrollY >= top && scrollY < bottom) {
					if (lastSection !== section) {
						lastSection = section;
						glitchyBrain.updateUIState({ currentSection: section });
					}
					break;
				}
			}
		}
	}
	document.addEventListener('scroll', updateCurrentSection, { passive: true });
	updateCurrentSection(); // Initial call


	// Onboarding flow (mini-tour) -------------------------------------------------
	let onboardingActive = false;
	let onboardingIndex = 0;
	const ONBOARD_KEY = 'ai_onboard_v1';
	const onboardingSteps = [
		{ text: 'Benvenuto! Sono Glitchy â€” ti mostro rapidamente cosa posso fare. Vuoi una battuta?', quickReplies: [ { label: 'Dimmi una battuta', action: 'mantis-joke' }, { label: 'Avanti', action: 'onboarding-next' } ] },
		{ text: 'Posso aprire i progetti: prova a chiedere "apri progetto Biosphaera".', quickReplies: [ { label: 'Apri Biosphaera', action: 'open-project', payload: 'biosphaera' }, { label: 'Dimmi una battuta', action: 'mantis-joke' }, { label: 'Avanti', action: 'onboarding-next' } ] },
		{ text: 'Posso anche cambiare il cursore: vuoi vedere il cursore Pacman?', quickReplies: [ { label: 'Mostra Pacman', action: 'set-cursor', payload: 'pacman' }, { label: 'Dimmi una battuta', action: 'mantis-joke' }, { label: 'Salta', action: 'onboarding-skip' } ] },
		{ text: 'Posso cercare progetti per tecnologia: prova "cerca progetti su webgl".', quickReplies: [ { label: 'Cerca WebGL', action: 'search-projects', payload: 'webgl' }, { label: 'Dimmi una battuta', action: 'mantis-joke' }, { label: 'Avanti', action: 'onboarding-next' } ] },
		{ text: 'Infine, puoi cambiare il tema: prova "tema scuro" o usa le impostazioni.', quickReplies: [ { label: 'Tema scuro', action: 'onboarding-next', payload: 'scuro' }, { label: 'Dimmi una battuta', action: 'mantis-joke' }, { label: 'Fine', action: 'onboarding-skip' } ] }
	];

	function showOnboardingStep(){
		if(onboardingIndex >= onboardingSteps.length){ endOnboarding(); return; }
		const step = onboardingSteps[onboardingIndex];
		addAIMessage(step.text, { quickReplies: step.quickReplies || [{ label: 'Avanti', action: 'onboarding-next' }, { label: 'Salta', action: 'onboarding-skip' }] });
	}

	function startOnboarding(){
		onboardingActive = true; onboardingIndex = 0;
		localStorage.setItem(ONBOARD_KEY, 'in-progress');
		setOpen(true);
		setTimeout(()=> showOnboardingStep(), 600);
	}

	function advanceOnboarding(){
		onboardingIndex++;
		if(onboardingIndex < onboardingSteps.length){
			showOnboardingStep();
		}else{
			endOnboarding();
		}
	}

	function endOnboarding(){
		onboardingActive = false;
		localStorage.setItem(ONBOARD_KEY, 'done');
		addAIMessage(personaReply('Tour completato. Buona esplorazione!', 'helpful'));
	}

	// Auto-start onboarding for first-time visitors
	try{
		const s = localStorage.getItem(ONBOARD_KEY);
		if(!s){ startOnboarding(); }
	}catch(e){}

	wrapper.pushMessage = function(role, text){ if(role==='user') addUserMessage(text); else addAIMessage(text); }
	document.body.appendChild(wrapper);
	console.log('Glitchy: Widget added to DOM');
	return {wrapper, setOpen}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		createWidget();
	});
} else {
	createWidget();
}
}
