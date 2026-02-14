export class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 0.25;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            // Audio not supported
        }
    }

    toggleMute() {
        this.muted = !this.muted;
    }

    // Create a simple tone
    playTone(frequency, duration, type = 'square', volumeMult = 1) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = this.volume * volumeMult;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Play noise (for explosions)
    playNoise(duration, volumeMult = 1) {
        if (!this.ctx || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = this.volume * volumeMult * 0.5;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    // Short "pew" sound
    playShoot() {
        this.playTone(600, 0.08, 'square', 0.4);
        setTimeout(() => this.playTone(400, 0.05, 'square', 0.2), 30);
    }

    // Explosion: noise burst + low sweep
    playExplosion() {
        this.playNoise(0.3, 0.8);
        this.playTone(100, 0.2, 'sine', 0.5);
    }

    // Big explosion
    playBigExplosion() {
        this.playNoise(0.5, 1.0);
        this.playTone(60, 0.4, 'sine', 0.6);
    }

    // Power-up: ascending arpeggio
    playPowerUp() {
        this.playTone(523, 0.1, 'sine', 0.5);  // C5
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.5), 80);  // E5
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.5), 160); // G5
    }

    // Hit sound
    playHit() {
        this.playNoise(0.1, 0.4);
        this.playTone(200, 0.1, 'sawtooth', 0.3);
    }

    // Level complete: happy ascending scale
    playLevelComplete() {
        const notes = [523, 587, 659, 784, 1047]; // C D E G C
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.5), i * 120);
        });
    }

    // Game over: descending sad tones
    playGameOver() {
        const notes = [392, 349, 311, 261]; // G F Eb C
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.5), i * 200);
        });
    }

    // Victory fanfare
    playVictory() {
        const notes = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
        const durations = [0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.15, 0.15, 0.4];
        let time = 0;
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, durations[i], 'sine', 0.5), time);
            time += durations[i] * 1000 + 50;
        });
    }

    // Menu select click
    playMenuSelect() {
        this.playTone(800, 0.05, 'sine', 0.3);
    }

    // Enemy spawn
    playSpawn() {
        this.playTone(300, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(450, 0.1, 'sine', 0.2), 100);
    }
}
