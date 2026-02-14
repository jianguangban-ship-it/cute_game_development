import {
    GAME_AREA_WIDTH, HUD_WIDTH, CANVAS_HEIGHT, COLORS, ENEMY_TYPE
} from './constants.js';
import { roundRect, formatNumber } from './utils.js';
import { drawTankIcon } from './renderer.js';

export class HUD {
    constructor() {}

    draw(ctx, game) {
        const x = GAME_AREA_WIDTH;
        const w = HUD_WIDTH;
        const h = CANVAS_HEIGHT;

        // Background
        ctx.fillStyle = COLORS.HUD_BG;
        ctx.fillRect(x, 0, w, h);

        // Decorative left border
        ctx.fillStyle = '#444';
        ctx.fillRect(x, 0, 2, h);

        const centerX = x + w / 2;
        let curY = 20;

        // Level number
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL', centerX, curY);
        curY += 22;
        ctx.font = 'bold 24px monospace';
        ctx.fillStyle = COLORS.HUD_SCORE;
        ctx.fillText(String(game.currentLevel + 1), centerX, curY);
        curY += 35;

        // Enemy count section
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.font = 'bold 11px monospace';
        ctx.fillText('ENEMIES', centerX, curY);
        curY += 12;

        // Enemy icons grid (2 columns)
        const remaining = game.remainingEnemies;
        const iconSize = 16;
        const iconPadding = 3;
        const cols = 2;
        const startX = x + (w - cols * (iconSize + iconPadding)) / 2;

        for (let i = 0; i < remaining; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const ix = startX + col * (iconSize + iconPadding);
            const iy = curY + row * (iconSize + iconPadding);
            drawTankIcon(ctx, ix, iy, iconSize, '#E0E0E0');
        }

        const iconRows = Math.ceil(remaining / cols);
        curY += Math.max(iconRows * (iconSize + iconPadding), 20) + 15;

        // Separator line
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 15, curY);
        ctx.lineTo(x + w - 15, curY);
        ctx.stroke();
        curY += 20;

        // Lives section
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LIVES', centerX, curY);
        curY += 12;

        const lifeIconSize = 20;
        const livesStartX = x + (w - Math.min(game.player.lives, 3) * (lifeIconSize + 4)) / 2;
        for (let i = 0; i < game.player.lives; i++) {
            drawTankIcon(ctx, livesStartX + i * (lifeIconSize + 4), curY, lifeIconSize, COLORS.PLAYER_BODY);
        }
        curY += lifeIconSize + 25;

        // Separator line
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(x + 15, curY);
        ctx.lineTo(x + w - 15, curY);
        ctx.stroke();
        curY += 20;

        // Score
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SCORE', centerX, curY);
        curY += 18;
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = COLORS.HUD_SCORE;
        ctx.fillText(formatNumber(game.score), centerX, curY);
        curY += 30;

        // Hi-score
        ctx.fillStyle = COLORS.HUD_TEXT;
        ctx.font = 'bold 11px monospace';
        ctx.fillText('HI-SCORE', centerX, curY);
        curY += 18;
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#FF8A80';
        ctx.fillText(formatNumber(game.hiScore), centerX, curY);
        curY += 30;

        // Power-up indicators
        if (game.player.shielded || game.player.speedBoost || game.player.rapidFire) {
            ctx.strokeStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(x + 15, curY);
            ctx.lineTo(x + w - 15, curY);
            ctx.stroke();
            curY += 15;

            ctx.fillStyle = COLORS.HUD_TEXT;
            ctx.font = 'bold 11px monospace';
            ctx.fillText('POWER-UPS', centerX, curY);
            curY += 14;

            ctx.font = '10px monospace';
            if (game.player.shielded) {
                ctx.fillStyle = '#42A5F5';
                ctx.fillText('SHIELD', centerX, curY);
                curY += 14;
            }
            if (game.player.speedBoost) {
                ctx.fillStyle = '#FFC107';
                const sec = Math.ceil(game.player.speedBoostTimer / 1000);
                ctx.fillText(`SPEED ${sec}s`, centerX, curY);
                curY += 14;
            }
            if (game.player.rapidFire) {
                ctx.fillStyle = '#EF5350';
                const sec = Math.ceil(game.player.rapidFireTimer / 1000);
                ctx.fillText(`RAPID ${sec}s`, centerX, curY);
                curY += 14;
            }
        }

        // Controls hint at bottom
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WASD/Arrows', centerX, h - 45);
        ctx.fillText('Space: Shoot', centerX, h - 33);
        ctx.fillText('Esc: Pause', centerX, h - 21);
        ctx.fillText('M: Mute', centerX, h - 9);
    }
}
