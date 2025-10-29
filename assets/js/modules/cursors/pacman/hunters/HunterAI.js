// hunters/HunterAI.js
export function updateBlinkyAI(state, hunter, deltaTime, helpers = {}) {
    const config = helpers.config;
    const p = config.BLINKY_AIM_PREDICTION;
    const targetX = (state.follower.x * (1 - p)) + (state.mouse.x * p);
    const targetY = (state.follower.y * (1 - p)) + (state.mouse.y * p);
    let speedFactor = 1.0;
    if (Math.hypot(state.follower.x - hunter.x, state.follower.y - hunter.y) < config.BLINKY_LUNGE_DISTANCE) speedFactor = config.BLINKY_LUNGE_FACTOR;
    return { target: { x: targetX, y: targetY }, speedFactor };
}

export function updatePinkyAI(state, hunter, deltaTime, helpers = {}) {
    const config = helpers.config;
    const targetX = state.follower.x + Math.cos(state.follower.angle) * config.PINKY_AIM_PREDICTION_DISTANCE;
    const targetY = state.follower.y + Math.sin(state.follower.angle) * config.PINKY_AIM_PREDICTION_DISTANCE;
    return { target: { x: targetX, y: targetY }, speedFactor: 1.0 };
}

export function updateClydeAI(state, hunter, deltaTime, helpers = {}) {
    const config = helpers.config;
    const distToPlayer = Math.hypot(state.follower.x - hunter.x, state.follower.y - hunter.y);
    let targetX, targetY;
    const p = config.BLINKY_AIM_PREDICTION;
    if (!hunter.isEnraged && distToPlayer < config.CLYDE_FEAR_DISTANCE) {
        targetX = hunter.x - (state.follower.x - hunter.x);
        targetY = hunter.y - (state.follower.y - hunter.y);
    } else {
        targetX = (state.follower.x * (1 - p)) + (state.mouse.x * p);
        targetY = (state.follower.y * (1 - p)) + (state.mouse.y * p);
    }
    return { target: { x: targetX, y: targetY }, speedFactor: 1.0 };
}

export function updateInkyAI(state, hunter, deltaTime, helpers = {}) {
    const config = helpers.config;
    const blinky = state.hunterGhosts.find(g => g.type === 'blinky');
    let targetX, targetY;
    if (blinky) {
        const pivotX = state.follower.x + Math.cos(state.follower.angle) * config.INKY_BLINKY_DEPENDENCY_DISTANCE;
        const pivotY = state.follower.y + Math.sin(state.follower.angle) * config.INKY_BLINKY_DEPENDENCY_DISTANCE;
        targetX = blinky.x + (pivotX - blinky.x) * 2;
        targetY = blinky.y + (pivotY - blinky.y) * 2;
    } else {
        const p = config.BLINKY_AIM_PREDICTION;
        targetX = (state.follower.x * (1 - p)) + (state.mouse.x * p);
        targetY = (state.follower.y * (1 - p)) + (state.mouse.y * p);
    }
    return { target: { x: targetX, y: targetY }, speedFactor: 1.0 };
}

export function updateSpookyAI(state, hunter, deltaTime, helpers = {}) {
    const config = helpers.config;
    const fireProjectile = helpers.fireProjectile; // optional
    const dxToPlayer = state.follower.x - hunter.x, dyToPlayer = state.follower.y - hunter.y;
    if (hunter.isEnraged) {
        if (!hunter.frenzyState) { hunter.frenzyState = 'dashing'; hunter.dashTarget = null; }
        let target = { x: hunter.x, y: hunter.y }, speedFactor = 1;
        switch(hunter.frenzyState) {
            case 'dashing':
                if (!hunter.dashTarget) {
                    const angleToPlayer = Math.atan2(dyToPlayer, dxToPlayer);
                    const dashAngle = angleToPlayer + (Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1));
                    hunter.dashTarget = { x: hunter.x + Math.cos(dashAngle) * 150, y: hunter.y + Math.sin(dashAngle) * 150 };
                }
                target = hunter.dashTarget;
                speedFactor = config.SPOOKY_DASH_SPEED / config.HUNTER_BASE_SPEED;
                if (Math.hypot(hunter.x - hunter.dashTarget.x, hunter.y - hunter.dashTarget.y) < 20) { hunter.frenzyState = 'aiming'; hunter.aimTimer = 0.25; }
                break;
            case 'aiming':
                hunter.aimTimer -= deltaTime;
                if(hunter.aimTimer <= 0) {
                    const angle = Math.atan2(dyToPlayer, dxToPlayer);
                    if (typeof fireProjectile === 'function') fireProjectile(hunter.x, hunter.y, angle, 'seeking', config.SPOOKY_SNIPER_SHOT_SPEED);
                    hunter.frenzyState = 'cooldown';
                    hunter.fireTimer = config.SPOOKY_ENRAGED_FIRE_RATE;
                }
                break;
            case 'cooldown':
                hunter.fireTimer -= deltaTime;
                if(hunter.fireTimer <= 0) { hunter.frenzyState = 'dashing'; hunter.dashTarget = null; }
                break;
        }
        return { target, speedFactor };
    }
    hunter.frenzyState = null;
    hunter.fireTimer -= deltaTime;
    hunter.strafeTimer -= deltaTime;
    if(hunter.strafeTimer <= 0) { hunter.strafeDirection *= -1; hunter.strafeTimer = 3 + Math.random() * 4; }
    const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);
    const normDx = distToPlayer > 1 ? dxToPlayer / distToPlayer : 0, normDy = distToPlayer > 1 ? dyToPlayer / distToPlayer : 0;
    const kitePointX = state.follower.x - normDx * config.SPOOKY_MIN_DISTANCE;
    const kitePointY = state.follower.y - normDy * config.SPOOKY_MIN_DISTANCE;
    const tangentDx = -normDy * hunter.strafeDirection, tangentDy = normDx * hunter.strafeDirection;
    let targetX = kitePointX + tangentDx * 40, targetY = kitePointY + tangentDy * 40;
    if (distToPlayer < config.SPOOKY_MIN_DISTANCE - 20) { targetX = hunter.x - dxToPlayer; targetY = hunter.y - dyToPlayer; }
    hunter.isAiming = false;
    if (hunter.isBursting) {
        if (hunter.fireTimer <= 0) {
            const angle = Math.atan2(dyToPlayer, dxToPlayer);
            if (typeof fireProjectile === 'function') fireProjectile(hunter.x, hunter.y, angle);
            hunter.burstsLeft--;
            if (hunter.burstsLeft <= 0) {
                hunter.isBursting = false;
                hunter.fireTimer = config.SPOOKY_FIRE_RATE + Math.random();
            } else hunter.fireTimer = 0.1;
        }
    } else if (hunter.fireTimer <= 0) {
        hunter.isAiming = true;
        if (hunter.fireTimer < -config.SPOOKY_AIM_TIME) {
            const attackType = ['spread', 'burst', 'seeking'][Math.floor(Math.random() * 3)];
            const angle = Math.atan2(dyToPlayer, dxToPlayer);
            switch (attackType) {
                case 'spread': if (typeof fireProjectile === 'function') { fireProjectile(hunter.x, hunter.y, angle - 0.2); fireProjectile(hunter.x, hunter.y, angle); fireProjectile(hunter.x, hunter.y, angle + 0.2); } break;
                case 'burst': if (typeof fireProjectile === 'function') { fireProjectile(hunter.x, hunter.y, angle); } hunter.isBursting = true; hunter.burstsLeft = 2; hunter.fireTimer = 0.1; break;
                case 'seeking': if (typeof fireProjectile === 'function') { fireProjectile(hunter.x, hunter.y, angle, 'seeking'); } break;
            }
            if (!hunter.isBursting) hunter.fireTimer = config.SPOOKY_FIRE_RATE + Math.random();
            hunter.isAiming = false;
        }
    }
    return { target: { x: targetX, y: targetY }, speedFactor: 0.85 };
}
