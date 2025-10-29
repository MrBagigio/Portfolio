// assets/js/modules/cursors/asteroids/managers/UIManager.js
export class UIManager {
    constructor(scoreElementId = 'global-score') {
        this.scoreEl = document.getElementById(scoreElementId);
        this.creditsEl = document.querySelector('#credits-display span');
        this._creditsKey = 'asteroids_credits_v1';
        this.reset();
        // initialize credits display from storage
        this._credits = this._loadCredits();
        this._updateCreditsDisplay();
    }

    reset() { this.notifications = []; this.scorePopups = []; this.hudNotifications = []; this.hudOpacity = 0; this.waveFlashTimer = 0; if (this.scoreEl) this.scoreEl.classList.remove('score-visible'); }
    addNotification(text, color, life = 120) { this.notifications.push({ text, color, life, maxLife: life }); }
    addHudNotification(text, color, life = 120) { this.hudNotifications.push({ text, color, life, maxLife: life }); }
    addScorePopup(x, y, text) { this.scorePopups.push({ x, y, text, life: 60 }); }
    triggerWaveFlash(duration = 120) { this.waveFlashTimer = duration; }
    update(isShipMode, isRespawning) { const targetOpacity = (isShipMode && !isRespawning) ? 1 : 0; this.hudOpacity += (targetOpacity - this.hudOpacity) * 0.1; if (this.waveFlashTimer > 0) this.waveFlashTimer--; for (let i = this.notifications.length - 1; i >= 0; i--) { if (--this.notifications[i].life <= 0) this.notifications.splice(i, 1); } for (let i = this.hudNotifications.length - 1; i >= 0; i--) { if (--this.hudNotifications[i].life <= 0) this.hudNotifications.splice(i, 1); } for (let i = this.scorePopups.length - 1; i >= 0; i--) { const s = this.scorePopups[i]; s.life--; s.y -= 0.5; if (s.life <= 0) this.scorePopups.splice(i, 1); } }
    draw(ctx, gameState) { if (this.hudOpacity > 0.01) this._drawHUD(ctx, gameState); this._drawNotifications(ctx); this._drawScorePopups(ctx); if (gameState.isGameOver) this._drawGameOver(ctx, gameState); }
    showFinalScore(score) { if (this.scoreEl) { this.scoreEl.innerHTML = `GAME OVER - FINAL SCORE: ${score}`; this.scoreEl.classList.add('score-visible'); } }
    _drawHUD(ctx, { lives, score, wave, playerX, playerY }) { ctx.save(); ctx.globalAlpha = this.hudOpacity; ctx.font = "bold 12px 'Share Tech Mono', monospace"; ctx.textAlign = 'right'; const hudX = playerX + 95; const hudY = playerY + 5; ctx.fillStyle = 'white'; ctx.fillText(`SCORE: ${score}`, hudX, hudY); ctx.fillText('▲ '.repeat(lives).trim(), hudX, hudY + 15); const shouldDrawWaveText = !(this.waveFlashTimer > 0 && this.waveFlashTimer % 20 < 10); if (shouldDrawWaveText) { ctx.fillStyle = this.waveFlashTimer > 0 ? '#FFD700' : 'white'; ctx.fillText(`WAVE: ${wave}`, hudX, hudY + 30); } ctx.font = "bold 11px 'Share Tech Mono', monospace"; this.hudNotifications.forEach((n, index) => { const alpha = n.life < 30 ? n.life / 30 : 1; ctx.globalAlpha = this.hudOpacity * alpha; ctx.fillStyle = n.color; ctx.fillText(n.text, hudX, hudY + 50 + (index * 15)); }); ctx.restore(); }
    _drawNotifications(ctx) { this.notifications.forEach(n => { ctx.save(); const alpha = n.life < 30 ? n.life / 30 : 1; ctx.globalAlpha = alpha; ctx.font = "bold 16px 'Share Tech Mono', monospace"; ctx.fillStyle = n.color; ctx.textAlign = "center"; const yPos = window.innerHeight / 2 - 50 - (n.maxLife - n.life) * 0.3; ctx.fillText(n.text, window.innerWidth / 2, yPos); ctx.restore(); }); }
    _drawScorePopups(ctx) { this.scorePopups.forEach(s => { ctx.save(); ctx.font = "bold 14px 'Share Tech Mono', monospace"; ctx.fillStyle = `rgba(255, 255, 255, ${s.life / 60})`; ctx.textAlign = "center"; ctx.fillText(s.text, s.x, s.y); ctx.restore(); }); }
    _drawGameOver(ctx, { mouseX, mouseY }) { ctx.save(); ctx.font = "bold 20px 'Share Tech Mono', monospace"; ctx.fillStyle = 'white'; ctx.textAlign = "center"; ctx.fillText("GAME OVER", mouseX, mouseY - 10); ctx.font = "14px 'Share Tech Mono', monospace"; ctx.fillText("(Click to Restart)", mouseX, mouseY + 12); ctx.restore(); }

    // Credits management (persistent)
    _loadCredits() { try { const s = localStorage.getItem(this._creditsKey); return s ? parseInt(s, 10) || 0 : 0; } catch (e) { return 0; } }
    _saveCredits(v) { try { localStorage.setItem(this._creditsKey, String(v)); } catch (e) {} }
    _updateCreditsDisplay() { if (this.creditsEl) this.creditsEl.textContent = String(this._credits || 0); }
    getCredits() { return this._credits || 0; }
    setCredits(v) { this._credits = Math.max(0, Math.floor(v)); this._saveCredits(this._credits); this._updateCreditsDisplay(); }
    addCredits(v) { this.setCredits(this.getCredits() + Math.floor(v)); this.addHudNotification(`+${v} CREDITS`, '#FFD700', 90); }
    spendCredits(v) { if (this.getCredits() >= v) { this.setCredits(this.getCredits() - v); return true; } return false; }
}