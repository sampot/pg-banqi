/**
 * Original board-game SFX via Web Audio — no commercial samples.
 */

export class BanqiAudio {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    this.enabled = true;
    this.master = 0.18;
  }

  async unlock() {
    this.ensure();
    if (this.ctx?.state === "suspended") await this.ctx.resume();
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
  }

  setEnabled(on) {
    this.enabled = on;
  }

  /**
   * @param {number} freq
   * @param {number} dur
   * @param {OscillatorType} [type]
   * @param {number} [gain]
   * @param {number} [when]
   */
  tone(freq, dur, type = "square", gain = 0.12, when = 0) {
    if (!this.enabled) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain * this.master, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.03, dur));
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  flip() {
    this.tone(520, 0.05, "triangle", 0.08);
    this.tone(340, 0.06, "square", 0.05, 0.04);
  }

  select() {
    this.tone(660, 0.03, "sine", 0.05);
  }

  move() {
    this.tone(280, 0.05, "triangle", 0.07);
  }

  capture() {
    this.tone(200, 0.07, "sawtooth", 0.1);
    this.tone(420, 0.08, "square", 0.07, 0.05);
  }

  deny() {
    this.tone(110, 0.06, "sawtooth", 0.05);
  }

  win() {
    for (let i = 0; i < 6; i++) {
      this.tone(400 * Math.pow(1.15, i), 0.09, "square", 0.09, i * 0.07);
    }
  }

  lose() {
    this.tone(280, 0.15, "sawtooth", 0.1);
    this.tone(160, 0.25, "triangle", 0.1, 0.12);
  }
}
