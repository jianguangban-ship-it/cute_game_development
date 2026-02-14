import { COLORS } from './constants.js';

export class Explosion {
    constructor(x, y, size = 'normal') {
        this.x = x;
        this.y = y;
        this.size = size === 'large' ? 40 : 25;
        this.maxFrames = 8;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameDuration = 50; // ms per frame
        this.done = false;
    }

    update(dt) {
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameDuration) {
            this.frameTimer -= this.frameDuration;
            this.frame++;
            if (this.frame >= this.maxFrames) {
                this.done = true;
            }
        }
    }

    draw(ctx) {
        if (this.done) return;

        const progress = this.frame / this.maxFrames;
        const radius = this.size * (0.3 + progress * 0.7);
        const alpha = 1 - progress * 0.8;

        ctx.save();

        // Outer ring (orange)
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = COLORS.EXPLOSION_OUTER;
        ctx.beginPath();

        // Jagged edge (star-like shape)
        const points = 12;
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const jag = 1 + Math.sin(angle * 3 + this.frame) * 0.2;
            const r = radius * jag;
            const px = this.x + Math.cos(angle) * r;
            const py = this.y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Middle ring (yellow)
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = COLORS.EXPLOSION_MID;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Inner core (white)
        ctx.globalAlpha = alpha;
        ctx.fillStyle = COLORS.EXPLOSION_INNER;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
