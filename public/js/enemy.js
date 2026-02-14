import { Tank } from './tank.js';
import {
    DIR, COLORS, ENEMY_TYPE, ENEMY_SPEED_WANDERER, ENEMY_SPEED_CHASER,
    ENEMY_SPEED_HEAVY, ENEMY_SPAWN_INVULNERABLE, SCORE, TILE_SIZE, TANK_SIZE,
    GAME_AREA_WIDTH, GRID_ROWS
} from './constants.js';
import { drawTank } from './renderer.js';
import { randInt, randFloat, distance } from './utils.js';

const ENEMY_CONFIGS = {
    [ENEMY_TYPE.WANDERER]: {
        speed: ENEMY_SPEED_WANDERER,
        hp: 1,
        bodyColor: COLORS.ENEMY_WANDERER,
        turretColor: '#E91E63',
        shootInterval: [1000, 3000],
        dirChangeInterval: [2000, 4000],
        score: SCORE.WANDERER
    },
    [ENEMY_TYPE.CHASER]: {
        speed: ENEMY_SPEED_CHASER,
        hp: 1,
        bodyColor: COLORS.ENEMY_CHASER,
        turretColor: '#F57C00',
        shootInterval: [800, 2000],
        dirChangeInterval: [1000, 2500],
        score: SCORE.CHASER
    },
    [ENEMY_TYPE.HEAVY]: {
        speed: ENEMY_SPEED_HEAVY,
        hp: 3,
        bodyColor: COLORS.ENEMY_HEAVY,
        turretColor: '#8E24AA',
        shootInterval: [600, 1200],
        dirChangeInterval: [2000, 3500],
        score: SCORE.HEAVY
    }
};

export class Enemy extends Tank {
    constructor(x, y, type) {
        const config = ENEMY_CONFIGS[type];
        super(x, y, DIR.DOWN, config.speed, config.hp, config.bodyColor, config.turretColor);
        this.type = type;
        this.config = config;
        this.scoreValue = config.score;

        // AI state
        this.shootTimer = randInt(config.shootInterval[0], config.shootInterval[1]);
        this.dirChangeTimer = randInt(config.dirChangeInterval[0], config.dirChangeInterval[1]);
        this.stuckTimer = 0;
        this.wantToShoot = false;

        this.setInvulnerable(ENEMY_SPAWN_INVULNERABLE);
    }

    updateAI(dt, player, world, otherTanks, basePos) {
        if (!this.alive) return;

        this.wantToShoot = false;

        // Shoot timer
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.wantToShoot = true;
            this.shootTimer = randInt(this.config.shootInterval[0], this.config.shootInterval[1]);
        }

        // Direction change timer
        this.dirChangeTimer -= dt;

        // Stuck detection: if we haven't moved in a while
        const prevX = this.x;
        const prevY = this.y;

        // Choose direction based on AI type
        let targetDir = this.direction;

        switch (this.type) {
            case ENEMY_TYPE.WANDERER:
                targetDir = this.wandererAI(dt);
                break;
            case ENEMY_TYPE.CHASER:
                targetDir = this.chaserAI(dt, player);
                break;
            case ENEMY_TYPE.HEAVY:
                targetDir = this.heavyAI(dt, player, basePos);
                break;
        }

        // Move in target direction
        this.move(targetDir, dt, world, otherTanks);

        // If stuck, try a different direction
        if (Math.abs(this.x - prevX) < 0.1 && Math.abs(this.y - prevY) < 0.1 && this.moving) {
            this.stuckTimer += dt;
            if (this.stuckTimer > 500) {
                this.direction = this.randomDirection();
                this.stuckTimer = 0;
            }
        } else {
            this.stuckTimer = 0;
        }

        // Smart shooting: shoot when roughly aligned with player
        if (player && player.alive && !player.respawning) {
            if (this.isAlignedWith(player.x, player.y, 3)) {
                this.wantToShoot = true;
            }
        }
    }

    wandererAI(dt) {
        if (this.dirChangeTimer <= 0) {
            this.dirChangeTimer = randInt(
                this.config.dirChangeInterval[0],
                this.config.dirChangeInterval[1]
            );
            return this.randomDirection();
        }
        return this.direction;
    }

    chaserAI(dt, player) {
        if (this.dirChangeTimer <= 0) {
            this.dirChangeTimer = randInt(
                this.config.dirChangeInterval[0],
                this.config.dirChangeInterval[1]
            );

            // 70% chance to move toward player, 30% random
            if (player && player.alive && Math.random() < 0.7) {
                return this.directionToward(player.centerX, player.centerY);
            }
            return this.randomDirection();
        }
        return this.direction;
    }

    heavyAI(dt, player, basePos) {
        if (this.dirChangeTimer <= 0) {
            this.dirChangeTimer = randInt(
                this.config.dirChangeInterval[0],
                this.config.dirChangeInterval[1]
            );

            // 50% target base, 30% target player, 20% random
            const roll = Math.random();
            if (basePos && roll < 0.5) {
                return this.directionToward(basePos.x, basePos.y);
            } else if (player && player.alive && roll < 0.8) {
                return this.directionToward(player.centerX, player.centerY);
            }
            return this.randomDirection();
        }
        return this.direction;
    }

    directionToward(tx, ty) {
        const dx = tx - this.centerX;
        const dy = ty - this.centerY;

        // Prefer the axis with the larger difference
        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? DIR.RIGHT : DIR.LEFT;
        } else {
            return dy > 0 ? DIR.DOWN : DIR.UP;
        }
    }

    isAlignedWith(tx, ty, tolerance) {
        const tileTolerance = tolerance * TILE_SIZE;
        const cx = this.centerX;
        const cy = this.centerY;

        // Check if in the same column (for UP/DOWN shooting)
        if (Math.abs(cx - (tx + TANK_SIZE / 2)) < TANK_SIZE) {
            if (this.direction === DIR.UP && ty < cy) return true;
            if (this.direction === DIR.DOWN && ty > cy) return true;
        }

        // Check if in the same row (for LEFT/RIGHT shooting)
        if (Math.abs(cy - (ty + TANK_SIZE / 2)) < TANK_SIZE) {
            if (this.direction === DIR.LEFT && tx < cx) return true;
            if (this.direction === DIR.RIGHT && tx > cx) return true;
        }

        return false;
    }

    randomDirection() {
        const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
        return dirs[randInt(0, 3)];
    }

    draw(ctx) {
        if (!this.alive) return;

        const damaged = this.hp < this.maxHp;
        const options = {
            invulnerable: this.invulnerable,
            damaged,
            treadFrame: Math.floor(this.treadFrame)
        };

        // Heavy enemy changes color as it takes damage
        let bodyColor = this.bodyColor;
        if (this.type === ENEMY_TYPE.HEAVY && damaged) {
            if (this.hp === 2) bodyColor = '#EF5350'; // Red
            else if (this.hp === 1) bodyColor = '#FF8A80'; // Light red, will blink
        }

        drawTank(ctx, this.x, this.y, this.direction, bodyColor, this.turretColor, options);

        // Heavy: draw star emblem
        if (this.type === ENEMY_TYPE.HEAVY) {
            const cx = this.centerX;
            const cy = this.centerY;
            // Only draw if not blinking away
            if (!this.invulnerable || Math.floor(Date.now() / 100) % 2 !== 0) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(DIR.UP); // star doesn't rotate
                ctx.fillStyle = '#FFD600';
                this.drawStar(ctx, 0, 2, 5, 5, 2.5);
                ctx.restore();
            }
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
                cx + Math.cos(rot) * outerRadius,
                cy + Math.sin(rot) * outerRadius
            );
            rot += step;
            ctx.lineTo(
                cx + Math.cos(rot) * innerRadius,
                cy + Math.sin(rot) * innerRadius
            );
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}
