import { randFloat, randInt } from './utils.js';

const MAX_PARTICLES = 200;

class Particle {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.vx = randFloat(-80, 80);
        this.vy = randFloat(-120, -20);
        this.life = 1;
        this.maxLife = 1;
        this.decay = randFloat(0.8, 2.0);
        this.type = type; // 'heart', 'star', 'sparkle', 'circle'
        this.color = color;
        this.size = randFloat(3, 7);
        this.rotation = randFloat(0, Math.PI * 2);
        this.rotationSpeed = randFloat(-3, 3);
        this.gravity = 60;
    }

    update(dt) {
        const sec = dt / 1000;
        this.x += this.vx * sec;
        this.y += this.vy * sec;
        this.vy += this.gravity * sec;
        this.life -= this.decay * sec;
        this.rotation += this.rotationSpeed * sec;
    }

    get isDead() {
        return this.life <= 0;
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;

        switch (this.type) {
            case 'heart':
                this.drawHeart(ctx);
                break;
            case 'star':
                this.drawStar(ctx);
                break;
            case 'sparkle':
                this.drawSparkle(ctx);
                break;
            default:
                this.drawCircle(ctx);
                break;
        }

        ctx.restore();
    }

    drawHeart(ctx) {
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s, -s * 0.2, -s * 0.5, -s * 0.8, 0, -s * 0.1);
        ctx.bezierCurveTo(s * 0.5, -s * 0.8, s, -s * 0.2, 0, s * 0.4);
        ctx.fill();
    }

    drawStar(ctx) {
        const s = this.size;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = Math.cos(angle) * s;
            const py = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawSparkle(ctx) {
        const s = this.size;
        ctx.beginPath();
        // 4-pointed sparkle
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.2, -s * 0.2);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.2, s * 0.2);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.2, s * 0.2);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.2, -s * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Spawn particles at a position with options
    emit(x, y, count, options = {}) {
        const { types = ['sparkle', 'circle'], colors = ['#FFD600', '#FF6F00', '#FFFFFF'] } = options;

        for (let i = 0; i < count; i++) {
            if (this.particles.length >= MAX_PARTICLES) {
                // Remove oldest
                this.particles.shift();
            }
            const type = types[randInt(0, types.length - 1)];
            const color = colors[randInt(0, colors.length - 1)];
            this.particles.push(new Particle(x, y, type, color));
        }
    }

    // Cute explosion: hearts and stars
    emitCuteExplosion(x, y) {
        this.emit(x, y, 12, {
            types: ['heart', 'star', 'sparkle'],
            colors: ['#F48FB1', '#FFD600', '#FF8A80', '#CE93D8', '#FFFFFF']
        });
    }

    // Power-up collected effect
    emitPowerUp(x, y) {
        this.emit(x, y, 8, {
            types: ['star', 'sparkle'],
            colors: ['#4FC3F7', '#FFD600', '#FFFFFF', '#81C784']
        });
    }

    // Victory celebration
    emitCelebration(x, y) {
        this.emit(x, y, 20, {
            types: ['heart', 'star', 'sparkle', 'circle'],
            colors: ['#F48FB1', '#FFD600', '#4FC3F7', '#CE93D8', '#81C784', '#FFFFFF']
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].isDead) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }
}
