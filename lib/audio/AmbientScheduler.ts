'use client';

export interface AmbientSchedulerOptions {
  clips: string[];
  minDelayMs: number;
  maxDelayMs: number;
  minVolume: number;
  maxVolume: number;
  /** Injectable for tests; defaults to Math.random. */
  rng?: () => number;
  /** Injectable for tests; defaults to HTMLAudioElement playback. */
  play?: (clip: string, volume: number) => void;
}

export class AmbientScheduler {
  private opts: Required<AmbientSchedulerOptions>;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;

  constructor(options: AmbientSchedulerOptions) {
    this.opts = {
      rng: Math.random,
      play: (clip, volume) => {
        const audio = new Audio(clip);
        audio.volume = volume;
        void audio.play().catch(() => undefined);
      },
      ...options,
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Begins scheduling. Never called automatically — user must opt in. */
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.scheduleNext();
  }

  disable(): void {
    this.enabled = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNext(): void {
    const { minDelayMs, maxDelayMs, rng } = this.opts;
    const delay = minDelayMs + rng() * (maxDelayMs - minDelayMs);
    this.timer = setTimeout(() => this.fire(), delay);
  }

  private fire(): void {
    if (!this.enabled) return;
    const { clips, minVolume, maxVolume, rng, play } = this.opts;
    const clip = clips[Math.floor(rng() * clips.length)] ?? clips[0];
    const volume = minVolume + rng() * (maxVolume - minVolume);
    play(clip, volume);
    this.scheduleNext();
  }
}

// ---- Active-instance registry ------------------------------------------------
// Lets scene-side sequences (the Phase 2 drain) cut whatever ambient audio is
// playing without reaching into the AudioToggle component. Additive — the class
// API above is unchanged.

let active: AmbientScheduler | null = null;

/** AudioToggle registers its scheduler here (null on unmount). */
export function registerActiveScheduler(s: AmbientScheduler | null): void {
  active = s;
}

/** Immediately silences the active ambient scheduler, if any. */
export function stopActiveAudio(): void {
  active?.disable();
}
