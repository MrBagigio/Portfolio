// src/components/games/cursors/simple/SimpleGame.js

// import gsap from 'gsap/src/index.js';

export class SimpleGame {
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

        this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.aura = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.auraDelay = 0.6; // seconds delay for aura

        // Magnetic effect properties
        this.magneticTarget = null;
        this.isInMagneticMode = false;
        this.magneticRadius = 60; // distance to trigger magnetic effect
        this.magneticExitRadius = 80; // larger radius to exit magnetic mode (dead zone)
        this.magneticElements = []; // cache of magnetic elements
        this.lastMagneticCheck = 0; // throttle magnetic checks
        
        // Transition properties for smooth magnetic effect
        this.magneticOpacity = 0; // Opacity for magnetic outline (0-1)
        this.auraOpacity = 1; // Opacity for normal aura ring (0-1)

        this.resizeHandler = () => {
            this.initCanvas();
            this.updateMagneticElements();
        };
        this.mouseHandler = (e) => this.onMouseMove(e);

        this.initCanvas();
        this.initMagneticElements();
        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('mousemove', this.mouseHandler);
    }

    initCanvas() {
        // Ensure canvas covers entire viewport
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }

    initMagneticElements() {
        // Find all clickable elements that should trigger magnetic effect
        this.magneticElements = Array.from(document.querySelectorAll('button, a, [role="button"], .nav-link, .interactive-bounce, .magnetic-target, input[type="submit"], input[type="button"], nav a, .navbar a'))
            .filter(el => {
                // Exclude navbar elements to prevent conflicts
                if (el.closest('#chimera-navbar')) {
                    return false;
                }
                
                const style = window.getComputedStyle(el);
                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       el.offsetWidth > 0 &&
                       el.offsetHeight > 0 &&
                       el.getBoundingClientRect().width > 0 &&
                       el.getBoundingClientRect().height > 0;
            });
    }

    updateMagneticElements() {
        // Update magnetic elements list (call this when DOM changes)
        this.initMagneticElements();
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.cursor.x = e.clientX - rect.left;
        this.cursor.y = e.clientY - rect.top;

        // Throttle magnetic checks for better performance
        const now = Date.now();
        if (now - this.lastMagneticCheck < 16) return; // ~60fps
        this.lastMagneticCheck = now;

        // Check for magnetic elements
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        let closestElement = null;
        let closestDistance = this.isInMagneticMode ? this.magneticExitRadius : this.magneticRadius;

        for (const element of this.magneticElements) {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const distance = Math.sqrt(
                Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
            );

            if (distance < closestDistance) {
                // If we're already in magnetic mode, only switch if this element is significantly closer
                // This prevents jumping between nearby elements
                if (this.isInMagneticMode && this.magneticTarget) {
                    const currentRect = this.magneticTarget.getBoundingClientRect();
                    const currentCenterX = currentRect.left + currentRect.width / 2;
                    const currentCenterY = currentRect.top + currentRect.height / 2;
                    const currentDistance = Math.sqrt(
                        Math.pow(mouseX - currentCenterX, 2) + Math.pow(mouseY - currentCenterY, 2)
                    );
                    
                    // Only switch if new element is at least 20px closer than current target
                    if (distance < currentDistance - 20) {
                        closestElement = element;
                        closestDistance = distance;
                    }
                } else {
                    closestElement = element;
                    closestDistance = distance;
                }
            }
        }

        if (closestElement && !this.isInMagneticMode) {
            // Enter magnetic mode
            this.enterMagneticMode(closestElement);
        } else if (!closestElement && this.isInMagneticMode) {
            // Exit magnetic mode only if we're truly far from all magnetic elements
            let shouldExit = true;
            for (const element of this.magneticElements) {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
                );
                if (distance < this.magneticExitRadius) {
                    shouldExit = false;
                    break;
                }
            }
            if (shouldExit) {
                this.exitMagneticMode();
            }
        } else if (this.isInMagneticMode && closestElement && closestElement !== this.magneticTarget) {
            // Switch to different magnetic target (only if hysteresis condition was met above)
            this.exitMagneticMode();
            this.enterMagneticMode(closestElement);
        }

        // Update aura position based on magnetic mode
        if (this.isInMagneticMode && this.magneticTarget) {
            const rect = this.magneticTarget.getBoundingClientRect();
            const targetX = rect.left + rect.width / 2 - this.canvas.getBoundingClientRect().left;
            const targetY = rect.top + rect.height / 2 - this.canvas.getBoundingClientRect().top;

            if (typeof gsap !== 'undefined') {
                gsap.to(this.aura, {
                    duration: 0.4, // Faster attraction
                    x: targetX,
                    y: targetY,
                    ease: 'back.out(1.2)' // Add slight bounce for more dynamic feel
                });
            } else {
                this.aura.x = targetX;
                this.aura.y = targetY;
            }
        } else {
            // Normal aura following with smoother transition
            if (typeof gsap !== 'undefined') {
                gsap.to(this.aura, { 
                    duration: 0.8, // Slightly longer for smoother return
                    x: this.cursor.x, 
                    y: this.cursor.y, 
                    ease: 'power2.out' // Smoother easing for return
                });
            } else {
                this.aura.x = this.cursor.x;
                this.aura.y = this.cursor.y;
            }
        }
    }

    start() {
        if (this.isRunning || !this.isActive) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }

    animate() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update() {
        // no trail update needed
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.isInMagneticMode && this.magneticTarget) {
            // Draw white outline around the element - slightly larger than element
            const rect = this.magneticTarget.getBoundingClientRect();

            // Use viewport coordinates directly (canvas is full screen)
            const elementX = rect.left;
            const elementY = rect.top;
            const elementWidth = rect.width;
            const elementHeight = rect.height;

            // Draw white outline slightly larger than the element with rounded corners
            const padding = 4; // extra space around element
            const radius = 6; // border radius for rounded corners
            const x = elementX - padding;
            const y = elementY - padding;
            const width = elementWidth + (padding * 2);
            const height = elementHeight + (padding * 2);

            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * this.magneticOpacity})`;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            // Draw rounded rectangle manually for better compatibility
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.stroke();
        }

        // Always draw normal aura - subtle white ring with smooth opacity transition
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * this.auraOpacity})`;
        ctx.lineWidth = 1.5;
        ctx.arc(this.aura.x, this.aura.y, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Draw cursor dot with subtle glow
        ctx.beginPath();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 3;
        ctx.arc(this.cursor.x, this.cursor.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
    }

    enterMagneticMode(targetElement) {
        if (this.magneticTarget === targetElement) return;

        this.magneticTarget = targetElement;
        this.isInMagneticMode = true;

        // Smooth transition: fade in magnetic outline, fade out normal aura
        if (typeof gsap !== 'undefined') {
            gsap.to(this, {
                duration: 0.3,
                magneticOpacity: 1,
                auraOpacity: 0,
                ease: 'power2.out'
            });
        } else {
            this.magneticOpacity = 1;
            this.auraOpacity = 0;
        }
    }

    exitMagneticMode() {
        if (this.magneticTarget) {
            // No CSS classes to remove - effect is handled in canvas
        }
        this.magneticTarget = null;
        this.isInMagneticMode = false;

        // Smooth transition: fade out magnetic outline, fade in normal aura
        if (typeof gsap !== 'undefined') {
            gsap.to(this, {
                duration: 0.4,
                magneticOpacity: 0,
                auraOpacity: 1,
                ease: 'power2.out'
            });
        } else {
            this.magneticOpacity = 0;
            this.auraOpacity = 1;
        }
    }

    setMagneticTarget(targetElement) {
        if (targetElement && targetElement !== this.magneticTarget) {
            this.exitMagneticMode();
            this.enterMagneticMode(targetElement);
        }
    }

    clearMagneticTarget(targetElement) {
        if (targetElement === this.magneticTarget) {
            this.exitMagneticMode();
        }
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.resizeHandler);
        document.removeEventListener('mousemove', this.mouseHandler);
        // clear canvas
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
