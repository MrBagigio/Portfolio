// assets/js/modules/TextScramble.js

export class TextScramble {
    constructor(el) {
        this.el = el;
        this.originalText = el.innerText;
        this.chars = '!<>-_\\/[]{}—=+*^?#';
        this.animationFrameId = null;
        this.isGlitching = false;
    }

    /**
     * --- NUOVA IMPLEMENTAZIONE: Avvia un loop di glitch continuo ---
     * Mantiene il testo leggibile ma sostituisce casualmente alcune lettere.
     * @param {number} intensity - Probabilità (0-1) che un carattere venga sostituito.
     */
    startGlitch(intensity = 0.3) {
        if (this.isGlitching) return;
        this.isGlitching = true;
        
        const update = () => {
            if (!this.isGlitching) return; // Se è stato fermato, esci dal loop

            let output = '';
            for (let i = 0; i < this.originalText.length; i++) {
                const char = this.originalText[i];
                // Con una certa probabilità, sostituisci il carattere se non è uno spazio
                if (Math.random() < intensity && char !== ' ') {
                    output += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    output += char;
                }
            }
            this.el.innerHTML = output;
            this.animationFrameId = requestAnimationFrame(update);
        };

        this.animationFrameId = requestAnimationFrame(update);
    }

    /**
     * --- NUOVA IMPLEMENTAZIONE: Ferma il loop e ripristina il testo originale ---
     */
    stopGlitch() {
        if (!this.isGlitching) return;
        this.isGlitching = false;
        cancelAnimationFrame(this.animationFrameId);
        this.el.innerText = this.originalText;
    }

    /**
     * Anima il testo da uno stato all'altro.
     * @param {string} newText - Il nuovo testo da visualizzare.
     * @returns {Promise<void>}
     */
    setText(newText) {
        return new Promise((resolve) => {
            this.stopGlitch(); // Assicura che il glitch sia fermo
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            
            let frame = 0;
            const update = () => {
                let output = '';
                let complete = 0;
                for (let i = 0; i < length; i++) {
                    const from = oldText[i] || '';
                    const to = newText[i] || '';
                    const progress = frame / 35; // Velocità
                    const revealThreshold = i / length;

                    if (progress >= revealThreshold) {
                        output += to;
                        complete++;
                    } else {
                        output += this.chars[Math.floor(Math.random() * this.chars.length)];
                    }
                }
                this.el.innerHTML = output;

                if (complete === length) {
                    this.originalText = newText; // Aggiorna il testo originale
                    resolve();
                } else {
                    frame++;
                    this.animationFrameId = requestAnimationFrame(update);
                }
            };
            this.animationFrameId = requestAnimationFrame(update);
        });
    }
}