import {
    TILE_SIZE, POWERUP_TYPE, POWERUP_LIFETIME, POWERUP_BLINK_TIME,
    POWERUP_DURATION, COLORS
} from './constants.js';
import { roundRect } from './utils.js';

export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = TILE_SIZE;
        this.h = TILE_SIZE;
        this.type = type;
        this.alive = true;
        this.lifetime = POWERUP_LIFETIME + POWERUP_BLINK_TIME;
        this.blinkPhase = 0;
        this.bobPhase = Math.random() * Math.PI * 2;
    }

    get isBlinking() {
        return this.lifetime < POWERUP_BLINK_TIME;
    }

    update(dt) {
        this.lifetime -= dt;
        this.blinkPhase += dt * 0.01;
        this.bobPhase += dt * 0.004;

        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }

    applyTo(player) {
        switch (this.type) {
            case POWERUP_TYPE.SHIELD:
                player.shielded = true;
                break;
            case POWERUP_TYPE.SPEED:
                player.speedBoost = true;
                player.speedBoostTimer = POWERUP_DURATION;
                break;
            case POWERUP_TYPE.RAPID_FIRE:
                player.rapidFire = true;
                player.rapidFireTimer = POWERUP_DURATION;
                break;
            case POWERUP_TYPE.EXTRA_LIFE:
                player.lives++;
                break;
            case POWERUP_TYPE.BOMB:
                // Handled externally in game.js
                break;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Blink when about to expire
        if (this.isBlinking && Math.floor(Date.now() / 200) % 2 === 0) {
            return;
        }

        const bobY = Math.sin(this.bobPhase) * 2;
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2 + bobY;
        const size = this.w * 0.4;

        // Background glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, size + 4, 0, Math.PI * 2);
        ctx.fill();

        // Background circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, size + 1, 0, Math.PI * 2);
        ctx.fill();

        switch (this.type) {
            case POWERUP_TYPE.SHIELD:
                this.drawShield(ctx, cx, cy, size);
                break;
            case POWERUP_TYPE.SPEED:
                this.drawSpeed(ctx, cx, cy, size);
                break;
            case POWERUP_TYPE.RAPID_FIRE:
                this.drawRapidFire(ctx, cx, cy, size);
                break;
            case POWERUP_TYPE.EXTRA_LIFE:
                this.drawExtraLife(ctx, cx, cy, size);
                break;
            case POWERUP_TYPE.BOMB:
                this.drawBomb(ctx, cx, cy, size);
                break;
        }
    }

    drawShield(ctx, cx, cy, size) {
        // Blue star
        ctx.fillStyle = '#42A5F5';
        this.drawStarShape(ctx, cx, cy, 5, size, size * 0.5);
        ctx.fill();
    }

    drawSpeed(ctx, cx, cy, size) {
        // Yellow lightning bolt
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy - size);
        ctx.lineTo(cx - 4, cy);
        ctx.lineTo(cx, cy - 1);
        ctx.lineTo(cx - 2, cy + size);
        ctx.lineTo(cx + 4, cy);
        ctx.lineTo(cx, cy + 1);
        ctx.closePath();
        ctx.fill();
    }

    drawRapidFire(ctx, cx, cy, size) {
        // Red double arrows
        ctx.fillStyle = '#EF5350';
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy - size);
        ctx.lineTo(cx - 6, cy - 2);
        ctx.lineTo(cx, cy - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 3, cy - size);
        ctx.lineTo(cx, cy - 2);
        ctx.lineTo(cx + 6, cy - 2);
        ctx.closePath();
        ctx.fill();
        // Lower arrows
        ctx.beginPath();
        ctx.moveTo(cx - 3, cy);
        ctx.lineTo(cx - 6, cy + size - 2);
        ctx.lineTo(cx, cy + size - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 3, cy);
        ctx.lineTo(cx, cy + size - 2);
        ctx.lineTo(cx + 6, cy + size - 2);
        ctx.closePath();
        ctx.fill();
    }

    drawExtraLife(ctx, cx, cy, size) {
        // Pink heart
        ctx.fillStyle = '#F48FB1';
        this.drawHeart(ctx, cx, cy, size * 0.9);
    }

    drawBomb(ctx, cx, cy, size) {
        // Orange explosion icon
        ctx.fillStyle = '#FF7043';
        this.drawStarShape(ctx, cx, cy, 8, size, size * 0.6);
        ctx.fill();
        // Center dot
        ctx.fillStyle = '#FFF176';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = -Math.PI / 2;
        const step = Math.PI / spikes;
        ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        ctx.closePath();
    }

    drawHeart(ctx, cx, cy, size) {
        ctx.beginPath();
        const topY = cy - size * 0.3;
        ctx.moveTo(cx, cy + size * 0.5);
        ctx.bezierCurveTo(cx - size, cy - size * 0.2, cx - size * 0.5, topY - size * 0.5, cx, topY + size * 0.1);
        ctx.bezierCurveTo(cx + size * 0.5, topY - size * 0.5, cx + size, cy - size * 0.2, cx, cy + size * 0.5);
        ctx.fill();
    }
}

// Get a random power-up type
export function randomPowerUpType() {
    const types = Object.values(POWERUP_TYPE);
    return types[Math.floor(Math.random() * types.length)];
}
