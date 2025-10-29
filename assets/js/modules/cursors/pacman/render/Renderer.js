// render/Renderer.js
export function drawPacman(ctx, state, config, override = {}) {
    const mouthAngle = (state.isBoosting || override.forceOpen) ? Math.PI / 3.5 : (Math.sin(state.mouthAnimationTimer * config.MOUTH_ANIMATION_SPEED) + 1) / 2 * (Math.PI / 4) + 0.1;
    const color = override.color || (state.isBoosting ? config.THEME.boost : config.THEME.wireframe);
    const alpha = override.alpha || 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(override.x || state.follower.x, override.y || state.follower.y);
    ctx.rotate(override.angle || state.follower.angle);
    ctx.beginPath();
    ctx.arc(0, 0, config.PLAYER_RADIUS, mouthAngle, -mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

export function drawBoostTrail(ctx, state, config) {
    const angle = state.boostAngle;
    const boostProgress = state.boostTimer / config.BOOST_DURATION;
    for (let i = 1; i <= 3; i++) {
        const t = i / 3; const distance = 25 * t;
        const x = state.follower.x - Math.cos(angle) * distance;
        const y = state.follower.y - Math.sin(angle) * distance;
        drawPacman(ctx, state, config, { x, y, angle, color: config.THEME.boost, alpha: (1 - t) * 0.4 * boostProgress });
    }
}

export function drawFollowerCircle(ctx, state, config) {
    ctx.beginPath(); ctx.arc(state.follower.x, state.follower.y, config.PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
}

export function drawCursorDot(ctx, state, config) {
    ctx.beginPath(); ctx.arc(state.mouse.x, state.mouse.y, config.CURSOR_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = config.THEME.cursor; ctx.fill();
    if (state.isHoveringPowerUp) {
        ctx.beginPath(); ctx.arc(state.mouse.x, state.mouse.y, config.CURSOR_DOT_RADIUS * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.sin(performance.now() * 0.01) * 0.5 + 0.5})`;
        ctx.lineWidth = 2; ctx.stroke();
    }
}

export function drawHUD(ctx, state, config) {
    if (state.hudOpacity < 0.01) return;
    ctx.save(); ctx.globalAlpha = state.hudOpacity;
    // Draw a subtle pulse/glow when entering/exiting game-mode
    if (state.hudPulse && state.hudPulse > 0) {
        const pulse = Math.max(0, Math.min(1, state.hudPulse));
        ctx.save();
        ctx.globalAlpha = 0.2 * pulse * state.hudOpacity;
        ctx.shadowBlur = 12 * pulse;
        ctx.shadowColor = 'rgba(255, 100, 100, 0.9)';
        // Draw a soft circle behind the HUD position
        const margin = 20; const idealX = state.follower.x + 95; const idealY = state.follower.y + 5;
        const hudX = Math.max(margin, Math.min(idealX, ctx.canvas.width - margin));
        const hudY = Math.max(margin + 40, Math.min(idealY, ctx.canvas.height - margin));
        ctx.beginPath(); ctx.arc(hudX, hudY, 36 * pulse, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,50,50,0.08)'; ctx.fill();
        ctx.restore();
    }
    ctx.font = "bold 14px 'Share Tech Mono', monospace"; ctx.fillStyle = 'white'; ctx.textAlign = 'right';
    const margin = 20; const idealX = state.follower.x + 95; const idealY = state.follower.y + 5;
    const hudX = Math.max(margin, Math.min(idealX, ctx.canvas.width - margin));
    const hudY = Math.max(margin + 40, Math.min(idealY, ctx.canvas.height - margin));
    ctx.fillText(`SCORE: ${state.score}`, hudX, hudY);
    ctx.fillText(`WAVE: ${state.wave}`, hudX, hudY - 20);
    const livesIcons = '● '.repeat(state.lives);
    const livesWidth = ctx.measureText(livesIcons).width;
    ctx.fillText(livesIcons, hudX, hudY + 20);
    const boostRadius = 7, boostX = hudX - livesWidth - 20, boostY = hudY + 15;
    ctx.beginPath(); ctx.arc(boostX, boostY, boostRadius, 0, Math.PI * 2);
    ctx.strokeStyle = state.boostCooldownTimer > 0 ? 'rgba(255, 255, 255, 0.3)' : config.THEME.boost; ctx.lineWidth = 1.5; ctx.stroke();
    if (state.boostCooldownTimer > 0) {
        const progress = 1 - (state.boostCooldownTimer / config.BOOST_COOLDOWN);
        ctx.beginPath(); ctx.arc(boostX, boostY, boostRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
        ctx.strokeStyle = config.THEME.boost; ctx.lineWidth = 2.5; ctx.stroke();
    }
    ctx.restore();
}

export function drawGameOver(ctx, state) {
    ctx.font = "bold 24px 'Share Tech Mono', monospace"; ctx.fillStyle = 'white'; ctx.textAlign = "center";
    ctx.fillText("GAME OVER", state.follower.x, state.follower.y - 20);
    ctx.font = "16px 'Share Tech Mono', monospace"; ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText("(Click to Restart)", state.follower.x, state.follower.y + 10);
}

export function drawEffects(ctx, state, config) {
    state.effects.forEach(e => { if (e.type === 'warpRing') { const p = 1 - (e.life / e.maxLife), eP = Math.pow(p, 0.5); ctx.beginPath(); ctx.arc(e.x, e.y, eP * 80, 0, Math.PI * 2); ctx.strokeStyle = `rgba(0, 255, 255, ${1 - p})`; ctx.lineWidth = 3 * (1 - p); ctx.stroke(); } });
}
