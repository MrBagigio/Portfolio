/**
 * LLMIntegration.js
 * Integrazione con Large Language Model per intelligenza avanzata
 */

export class LLMIntegration {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || null, // Da configurare con chiave sicura
            model: config.model || 'gpt-3.5-turbo',
            maxTokens: config.maxTokens || 150,
            temperature: config.temperature || 0.7,
            fallbackEnabled: true,
            ...config
        };

        this.knowledgeBase = null;
        this.conversationHistory = [];
    }

    setKnowledgeBase(kb) {
        this.knowledgeBase = kb;
    }

    /**
     * Genera risposta intelligente usando LLM
     */
    async generateResponse(input, context = {}) {
        try {
            // Prepara prompt con contesto
            const prompt = this._buildPrompt(input, context);

            // Chiama API LLM
            const response = await this._callLLM(prompt);

            if (response) {
                this._updateHistory(input, response);
                return response;
            }

        } catch (error) {
            console.warn('[LLM] API call failed, using fallback:', error.message);
        }

        // Fallback a logica locale
        if (this.config.fallbackEnabled) {
            return this._generateFallbackResponse(input, context);
        }

        return "Mi dispiace, al momento non posso rispondere. Riprova più tardi.";
    }

    _buildPrompt(input, context) {
        const systemPrompt = `Sei Glitchy, un'AI bounty hunter sarcastica e utile nel portfolio di Alessandro Giacobbi, un 3D artist specializzato in environment e character design.

Conoscenze chiave:
- Nome sito: A.P.I.S. TERMINAL v4.0
- Proprietario: Alessandro Giacobbi
- Ruolo: 3D Artist (Maya, ZBrush, Blender, Substance Painter)
- Progetti principali: Biosphaera, LP Project
- Funzionalità sito: Cursori interattivi (Pacman, Asteroids), temi, navigazione AI

Rispondi in modo:
- Sarcastico ma helpful
- Tecnico quando appropriato
- Coinvolgente e creativo
- In italiano, a meno che specificato diversamente

Se l'utente chiede qualcosa relativo al sito/portfolio, fornisci risposte accurate basate sulle conoscenze.`;

        const history = this.conversationHistory.slice(-5).map(h => `User: ${h.input}\nAI: ${h.response}`).join('\n\n');

        return `${systemPrompt}

Storia conversazione recente:
${history}

User: ${input}

AI:`;
    }

    async _callLLM(prompt) {
        if (!this.config.apiKey) {
            throw new Error('API key not configured');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim();
    }

    _generateFallbackResponse(input, context) {
        // Logica semplice di fallback basata su keywords
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('ciao') || lowerInput.includes('salve')) {
            return "Ciao! Sono Glitchy, l'AI bounty hunter di questo portfolio. Cosa posso fare per te?";
        }

        if (lowerInput.includes('progetto') || lowerInput.includes('portfolio')) {
            return "Vuoi vedere i progetti di Alessandro? Prova 'apri biosphaera' o 'vai a progetti'!";
        }

        if (lowerInput.includes('cursore')) {
            return "I cursori sono fantastici! Prova 'cambia cursore in pacman' per un'esperienza gaming.";
        }

        return "Hmm, non ho capito bene. Prova a chiedere 'cosa puoi fare' per suggerimenti!";
    }

    _updateHistory(input, response) {
        this.conversationHistory.push({ input, response, timestamp: Date.now() });
        if (this.conversationHistory.length > 10) {
            this.conversationHistory.shift();
        }
    }

    /**
     * Sanitizza input per sicurezza
     */
    sanitizeInput(input) {
        // Rimuovi caratteri pericolosi, limita lunghezza
        return input.replace(/[<>\"'&]/g, '').substring(0, 500);
    }
}