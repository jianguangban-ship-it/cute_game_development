import { BULLET_SIZE, BULLET_SPEED, DIR_VECTORS, GAME_AREA_WIDTH, GRID_ROWS, TILE_SIZE, COLORS } from './constants.js';

export class Bullet {
    constructor(x, y, direction, owner) {
        // Center the bullet on the tank's gun barrel position
        this.x = x - BULLET_SIZE / 2;
        this.y = y - BULLET_SIZE / 2;
        this.w = BULLET_SIZE;
        this.h = BULLET_SIZE;
        this.direction = direction;
        this.speed = BULLET_SPEED;
        this.owner = owner; // 'player' or 'enemy'
        this.alive = true;
        this.glowPhase = 0;
    }

    update(dt) {
        if (!this.alive) return;

        const vec = DIR_VECTORS[this.direction];
        const dist = this.speed * dt / 1000;
        this.x += vec.x * dist;
        this.y += vec.y * dist;

        this.glowPhase += dt * 0.01;

        // Check boundary
        if (this.x < -this.w || this.y < -this.h ||
            this.x > GAME_AREA_WIDTH || this.y > GRID_ROWS * TILE_SIZE) {
            this.alive = false;
        }
    }

    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }

    draw(ctx) {
        if (!this.alive) return;

        const cx = this.centerX;
        const cy = this.centerY;

        // Glow effect
        const glowSize = 6 + Math.sin(this.glowPhase) * 2;
        ctx.fillStyle = 'rgba(255, 34, 34, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Bullet body
        ctx.fillStyle = COLORS.BULLET;
        ctx.beginPath();
        ctx.arc(cx, cy, BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // White center highlight
        ctx.fillStyle = COLORS.BULLET_GLOW;
        ctx.beginPath();
        ctx.arc(cx - 1, cy - 1, BULLET_SIZE / 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
