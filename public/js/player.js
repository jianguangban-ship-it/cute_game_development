import { Tank } from './tank.js';
import {
    DIR, PLAYER_SPEED, COLORS, SHOOT_COOLDOWN, SHOOT_COOLDOWN_RAPID,
    PLAYER_START_LIVES, INVULNERABLE_DURATION, MAX_PLAYER_BULLETS,
    MAX_PLAYER_BULLETS_RAPID
} from './constants.js';
import { drawTank } from './renderer.js';

export class Player extends Tank {
    constructor(x, y) {
        super(x, y, DIR.UP, PLAYER_SPEED, 1, COLORS.PLAYER_BODY, COLORS.PLAYER_TURRET);
        this.lives = PLAYER_START_LIVES;
        this.shielded = false;
        this.speedBoost = false;
        this.rapidFire = false;
        this.speedBoostTimer = 0;
        this.rapidFireTimer = 0;
        this.respawning = false;
        this.respawnTimer = 0;
        this.spawnX = x;
        this.spawnY = y;
        this.activeBullets = 0;
    }

    get maxBullets() {
        return this.rapidFire ? MAX_PLAYER_BULLETS_RAPID : MAX_PLAYER_BULLETS;
    }

    get currentCooldown() {
        return this.rapidFire ? SHOOT_COOLDOWN_RAPID : SHOOT_COOLDOWN;
    }

    handleInput(input, dt, world, otherTanks) {
        if (this.respawning || !this.alive) return;

        if (input.up) this.move(DIR.UP, dt, world, otherTanks);
        else if (input.down) this.move(DIR.DOWN, dt, world, otherTanks);
        else if (input.left) this.move(DIR.LEFT, dt, world, otherTanks);
        else if (input.right) this.move(DIR.RIGHT, dt, world, otherTanks);

        // Apply speed boost
        if (this.speedBoost) {
            this.speed = this.baseSpeed * 1.5;
        } else {
            this.speed = this.baseSpeed;
        }
    }

    canShoot() {
        return !this.respawning && this.alive && this.shootCooldown <= 0 &&
               this.activeBullets < this.maxBullets;
    }

    onShoot() {
        this.shootCooldown = this.currentCooldown;
        this.activeBullets++;
    }

    onBulletDestroyed() {
        this.activeBullets = Math.max(0, this.activeBullets - 1);
    }

    takeDamage() {
        if (this.invulnerable || this.respawning) return false;

        if (this.shielded) {
            this.shielded = false;
            return false;
        }

        this.alive = false;
        this.lives--;
        return true; // Destroyed
    }

    respawn(x, y) {
        if (x !== undefined) { this.spawnX = x; this.spawnY = y; }
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.direction = DIR.UP;
        this.alive = true;
        this.hp = 1;
        this.respawning = false;
        this.activeBullets = 0;
        this.setInvulnerable(INVULNERABLE_DURATION);
    }

    update(dt) {
        super.update(dt);

        if (this.speedBoost) {
            this.speedBoostTimer -= dt;
            if (this.speedBoostTimer <= 0) {
                this.speedBoost = false;
                this.speed = this.baseSpeed;
            }
        }

        if (this.rapidFire) {
            this.rapidFireTimer -= dt;
            if (this.rapidFireTimer <= 0) {
                this.rapidFire = false;
            }
        }
    }

    draw(ctx) {
        if (this.respawning || !this.alive) return;

        const options = {
            invulnerable: this.invulnerable,
            treadFrame: Math.floor(this.treadFrame)
        };

        drawTank(ctx, this.x, this.y, this.direction, this.bodyColor, this.turretColor, options);

        // Shield visual
        if (this.shielded) {
            ctx.save();
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 34, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 36, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}
