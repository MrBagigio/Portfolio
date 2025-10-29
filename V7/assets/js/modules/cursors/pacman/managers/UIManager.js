// assets/js/modules/cursors/pacman/managers/UIManager.js

import { CONFIG } from '../config.js';

export class UIManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.scores = [];
    }

    reset() {
        this.scores = [];
    }

    update(deltaTime) {
        this.scores.forEach(s => s.y -= 30 * deltaTime);
        this.scores = this.scores.filter(s => (s.life -= deltaTime) > 0);
    }

    draw(gameState, player, mouse, isHoveringPowerUp, globalAlpha) {
        if (globalAlpha > 0.01) {
            this.ctx.save();
            this.ctx.globalAlpha = globalAlpha;
            this.drawHUD(gameState, player);
            this.drawScores();
            this.ctx.restore();
        }

        if (gameState.isGameOver) {
            this.drawGameOver(player);
        }
        
        this.drawCursorDot(mouse, isHoveringPowerUp);
    }
    
    drawHUD(gameState, player) {
        this.ctx.font = "bold 14px 'Share Tech Mono', monospace";
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'right';

        const margin = 20;
        const offsetX = 95;
        const offsetY = -5;
        const idealX = player.x + offsetX;
        const idealY = player.y + offsetY;
        const hudX = Math.max(margin, Math.min(idealX, this.ctx.canvas.width - margin));
        const hudY = Math.max(margin + 40, Math.min(idealY, this.ctx.canvas.height - margin));

        this.ctx.fillText(`SCORE: ${gameState.score}`, hudX, hudY);
        this.ctx.fillText(`WAVE: ${gameState.wave}`, hudX, hudY - 20);
        
        const livesIcons = '● '.repeat(player.lives);
        const livesWidth = this.ctx.measureText(livesIcons).width;
        this.ctx.fillText(livesIcons, hudX, hudY + 20);
        
        this.drawBoostIndicator(hudX - livesWidth - 20, hudY + 15, player);
    }

    drawBoostIndicator(x, y, player) {
        const radius = 7;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = player.boostCooldownTimer > 0 ? 'rgba(255, 255, 255, 0.3)' : CONFIG.THEME.boost;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        if (player.boostCooldownTimer > 0) {
            const progress = 1 - (player.boostCooldownTimer / CONFIG.BOOST_COOLDOWN);
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
            this.ctx.strokeStyle = CONFIG.THEME.boost;
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();
        }
    }

    drawScores() {
        this.scores.forEach(s => {
            const alpha = Math.min(1, s.life / s.maxLife);
            this.ctx.font = `bold ${s.size || 14}px 'Share Tech Mono', monospace`;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.textAlign = "center";
            this.ctx.fillText(s.text, s.x, s.y);
        });
    }

    drawGameOver(player) {
        this.ctx.font = "bold 24px 'Share Tech Mono', monospace";
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = "center";
        this.ctx.fillText("GAME OVER", player.x, player.y - 20);
        this.ctx.font = "16px 'Share Tech Mono', monospace";
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText("(Click to Restart)", player.x, player.y + 10);
    }
    
    drawCursorDot(mouse, isHoveringPowerUp) {
        if (!mouse) return;
        this.ctx.beginPath();
        this.ctx.arc(mouse.x, mouse.y, CONFIG.CURSOR_DOT_RADIUS, 0, Math.PI * 2);
        this.ctx.fillStyle = CONFIG.THEME.cursor;
        this.ctx.fill();
        if (isHoveringPowerUp) {
            this.ctx.beginPath();
            this.ctx.arc(mouse.x, mouse.y, CONFIG.CURSOR_DOT_RADIUS * 4, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(performance.now() * 0.01) * 0.5 + 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    
    addScorePopup(x, y, text, duration = 1, size = 14) {
        this.scores.push({ x, y, text, life: duration, maxLife: duration, size });
    }
}