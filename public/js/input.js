export class InputManager {
    constructor() {
        this.keys = {};
        this.justPressed = {};
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.justPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Prevent scrolling with game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Reset state when window loses focus
        window.addEventListener('blur', () => {
            this.keys = {};
            this.justPressed = {};
        });
    }

    isDown(code) {
        return !!this.keys[code];
    }

    wasPressed(code) {
        return !!this.justPressed[code];
    }

    // Movement helpers — check both WASD and arrow keys
    get up() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
    get down() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
    get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
    get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
    get shoot() { return this.isDown('Space'); }
    get pause() { return this.wasPressed('Escape'); }
    get confirm() { return this.wasPressed('Enter'); }
    get mute() { return this.wasPressed('KeyM'); }

    endFrame() {
        this.justPressed = {};
    }
}
