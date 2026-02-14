import { TILE_SIZE, DIR } from './constants.js';

// AABB rectangle overlap test
export function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

// Clamp a value between min and max
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Convert pixel position to grid column/row
export function pixelToGrid(px) {
    return Math.floor(px / TILE_SIZE);
}

// Convert grid column/row to pixel position
export function gridToPixel(grid) {
    return grid * TILE_SIZE;
}

// Snap a value to the nearest half-tile boundary
export function snapToHalfTile(val) {
    const half = TILE_SIZE / 2;
    return Math.round(val / half) * half;
}

// Darken a hex color by a percentage (0-100)
export function darkenColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) * (1 - percent / 100)) | 0;
    const g = Math.max(0, ((num >> 8) & 0xFF) * (1 - percent / 100)) | 0;
    const b = Math.max(0, (num & 0xFF) * (1 - percent / 100)) | 0;
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Lighten a hex color by a percentage (0-100)
export function lightenColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + (255 - ((num >> 16) & 0xFF)) * percent / 100) | 0;
    const g = Math.min(255, ((num >> 8) & 0xFF) + (255 - ((num >> 8) & 0xFF)) * percent / 100) | 0;
    const b = Math.min(255, (num & 0xFF) + (255 - (num & 0xFF)) * percent / 100) | 0;
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

// Draw a rounded rectangle path
export function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

// Random integer between min and max (inclusive)
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
export function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Distance between two points
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Get the opposite direction
export function oppositeDir(dir) {
    return (dir + 2) % 4;
}

// Format a number with commas
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
