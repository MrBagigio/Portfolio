// assets/js/modules/GlitchImage.js

export class GlitchImage {
    constructor(canvas, imageUrl) {
        if (!canvas) throw new Error('Canvas element not provided.');
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.imageUrl = imageUrl;
        this.image = null;
        this.isInitialized = false;
        this.glitchIntensity = 0;
        this.animationFrameId = null;
    }

    async init() {
        try {
            this.image = await this.loadImage(this.imageUrl);
            this.isInitialized = true;
            this.draw();
            this.canvas.addEventListener('click', () => this.glitch());
        } catch (error) {
            console.error('Failed to initialize GlitchImage:', error);
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }

    // --- MODIFICA CHIAVE: Logica di disegno che previene la distorsione ---
    draw() {
        if (!this.isInitialized) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const canvasAspect = this.canvas.width / this.canvas.height;
        const imageAspect = this.image.naturalWidth / this.image.naturalHeight;

        let sx = 0, sy = 0, sWidth = this.image.naturalWidth, sHeight = this.image.naturalHeight;

        if (imageAspect > canvasAspect) {
            // L'immagine è più "larga" del canvas, quindi la tagliamo verticalmente
            sHeight = this.image.naturalHeight;
            sWidth = sHeight * canvasAspect;
            sx = (this.image.naturalWidth - sWidth) / 2;
        } else {
            // L'immagine è più "alta" del canvas, quindi la tagliamo orizzontalmente
            sWidth = this.image.naturalWidth;
            sHeight = sWidth / canvasAspect;
            sy = (this.image.naturalHeight - sHeight) / 2;
        }
        
        // Disegna la porzione calcolata dell'immagine su tutto il canvas
        this.ctx.drawImage(this.image, sx, sy, sWidth, sHeight, 0, 0, this.canvas.width, this.canvas.height);

        if (this.glitchIntensity > 0) {
            this.applyGlitch();
        }
    }
    
    glitch() {
        if (!this.isInitialized || this.glitchTween) return;

        this.glitchTween = gsap.to(this, {
            glitchIntensity: 1,
            duration: 0.1,
            repeat: 3,
            yoyo: true,
            ease: 'power2.inOut',
            onUpdate: () => this.draw(),
            onComplete: () => {
                this.glitchIntensity = 0;
                this.draw();
                this.glitchTween = null;
            }
        });
    }

    applyGlitch() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const imageData = this.ctx.getImageData(0, 0, w, h);

        for (let i = 0; i < 5; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const spliceWidth = w - x;
            const spliceHeight = Math.random() * 10 + 5;
            
            if (y + spliceHeight > h) continue;

            const spliceData = this.ctx.getImageData(x, y, spliceWidth, spliceHeight);
            this.ctx.putImageData(spliceData, Math.random() * x, y);
        }
        
        const offset = Math.random() * 10 * this.glitchIntensity;
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.drawImage(this.canvas, offset, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }
}