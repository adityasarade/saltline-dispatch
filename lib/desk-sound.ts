// Night-desk sound.
//
// Saltline is a print room, not a broadcast. There is no soundtrack and no
// ambient bed - only three short diegetic noises made by the desk itself:
// a call landing, paper feeding out of the press, and a stamp coming down.
// Everything is synthesized with WebAudio at call time, so the project ships
// no audio files, needs no licence, and adds nothing to the download.
//
// Off by default. Nothing is constructed until the visitor opts in, because
// browsers require a gesture before an AudioContext may start.

export type DeskCue = 'call' | 'press' | 'stamp';

type Ctx = AudioContext & { resume(): Promise<void> };

export class DeskSound {
  private context: Ctx | null = null;
  private master: GainNode | null = null;

  /** Opens the audio device. Must be called from a user gesture. */
  async enable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.context) {
        const Constructor: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Constructor) return false;

        this.context = new Constructor() as Ctx;
        this.master = this.context.createGain();
        // Deliberately quiet. These are room noises, not effects.
        this.master.gain.value = 0.22;
        this.master.connect(this.context.destination);
      }

      if (this.context.state === 'suspended') await this.context.resume();
      return this.context.state === 'running';
    } catch {
      this.context = null;
      this.master = null;
      return false;
    }
  }

  disable() {
    try {
      void this.context?.close();
    } catch {
      // Closing twice is harmless; the next enable() rebuilds the device.
    }
    this.context = null;
    this.master = null;
  }

  cue(kind: DeskCue) {
    const context = this.context;
    const master = this.master;
    if (!context || !master || context.state !== 'running') return;

    const now = context.currentTime;

    try {
      if (kind === 'call') this.playCall(context, master, now);
      if (kind === 'press') this.playPress(context, master, now);
      if (kind === 'stamp') this.playStamp(context, master, now);
    } catch {
      // A cue that cannot play must never interrupt the journey.
    }
  }

  /** Two short electromechanical pulses: the desk phone picking up a line. */
  private playCall(context: Ctx, master: GainNode, now: number) {
    for (const offset of [0, 0.22]) {
      const start = now + offset;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(620, start);
      oscillator.frequency.exponentialRampToValueAtTime(470, start + 0.14);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
      oscillator.connect(gain).connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    }
  }

  /** Filtered noise with a rising edge: a sheet feeding out of the press. */
  private playPress(context: Ctx, master: GainNode, now: number) {
    const duration = 0.72;
    const frames = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < frames; index += 1) {
      // Envelope that swells then falls, so it reads as one sheet, not hiss.
      const progress = index / frames;
      const envelope = Math.sin(Math.PI * progress) ** 1.6;
      channel[index] = (Math.random() * 2 - 1) * envelope;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(2600, now + duration);
    filter.Q.value = 0.8;

    const gain = context.createGain();
    gain.gain.value = 0.38;

    source.connect(filter).connect(gain).connect(master);
    source.start(now);
  }

  /** A low thud plus a short slap: rubber stamp meeting newsprint. */
  private playStamp(context: Ctx, master: GainNode, now: number) {
    const oscillator = context.createOscillator();
    const thud = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(52, now + 0.16);
    thud.gain.setValueAtTime(0.0001, now);
    thud.gain.exponentialRampToValueAtTime(0.9, now + 0.008);
    thud.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    oscillator.connect(thud).connect(master);
    oscillator.start(now);
    oscillator.stop(now + 0.26);

    const frames = Math.floor(context.sampleRate * 0.09);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / frames) ** 3;
    }
    const slap = context.createBufferSource();
    slap.buffer = buffer;
    const slapFilter = context.createBiquadFilter();
    slapFilter.type = 'highpass';
    slapFilter.frequency.value = 1400;
    const slapGain = context.createGain();
    slapGain.gain.value = 0.3;
    slap.connect(slapFilter).connect(slapGain).connect(master);
    slap.start(now);
  }
}
