/**
 * AIChatWidget.js
 * 
 * Gestisce l'interfaccia utente (UI) della chat.
 * Questo componente orchestra le interazioni dell'utente, visualizza i messaggi
 * e comunica con il "cervello" di Glitchy e altri moduli di servizio.
 */

// --- 1. IMPORTAZIONI ---
// Servizi e logica esterna
import siteActions from './siteActions.js';
import { parse } from './NLU.js';
import ConversationManager from './ConversationManager.js';

// Intelligenza Artificiale di Glitchy
import GlitchyBrain from './ai/GlitchyBrain.js';

// Utility e Configurazione
import { mk } from './utils/dom.js';
import { personaReply, randomGlitchyJoke } from './utils/persona.js';
import { CONFIG } from './config.js';

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
        this.brain = new GlitchyBrain(); // L'istanza del cervello AI

        // --- Riferimenti a Elementi DOM ---
        this.wrapper = null;
        this.panel = null;
        this.messages = null;
        this.input = null;
        this.header = null;
        this.settingsPanel = null;
        // ... e tutti gli altri elementi che servono
    }

    /**
     * Punto di ingresso pubblico per creare e avviare il widget.
     */
    init() {
        console.log(`[${CONFIG.name}] Initializing Widget...`);
        this.#createDOM();
        this.#loadHistoryAndPrefs();
        this.#bindEvents();
        document.body.appendChild(this.wrapper);
        this.#updateTheme();
        this.#startOnboardingIfNeeded();
        console.log(`[${CONFIG.name}] Widget ready.`);
    }

    // --- METODI PRIVATI PER LA GESTIONE DELLA UI ---

    #createDOM() {
        this.wrapper = mk('div', 'ai-chat-widget');
        this.panel = mk('div', 'ai-chat-panel');
        this.header = mk('div', 'ai-chat-header');
        
        const avatar = mk('div', 'ai-avatar');
        avatar.innerHTML = `<img src="assets/img/glitchy-avatar.svg" alt="${CONFIG.name}" class="ai-pixel"/>`;
        const titleBox = mk('div', 'ai-chat-meta');
        titleBox.append(
            mk('div', 'ai-chat-title', CONFIG.name),
            mk('div', 'ai-chat-sub', 'Assistente virtuale del sito')
        );
        const statusIndicator = mk('div', 'ai-status-indicator');
        this.header.append(avatar, titleBox, statusIndicator);

        const actions = mk('div', 'ai-chat-actions');
        this.btnProjects = mk('button', 'ai-chat-action-btn', 'PROGETTI');
        this.btnCursor = mk('button', 'ai-chat-action-btn', 'CURSORE');
        this.btnTop = mk('button', 'ai-chat-action-btn', 'HOME');
        this.btnClear = mk('button', 'ai-chat-action-btn ai-clear-btn', 'CLR');
        this.btnClear.title = 'Cancella cronologia chat';
        this.btnSettings = mk('button', 'ai-chat-action-btn', '⚙️');
        this.btnSettings.title = 'Impostazioni';
        actions.append(this.btnProjects, this.btnCursor, this.btnTop, this.btnClear, this.btnSettings);
        this.header.appendChild(actions);

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
        this.toggleButton = mk('button', 'ai-chat-toggle', '🤖');
        this.toggleButton.title = `Apri chat con ${CONFIG.name}`;
        toggleContainer.append(this.toggleButton);

        this.wrapper.append(this.panel, toggleContainer);
        this.panel.style.display = 'none';
    }

    #createSettingsPanel() {
        this.settingsPanel = mk('div', 'ai-settings-panel');
        this.settingsPanel.style.display = 'none';
        this.settingsPanel.innerHTML = `
            <div class="ai-settings-inner">
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
            </div>
        `;
    }

    #bindEvents() {
        this.toggleButton.addEventListener('click', () => this.setOpen(true));
        this.sendBtn.addEventListener('click', () => this.#handleSend());
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.#handleSend(); }
        });

        this.btnProjects.addEventListener('click', () => this.#handleQuickAction('apri progetto Biosphaera', 'Apro il progetto Biosphaera.', () => siteActions.openProjectCase('biosphaera')));
        this.btnCursor.addEventListener('click', () => this.#handleQuickAction('cursore pacman', 'Imposto cursore Pacman.', () => siteActions.setGameCursor('pacman')));
        this.btnTop.addEventListener('click', () => this.#handleQuickAction('vai a hero', 'Torno alla Home.', () => siteActions.navigateTo('hero')));
        this.btnClear.addEventListener('click', () => this.#clearHistory());

        this.btnSettings.addEventListener('click', () => {
            this.settingsPanel.style.display = this.settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
        this.settingsPanel.querySelector('#ai-save-prefs').addEventListener('click', () => this.#savePrefs());
        this.settingsPanel.querySelector('#ai-cancel-prefs').addEventListener('click', () => { this.settingsPanel.style.display = 'none'; });
        this.settingsPanel.querySelector('#ai-restart-onboarding').addEventListener('click', () => {
            this.settingsPanel.style.display = 'none';
            this.#startOnboarding();
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.wrapper.contains(e.target)) this.setOpen(false);
            const quickReply = e.target.closest('.ai-quick-reply');
            if (quickReply) {
                const action = quickReply.dataset.action;
                const payload = quickReply.dataset.payload;
                this.#handleQuickReply(action, payload);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.setOpen(true);
            }
            if (e.key === 'Escape' && this.isOpen) this.setOpen(false);
        });

        new MutationObserver(() => this.#updateTheme()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    #handleQuickAction(userText, aiText, actionCallback) {
        this.pushMessage('user', userText);
        setTimeout(() => {
            const reply = personaReply(aiText, CONFIG.defaultTone);
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
                    this.#addAIMessage(personaReply(`Ciao! Sono ${CONFIG.name}. Prova a dirmi: "apri progetto Biosphaera".`, CONFIG.defaultTone));
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
            // --- LOGICA IBRIDA ---
            // 1. Prima proviamo a vedere se è un comando locale che conosciamo
            const localCommand = await parse(text);

            if (localCommand && localCommand.intent !== 'unknown') {
                // È un comando locale! Eseguilo velocemente e gratis.
                console.log("[Glitchy] Comando locale riconosciuto:", localCommand.intent);
                const res = await this.#executeCommandSafely(localCommand);
                await new Promise(r => setTimeout(r, 300)); // Simula pensiero
                this.#addAIMessage(personaReply(res.msg, CONFIG.defaultTone), res.options || {});
            } else {
                // 2. Non è un comando locale. È una domanda aperta. Chiamiamo l'LLM!
                console.log("[Glitchy] Comando non riconosciuto. Chiamo il backend...");
                
                // Chiamata al nostro "ponte API" su Vercel
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'La risposta dal server non è valida.');
                }
                
                const data = await response.json();
                this.#addAIMessage(data.reply); // Mostra la risposta generata da Llama
            }

        } catch (err) {
            console.error(`[Glitchy] Errore durante #handleSend:`, err);
            this.#addAIMessage("Oops, [bzt..] c'è stato un corto circuito nel mio cervello principale.");
        } finally {
            this.#hideTypingIndicator();
        }
    }

    async #executeCommandSafely(command) {
        if (!command || !command.intent) {
            return { ok: false, msg: personaReply('Comando non valido.', 'sarcastic') };
        }
        if (!CONFIG.allowedActions.includes(command.intent)) {
            return { ok: false, msg: personaReply('Azione non autorizzata.', 'sarcastic') };
        }
        
        const { intent, entities } = command;
        
        switch (intent) {
            case 'openProject':
                if (!entities.projectName) return { ok: false, msg: ConversationManager.askFor('projectName', 'Quale progetto?') };
                return siteActions.openProjectCase(entities.projectName);
            case 'setCursor':
                if (!entities.cursorType) return { ok: false, msg: ConversationManager.askFor('cursorType', 'Quale cursore?') };
                return siteActions.setGameCursor(entities.cursorType);
            case 'navigate':
                if (!entities.sectionName) return { ok: false, msg: ConversationManager.askFor('sectionName', 'Dove vuoi andare?') };
                return siteActions.navigateTo(entities.sectionName);
            case 'searchProjects':
                 if (!entities.technology) return { ok: false, msg: ConversationManager.askFor('technology', 'Quale tecnologia?') };
                 return siteActions.searchProjectsByTechnology(entities.technology);
            // Incolla qui TUTTI gli altri 'case' dalla tua funzione originale.
            // Esempio:
            // case 'getWeather':
            //     if (!entities.location) return { ok: false, msg: ConversationManager.askFor('location', 'Per quale città?') };
            //     return siteActions.getWeather(entities.location);
            default:
                return { ok: false, msg: `Il comando '${intent}' non è ancora implementato.` };
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
        this.#addAIMessage(personaReply(res.msg, 'helpful'), res.options || {});
        
        if (action === 'onboarding-next') this.#advanceOnboarding();
        if (action === 'onboarding-skip') this.#endOnboarding();
        if (action === 'mantis-joke') this.#addAIMessage(randomGlitchyJoke());
    }

    pushMessage(role, text) {
        if (role === 'user') {
            this.#addUserMessage(text);
            this.history.push({ role: 'user', text });
        } else {
            this.#addAIMessage(text);
            this.history.push({ role: 'ai', text });
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
        if (opts.html) m.innerHTML = text; else m.textContent = text;
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
            this.settingsPanel.querySelector('#ai-tone-select').value = CONFIG.defaultTone;
            this.settingsPanel.querySelector('#ai-sound-toggle').checked = this.soundEnabled;
        } catch (e) {}
    }

    #saveHistory() { try { localStorage.setItem(CONFIG.persistKey, JSON.stringify(this.history.slice(-50))); } catch (e) {} }
    
    #clearHistory() {
        this.history = [];
        this.messages.innerHTML = '';
        this.#saveHistory();
        this.#addAIMessage(personaReply('Cronologia cancellata.', 'neutral'));
    }

    #savePrefs() {
        const newPrefs = {
			tone: this.settingsPanel.querySelector('#ai-tone-select').value,
			sound: this.settingsPanel.querySelector('#ai-sound-toggle').checked,
		};
		localStorage.setItem('ai_chat_prefs', JSON.stringify(newPrefs));
		CONFIG.defaultTone = newPrefs.tone;
		this.soundEnabled = newPrefs.sound;
		this.#addAIMessage(personaReply('Impostazioni salvate.', 'helpful'));
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

    #showOnboardingStep() {
        const ONBOARD_STEPS = [
            { text: `Benvenuto! Sono ${CONFIG.name}. Vuoi una battuta per rompere il ghiaccio?`, quickReplies: [{ label: 'Certo, spara!', action: 'mantis-joke' }, { label: 'No, vai avanti', action: 'onboarding-next' }] },
            { text: 'Posso aprire i progetti per te. Prova a cliccare qui sotto.', quickReplies: [{ label: 'Apri "Biosphaera"', action: 'open-project', payload: 'biosphaera' }, { label: 'Avanti', action: 'onboarding-next' }] },
            { text: 'E anche cambiare il cursore. Che ne dici di Pacman?', quickReplies: [{ label: 'Mostrami Pacman', action: 'set-cursor', payload: 'pacman' }, { label: 'Salta', action: 'onboarding-skip' }] },
            { text: 'Perfetto! Il tour è finito. Se hai bisogno, premi "/" o clicca sulla mia icona.', quickReplies: [{ label: 'Ho capito!', action: 'onboarding-skip' }] }
        ];
		if (this.onboardingIndex >= ONBOARD_STEPS.length) { this.#endOnboarding(); return; }
		const step = ONBOARD_STEPS[this.onboardingIndex];
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
        if (this.onboardingIndex < ONBOARD_STEPS.length -1) {
		    this.#addAIMessage(personaReply('Tour saltato. Puoi riavviarlo dalle impostazioni.', 'helpful'));
        }
	}
}