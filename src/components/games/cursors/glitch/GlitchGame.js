// assets/js/modules/cursors/glitch/GlitchGame.js

export class GlitchGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.isActive = false;
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.isActive = true;
        this.isRunning = false;
        this.animationId = null;

        // Configurazione matrix rain
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];
        this.matrixChars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()";

        // Configurazione cursore
        this.cursor = {
            x: 0,
            y: 0,
            trail: [],
            maxTrail: 20
        };

        // Stato magnetico
        this.magneticTarget = null;

        this.initCanvas();
        this.setupEventListeners();
    }

    initCanvas() {
        // Usa dimensioni della finestra invece di getBoundingClientRect per evitare problemi con canvas nascosto
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.drops = new Array(this.columns).fill(1);
    }

    setupEventListeners() {
        // Aggiorna posizione cursore
        const updateCursorPosition = (e) => {
            if (this.magneticTarget) return; // Se magnetico, usa posizione target

            const rect = this.canvas.getBoundingClientRect();
            this.cursor.x = e.clientX - rect.left;
            this.cursor.y = e.clientY - rect.top;

            // Aggiungi alla trail
            this.cursor.trail.push({ x: this.cursor.x, y: this.cursor.y, life: 1 });
            if (this.cursor.trail.length > this.cursor.maxTrail) {
                this.cursor.trail.shift();
            }
        };

        document.addEventListener('mousemove', updateCursorPosition);

        // Gestisci resize
        window.addEventListener('resize', () => {
            this.initCanvas();
        });
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isRunning) return;

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update() {
        // Aggiorna matrix rain
        for (let i = 0; i < this.drops.length; i++) {
            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }

        // Aggiorna trail del cursore
        this.cursor.trail.forEach((point, index) => {
            point.life -= 0.02;
            if (point.life <= 0) {
                this.cursor.trail.splice(index, 1);
            }
        });

        // Aggiorna posizione magnetica se attiva
        if (this.magneticTarget) {
            const rect = this.magneticTarget.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();
            this.cursor.x = rect.left + rect.width / 2 - canvasRect.left;
            this.cursor.y = rect.top + rect.height / 2 - canvasRect.top;
        }
    }

    draw() {
        // Sfondo semi-trasparente per effetto trail
        this.ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Disegna matrix rain
        this.ctx.fillStyle = '#39ff14';
        this.ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            // Carattere casuale
            const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];

            // Effetto fade per colonne lontane dal cursore
            const distance = Math.abs(i * this.fontSize - this.cursor.x);
            const alpha = Math.max(0.1, 1 - distance / (this.canvas.width / 2));
            this.ctx.globalAlpha = alpha;

            this.ctx.fillText(char, i * this.fontSize, this.drops[i] * this.fontSize);
        }

        this.ctx.globalAlpha = 1;

        // Disegna trail del cursore
        this.cursor.trail.forEach((point, index) => {
            const alpha = point.life;
            const size = this.fontSize * (0.5 + point.life * 0.5);

            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#39ff14';
            this.ctx.font = size + 'px monospace';

            // Carattere glitch vicino al cursore
            const glitchChar = Math.random() > 0.7 ? '█' : Math.random() > 0.7 ? '▓' : '▒';
            this.ctx.fillText(glitchChar, point.x - size/2, point.y + size/2);
        });

        this.ctx.globalAlpha = 1;

        // Disegna cursore principale
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = (this.fontSize * 1.5) + 'px monospace';
        this.ctx.fillText('█', this.cursor.x - this.fontSize * 0.75, this.cursor.y + this.fontSize * 0.75);

        // Effetto glow
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#39ff14';
        this.ctx.fillText('█', this.cursor.x - this.fontSize * 0.75, this.cursor.y + this.fontSize * 0.75);
        this.ctx.shadowBlur = 0;
    }

    setMagneticTarget(targetElement) {
        this.magneticTarget = targetElement;
    }

    clearMagneticTarget(targetElement) {
        if (this.magneticTarget === targetElement) {
            this.magneticTarget = null;
        }
    }
}