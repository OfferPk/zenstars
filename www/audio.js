/**
 * ZenStars - Procedural Web Audio Synthesizer
 * Pure procedural synthesis using Web Audio API:
 * - Celestial bell & starlight celesta harmonics
 * - Pentatonic cosmic frequency scales
 * - Zero external audio files / 100% offline
 */

class StarAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isInitialized = false;

    try {
      const saved = localStorage.getItem('zenstars_sound_enabled');
      if (saved !== null) {
        this.muted = saved === 'false';
      }
    } catch (e) {
      this.muted = false;
    }
  }

  init() {
    if (this.isInitialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleSound() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('zenstars_sound_enabled', String(!this.muted));
    } catch (e) {}
    return !this.muted;
  }

  isSoundEnabled() {
    return !this.muted;
  }

  /**
   * Radiant celestial bell chime on star placement
   */
  playStarChime(pitchIdx = 0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Celestial pentatonic frequencies: C5, D5, E5, G5, A5, C6, D6, E6
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const baseFreq = pentatonic[Math.abs(pitchIdx) % pentatonic.length];

    // Dual oscillator: fundamental sine + crystal bell harmonic
    [baseFreq, baseFreq * 2.76].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const amp = idx === 0 ? 0.18 : 0.06;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(amp, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + (idx === 0 ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  /**
   * Subtle stardust wooden tap when marking a dot / ruled-out cell
   */
  playDotTap() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * Soft whoosh / dissolve when clearing a cell to empty
   */
  playErase() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.09);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  /**
   * Harmonic shimmer when a row, col, or zone reaches satisfaction
   */
  playZoneSatisfied() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 880.00, 1046.50]; // E5, A5, C6
    notes.forEach((freq, idx) => {
      const delay = idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.001, t + delay);
      gain.gain.linearRampToValueAtTime(0.1, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.5);
    });
  }

  /**
   * Gentle subtle wobble tone when a conflict is detected
   */
  playConflict() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.15);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Grand victory arpeggio on completing the constellation level
   */
  playVictory() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Ascending celestial harp cascade: C5, E5, G5, B5, C6, E6, G6
    const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51, 1567.98];

    arpeggio.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.001, t + delay);
      gain.gain.linearRampToValueAtTime(0.14, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.95);
    });
  }

  /**
   * Soft glass click for UI buttons
   */
  playButtonTap() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.03);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StarAudio };
}
