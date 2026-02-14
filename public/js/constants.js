// Canvas dimensions
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 780;
export const GAME_AREA_WIDTH = 780;
export const HUD_WIDTH = 120;

// Grid settings
export const TILE_SIZE = 30;
export const GRID_COLS = 26;
export const GRID_ROWS = 26;

// Tank dimensions (2x2 tiles)
export const TANK_SIZE = 60;

// Game loop
export const TICK_RATE = 60;
export const TICK_DURATION = 1000 / TICK_RATE;

// Directions
export const DIR = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// Direction vectors (dx, dy)
export const DIR_VECTORS = {
    [DIR.UP]: { x: 0, y: -1 },
    [DIR.RIGHT]: { x: 1, y: 0 },
    [DIR.DOWN]: { x: 0, y: 1 },
    [DIR.LEFT]: { x: -1, y: 0 }
};

// Direction to angle (radians)
export const DIR_ANGLES = {
    [DIR.UP]: 0,
    [DIR.RIGHT]: Math.PI / 2,
    [DIR.DOWN]: Math.PI,
    [DIR.LEFT]: -Math.PI / 2
};

// Tile types
export const TILE = {
    EMPTY: 0,
    BRICK: 1,
    STEEL: 2,
    WATER: 3,
    FOREST: 4,
    ICE: 5
};

// Speeds (pixels per second)
export const PLAYER_SPEED = 120;
export const ENEMY_SPEED_WANDERER = 90;
export const ENEMY_SPEED_CHASER = 120;
export const ENEMY_SPEED_HEAVY = 75;
export const BULLET_SPEED = 300;

// Combat
export const SHOOT_COOLDOWN = 500;
export const SHOOT_COOLDOWN_RAPID = 250;
export const BULLET_SIZE = 8;
export const MAX_PLAYER_BULLETS = 1;
export const MAX_PLAYER_BULLETS_RAPID = 2;

// Player
export const PLAYER_START_LIVES = 3;
export const INVULNERABLE_DURATION = 1500;
export const RESPAWN_DELAY = 2000;
export const EXTRA_LIFE_SCORE = 20000;

// Enemies
export const MAX_ACTIVE_ENEMIES = 4;
export const ENEMY_SPAWN_DELAY = 2000;
export const ENEMY_SPAWN_INVULNERABLE = 1500;
export const POWERUP_DROP_INTERVAL = 4; // every Nth enemy killed

// Enemy types
export const ENEMY_TYPE = {
    WANDERER: 'wanderer',
    CHASER: 'chaser',
    HEAVY: 'heavy'
};

// Score values
export const SCORE = {
    WANDERER: 100,
    CHASER: 200,
    HEAVY: 400,
    POWERUP: 50
};

// Power-up
export const POWERUP_DURATION = 15000;
export const POWERUP_LIFETIME = 10000;
export const POWERUP_BLINK_TIME = 3000;
export const POWERUP_TYPE = {
    SHIELD: 'shield',
    SPEED: 'speed',
    RAPID_FIRE: 'rapid_fire',
    EXTRA_LIFE: 'extra_life',
    BOMB: 'bomb'
};

// Colors
export const COLORS = {
    GRASS: '#7EC850',
    BRICK: '#D4835E',
    BRICK_MORTAR: '#C47350',
    STEEL: '#B0B0B0',
    STEEL_DARK: '#888888',
    WATER: '#5B9BD5',
    WATER_LIGHT: '#7CB9E8',
    FOREST: '#3DA35D',
    ICE: '#D6EAF8',
    ICE_SPARKLE: '#FFFFFF',

    PLAYER_BODY: '#4FC3F7',
    PLAYER_TURRET: '#0288D1',

    ENEMY_WANDERER: '#F48FB1',
    ENEMY_CHASER: '#FFB74D',
    ENEMY_HEAVY: '#CE93D8',

    BULLET: '#FFD600',
    BULLET_GLOW: '#FFFFFF',

    EXPLOSION_INNER: '#FFFFFF',
    EXPLOSION_MID: '#FFEB3B',
    EXPLOSION_OUTER: '#FF6F00',

    HUD_BG: '#2C2C2C',
    HUD_TEXT: '#FFFFFF',
    HUD_SCORE: '#FFD600',

    MENU_BG: '#1a1a2e',
    MENU_TITLE: '#4FC3F7',
    MENU_TEXT: '#FFFFFF',
    MENU_SUBTITLE: '#F48FB1'
};

// Game states
export const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};
