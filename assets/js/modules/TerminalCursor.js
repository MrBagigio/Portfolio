// Percorso: /assets/js/modules/TerminalCursor.js
// ==========================================================================
// MODULE: Terminal Cursor (Versione Finale)
// ==========================================================================

export class TerminalCursor {
    constructor(options = {}) {
        this.cursor = null;
        this.aura = null;
        this.scopeElement = null;
        this.interactiveElements = [];
        this.forceShowTimeout = null;
        this.isVisible = false;
        this.isSuppressed = false;
        this.bodyClassObserver = null;

        this.options = {
            scope: document,
            interactiveSelector: 'a, button, .clickable',
            enableAura: true,
            activeAreaOnly: false,
            cursorColor: '#39ff14',
            auraColor: '#39ff14'
        };
        Object.assign(this.options, options);

        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleBodyClassMutation = this.handleBodyClassMutation.bind(this);
    }

    resolveScope(scope) {
        if (!scope) return document;
        if (scope === document || scope === window) return document;
        if (typeof scope === 'string') {
            const el = document.querySelector(scope);
            return el || document;
        }
        return scope instanceof Element ? scope : document;
    }

    init() {
        this.cursor = document.getElementById('terminal-cursor');
        this.aura = document.getElementById('terminal-aura');
        this.scopeElement = this.resolveScope(this.options.scope);

        if (!this.cursor) {
            console.warn('[TerminalCursor] Elemento #terminal-cursor non trovato.');
            return;
        }

        if (!this.aura && this.options.enableAura) {
            console.warn('[TerminalCursor] Elemento #terminal-aura non trovato. Disabilito aura.');
            this.options.enableAura = false;
        }

        this.interactiveElements = Array.from(this.scopeElement.querySelectorAll(this.options.interactiveSelector));

        // Non mostrare il cursore di default, attendi il primo movimento del mouse
        this.cursor.style.display = 'block';
        this.cursor.style.opacity = '0'; // Inizia invisibile
        this.cursor.style.backgroundColor = this.options.cursorColor;
        this.cursor.classList.add('is-hidden');

        if (this.options.enableAura && this.aura) {
            this.aura.style.display = 'block';
            this.aura.style.opacity = '0'; // Inizia invisibile
            this.aura.style.borderColor = this.options.auraColor;
            this.aura.style.boxShadow = `0 0 10px ${this.options.auraColor}, inset 0 0 10px ${this.options.auraColor}`;
            this.aura.classList.add('is-hidden');
        } else if (this.aura) {
            this.aura.style.display = 'none';
        }

        this.isVisible = false; // Lo stato iniziale è invisibile

        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        this.interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', this.handleMouseEnter);
            el.addEventListener('mouseleave', this.handleMouseLeave);
        });

        this.observeBodyClassChanges();
        this.updateSuppressionState();

        // Prime manuale: evita che il cursore scompaia nelle viste che cambiano il puntatore di sistema
        requestAnimationFrame(() => {
            if (!this.cursor) return;
            if (this.isSuppressed) return;
            const centerX = window.innerWidth * 0.5;
            const centerY = window.innerHeight * 0.5;
            this.moveCursor(centerX, centerY, 0);
            this.setVisibility(true, true);
        });
    }

    observeBodyClassChanges() {
        if (typeof MutationObserver === 'undefined' || !document?.body) return;
        this.bodyClassObserver = new MutationObserver(this.handleBodyClassMutation);
        this.bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    handleBodyClassMutation() {
        this.updateSuppressionState();
    }

    updateSuppressionState() {
        const body = document.body;
        if (!body) return;
        const shouldSuppress = body.classList.contains('js-pacman-cursor-active') || body.classList.contains('custom-cursor-active');
        if (shouldSuppress === this.isSuppressed) return;

        this.isSuppressed = shouldSuppress;
        if (this.isSuppressed) {
            this.setVisibility(false, true);
        } else {
            // Riattiva visibilità alla prima mossa dopo la soppressione
            this.isVisible = false;
        }
    }

    pointInsideScope(x, y) {
        if (!this.scopeElement || this.scopeElement === document) return true;
        const rect = this.scopeElement.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    setVisibility(visible, immediate = false) {
        if (!this.cursor) return;
        if (this.isSuppressed && visible) return;
        if (this.isVisible === visible && !immediate) return;
        this.isVisible = visible;

        // Usa l'opacità per la transizione fade-in/out
        const targetOpacity = visible ? '1' : '0';
        this.cursor.style.opacity = targetOpacity;
        if (this.options.enableAura && this.aura) {
            this.aura.style.opacity = targetOpacity;
        }
    }

    moveCursor(clientX, clientY, duration = 0.18) {
        if (!this.cursor) return;

        // Aggiorna direttamente left/top per garantire il tracciamento immediato
        const applyDirectPosition = () => {
            this.cursor.style.left = `${clientX}px`;
            this.cursor.style.top = `${clientY}px`;
            if (this.options.enableAura && this.aura) {
                this.aura.style.left = `${clientX}px`;
                this.aura.style.top = `${clientY}px`;
            }
        };

        if (typeof gsap === 'undefined' || duration <= 0) {
            applyDirectPosition();
            return;
        }

        const ease = 'power3.out';
        gsap.to(this.cursor, { duration, left: clientX, top: clientY, ease, overwrite: 'auto' });
        if (this.options.enableAura && this.aura) {
            gsap.to(this.aura, { duration: Math.max(duration, 0.28), left: clientX, top: clientY, ease, overwrite: 'auto' });
        }
    }

    handleMouseMove(e) {
        if (!this.cursor || this.isSuppressed) return;

        // Al primo movimento, rendi visibile il cursore
        if (!this.isVisible) {
            this.setVisibility(true);
        }

        const { clientX, clientY } = e;
        const inside = this.options.activeAreaOnly ? this.pointInsideScope(clientX, clientY) : true;

        if (!inside) {
            if (!this.forceShowTimeout) {
                this.setVisibility(false);
            }
            return;
        }

        this.moveCursor(clientX, clientY);
    }

    handleMouseEnter() {
        if (!this.cursor || this.isSuppressed) return;
        this.cursor.classList.add('cursor-hover');
        if (this.options.enableAura && this.aura) {
            this.aura.classList.add('cursor-hover');
        }
    }

    handleMouseLeave() {
        if (!this.cursor) return;
        this.cursor.classList.remove('cursor-hover');
        if (this.options.enableAura && this.aura) {
            this.aura.classList.remove('cursor-hover');
        }
    }

    primeAt(x, y, { duration = 0.25, persistFor = 900 } = {}) {
        if (!this.cursor) return;
        this.setVisibility(true, true);
        this.moveCursor(x, y, duration);
        if (this.forceShowTimeout) {
            clearTimeout(this.forceShowTimeout);
        }
        if (this.options.activeAreaOnly) {
            this.forceShowTimeout = setTimeout(() => {
                this.forceShowTimeout = null;
                this.setVisibility(false);
            }, persistFor);
        }
    }

    destroy() {
        if (!this.cursor) return;

        window.removeEventListener('mousemove', this.handleMouseMove);
        this.interactiveElements.forEach(el => {
            el.removeEventListener('mouseenter', this.handleMouseEnter);
            el.removeEventListener('mouseleave', this.handleMouseLeave);
        });

        if (this.bodyClassObserver) {
            this.bodyClassObserver.disconnect();
            this.bodyClassObserver = null;
        }

        if (this.forceShowTimeout) {
            clearTimeout(this.forceShowTimeout);
            this.forceShowTimeout = null;
        }

        this.cursor.classList.add('is-hidden');
        this.cursor.style.display = 'none';

        if (this.options.enableAura && this.aura) {
            this.aura.classList.add('is-hidden');
            this.aura.style.display = 'none';
        }
    }
}