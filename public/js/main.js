import { CANVAS_WIDTH, CANVAS_HEIGHT, TICK_DURATION } from './constants.js';
import { Game } from './game.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const input = new InputManager();
input.init();

const audio = new AudioManager();
const game = new Game(ctx, input, audio);

let lastTime = 0;
let accumulator = 0;

function loop(currentTime) {
    if (lastTime === 0) lastTime = currentTime;

    const delta = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += delta;

    // Cap accumulator to prevent spiral of death
    if (accumulator > 200) accumulator = 200;

    while (accumulator >= TICK_DURATION) {
        game.update(TICK_DURATION);
        input.endFrame();
        accumulator -= TICK_DURATION;
    }

    game.draw(ctx);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
