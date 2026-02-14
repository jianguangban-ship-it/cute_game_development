import { TANK_SIZE, DIR, DIR_VECTORS, TILE_SIZE, GAME_AREA_WIDTH, GRID_ROWS } from './constants.js';
import { snapToHalfTile, clamp } from './utils.js';

export class Tank {
    constructor(x, y, direction, speed, hp, bodyColor, turretColor) {
        this.x = x;
        this.y = y;
        this.w = TANK_SIZE;
        this.h = TANK_SIZE;
        this.direction = direction;
        this.speed = speed;
        this.baseSpeed = speed;
        this.hp = hp;
        this.maxHp = hp;
        this.bodyColor = bodyColor;
        this.turretColor = turretColor;
        this.alive = true;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.shootCooldown = 0;
        this.treadFrame = 0;
        this.moving = false;
    }

    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }

    move(direction, dt, world, otherTanks) {
        const oldDir = this.direction;
        this.direction = direction;
        this.moving = true;

        const vec = DIR_VECTORS[direction];
        const dist = this.speed * dt / 1000;
        let newX = this.x + vec.x * dist;
        let newY = this.y + vec.y * dist;

        // Grid snapping on the perpendicular axis when turning
        if (oldDir !== direction) {
            if (direction === DIR.UP || direction === DIR.DOWN) {
                // Snap X to nearest half-tile
                newX = snapToHalfTile(this.x);
            } else {
                // Snap Y to nearest half-tile
                newY = snapToHalfTile(this.y);
            }
        }

        // Boundary clamping
        newX = clamp(newX, 0, GAME_AREA_WIDTH - this.w);
        newY = clamp(newY, 0, GRID_ROWS * TILE_SIZE - this.h);

        // Check world collision
        if (!world.isAreaPassable(newX, newY, this.w, this.h)) {
            // Try sliding along just one axis
            if (vec.x !== 0 && world.isAreaPassable(newX, this.y, this.w, this.h)) {
                newY = this.y;
            } else if (vec.y !== 0 && world.isAreaPassable(this.x, newY, this.w, this.h)) {
                newX = this.x;
            } else {
                return; // Can't move
            }
        }

        // Check collision with other tanks
        for (const other of otherTanks) {
            if (other === this || !other.alive) continue;
            if (newX < other.x + other.w && newX + this.w > other.x &&
                newY < other.y + other.h && newY + this.h > other.y) {
                return; // Blocked by another tank
            }
        }

        this.x = newX;
        this.y = newY;

        // Animate treads
        this.treadFrame += dist * 0.3;
    }

    takeDamage() {
        if (this.invulnerable) return false;
        this.hp--;
        if (this.hp <= 0) {
            this.alive = false;
            return true; // Destroyed
        }
        return false;
    }

    setInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerableTimer = duration;
    }

    update(dt) {
        this.moving = false;
        if (this.shootCooldown > 0) {
            this.shootCooldown -= dt;
        }
        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }
}
