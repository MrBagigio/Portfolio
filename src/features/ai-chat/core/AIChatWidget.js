/**
 * AIChatWidget.js
 * 
 * Gestisce l'interfaccia utente (UI) della chat.
 * Questo componente orchestra le interazioni dell'utente, visualizza i messaggi
 * e comunica con il "cervello" di Glitchy e altri moduli di servizio.
 */

// --- 1. IMPORTAZIONI ---
// Servizi e logica esterna (stessa directory di AIChatWidget.js)
import siteActions from './siteActions.js';
import { parse, initNLU } from '../nlu/NLU.js';
import ConversationManager from './ConversationManager.js';

// Intelligenza Artificiale di Glitchy (nella stessa cartella)
import { GlitchyBrainSimplified } from './GlitchyBrainSimplified.js';
import GlitchyAnalytics from '../analytics/GlitchyAnalytics.js';

// Utility e Configurazione (nella stessa cartella)
import { mk } from './dom.js';
import { personaReply, randomGlitchyJoke } from './persona.js';
import { CONFIG } from './config.js';
import { loadProjectsIntoKB } from '../knowledge/knowledgeBase.js';

// Command system
import '../commands/registry.js'; // Registra tutti i comandi
import { commandRegistry } from '../commands/index.js';
import EventBus from '../../../utils/events/EventBus.js';

// --- 2. LA CLASSE DEL WIDGET ---
export default class AIChatWidget {
    constructor() {
        // --- Stato Interno della UI ---
        this.isOpen = false;
        this.history = [];
        this.soundEnabled = true;
        this.typingIndicator = null;
        this.seenWelcome = false;
        this.onboardingActive = false;
        this.onboardingIndex = 0;

        // --- Componenti Logici ---
        this.brain = new GlitchyBrainSimplified();
        this.analytics = new GlitchyAnalytics(this.brain);
        this.conversationManager = new ConversationManager(); // Dependency injection - istanza isolata 

        // --- Riferimenti a Elementi DOM (inizializzati in #createDOM) ---
        this.wrapper = null;
        this.panel = null;
        this.messages = null;
        this.input = null;
        this.header = null;
        this.settingsPanel = null;
        this.toggleButton = null;
        this.sendBtn = null;
        this.btnSettings = null; 
        this.glitchyAnimatedDisplay = null;
        this.btnSavePrefs = null;
        this.btnCancelPrefs = null;
        this.btnRestartOnboarding = null;
    }

    /**
     * Punto di ingresso pubblico per creare e avviare il widget.
     */
    async init() {
        console.log(`[${CONFIG.name}] Initializing Widget...`);
        
        // Carica la conoscenza dei progetti prima di tutto
        await loadProjectsIntoKB();

        this.#createDOM();
        this.#bindEvents();
        this.#loadHistoryAndPrefs();

        // Inizializza il cervello AI
        await this.brain.initialize();

        // Inizializza la pipeline NLU
        initNLU().then(success => {
            if (success) {
                console.log(`[${CONFIG.name}] NLU Pipeline initialized successfully`);
                this.conversationManager.nluModule = { extractEntity: this.extractEntity.bind(this) };
            } else {
                console.warn(`[${CONFIG.name}] Failed to initialize NLU Pipeline`);
            }
        }).catch(err => {
            console.error(`[${CONFIG.name}] Critical error during NLU initialization:`, err);
        });

        document.body.appendChild(this.wrapper);
        this.#updateTheme();
        this.#startOnboardingIfNeeded();

        // Inietta l'istanza del brain in siteActions
        siteActions.setBrain(this.brain);

        console.log(`[${CONFIG.name}] Widget ready.`);
    }    // --- METODI PRIVATI PER LA GESTIONE DELLA UI ---

    #createDOM() {
        this.wrapper = mk('div', 'ai-chat-widget');
        this.panel = mk('div', 'ai-chat-panel');
        this.header = mk('div', 'ai-chat-header');

        // Contenitore per gli elementi HUD in primo piano
        const hudContainer = mk('div', 'ai-chat-header-hud');
        const hudLeft = mk('div', 'hud-left');
        const hudRight = mk('div', 'hud-right');
        
        const avatar = mk('div', 'ai-avatar');
        avatar.innerHTML = `<img src="assets/img/glitchy-avatar.svg" alt="${CONFIG.name}" class="ai-pixel"/>`;
        const titleBox = mk('div', 'ai-chat-meta');
        titleBox.append(
            mk('div', 'ai-chat-title', CONFIG.name),
            mk('div', 'ai-chat-sub', 'Assistente virtuale del sito')
        );
        hudLeft.append(avatar, titleBox);

        const statusIndicator = mk('div', 'ai-status-indicator');
        this.btnSettings = mk('button', 'ai-settings-toggle', '⚙️');
        this.btnSettings.title = 'Impostazioni';
        hudRight.append(statusIndicator, this.btnSettings);
        
        hudContainer.append(hudLeft, hudRight);

        // Schermo animato di sfondo
        this.glitchyAnimatedDisplay = mk('div', 'glitchy-animated-display');
        this.glitchyAnimatedDisplay.innerHTML = `
            <div class="glitchy-static-overlay"></div>
        `; 

        // Aggiungi prima lo schermo di sfondo, poi l'HUD sopra
        this.header.append(this.glitchyAnimatedDisplay, hudContainer);

        // Resto della UI
        this.messages = mk('div', 'ai-chat-messages');
        const inputRow = mk('div', 'ai-chat-input');
        this.input = mk('input');
        this.input.type = 'text';
        this.input.placeholder = 'Comandi: "apri progetto Biosphaera"...';
        this.sendBtn = mk('button', null, 'Invia');
        inputRow.append(this.input, this.sendBtn);

        this.#createSettingsPanel();
        
        this.panel.append(this.header, this.settingsPanel, this.messages, inputRow);

        const toggleContainer = mk('div');
        this.toggleButton = mk('button', 'ai-chat-toggle');
        this.toggleButton.innerHTML = `🤖`; 
        this.toggleButton.title = `Apri chat con ${CONFIG.name}`;
        toggleContainer.append(this.toggleButton);

        this.wrapper.append(this.panel, toggleContainer);
        this.panel.style.display = 'none';
    }

    #createSettingsPanel() {
        this.settingsPanel = mk('div', 'ai-settings-panel');
        this.settingsPanel.style.display = 'none';
        
        const innerSettings = mk('div', 'ai-settings-inner');
        innerSettings.innerHTML = `
            <h4>Impostazioni ${CONFIG.name}</h4>
            <label>Personalità:
                <select id="ai-tone-select">
                    <option value="sarcastic">Sarcastic</option>
                    <option value="helpful">Helpful</option>
                    <option value="neutral">Neutral</option>
                </select>
            </label>
            <label><input type="checkbox" id="ai-sound-toggle" checked /> Suoni attivi</label>
            <div class="settings-actions">
                <button id="ai-restart-onboarding">Riavvia Tour</button>
                <button id="ai-save-prefs">Salva</button>
                <button id="ai-cancel-prefs">Annulla</button>
            </div>
        `;
        this.settingsPanel.append(innerSettings); 

        this.btnSavePrefs = this.settingsPanel.querySelector('#ai-save-prefs');
        this.btnCancelPrefs = this.settingsPanel.querySelector('#ai-cancel-prefs');
        this.btnRestartOnboarding = this.settingsPanel.querySelector('#ai-restart-onboarding');
    }

    #bindEvents() {
        const toggleHandler = () => this.setOpen(true);
        this.toggleButton.addEventListener('click', toggleHandler);
        this.toggleButton.addEventListener('touchstart', toggleHandler);
        this.sendBtn.addEventListener('click', () => this.#handleSend());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.#handleSend(); }
        });

        this.btnSettings.addEventListener('click', () => {
            this.settingsPanel.style.display = this.settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
        
        this.btnSavePrefs?.addEventListener('click', () => this.#savePrefs());
        this.btnCancelPrefs?.addEventListener('click', () => { this.settingsPanel.style.display = 'none'; });
        this.btnRestartOnboarding?.addEventListener('click', () => {
            this.settingsPanel.style.display = 'none';
            this.#startOnboarding();
        });

        EventBus.on('global:click', (e) => {
            if (this.isOpen && !this.wrapper.contains(e.target) && !this.settingsPanel.contains(e.target)) this.setOpen(false); 
            const quickReply = e.target.closest('.ai-quick-reply');
            if (quickReply) {
                const action = quickReply.dataset.action;
                const payload = quickReply.dataset.payload;
                this.#handleQuickReply(action, payload);
            }
        });

        EventBus.on('global:keydown', (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.setOpen(true);
            }
            if (e.key === 'Escape' && this.isOpen) this.setOpen(false);
        });

        const themeObserver = new MutationObserver(() => this.#updateTheme());
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    #handleQuickAction(userText, aiText, actionCallback) {
        this.pushMessage('user', userText);
        setTimeout(() => {
            const reply = personaReply(aiText, CONFIG.defaultTone, 'neutral', null, this.brain.uiState); 
            this.pushMessage('ai', reply);
            actionCallback();
        }, 120);
    }
    
    setOpen(state) {
        this.isOpen = state;
        if (this.isOpen) {
            this.panel.style.display = 'flex';
            setTimeout(() => this.panel.classList.add('open'), 10);
            this.toggleButton.style.display = 'none';
            this.#setStatus('active');
            siteActions.playSound('coin');
            this.input.focus();
            
            if (!this.seenWelcome && !this.onboardingActive) {
                this.seenWelcome = true;
                this.#setStatus('typing');
                setTimeout(() => {
                    const randomWelcome = CONFIG.welcomeMessages[Math.floor(Math.random() * CONFIG.welcomeMessages.length)];
                    this.#addAIMessage(personaReply(randomWelcome, CONFIG.defaultTone, 'neutral', null, this.brain.uiState));
                    this.#setStatus('active');
                }, 500);
            }
        } else {
            this.panel.classList.remove('open');
            setTimeout(() => {
                if (!this.isOpen) this.panel.style.display = 'none';
            }, 400);
            this.toggleButton.style.display = 'flex';
            this.#setStatus(null);
        }
    }

    async #handleSend() {
        const text = this.input.value.trim();
        if (!text) return;

        this.pushMessage('user', text);
        this.input.value = '';
        this.#showTypingIndicator();

        try {
            // Gestisci comandi speciali che iniziano con "/"
            if (text.startsWith('/')) {
                const result = await this.#processSlashCommand(text);
                this.#hideTypingIndicator();
                this.pushMessage('ai', result.msg);
                return;
            }

            // Processa comandi locali o query LLM
            const result = await this.#processUserInput(text);
            this.#hideTypingIndicator();

            if (result.response) {
                this.#addAIMessage(result.response, result.options || {});
            }

        } catch (err) {
            console.error(`[Glitchy] Errore inatteso durante #handleSend:`, err);
            this.#hideTypingIndicator();
            const errorMsg = await this.#generateErrorMessage(err);
            this.#addAIMessage(errorMsg);
        }
    }

    async #processSlashCommand(text) {
        const command = text.substring(1).toLowerCase().trim();

        switch (command) {
            case 'log':
                const log = this.brain.getConversationLog();
                if (log.length === 0) {
                    return { ok: true, msg: '📝 Nessuna conversazione registrata ancora.' };
                } else {
                    let msg = `📝 Log delle conversazioni (${log.length} interazioni):\n\n`;
                    log.slice(-10).forEach((entry, i) => {
                        const date = new Date(entry.timestamp).toLocaleString();
                        msg += `${i + 1}. [${date}] ${entry.type}\n`;
                        msg += `   👤: ${entry.userMessage?.substring(0, 50)}${entry.userMessage?.length > 50 ? '...' : ''}\n`;
                        msg += `   🤖: ${entry.response?.substring(0, 50)}${entry.response?.length > 50 ? '...' : ''}\n\n`;
                    });
                    msg += `💡 Usa "/exportlog" per ottenere il log completo in JSON.`;
                    return { ok: true, msg: msg };
                }
            case 'exportlog':
                const fullLog = this.brain.exportConversationLog();
                return { ok: true, msg: `📄 Log esportato (${fullLog.length} caratteri). Copia il JSON qui sotto:\n\n${fullLog}` };
            case 'clearlog':
                this.brain.clearConversationLog();
                return { ok: true, msg: '🗑️ Log delle conversazioni cancellato.' };
            default:
                return { ok: false, msg: `Comando "${command}" non riconosciuto. Comandi disponibili: /log, /exportlog, /clearlog` };
        }
    }

    async #processUserInput(text) {
        const startTime = Date.now();
        let command = { intent: 'unknown', entities: {}, sentiment: 'neutral', confidence: 0 };

        // Gestisci follow-up se siamo in una conversazione
        if (this.conversationManager.getContext().awaitingFor) {
            command = this.conversationManager.handleFollowUp(text);
        } else {
            const parsedResult = await parse(text);
            if (parsedResult) {
                command = parsedResult;
            }
        }

        // Prova comandi locali prima
        if (command.intent !== 'unknown' && command.intent !== 'conversationMode') {
            console.log("[Glitchy] Comando locale riconosciuto:", command.intent);
            return await this.#processLocalCommand(command, text, startTime);
        }

        // Fallback a risposte locali o LLM
        return await this.#processFallbackResponse(text, command, startTime);
    }

    async #processLocalCommand(command, text, startTime) {
        const res = await this.#executeCommandSafely(command);
        const personalizedResponse = await this.brain.generatePersonalizedResponse(res.msg, text, command.intent);

        const satisfaction = this.brain.evaluateUserSatisfaction({ ok: res.ok, msg: personalizedResponse }, text);
        this.brain.addEpisodicMemory({
            intent: command.intent, entities: command.entities, sentiment: command.sentiment,
            satisfaction, success: res.ok,
            responseQuality: satisfaction > 3.5 ? 'good' : satisfaction > 2.5 ? 'neutral' : 'poor',
            userEngagement: command.intent ? 'high' : 'low'
        });

        this.analytics.trackCommand(command.intent, res.ok, Date.now() - startTime);

        // Aggiorna il conversation manager con il risultato
        this.conversationManager.updateContext(command.intent, command.entities, personalizedResponse, { success: res.ok });

        return {
            response: personalizedResponse,
            options: res.options || {}
        };
    }

    // Metodo per estrazione entità (usato dal conversation manager)
    extractEntity(text, entityType, validValues = []) {
        // Delega all'NLU per l'estrazione intelligente
        // Per ora usa una logica semplice, ma può essere estesa
        const trimmedText = text.trim();

        // Se abbiamo valori validi, cerca corrispondenze
        if (validValues && validValues.length > 0) {
            for (const value of validValues) {
                if (trimmedText.toLowerCase().includes(value.toLowerCase())) {
                    return value;
                }
            }
        }

        // Fallback: restituisci il testo pulito
        return trimmedText.replace(/[^\w\s-]/g, '').trim();
    }

    async #processFallbackResponse(text, command, startTime) {
        // Prima prova risposte locali se offline o se la confidenza è bassa
        const isOffline = !navigator.onLine;
        const lowConfidence = command && command.confidence < 0.3;

        if (isOffline || lowConfidence) {
            console.log("[Glitchy] Uso risposte locali avanzate (offline o bassa confidenza)");
            return await this.#generateLocalResponse(text, command, startTime);
        } else {
            return await this.#processLLMQuery(text, command, startTime);
        }
    }

    async #generateLocalResponse(text, command, startTime) {
        const localResponse = await this.brain.generateLocalResponse(text, command?.intent, command?.entities);
        
        const satisfaction = this.brain.evaluateUserSatisfaction({ ok: true, msg: localResponse }, text);
        this.brain.addEpisodicMemory({
            intent: command?.intent || 'local_query', entities: command?.entities || {},
            sentiment: this.brain.analyzeSentiment(text), satisfaction, success: true,
            responseQuality: satisfaction > 3.5 ? 'good' : satisfaction > 2.5 ? 'neutral' : 'poor',
            userEngagement: 'medium'
        });

        this.analytics.trackCommand(command?.intent || 'local_command', true, Date.now() - startTime);

        return { response: localResponse };
    }

    async #processLLMQuery(text, command, startTime) {
        let llmResponse = null;

        try {
            console.log("[Glitchy] Comando non riconosciuto o domanda aperta. Chiamo il backend (Groq)...");

            const systemPrompt = `Sei Glitchy, un'IA integrata in una tuta da bounty hunter. Le tue risposte sono brevi, sarcastche e a volte un po' irritabili. Fornisci informazioni utili per la missione, ma con un tono da "non ho tempo per queste sciocchezze". Commenta l'ambiente e le richieste con un tono di scherno o leggero disappunto se opportuno.`;

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, systemPrompt })
            });

            if (response.status === 405) {
                throw new Error(CONFIG.errorMessages.apiUnavailable);
            }

            if (!response.ok) {
                throw new Error(this.#parseAPIError(response));
            }

            const data = await response.json();
            llmResponse = data.reply;

            const satisfaction = this.brain.evaluateUserSatisfaction({ ok: true, msg: llmResponse }, text);
            this.brain.addEpisodicMemory({
                intent: command?.intent || 'llm_query', entities: command?.entities || {},
                sentiment: this.brain.analyzeSentiment(text), satisfaction, success: true,
                responseQuality: satisfaction > 3.5 ? 'good' : satisfaction > 2.5 ? 'neutral' : 'poor',
                userEngagement: 'high'
            });

            this.analytics.trackCommand(command?.intent || 'llm_command', true, Date.now() - startTime);

            return { response: llmResponse };

        } catch (llmErr) {
            console.warn(`[Glitchy] LLM API fallita. Uso l'IA locale avanzata: ${llmErr.message}`);

            return await this.#generateLocalResponse(text, command, startTime);
        }
    }

    #parseAPIError(response) {
        try {
            const errData = response.json();
            return errData.error || CONFIG.errorMessages.networkError;
        } catch (jsonErr) {
            return `${CONFIG.errorMessages.parsingError}: ${response.text()}`;
        }
    }

    async #generateErrorMessage(error) {
        if (error.message.includes('fetch')) {
            return await this.brain.generatePersonalizedResponse(CONFIG.errorMessages.networkError, '', 'network_error');
        } else if (error.message.includes('API')) {
            return await this.brain.generatePersonalizedResponse(CONFIG.errorMessages.apiUnavailable, '', 'api_error');
        } else {
            return await this.brain.generatePersonalizedResponse(CONFIG.errorMessages.genericError, '', 'internal_error');
        }
    }

    async #executeCommandSafely(command) {
        if (!command || !command.intent) {
            return { ok: false, msg: personaReply(CONFIG.errorMessages.invalidCommand, 'sarcastic', null, null, this.brain.uiState) };
        }

        if (!CONFIG.allowedActions.includes(command.intent)) {
            return { ok: false, msg: personaReply(CONFIG.errorMessages.unauthorizedAction, 'sarcastic', null, null, this.brain.uiState) };
        }

        // Usa il Command Pattern per eseguire il comando
        const CommandClass = commandRegistry.getCommand(command.intent);
        if (!CommandClass) {
            return { ok: false, msg: personaReply(CONFIG.errorMessages.commandNotImplemented, 'sarcastic', null, null, this.brain.uiState) };
        }

        try {
            const commandInstance = new CommandClass(this);
            const result = await commandInstance.execute(command.entities);

            // Gestisci i comandi che richiedono follow-up
            if (result && typeof result === 'object' && result.ok === false && result.msg && result.msg.includes('askFor')) {
                return result; // ConversationManager.askFor result
            }

            return result;
        } catch (error) {
            console.error(`[Glitchy] Errore nell'esecuzione del comando ${command.intent}:`, error);
            return { ok: false, msg: personaReply(CONFIG.errorMessages.genericError, 'sarcastic', null, null, this.brain.uiState) };
        }
    }

    async #handleQuickReply(action, payload) {
        const userMessage = `${action.replace(/-/g, ' ')}${payload ? ' ' + payload : ''}`;
        this.pushMessage('user', userMessage);

        const entityMap = { 'open-project': 'projectName', 'set-cursor': 'cursorType', 'search-projects': 'technology', 'navigate': 'sectionName' };
        const command = { intent: action, entities: {} };
        if (payload && entityMap[action]) {
            command.entities[entityMap[action]] = payload;
        }

        const res = await this.#executeCommandSafely(command);
        const personalizedResponse = await this.brain.generatePersonalizedResponse(res.msg, userMessage, action);
        this.#addAIMessage(personalizedResponse, res.options || {});
        
        if (action === 'onboarding-next') this.#advanceOnboarding();
        if (action === 'onboarding-skip') this.#endOnboarding();
        if (action === 'mantis-joke') this.#addAIMessage(randomGlitchyJoke());
    }

    pushMessage(role, text, opts = {}) {
        if (role === 'user') {
            this.#addUserMessage(text);
            this.history.push({ role: 'user', text, opts });
        } else {
            this.#addAIMessage(text, opts);
            this.history.push({ role: 'ai', text, opts });
        }
        this.#saveHistory();
    }
    
    #addUserMessage(text) {
        const m = mk('div', 'msg user', text);
        this.messages.append(m);
        this.#scrollMessages();
        setTimeout(() => m.classList.add('animate-in'), 10);
    }
    
    #addAIMessage(text, opts = {}) {
        this.#hideTypingIndicator();
        const m = mk('div', 'msg ai');
        
        // Sanitize HTML content to prevent XSS attacks
        const safeText = opts.html ? window.HTMLSanitizer.sanitize(text) : text;
        m.innerHTML = safeText;
        
        this.messages.append(m);
        
        if (opts.quickReplies && Array.isArray(opts.quickReplies)) {
             const qwrap = mk('div', 'ai-quick-replies');
             opts.quickReplies.forEach(q => {
                const b = mk('button', 'ai-quick-reply', q.label);
                b.dataset.action = q.action || '';
                if(q.payload) b.dataset.payload = q.payload;
                qwrap.append(b);
             });
             this.messages.append(qwrap);
        }
        this.#scrollMessages();
        if (this.soundEnabled) try { siteActions.playSound('notify'); } catch(e){}
        setTimeout(() => m.classList.add('animate-in'), 10);
    }
    
    #showTypingIndicator() {
        if (this.typingIndicator) return;
        this.typingIndicator = mk('div', 'ai-typing');
        this.typingIndicator.append(mk('span'), mk('span'), mk('span'));
        this.messages.append(this.typingIndicator);
        this.#scrollMessages();
        this.#setStatus('typing');
    }

    #hideTypingIndicator() {
        if (this.typingIndicator) { this.typingIndicator.remove(); this.typingIndicator = null; }
        this.#setStatus('active');
    }
    
    #setStatus(status) {
        const indicator = this.header.querySelector('.ai-status-indicator');
        if (indicator) {
            indicator.className = 'ai-status-indicator';
            if (status) indicator.classList.add(status);
        }
    }
    
    #scrollMessages() { this.messages.scrollTop = this.messages.scrollHeight; }

    #loadHistoryAndPrefs() {
        try {
            const rawHist = localStorage.getItem(CONFIG.persistKey);
            this.history = rawHist ? JSON.parse(rawHist) : [];
            this.history.forEach(h => {
                if (h.role === 'user') this.#addUserMessage(h.text);
                else this.#addAIMessage(h.text, h.opts || {});
            });
        } catch (e) { this.history = []; }

        try {
            const prefs = JSON.parse(localStorage.getItem('ai_chat_prefs') || '{}');
            CONFIG.defaultTone = prefs.tone || 'sarcastic';
            this.soundEnabled = typeof prefs.sound !== 'undefined' ? prefs.sound : true;
            const toneSelect = this.settingsPanel.querySelector('#ai-tone-select');
            if (toneSelect) toneSelect.value = CONFIG.defaultTone;
            const soundToggle = this.settingsPanel.querySelector('#ai-sound-toggle');
            if (soundToggle) soundToggle.checked = this.soundEnabled;
        } catch (e) {}
    }

    #saveHistory() { try { localStorage.setItem(CONFIG.persistKey, JSON.stringify(this.history.slice(-50))); } catch (e) {} }
    
    #clearHistory() {
        this.history = [];
        this.#saveHistory();
        this.messages.innerHTML = '';
        this.#addAIMessage(personaReply('Cronologia cancellata.', 'neutral', null, null, this.brain.uiState));
    }

    #savePrefs() {
        const newPrefs = {
			tone: this.settingsPanel.querySelector('#ai-tone-select').value,
			sound: this.settingsPanel.querySelector('#ai-sound-toggle').checked,
		};
		localStorage.setItem('ai_chat_prefs', JSON.stringify(newPrefs));
		CONFIG.defaultTone = newPrefs.tone;
		this.soundEnabled = newPrefs.sound;
		this.#addAIMessage(personaReply('Impostazioni salvate.', 'helpful', null, null, this.brain.uiState));
		this.settingsPanel.style.display = 'none';
    }

    #updateTheme() {
        const isDark = document.body.classList.contains('theme-dark');
        this.wrapper.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }

    #startOnboardingIfNeeded() {
        const ONBOARD_KEY = 'ai_onboard_v2';
        try { if (!localStorage.getItem(ONBOARD_KEY)) this.#startOnboarding(); } catch (e) {}
    }
    
        #startOnboarding() {
        this.onboardingActive = true; this.onboardingIndex = 0;
        localStorage.setItem('ai_onboard_v2', 'in-progress');
        this.setOpen(true);
        setTimeout(() => this.#showOnboardingStep(), 600);
    }

    /**
     * Metodo pubblico per testare l'elaborazione dell'input utente
     */
    async processUserInputForTest(text) {
        return await this.#processUserInput(text);
    }

    #showOnboardingStep() {
        if (this.onboardingIndex >= CONFIG.onboardingSteps.length) { this.#endOnboarding(); return; }
        const step = CONFIG.onboardingSteps[this.onboardingIndex];
        this.#addAIMessage(step.text, { quickReplies: step.quickReplies });
    }

	#advanceOnboarding() {
		this.onboardingIndex++;
		this.#showOnboardingStep();
	}

	#endOnboarding() {
		this.onboardingActive = false;
        const ONBOARD_KEY = 'ai_onboard_v2';
		localStorage.setItem(ONBOARD_KEY, 'done');
        if (this.onboardingIndex < CONFIG.onboardingSteps.length -1) {
		    this.#addAIMessage(personaReply('Tour saltato. Puoi riavviarlo dalle impostazioni.', 'helpful', null, null, this.brain.uiState));
        }
	}
}
document.addEventListener('DOMContentLoaded', async () => {
    const chatWidget = new AIChatWidget();
    try {
        await chatWidget.init();
    } catch (error) {
        console.error('[AIChatWidget] Initialization failed:', error);
    }
});