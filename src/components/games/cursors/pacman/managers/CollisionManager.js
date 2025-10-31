// assets/js/modules/cursors/pacman/managers/CollisionManager.js

export class CollisionManager {
    check(player, entityManager) {
        const events = [];
        const { hunters, scaredGhosts, projectiles } = entityManager.getCollidableEntities();

        const checkCollision = (entity1, entity2) => {
            const dx = entity1.x - entity2.x;
            const dy = entity1.y - entity2.y;
            const distance = Math.hypot(dx, dy);
            return distance < (entity1.radius || 0) + (entity2.radius || 0);
        };

        for (const ghost of scaredGhosts) {
            if (checkCollision(player, ghost)) {
                if (ghost.state === 'kamikaze') {
                    events.push({ type: 'player_hit_hunter', enemy: ghost });
                } else {
                    events.push({ type: 'player_eats_scared_ghost', enemy: ghost });
                }
            }
        }

        // Keep track of hunters already handled by boost to avoid double-hits
        const handledHunters = new Set();

        if (player.isBoosting) {
            for (const hunter of hunters) {
                if (player.isIntersecting(hunter)) {
                    events.push({ type: 'boost_hit_hunter', enemy: hunter });
                    handledHunters.add(hunter);
                }
            }
        }

        if (!player.isRespawning) {
            for (const hunter of hunters) {
                // skip hunters already handled by boost this frame
                if (handledHunters.has(hunter)) continue;
                if (checkCollision(player, hunter)) {
                    events.push({ type: 'player_hit_hunter', enemy: hunter });
                }
            }
        }

        if (!player.isRespawning) {
            for (const projectile of projectiles) {
                if (checkCollision(player, projectile)) {
                    events.push({ type: 'player_hit_projectile', enemy: projectile });
                    projectile.markForRemoval();
                }
            }
        }
        return events;
    }
}