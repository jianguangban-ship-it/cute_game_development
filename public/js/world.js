import { TILE_SIZE, GRID_COLS, GRID_ROWS, TILE, COLORS, GAME_AREA_WIDTH } from './constants.js';
import { roundRect } from './utils.js';

export class World {
    constructor() {
        this.grid = [];
        this.waterAnimOffset = 0;
        this.iceSparkleTimer = 0;
    }

    loadLevel(levelData) {
        // Deep copy the grid
        this.grid = levelData.grid.map(row => [...row]);
    }

    getTile(col, row) {
        if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return TILE.STEEL;
        return this.grid[row][col];
    }

    setTile(col, row, type) {
        if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
            this.grid[row][col] = type;
        }
    }

    // Check if a tile blocks movement
    isSolid(col, row) {
        const tile = this.getTile(col, row);
        return tile === TILE.BRICK || tile === TILE.STEEL || tile === TILE.WATER;
    }

    // Check if a tile blocks bullets
    blocksBullets(col, row) {
        const tile = this.getTile(col, row);
        return tile === TILE.BRICK || tile === TILE.STEEL;
    }

    // Check if a rectangular area can move here (no solid tiles overlap)
    isAreaPassable(x, y, w, h) {
        const startCol = Math.floor(x / TILE_SIZE);
        const endCol = Math.floor((x + w - 0.01) / TILE_SIZE);
        const startRow = Math.floor(y / TILE_SIZE);
        const endRow = Math.floor((y + h - 0.01) / TILE_SIZE);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (this.isSolid(c, r)) return false;
            }
        }
        return true;
    }

    // Check if area is within game bounds
    isInBounds(x, y, w, h) {
        return x >= 0 && y >= 0 && x + w <= GAME_AREA_WIDTH && y + h <= GRID_ROWS * TILE_SIZE;
    }

    // Check if a tile is ice
    isIce(col, row) {
        return this.getTile(col, row) === TILE.ICE;
    }

    update(dt) {
        this.waterAnimOffset += dt * 0.002;
        this.iceSparkleTimer += dt;
    }

    draw(ctx) {
        // Draw all tiles except forest (forest drawn on top of tanks later)
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                const tile = this.grid[r][c];

                switch (tile) {
                    case TILE.EMPTY:
                        this.drawGrass(ctx, x, y);
                        break;
                    case TILE.BRICK:
                        this.drawGrass(ctx, x, y);
                        this.drawBrick(ctx, x, y);
                        break;
                    case TILE.STEEL:
                        this.drawGrass(ctx, x, y);
                        this.drawSteel(ctx, x, y);
                        break;
                    case TILE.WATER:
                        this.drawWater(ctx, x, y);
                        break;
                    case TILE.FOREST:
                        this.drawGrass(ctx, x, y);
                        break;
                    case TILE.ICE:
                        this.drawIce(ctx, x, y);
                        break;
                }
            }
        }
    }

    // Draw forest tiles on top of everything (called after drawing tanks)
    drawForestLayer(ctx) {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.grid[r][c] === TILE.FOREST) {
                    this.drawForest(ctx, c * TILE_SIZE, r * TILE_SIZE);
                }
            }
        }
    }

    drawGrass(ctx, x, y) {
        ctx.fillStyle = COLORS.GRASS;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Small random dots for texture (deterministic based on position)
        ctx.fillStyle = '#72B847';
        const seed = (x * 7 + y * 13) % 17;
        if (seed < 5) {
            ctx.fillRect(x + seed * 2 + 3, y + seed * 3 + 2, 2, 2);
        }
        if (seed > 8) {
            ctx.fillRect(x + 15 + seed, y + 10 + seed % 5, 2, 2);
        }
    }

    drawBrick(ctx, x, y) {
        ctx.fillStyle = COLORS.BRICK;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Mortar lines (grid of sub-bricks)
        ctx.strokeStyle = COLORS.BRICK_MORTAR;
        ctx.lineWidth = 1;
        const subSize = TILE_SIZE / 4;
        for (let i = 0; i <= 4; i++) {
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(x, y + i * subSize);
            ctx.lineTo(x + TILE_SIZE, y + i * subSize);
            ctx.stroke();
        }
        // Vertical lines offset on alternating rows
        for (let row = 0; row < 4; row++) {
            const offsetX = (row % 2 === 0) ? 0 : subSize / 2;
            for (let col = 0; col <= 4; col++) {
                const lx = x + col * subSize + offsetX;
                if (lx >= x && lx <= x + TILE_SIZE) {
                    ctx.beginPath();
                    ctx.moveTo(lx, y + row * subSize);
                    ctx.lineTo(lx, y + (row + 1) * subSize);
                    ctx.stroke();
                }
            }
        }

        // Slight rounded border
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    }

    drawSteel(ctx, x, y) {
        ctx.fillStyle = COLORS.STEEL;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Diagonal shine line
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
        ctx.stroke();

        // Rivet dots
        ctx.fillStyle = COLORS.STEEL_DARK;
        const rivetSize = 3;
        ctx.beginPath();
        ctx.arc(x + 6, y + 6, rivetSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE - 6, y + 6, rivetSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 6, y + TILE_SIZE - 6, rivetSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + TILE_SIZE - 6, y + TILE_SIZE - 6, rivetSize, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    }

    drawWater(ctx, x, y) {
        ctx.fillStyle = COLORS.WATER;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Animated wave lines
        ctx.strokeStyle = COLORS.WATER_LIGHT;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const baseY = y + 6 + i * 10;
            for (let px = 0; px <= TILE_SIZE; px += 2) {
                const waveY = baseY + Math.sin((px + x) * 0.15 + this.waterAnimOffset * (i + 1) * 1.5) * 2.5;
                if (px === 0) ctx.moveTo(x + px, waveY);
                else ctx.lineTo(x + px, waveY);
            }
            ctx.stroke();
        }
    }

    drawForest(ctx, x, y) {
        // Multiple overlapping green circles
        const circles = [
            { cx: 8, cy: 10, r: 10, color: '#2D8B3D' },
            { cx: 20, cy: 8, r: 11, color: '#3DA35D' },
            { cx: 14, cy: 18, r: 12, color: '#34943D' },
            { cx: 24, cy: 20, r: 9, color: '#2D8B3D' },
            { cx: 6, cy: 22, r: 8, color: '#3DA35D' },
        ];
        for (const c of circles) {
            ctx.fillStyle = c.color;
            ctx.beginPath();
            ctx.arc(x + c.cx, y + c.cy, c.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawIce(ctx, x, y) {
        ctx.fillStyle = COLORS.ICE;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Cross pattern
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE);
        ctx.moveTo(x + TILE_SIZE, y);
        ctx.lineTo(x, y + TILE_SIZE);
        ctx.stroke();

        // Sparkle dots
        if (Math.sin(this.iceSparkleTimer * 0.003 + x * 0.1) > 0.5) {
            ctx.fillStyle = COLORS.ICE_SPARKLE;
            ctx.beginPath();
            ctx.arc(x + 10, y + 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        if (Math.sin(this.iceSparkleTimer * 0.004 + y * 0.1) > 0.3) {
            ctx.fillStyle = COLORS.ICE_SPARKLE;
            ctx.beginPath();
            ctx.arc(x + 22, y + 20, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
