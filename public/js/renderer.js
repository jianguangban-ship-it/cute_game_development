import { DIR_ANGLES, TANK_SIZE } from './constants.js';
import { roundRect, darkenColor } from './utils.js';

// Draw a cute tank at the given position facing the given direction
export function drawTank(ctx, x, y, direction, bodyColor, turretColor, options = {}) {
    const { invulnerable = false, damaged = false, treadFrame = 0 } = options;

    // Blinking effect when invulnerable
    if (invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        return;
    }

    const cx = x + TANK_SIZE / 2;
    const cy = y + TANK_SIZE / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(DIR_ANGLES[direction]);

    // Treads (left and right)
    const treadColor = darkenColor(bodyColor, 30);
    ctx.fillStyle = treadColor;

    // Left tread
    roundRect(ctx, -28, -26, 10, 52, 4);
    ctx.fill();
    // Right tread
    roundRect(ctx, 18, -26, 10, 52, 4);
    ctx.fill();

    // Tread marks (animated)
    ctx.strokeStyle = darkenColor(bodyColor, 45);
    ctx.lineWidth = 1.5;
    const treadOffset = (treadFrame % 3) * 6;
    for (let i = -24 + treadOffset; i < 26; i += 8) {
        // Left tread marks
        ctx.beginPath();
        ctx.moveTo(-28, i);
        ctx.lineTo(-18, i);
        ctx.stroke();
        // Right tread marks
        ctx.beginPath();
        ctx.moveTo(18, i);
        ctx.lineTo(28, i);
        ctx.stroke();
    }

    // Body (rounded rectangle)
    ctx.fillStyle = bodyColor;
    roundRect(ctx, -18, -22, 36, 44, 6);
    ctx.fill();
    ctx.strokeStyle = darkenColor(bodyColor, 20);
    ctx.lineWidth = 2;
    roundRect(ctx, -18, -22, 36, 44, 6);
    ctx.stroke();

    // Damaged visual
    if (damaged) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        roundRect(ctx, -18, -22, 36, 44, 6);
        ctx.fill();
    }

    // Turret base (circle)
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, 2, 11, 0, Math.PI * 2);
    ctx.fill();

    // Gun barrel
    ctx.fillStyle = turretColor;
    roundRect(ctx, -3.5, -28, 7, 22, 3);
    ctx.fill();
    ctx.strokeStyle = darkenColor(turretColor, 15);
    ctx.lineWidth = 1.5;
    roundRect(ctx, -3.5, -28, 7, 22, 3);
    ctx.stroke();

    // Gun barrel tip (slightly lighter)
    ctx.fillStyle = darkenColor(turretColor, -10);
    roundRect(ctx, -4.5, -30, 9, 5, 2);
    ctx.fill();

    // Eyes (two white circles with pupils, near the "front" = top)
    const eyeY = -10;
    const eyeSpacing = 8;

    // White of eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (looking forward = up in tank space)
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY - 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY - 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 1, eyeY - 2.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + 1, eyeY - 2.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Blush circles (cute pink cheeks)
    ctx.fillStyle = 'rgba(255, 150, 150, 0.35)';
    ctx.beginPath();
    ctx.arc(-12, eyeY + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, eyeY + 4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Draw a small tank icon (for HUD)
export function drawTankIcon(ctx, x, y, size, color) {
    const scale = size / TANK_SIZE;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Simple small tank silhouette
    ctx.fillStyle = color;
    roundRect(ctx, 2, 0, 8, TANK_SIZE * 0.8, 2);
    ctx.fill();
    roundRect(ctx, TANK_SIZE * 0.6 - 2, 0, 8, TANK_SIZE * 0.8, 2);
    ctx.fill();
    roundRect(ctx, 8, 4, TANK_SIZE * 0.6 - 8, TANK_SIZE * 0.6, 4);
    ctx.fill();

    // Barrel
    ctx.fillStyle = darkenColor(color, 20);
    roundRect(ctx, TANK_SIZE * 0.3 - 2, -4, 4, 12, 2);
    ctx.fill();

    ctx.restore();
}
