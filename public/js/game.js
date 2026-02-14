import {
    STATE, COLORS, TILE, TILE_SIZE, GAME_AREA_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT,
    GRID_ROWS, DIR, DIR_VECTORS, TANK_SIZE, BULLET_SIZE,
    MAX_ACTIVE_ENEMIES, ENEMY_SPAWN_DELAY, RESPAWN_DELAY,
    POWERUP_DROP_INTERVAL, EXTRA_LIFE_SCORE, SCORE, POWERUP_TYPE
} from './constants.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Bullet } from './bullet.js';
import { Explosion } from './explosion.js';
import { PowerUp, randomPowerUpType } from './powerup.js';
import { ParticleSystem } from './particles.js';
import { HUD } from './hud.js';
import { LEVELS } from './levels.js';
import { rectsOverlap, pixelToGrid, roundRect, formatNumber, randInt } from './utils.js';

export class Game {
    constructor(ctx, input, audio) {
        this.ctx = ctx;
        this.input = input;
        this.audio = audio;
        this.state = STATE.MENU;

        this.world = new World();
        this.player = new Player(360, 720);
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.powerups = [];
        this.particles = new ParticleSystem();
        this.hud = new HUD();

        this.currentLevel = 0;
        this.score = 0;
        this.hiScore = this.loadHiScore();
        this.enemyKillCount = 0;
        this.extraLifeAwarded = false;

        // Level state
        this.enemyQueue = [];
        this.spawnTimer = 0;
        this.nextSpawnIndex = 0;
        this.levelTimer = 0;
        this.levelCompleteTimer = 0;
        this.gameOverTimer = 0;
        this.respawnTimer = 0;

        // Base (flag/eagle)
        this.baseAlive = true;
        this.basePos = { x: 0, y: 0 };

        // Shake effect
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        // Menu animation
        this.menuTimer = 0;

        // Audio initialized on first interaction
        this.audioInitialized = false;
    }

    get remainingEnemies() {
        const queueRemaining = this.enemyQueue.length - this.nextSpawnIndex;
        return queueRemaining + this.enemies.filter(e => e.alive).length;
    }

    get allEnemiesDefeated() {
        return this.nextSpawnIndex >= this.enemyQueue.length &&
               this.enemies.every(e => !e.alive);
    }

    loadHiScore() {
        try {
            return parseInt(localStorage.getItem('tankWarHiScore')) || 0;
        } catch {
            return 0;
        }
    }

    saveHiScore() {
        try {
            if (this.score > this.hiScore) {
                this.hiScore = this.score;
                localStorage.setItem('tankWarHiScore', String(this.hiScore));
            }
        } catch {
            // localStorage unavailable
        }
    }

    initAudio() {
        if (!this.audioInitialized) {
            this.audio.init();
            this.audioInitialized = true;
        }
    }

    startGame() {
        this.currentLevel = 0;
        this.score = 0;
        this.enemyKillCount = 0;
        this.extraLifeAwarded = false;
        this.player = new Player(360, 720);
        this.loadLevel(0);
        this.state = STATE.PLAYING;
    }

    loadLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        this.world.loadLevel(level);
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];
        this.powerups = [];
        this.particles = new ParticleSystem();

        this.enemyQueue = level.enemies;
        this.nextSpawnIndex = 0;
        this.spawnTimer = 0;
        this.levelTimer = 0;
        this.levelCompleteTimer = 0;

        this.baseAlive = true;
        this.basePos = { ...level.basePosition };

        // Reset player position
        this.player.respawn(level.playerSpawn.x, level.playerSpawn.y);
    }

    update(dt) {
        this.menuTimer += dt;

        if (this.input.mute) {
            this.initAudio();
            this.audio.toggleMute();
        }

        switch (this.state) {
            case STATE.MENU:
                this.updateMenu(dt);
                break;
            case STATE.PLAYING:
                this.updatePlaying(dt);
                break;
            case STATE.PAUSED:
                this.updatePaused(dt);
                break;
            case STATE.LEVEL_COMPLETE:
                this.updateLevelComplete(dt);
                break;
            case STATE.GAME_OVER:
                this.updateGameOver(dt);
                break;
            case STATE.VICTORY:
                this.updateVictory(dt);
                break;
        }
    }

    updateMenu(dt) {
        if (this.input.confirm) {
            this.initAudio();
            this.audio.playMenuSelect();
            this.startGame();
        }
    }

    updatePlaying(dt) {
        if (this.input.pause) {
            this.state = STATE.PAUSED;
            return;
        }

        this.levelTimer += dt;
        this.world.update(dt);

        // Player respawn
        if (!this.player.alive && this.player.lives > 0) {
            this.respawnTimer += dt;
            if (this.respawnTimer >= RESPAWN_DELAY) {
                this.respawnTimer = 0;
                this.player.respawn();
            }
        }

        // Player input
        this.player.update(dt);
        this.player.handleInput(this.input, dt, this.world, this.enemies);

        // Player shoot
        if (this.input.shoot && this.player.canShoot()) {
            this.shootBullet(this.player, 'player');
        }

        // Spawn enemies
        this.updateEnemySpawning(dt);

        // Update enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            enemy.update(dt);
            enemy.updateAI(dt, this.player, this.world, [...this.enemies, this.player], this.basePos);

            // Enemy shoot
            if (enemy.wantToShoot && enemy.shootCooldown <= 0) {
                this.shootBullet(enemy, 'enemy');
            }
        }

        // Update bullets
        for (const bullet of this.bullets) {
            bullet.update(dt);
        }

        // Collision detection
        this.checkBulletCollisions();
        this.checkPowerUpCollisions();

        // Update explosions
        for (const exp of this.explosions) {
            exp.update(dt);
        }

        // Update powerups
        for (const pu of this.powerups) {
            pu.update(dt);
        }

        // Update particles
        this.particles.update(dt);

        // Update shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
        }

        // Clean up dead entities
        this.bullets = this.bullets.filter(b => b.alive);
        this.explosions = this.explosions.filter(e => !e.done);
        this.powerups = this.powerups.filter(p => p.alive);

        // Check win/lose conditions
        if (!this.baseAlive) {
            this.state = STATE.GAME_OVER;
            this.gameOverTimer = 0;
            this.saveHiScore();
            this.audio.playGameOver();
            return;
        }

        if (this.player.lives <= 0 && !this.player.alive) {
            this.state = STATE.GAME_OVER;
            this.gameOverTimer = 0;
            this.saveHiScore();
            this.audio.playGameOver();
            return;
        }

        if (this.allEnemiesDefeated) {
            this.state = STATE.LEVEL_COMPLETE;
            this.levelCompleteTimer = 0;
            this.audio.playLevelComplete();
        }

        // Extra life at score threshold
        if (!this.extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
            this.extraLifeAwarded = true;
            this.player.lives++;
            this.audio.playPowerUp();
        }
    }

    updatePaused(dt) {
        if (this.input.pause) {
            this.state = STATE.PLAYING;
        }
    }

    updateLevelComplete(dt) {
        this.levelCompleteTimer += dt;
        this.particles.update(dt);

        // Celebration particles
        if (this.levelCompleteTimer < 2000 && Math.random() < 0.3) {
            this.particles.emitCelebration(
                randInt(100, GAME_AREA_WIDTH - 100),
                randInt(100, GAME_AREA_WIDTH - 100)
            );
        }

        if (this.levelCompleteTimer >= 3000) {
            if (this.currentLevel < LEVELS.length - 1) {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
                this.state = STATE.PLAYING;
            } else {
                this.state = STATE.VICTORY;
                this.saveHiScore();
                this.audio.playVictory();
            }
        }
    }

    updateGameOver(dt) {
        this.gameOverTimer += dt;
        this.particles.update(dt);
        if (this.input.confirm && this.gameOverTimer > 1000) {
            this.audio.playMenuSelect();
            this.state = STATE.MENU;
        }
    }

    updateVictory(dt) {
        this.particles.update(dt);

        if (Math.random() < 0.15) {
            this.particles.emitCelebration(
                randInt(50, GAME_AREA_WIDTH - 50),
                randInt(50, 700)
            );
        }

        if (this.input.confirm) {
            this.audio.playMenuSelect();
            this.state = STATE.MENU;
        }
    }

    updateEnemySpawning(dt) {
        if (this.nextSpawnIndex >= this.enemyQueue.length) return;

        const activeEnemies = this.enemies.filter(e => e.alive).length;
        if (activeEnemies >= MAX_ACTIVE_ENEMIES) return;

        const nextEnemy = this.enemyQueue[this.nextSpawnIndex];
        if (this.levelTimer >= nextEnemy.delay) {
            this.spawnEnemy(nextEnemy.type);
            this.nextSpawnIndex++;
        }
    }

    spawnEnemy(type) {
        const level = LEVELS[this.currentLevel];
        const spawnPoints = level.spawnPoints;

        // Pick a random spawn point that isn't blocked
        for (let attempt = 0; attempt < spawnPoints.length; attempt++) {
            const sp = spawnPoints[(attempt + this.nextSpawnIndex) % spawnPoints.length];
            const x = sp.x;
            const y = sp.y;

            // Check if spawn point is clear
            let blocked = false;
            for (const other of [...this.enemies, this.player]) {
                if (!other.alive) continue;
                if (rectsOverlap(
                    { x, y, w: TANK_SIZE, h: TANK_SIZE },
                    { x: other.x, y: other.y, w: other.w, h: other.h }
                )) {
                    blocked = true;
                    break;
                }
            }

            if (!blocked) {
                const enemy = new Enemy(x, y, type);
                this.enemies.push(enemy);
                this.audio.playSpawn();
                return;
            }
        }

        // All spawn points blocked, try again on next frame
        this.nextSpawnIndex--;
    }

    shootBullet(tank, owner) {
        const vec = DIR_VECTORS[tank.direction];
        const bx = tank.centerX + vec.x * (TANK_SIZE / 2);
        const by = tank.centerY + vec.y * (TANK_SIZE / 2);

        const bullet = new Bullet(bx, by, tank.direction, owner);
        this.bullets.push(bullet);

        if (owner === 'player') {
            this.player.onShoot();
        } else {
            tank.shootCooldown = 800;
        }

        this.audio.playShoot();
    }

    checkBulletCollisions() {
        for (const bullet of this.bullets) {
            if (!bullet.alive) continue;

            // Bullet vs walls
            const col = pixelToGrid(bullet.centerX);
            const row = pixelToGrid(bullet.centerY);

            // Check surrounding tiles
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const tc = col + dc;
                    const tr = row + dr;
                    const tile = this.world.getTile(tc, tr);

                    if (tile === TILE.BRICK || tile === TILE.STEEL) {
                        const tileRect = {
                            x: tc * TILE_SIZE, y: tr * TILE_SIZE,
                            w: TILE_SIZE, h: TILE_SIZE
                        };
                        const bulletRect = {
                            x: bullet.x, y: bullet.y,
                            w: bullet.w, h: bullet.h
                        };

                        if (rectsOverlap(bulletRect, tileRect)) {
                            bullet.alive = false;

                            if (tile === TILE.BRICK) {
                                this.world.setTile(tc, tr, TILE.EMPTY);
                                this.spawnExplosion(tc * TILE_SIZE + TILE_SIZE / 2,
                                                    tr * TILE_SIZE + TILE_SIZE / 2, 'small');
                            } else {
                                // Steel: bullet destroyed, wall stays
                                this.spawnExplosion(bullet.centerX, bullet.centerY, 'small');
                            }
                            this.audio.playHit();

                            if (bullet.owner === 'player') {
                                this.player.onBulletDestroyed();
                            }
                            break;
                        }
                    }
                }
                if (!bullet.alive) break;
            }

            if (!bullet.alive) continue;

            // Bullet vs tanks
            if (bullet.owner === 'player') {
                // Hit enemies
                for (const enemy of this.enemies) {
                    if (!enemy.alive || enemy.invulnerable) continue;
                    if (rectsOverlap(
                        { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h },
                        { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h }
                    )) {
                        bullet.alive = false;
                        this.player.onBulletDestroyed();
                        const destroyed = enemy.takeDamage();

                        if (destroyed) {
                            this.score += enemy.scoreValue;
                            this.enemyKillCount++;
                            this.spawnExplosion(enemy.centerX, enemy.centerY, 'large');
                            this.particles.emitCuteExplosion(enemy.centerX, enemy.centerY);
                            this.audio.playExplosion();

                            // Power-up drop
                            if (this.enemyKillCount % POWERUP_DROP_INTERVAL === 0) {
                                this.spawnPowerUp();
                            }
                        } else {
                            this.spawnExplosion(bullet.centerX, bullet.centerY, 'small');
                            this.audio.playHit();
                        }
                        break;
                    }
                }
            } else {
                // Enemy bullet hits player
                if (this.player.alive && !this.player.respawning) {
                    if (rectsOverlap(
                        { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h },
                        { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }
                    )) {
                        bullet.alive = false;
                        const destroyed = this.player.takeDamage();

                        if (destroyed) {
                            this.spawnExplosion(this.player.centerX, this.player.centerY, 'large');
                            this.particles.emitCuteExplosion(this.player.centerX, this.player.centerY);
                            this.audio.playBigExplosion();
                            this.respawnTimer = 0;
                        } else {
                            // Shield absorbed the hit
                            this.spawnExplosion(bullet.centerX, bullet.centerY, 'small');
                            this.audio.playHit();
                        }
                    }
                }

                // Enemy bullet hits base
                if (this.baseAlive) {
                    const baseRect = {
                        x: this.basePos.x - TILE_SIZE,
                        y: this.basePos.y - TILE_SIZE / 2,
                        w: TILE_SIZE * 2,
                        h: TILE_SIZE * 2
                    };
                    if (rectsOverlap(
                        { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h },
                        baseRect
                    )) {
                        bullet.alive = false;
                        this.baseAlive = false;
                        this.spawnExplosion(this.basePos.x, this.basePos.y, 'large');
                        this.particles.emitCuteExplosion(this.basePos.x, this.basePos.y);
                        this.audio.playBigExplosion();
                        this.shakeTimer = 500;
                        this.shakeIntensity = 8;
                    }
                }
            }

            // Bullet already dead from boundary check
            if (!bullet.alive && bullet.owner === 'player') {
                // Make sure we counted this bullet
            }

            // Bullet vs bullet
            for (const other of this.bullets) {
                if (other === bullet || !other.alive || !bullet.alive) continue;
                if (rectsOverlap(
                    { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h },
                    { x: other.x, y: other.y, w: other.w, h: other.h }
                )) {
                    if (bullet.owner === 'player') this.player.onBulletDestroyed();
                    if (other.owner === 'player') this.player.onBulletDestroyed();
                    bullet.alive = false;
                    other.alive = false;
                    this.spawnExplosion(bullet.centerX, bullet.centerY, 'small');
                }
            }
        }
    }

    checkPowerUpCollisions() {
        if (!this.player.alive || this.player.respawning) return;

        for (const pu of this.powerups) {
            if (!pu.alive) continue;
            if (rectsOverlap(
                { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h },
                { x: pu.x, y: pu.y, w: pu.w, h: pu.h }
            )) {
                pu.alive = false;
                this.score += SCORE.POWERUP;

                if (pu.type === POWERUP_TYPE.BOMB) {
                    // Destroy all active enemies
                    for (const enemy of this.enemies) {
                        if (enemy.alive) {
                            enemy.alive = false;
                            this.score += enemy.scoreValue;
                            this.enemyKillCount++;
                            this.spawnExplosion(enemy.centerX, enemy.centerY, 'large');
                            this.particles.emitCuteExplosion(enemy.centerX, enemy.centerY);
                        }
                    }
                    this.audio.playBigExplosion();
                    this.shakeTimer = 300;
                    this.shakeIntensity = 5;
                } else {
                    pu.applyTo(this.player);
                    this.audio.playPowerUp();
                }

                this.particles.emitPowerUp(pu.x + pu.w / 2, pu.y + pu.h / 2);
            }
        }
    }

    spawnExplosion(x, y, size) {
        this.explosions.push(new Explosion(x, y, size));
    }

    spawnPowerUp() {
        // Find a random empty tile for the power-up
        const emptyCells = [];
        for (let r = 2; r < GRID_ROWS - 2; r++) {
            for (let c = 2; c < 24; c++) {
                if (this.world.getTile(c, r) === TILE.EMPTY) {
                    emptyCells.push({ x: c * TILE_SIZE, y: r * TILE_SIZE });
                }
            }
        }

        if (emptyCells.length > 0) {
            const cell = emptyCells[randInt(0, emptyCells.length - 1)];
            this.powerups.push(new PowerUp(cell.x, cell.y, randomPowerUpType()));
        }
    }

    // ==================== DRAWING ====================

    draw(ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        switch (this.state) {
            case STATE.MENU:
                this.drawMenu(ctx);
                break;
            case STATE.PLAYING:
            case STATE.PAUSED:
                this.drawGame(ctx);
                if (this.state === STATE.PAUSED) this.drawPauseOverlay(ctx);
                break;
            case STATE.LEVEL_COMPLETE:
                this.drawGame(ctx);
                this.drawLevelComplete(ctx);
                break;
            case STATE.GAME_OVER:
                this.drawGame(ctx);
                this.drawGameOver(ctx);
                break;
            case STATE.VICTORY:
                this.drawGame(ctx);
                this.drawVictory(ctx);
                break;
        }
    }

    drawGame(ctx) {
        ctx.save();

        // Screen shake
        if (this.shakeTimer > 0) {
            const intensity = this.shakeIntensity * (this.shakeTimer / 500);
            ctx.translate(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity
            );
        }

        // Clip to game area
        ctx.beginPath();
        ctx.rect(0, 0, GAME_AREA_WIDTH, CANVAS_HEIGHT);
        ctx.clip();

        // Draw world (tiles)
        this.world.draw(ctx);

        // Draw base
        this.drawBase(ctx);

        // Draw powerups
        for (const pu of this.powerups) {
            pu.draw(ctx);
        }

        // Draw player
        this.player.draw(ctx);

        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }

        // Draw forest layer on top of tanks
        this.world.drawForestLayer(ctx);

        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.draw(ctx);
        }

        // Draw explosions
        for (const exp of this.explosions) {
            exp.draw(ctx);
        }

        // Draw particles
        this.particles.draw(ctx);

        ctx.restore();

        // Draw HUD (outside game area clip)
        this.hud.draw(ctx, this);
    }

    drawBase(ctx) {
        const bx = this.basePos.x;
        const by = this.basePos.y;

        if (this.baseAlive) {
            // Cute flag/house with heart
            ctx.fillStyle = '#5D4037';
            roundRect(ctx, bx - 15, by - 10, 30, 25, 3);
            ctx.fill();

            // Roof
            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.moveTo(bx - 18, by - 8);
            ctx.lineTo(bx, by - 22);
            ctx.lineTo(bx + 18, by - 8);
            ctx.closePath();
            ctx.fill();

            // Door
            ctx.fillStyle = '#FFE082';
            roundRect(ctx, bx - 5, by + 2, 10, 13, 2);
            ctx.fill();

            // Heart on house
            ctx.fillStyle = '#F48FB1';
            ctx.font = '10px serif';
            ctx.textAlign = 'center';
            ctx.fillText('\u2665', bx, by - 1);
        } else {
            // Destroyed base
            ctx.fillStyle = '#555';
            ctx.fillRect(bx - 15, by - 10, 30, 25);
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('X', bx, by + 8);
        }
    }

    drawMenu(ctx) {
        // Background
        ctx.fillStyle = COLORS.MENU_BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Stars background
        for (let i = 0; i < 50; i++) {
            const seed = i * 137.5;
            const sx = (seed * 7.3) % CANVAS_WIDTH;
            const sy = (seed * 3.7) % CANVAS_HEIGHT;
            const brightness = 0.3 + Math.sin(this.menuTimer * 0.002 + i) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const cx = CANVAS_WIDTH / 2;

        // Title
        ctx.textAlign = 'center';

        // Title shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.font = 'bold 52px monospace';
        ctx.fillText('CUTE TANK WAR', cx + 3, 203);

        // Title main
        ctx.fillStyle = COLORS.MENU_TITLE;
        ctx.font = 'bold 52px monospace';
        ctx.fillText('CUTE TANK WAR', cx, 200);

        // Subtitle with bounce
        const bounce = Math.sin(this.menuTimer * 0.003) * 5;
        ctx.fillStyle = COLORS.MENU_SUBTITLE;
        ctx.font = 'bold 18px monospace';
        ctx.fillText('~ Battle City Reimagined ~', cx, 240 + bounce);

        // Tank illustration
        this.drawMenuTank(ctx, cx - 80, 300, COLORS.PLAYER_BODY, COLORS.PLAYER_TURRET, DIR.RIGHT);
        ctx.fillStyle = COLORS.BULLET;
        for (let i = 0; i < 3; i++) {
            const bx = cx - 10 + i * 25 + Math.sin(this.menuTimer * 0.005 + i) * 5;
            ctx.beginPath();
            ctx.arc(bx, 330, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        this.drawMenuTank(ctx, cx + 50, 300, COLORS.ENEMY_WANDERER, '#E91E63', DIR.LEFT);

        // Instructions
        const blink = Math.sin(this.menuTimer * 0.004) > 0;
        if (blink) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px monospace';
            ctx.fillText('PRESS ENTER TO START', cx, 440);
        }

        // Controls
        ctx.fillStyle = '#888';
        ctx.font = '14px monospace';
        ctx.fillText('WASD / Arrow Keys - Move', cx, 510);
        ctx.fillText('Space - Shoot', cx, 535);
        ctx.fillText('Esc - Pause    M - Mute', cx, 560);

        // Hi-score
        if (this.hiScore > 0) {
            ctx.fillStyle = COLORS.HUD_SCORE;
            ctx.font = 'bold 16px monospace';
            ctx.fillText(`HI-SCORE: ${formatNumber(this.hiScore)}`, cx, 630);
        }

        // Version / credits
        ctx.fillStyle = '#555';
        ctx.font = '11px monospace';
        ctx.fillText('Made with love for cute tank battles', cx, CANVAS_HEIGHT - 20);
    }

    drawMenuTank(ctx, x, y, bodyColor, turretColor, dir) {
        ctx.save();
        ctx.translate(x + 30, y + 30);

        const angle = dir === DIR.RIGHT ? Math.PI / 2 : -Math.PI / 2;
        ctx.rotate(angle);

        ctx.fillStyle = bodyColor;
        roundRect(ctx, -18, -22, 36, 44, 6);
        ctx.fill();

        ctx.fillStyle = turretColor;
        ctx.beginPath();
        ctx.arc(0, 2, 11, 0, Math.PI * 2);
        ctx.fill();
        roundRect(ctx, -3.5, -28, 7, 22, 3);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-8, -10, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -10, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-8, -11.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -11.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawPauseOverlay(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.font = '16px monospace';
        ctx.fillText('Press ESC to continue', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    drawLevelComplete(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = COLORS.HUD_SCORE;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px monospace';
        ctx.fillText(`Score: ${formatNumber(this.score)}`, GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        this.particles.draw(ctx);
    }

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#EF5350';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px monospace';
        ctx.fillText(`Final Score: ${formatNumber(this.score)}`, GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

        if (this.score > this.hiScore) {
            ctx.fillStyle = COLORS.HUD_SCORE;
            ctx.font = 'bold 16px monospace';
            ctx.fillText('NEW HI-SCORE!', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
        }

        if (this.gameOverTimer > 1000) {
            const blink = Math.sin(Date.now() * 0.004) > 0;
            if (blink) {
                ctx.fillStyle = '#888';
                ctx.font = '14px monospace';
                ctx.fillText('Press ENTER to continue', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
            }
        }
    }

    drawVictory(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, GAME_AREA_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = COLORS.HUD_SCORE;
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

        ctx.fillStyle = COLORS.MENU_SUBTITLE;
        ctx.font = 'bold 20px monospace';
        ctx.fillText('You saved the base!', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '18px monospace';
        ctx.fillText(`Final Score: ${formatNumber(this.score)}`, GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        if (this.score >= this.hiScore) {
            ctx.fillStyle = COLORS.HUD_SCORE;
            ctx.font = 'bold 16px monospace';
            ctx.fillText('NEW HI-SCORE!', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
        }

        const blink = Math.sin(Date.now() * 0.004) > 0;
        if (blink) {
            ctx.fillStyle = '#888';
            ctx.font = '14px monospace';
            ctx.fillText('Press ENTER to continue', GAME_AREA_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
        }

        this.particles.draw(ctx);
    }
}
