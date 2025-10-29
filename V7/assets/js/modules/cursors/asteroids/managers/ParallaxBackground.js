// assets/js/modules/cursors/asteroids/managers/ParallaxBackground.js

class Star {
    constructor(x, y, z, speed) {
        this.x = x; // Posizione assoluta sulla pagina
        this.y = y; // Posizione assoluta sulla pagina
        this.z = z; // Profondità
        this.speed = speed;
    }

    update(mouseVelocity, viewWidth) {
        // Il movimento parallax è relativo alla profondità
        this.x -= (mouseVelocity.x * (this.z / viewWidth)) * this.speed;
        this.y -= (mouseVelocity.y * (this.z / viewWidth)) * this.speed;
    }

    draw(ctx, viewWidth) {
        const size = (1 - this.z / viewWidth) * 2;
        const alpha = (1 - this.z / viewWidth) * 0.8;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class ParallaxBackground {
    constructor() {
        this.stars = [];
        this.bounds = {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight
        };
        this.expansionFactor = 0.5; // Quanto buffer aggiungere
        this.initStars();
    }

    initStars() {
        this.stars = [];
        const initialWidth = this.bounds.right;
        const initialHeight = this.bounds.bottom;
        for (let i = 0; i < 200; i++) {
            this.stars.push(this._createStarInBounds(this.bounds, initialWidth));
        }
    }

    _createStarInBounds(bounds, depthReference) {
        const x = Math.random() * (bounds.right - bounds.left) + bounds.left;
        const y = Math.random() * (bounds.bottom - bounds.top) + bounds.top;
        const z = Math.random() * depthReference;
        const speed = z < depthReference / 2 ? 0.05 : 0.1;
        return new Star(x, y, z, speed);
    }

    update(mouseVelocity, player) {
        const viewWidth = window.innerWidth;
        this.stars.forEach(star => star.update(mouseVelocity, viewWidth));

        this._expandBounds(player.x, player.y);
        this._cleanupStars(player.x, player.y);
    }

    _expandBounds(centerX, centerY) {
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;
        const bufferX = viewWidth * this.expansionFactor;
        const bufferY = viewHeight * this.expansionFactor;

        let expanded = false;
        // Espandi a destra
        if (centerX > this.bounds.right - bufferX) {
            const newBounds = { left: this.bounds.right, right: this.bounds.right + viewWidth, top: this.bounds.top, bottom: this.bounds.bottom };
            for (let i = 0; i < 100; i++) this.stars.push(this._createStarInBounds(newBounds, viewWidth));
            this.bounds.right += viewWidth;
            expanded = true;
        }
        // Espandi a sinistra
        if (centerX < this.bounds.left + bufferX) {
            const newBounds = { left: this.bounds.left - viewWidth, right: this.bounds.left, top: this.bounds.top, bottom: this.bounds.bottom };
            for (let i = 0; i < 100; i++) this.stars.push(this._createStarInBounds(newBounds, viewWidth));
            this.bounds.left -= viewWidth;
            expanded = true;
        }
        // Espandi in basso
        if (centerY > this.bounds.bottom - bufferY) {
            const newBounds = { left: this.bounds.left, right: this.bounds.right, top: this.bounds.bottom, bottom: this.bounds.bottom + viewHeight };
            for (let i = 0; i < 100; i++) this.stars.push(this._createStarInBounds(newBounds, viewWidth));
            this.bounds.bottom += viewHeight;
            expanded = true;
        }
        // Espandi in alto
        if (centerY < this.bounds.top + bufferY) {
            const newBounds = { left: this.bounds.left, right: this.bounds.right, top: this.bounds.top - viewHeight, bottom: this.bounds.top };
            for (let i = 0; i < 100; i++) this.stars.push(this._createStarInBounds(newBounds, viewWidth));
            this.bounds.top -= viewHeight;
            expanded = true;
        }
    }

    _cleanupStars(centerX, centerY) {
        const cleanupDistanceX = window.innerWidth * 2;
        const cleanupDistanceY = window.innerHeight * 2;
        this.stars = this.stars.filter(star => {
            return Math.abs(star.x - centerX) < cleanupDistanceX && Math.abs(star.y - centerY) < cleanupDistanceY;
        });
    }

    draw(ctx) {
        const viewWidth = window.innerWidth;
        ctx.save();
        // Applica lo scroll per disegnare le stelle con coordinate assolute nella posizione corretta
        ctx.translate(-window.scrollX, -window.scrollY);
        this.stars.forEach(star => star.draw(ctx, viewWidth));
        ctx.restore();
    }
    
    // Manteniamo un metodo resize per compatibilità, anche se ora è meno centrale
    resize() {
        // La logica di espansione dinamica gestisce la dimensione,
        // ma potremmo voler resettare o aggiustare qualcosa qui in futuro.
    }
}