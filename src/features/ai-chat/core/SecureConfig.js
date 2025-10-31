/**
 * SecureConfig.js
 * Configurazione sicura per API keys e rate limiting
 */

// Nota: In produzione, queste chiavi dovrebbero essere in variabili d'ambiente server-side
// Per demo client-side, usa placeholder - sostituire con chiave reale se necessario

export const SECURE_CONFIG = {
    // API Keys (da configurare esternamente per sicurezza)
    openai: {
        apiKey: (typeof window !== 'undefined' && window.OPENAI_API_KEY) || null, // Configurabile via window.OPENAI_API_KEY
        model: 'gpt-3.5-turbo',
        maxTokens: 150
    },

    // Rate Limiting
    rateLimit: {
        maxRequestsPerMinute: 30, // Aumentato per test
        maxRequestsPerHour: 100,  // Aumentato per test
        cooldownMs: 30000 // Ridotto a 30 secondi
    },

    // Sicurezza
    security: {
        maxInputLength: 500,
        allowedChars: /^[a-zA-Z0-9\s\.,!?;:'"()-àèéìòùÀÈÉÌÒÙ]+$/,
        sanitizeHtml: true
    }
};

// Rate limiter migliorato con persistenza e controlli avanzati
export class RateLimiter {
    constructor(config = SECURE_CONFIG.rateLimit) {
        this.config = config;
        this.storageKey = 'glitchy_rate_limit';
        this.fingerprintKey = 'glitchy_fingerprint';
        this.loadState();
        this.generateFingerprint();
    }

    loadState() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                this.requests = Array.isArray(data.requests) ? data.requests : [];
                this.blockedUntil = data.blockedUntil || 0;
            } else {
                this.requests = [];
                this.blockedUntil = 0;
            }
        } catch (e) {
            console.warn('[RateLimiter] Error loading state:', e);
            this.requests = [];
            this.blockedUntil = 0;
        }
    }

    saveState() {
        try {
            const data = {
                requests: this.requests,
                blockedUntil: this.blockedUntil,
                fingerprint: this.fingerprint
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('[RateLimiter] Error saving state:', e);
        }
    }

    generateFingerprint() {
        // Genera un fingerprint basato su caratteristiche del browser
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('fingerprint', 2, 2);
        const fingerprint = canvas.toDataURL();

        this.fingerprint = btoa(fingerprint).substring(0, 32);
        localStorage.setItem(this.fingerprintKey, this.fingerprint);
    }

    canMakeRequest() {
        const now = Date.now();

        // Controlla se siamo ancora bloccati
        if (now < this.blockedUntil) {
            return false;
        }

        // Rimuovi richieste vecchie (finestra scorrevole)
        const windowStart = now - (60 * 1000); // Ultimo minuto
        this.requests = this.requests.filter(time => time > windowStart);

        // Controlla limite per minuto
        if (this.requests.length >= this.config.maxRequestsPerMinute) {
            this.blockedUntil = now + this.config.cooldownMs;
            this.saveState();
            return false;
        }

        // Controlla limite per ora
        const hourWindow = now - (60 * 60 * 1000);
        const hourlyRequests = this.requests.filter(time => time > hourWindow);
        if (hourlyRequests.length >= this.config.maxRequestsPerHour) {
            this.blockedUntil = now + (5 * 60 * 1000); // 5 minuti di blocco
            this.saveState();
            return false;
        }

        // Aggiungi la nuova richiesta
        this.requests.push(now);
        this.saveState();
        return true;
    }

    getRemainingTime() {
        const now = Date.now();

        if (now < this.blockedUntil) {
            return this.blockedUntil - now;
        }

        // Calcola tempo rimanente prima del prossimo reset
        if (this.requests.length > 0) {
            const oldest = Math.min(...this.requests);
            const timeToReset = (60 * 1000) - (now - oldest);
            return Math.max(0, timeToReset);
        }

        return 0;
    }

    getStats() {
        const now = Date.now();
        const minuteWindow = now - (60 * 1000);
        const hourWindow = now - (60 * 60 * 1000);

        return {
            requestsLastMinute: this.requests.filter(time => time > minuteWindow).length,
            requestsLastHour: this.requests.filter(time => time > hourWindow).length,
            isBlocked: now < this.blockedUntil,
            blockedUntil: this.blockedUntil,
            remainingTime: this.getRemainingTime()
        };
    }

    reset() {
        this.requests = [];
        this.blockedUntil = 0;
        this.saveState();
    }
}

// Input sanitizer
export class InputSanitizer {
    constructor(config = SECURE_CONFIG.security) {
        this.config = config;
    }

    sanitize(input) {
        if (!input || typeof input !== 'string') return '';

        let sanitized = input.substring(0, this.config.maxInputLength);

        // Rimuovi caratteri pericolosi
        sanitized = sanitized.replace(/[<>\"'&]/g, '');

        // Filtra caratteri non consentiti se regex definita
        if (this.config.allowedChars) {
            sanitized = sanitized.replace(new RegExp(`[^${this.config.allowedChars.source.slice(1, -1)}]`, 'g'), '');
        }

        return sanitized.trim();
    }
}