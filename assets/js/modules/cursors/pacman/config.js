// assets/js/modules/cursors/pacman/config.js

export const CONFIG = {
    // --- Movimento Giocatore ---
    LERP_AMOUNT: 0.09,
    MAGNETIC_LERP_AMOUNT: 0.2,
    PLAYER_DEAD_ZONE_RADIUS: 1,
    
    // --- Transizioni e UI ---
    FADE_SPEED: 0.12,                  // NUOVO: Controlla la velocità di fade-in/out
    
    // --- AI ---
    AI_STATE_CHASE_DURATION: 7, // Secondi in modalità inseguimento
    AI_STATE_SCATTER_DURATION: 4, // Secondi in modalità dispersione
    // Forza con cui i fantasmi evitano gli ostacoli. Valore ridotto perché
    // un moltiplicatore troppo alto sovrascrive il vettore verso il target
    // e rende i fantasmi esitanti nell'inseguimento.
    AI_OBSTACLE_AVOIDANCE_FORCE: 0.25,

    // --- Gameplay & State ---
    PLAYER_RADIUS: 16,
    CURSOR_DOT_RADIUS: 3,
    MOUTH_ANIMATION_SPEED: 4.5,
    MAX_LIVES: 3,
    RESPAWN_DURATION: 3,
    BOOST_DURATION: 0.15,
    BOOST_SPEED: 1200,
    BOOST_COOLDOWN: 4.5,
    MAX_DELTA_TIME: 0.1,
    GAME_OVER_LERP_FACTOR: 2.4,

    // --- Scared Ghosts ---
    SCARED_GHOST_SPAWN_INTERVAL: 2.5,
    MAX_SCARED_GHOSTS_ON_SCREEN: 5,
    SCARED_GHOST_LIFETIME: 8,
    SCARED_GHOST_SPAWN_DURATION: 0.5,
    SCARED_GHOST_SPAWN_PUSH_SPEED: 750,
    SCARED_GHOST_SPAWN_OFFSET: 50,
    SCARED_GHOST_BASE_SPEED: 120,
    SCARED_GHOST_WANDER_SPEED: 40,
    SCARED_GHOST_EDGE_AVOIDANCE_MARGIN: 50,
    SCARED_GHOST_KAMIKAZE_THRESHOLD: 2.5,
    SCARED_GHOST_KAMIKAZE_FACTOR: 3.0,
    SCARED_GHOST_EXPLOSION_RADIUS: 40,
    
    // --- Hunter Ghosts ---
    HUNTER_BASE_SPEED: 84,
    HUNTER_MAX_SPEED: 228,
    HUNTER_SCORE_SPEED_BONUS: 2500,
    HUNTER_ENRAGE_FACTOR: 1.4,
    BLINKY_LUNGE_DISTANCE: 100,
    BLINKY_LUNGE_FACTOR: 1.5,
    BLINKY_AIM_PREDICTION: 0.3,
    PINKY_AIM_PREDICTION_DISTANCE: 80,
    CLYDE_FEAR_DISTANCE: 120,
    INKY_BLINKY_DEPENDENCY_DISTANCE: 40,
    SPOOKY_MIN_DISTANCE: 180,
    SPOOKY_FIRE_RATE: 3.5,
    SPOOKY_ENRAGED_FIRE_RATE: 2.0,
    SPOOKY_AIM_TIME: 1,
    SPOOKY_PROJECTILE_SPEED: 280,
    SPOOKY_SEEKING_TURN_RATE: 0.03,
    SPOOKY_DASH_SPEED: 400,
    SPOOKY_SNIPER_SHOT_SPEED: 450,
    SCARED_GHOST_SHAPES: [[{x:1,y:1},{x:0.5,y:0.75},{x:0,y:1},{x:-0.5,y:0.75},{x:-1,y:1}],[{x:1,y:1},{x:0.33,y:0.75},{x:-0.33,y:1},{x:-1,y:0.75}],[{x:1,y:0.8},{x:0,y:1},{x:-1,y:0.8}]],
    THEME: {
        wireframe: 'rgba(255, 255, 255, 0.9)', boost: 'rgba(0, 255, 255, 1)', magnetic: 'white',
        cursor: 'white', popupScore: 'rgba(255, 255, 255, 0.9)', effects: { warpRing: 'rgba(0, 255, 255, 1)' },
        ghosts: { blinky: 'rgba(255, 100, 100, 0.9)', pinky: 'rgba(255, 184, 222, 0.9)', clyde: 'rgba(255, 184, 82, 0.9)', spooky: 'rgba(173, 255, 47, 0.9)', inky: 'rgba(0, 255, 200, 0.9)', kamikazeEnd: 'rgba(255, 50, 50, 0.9)' }
    },
    DEBUG: false
};