// Sound Effects for Slot Machine
class SlotSounds {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = 0.3; // 30% volume
    }

    // Reel spin sound - rocket launch!
    playSpinSound() {
        const duration = 1.2;

        // Low rumble (rocket engine)
        const rumble = this.audioContext.createOscillator();
        const rumbleGain = this.audioContext.createGain();
        rumble.connect(rumbleGain);
        rumbleGain.connect(this.audioContext.destination);

        rumble.type = 'sawtooth';
        rumble.frequency.setValueAtTime(40, this.audioContext.currentTime);
        rumble.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration * 0.3);
        rumble.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + duration);

        rumbleGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        rumbleGain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime + 0.1);
        rumbleGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        rumble.start(this.audioContext.currentTime);
        rumble.stop(this.audioContext.currentTime + duration);

        // High pitch whoosh (rocket acceleration)
        const whoosh = this.audioContext.createOscillator();
        const whooshGain = this.audioContext.createGain();
        whoosh.connect(whooshGain);
        whooshGain.connect(this.audioContext.destination);

        whoosh.type = 'sine';
        whoosh.frequency.setValueAtTime(800, this.audioContext.currentTime);
        whoosh.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + duration * 0.5);
        whoosh.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + duration);

        whooshGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        whooshGain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.05);
        whooshGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        whoosh.start(this.audioContext.currentTime);
        whoosh.stop(this.audioContext.currentTime + duration);

        // White noise burst (launch flame)
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioContext.sampleRate * 0.3));
        }

        noise.buffer = noiseBuffer;
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        noise.start(this.audioContext.currentTime);
    }

    // Win sound - cheerful ascending tones
    playWinSound(winAmount) {
        const baseFreq = 400;
        const notes = [0, 4, 7, 12]; // Major chord arpeggio
        const noteDuration = 0.15;

        notes.forEach((semitone, index) => {
            const freq = baseFreq * Math.pow(2, semitone / 12);
            const startTime = this.audioContext.currentTime + (index * noteDuration);

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.5, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);

            oscillator.start(startTime);
            oscillator.stop(startTime + noteDuration);
        });
    }

    // Big win sound - more dramatic
    playBigWinSound() {
        const duration = 1.0;

        // Bass pulse
        const bass = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        bass.connect(bassGain);
        bassGain.connect(this.audioContext.destination);
        bass.type = 'sine';
        bass.frequency.setValueAtTime(80, this.audioContext.currentTime);
        bassGain.gain.setValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        bass.start();
        bass.stop(this.audioContext.currentTime + duration);

        // High sparkle
        for (let i = 0; i < 8; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            const startTime = this.audioContext.currentTime + (i * 0.1);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800 + Math.random() * 800, startTime);
            gain.gain.setValueAtTime(this.masterVolume * 0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        }
    }

    // Bonus trigger sound
    playBonusSound() {
        const duration = 0.8;
        const freqs = [523.25, 659.25, 783.99]; // C, E, G (major chord)

        freqs.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

            gain.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
        });
    }

    // Reel stop sound - click
    playReelStopSound() {
        const noise = this.audioContext.createBufferSource();
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.05, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        noise.buffer = noiseBuffer;

        const noiseGain = this.audioContext.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        noise.start();
    }

    // Casino ambient background music
    startCasinoAmbient() {
        if (this.ambientStarted) return;
        this.ambientStarted = true;

        const playAmbientLoop = () => {
            // Jazz chords progression
            const chordProgressions = [
                [261.63, 329.63, 392.00], // C Major
                [293.66, 369.99, 440.00], // D minor
                [329.63, 392.00, 493.88], // E minor
                [349.23, 440.00, 523.25]  // F Major
            ];

            const chordDuration = 4.0;

            chordProgressions.forEach((chord, index) => {
                const startTime = this.audioContext.currentTime + (index * chordDuration);

                chord.forEach((freq, noteIndex) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();

                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq * 0.5, startTime); // Lower octave

                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.05, startTime + 0.1);
                    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.03, startTime + chordDuration - 0.5);
                    gain.gain.linearRampToValueAtTime(0, startTime + chordDuration);

                    osc.start(startTime);
                    osc.stop(startTime + chordDuration);
                });
            });

            // Loop every 16 seconds
            setTimeout(playAmbientLoop, 16000);
        };

        playAmbientLoop();
    }
}

// Export for use in script.js
const slotSounds = new SlotSounds();

// Resume audio context and start ambient music on first user interaction
document.addEventListener('click', () => {
    // Resume audio context (required by modern browsers)
    if (slotSounds.audioContext.state === 'suspended') {
        slotSounds.audioContext.resume();
    }
    slotSounds.startCasinoAmbient();
    console.log('Audio system activated!');
}, { once: true });

