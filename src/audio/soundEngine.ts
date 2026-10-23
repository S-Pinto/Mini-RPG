// Web Audio API Synthesizer and Dungeon Synth Soundtrack Engine
// 100% Procedural - Zero external audio file downloads needed!

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private currentStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setSfxVolume(vol: number): void {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public setMusicVolume(vol: number): void {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  // Generic procedural tone generator
  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.1, rampToFreq?: number, delay = 0): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (rampToFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, rampToFreq), t + duration);
    }

    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // --- Sound Effects ---

  public btnClick(): void {
    this.playTone(480, 0.05, 'triangle', 0.07, 720);
  }

  public swing(): void {
    // Sword woosh / slash
    this.playTone(320, 0.12, 'sawtooth', 0.08, 90);
  }

  public heavyChop(): void {
    // Deep heavy vertical cleave
    this.playTone(210, 0.18, 'sawtooth', 0.13, 50);
    this.playTone(110, 0.22, 'square', 0.09, 35, 0.03);
  }

  public thrust(): void {
    // Sharp fast piercing thrust
    this.playTone(540, 0.09, 'sawtooth', 0.11, 140);
    this.playTone(760, 0.07, 'triangle', 0.09, 240);
  }

  public mageBlast(): void {
    // Arcane burst with magic snap and resonant pulse
    this.playTone(620, 0.13, 'sine', 0.12, 180);
    this.playTone(320, 0.22, 'triangle', 0.13, 70, 0.02);
  }

  public smite(): void {
    // Divine smite: thunder crack + sacred ringing chime
    this.playTone(180, 0.35, 'sawtooth', 0.16, 40);
    this.playTone(523.25, 0.45, 'triangle', 0.12, 1046.5);
    this.playTone(783.99, 0.5, 'sine', 0.1, 1567.98, 0.05);
  }

  public fireball(): void {
    // Whoosh and fiery boom
    this.playTone(480, 0.15, 'triangle', 0.1, 140);
    this.playTone(90, 0.4, 'sawtooth', 0.2, 35, 0.08);
  }

  public shootArrow(): void {
    // Sharp twang
    this.playTone(880, 0.06, 'triangle', 0.08, 220);
  }

  public explosion(): void {
    this.playTone(180, 0.25, 'sawtooth', 0.15, 45);
    this.playTone(60, 0.5, 'square', 0.25, 20, 0.05);
  }

  public lightning(): void {
    this.playTone(950, 0.12, 'sawtooth', 0.15, 300);
    this.playTone(1400, 0.08, 'square', 0.1, 400, 0.03);
  }

  public heal(): void {
    // Holy harmony arpeggio
    [392, 493.88, 587.33, 783.99].forEach((freq, idx) => {
      this.playTone(freq, 0.35, 'sine', 0.08, freq * 1.05, idx * 0.07);
    });
  }

  public hitEnemy(): void {
    this.playTone(240, 0.08, 'sawtooth', 0.07, 80);
  }

  public killEnemy(): void {
    this.playTone(160, 0.18, 'sawtooth', 0.09, 50);
  }

  public playerHurt(): void {
    this.playTone(130, 0.28, 'square', 0.15, 60);
    this.playTone(85, 0.35, 'sawtooth', 0.18, 30);
  }

  public dash(): void {
    this.playTone(320, 0.16, 'sine', 0.09, 580);
  }

  public teleport(): void {
    this.playTone(280, 0.28, 'sine', 0.12, 750);
    this.playTone(560, 0.32, 'triangle', 0.09, 1120, 0.08);
  }

  public skill(): void {
    this.teleport();
  }

  public coin(): void {
    this.playTone(987.77, 0.07, 'sine', 0.08);
    this.playTone(1318.51, 0.12, 'sine', 0.08, undefined, 0.05);
  }

  public chestOpen(): void {
    this.playTone(260, 0.2, 'sawtooth', 0.08, 380);
    this.playTone(520, 0.25, 'triangle', 0.09, 780, 0.1);
  }

  public breakProp(): void {
    this.playTone(180, 0.14, 'square', 0.1, 60);
  }

  public levelUp(): void {
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((f, i) => {
      this.playTone(f, 0.25, 'triangle', 0.1, undefined, i * 0.08);
    });
  }

  public dragonRoar(): void {
    this.playTone(65, 0.8, 'sawtooth', 0.25, 120);
    this.playTone(95, 0.6, 'square', 0.15, 45, 0.1);
  }

  public doorUnlock(): void {
    this.playTone(293.66, 0.25, 'triangle', 0.1, 440);
  }

  public legendaryDrop(): void {
    // Ethereal crystalline fanfare for Epic and Legendary loot beams
    const notes = [587.33, 880, 1174.66, 1760, 2349.32]; // D5, A5, D6, A6, D7
    notes.forEach((f, i) => {
      this.playTone(f, 0.45, 'sine', 0.12, f * 1.02, i * 0.065);
      this.playTone(f * 0.5, 0.35, 'triangle', 0.08, undefined, i * 0.065);
    });
  }

  // --- Procedural Dungeon Synth Music ---
  // Mode: D Dorian / Minor D&D Adventure scale
  public startDungeonMusic(): void {
    if (this.isMusicPlaying) return;
    this.init();
    this.isMusicPlaying = true;

    const scale = [
      146.83, // D3
      174.61, // F3
      196.00, // G3
      220.00, // A3
      261.63, // C4
      293.66, // D4
      349.23, // F4
      392.00, // G4
      440.00  // A4
    ];

    const bassLine = [73.42, 73.42, 87.31, 98.00, 73.42, 73.42, 110.00, 98.00]; // D2, F2, G2, A2

    this.currentStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.musicGain) return;

      const t = this.ctx.currentTime;
      const step = this.currentStep % 16;
      this.currentStep++;

      // Bass drone every 4 steps
      if (step % 2 === 0) {
        const bassFreq = bassLine[Math.floor(step / 2) % bassLine.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.5);
      }

      // Melodic arpeggio
      if (Math.random() > 0.18) {
        const noteIdx = Math.floor(Math.sin(step * 0.7) * 3 + 4) % scale.length;
        const freq = scale[Math.abs(noteIdx)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.3);
      }
    }, 280);
  }

  public stopDungeonMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const sound = new SoundEngine();
