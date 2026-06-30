import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AmbientScheduler } from './AmbientScheduler';

describe('AmbientScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.restoreAllMocks());

  function makeScheduler(rngValues: number[]) {
    const played: { clip: string; volume: number }[] = [];
    let i = 0;
    const rng = () => rngValues[i++ % rngValues.length];
    const s = new AmbientScheduler({
      clips: ['a', 'b', 'c', 'd'],
      minDelayMs: 1000,
      maxDelayMs: 5000,
      minVolume: 0.1,
      maxVolume: 0.6,
      rng,
      play: (clip, volume) => played.push({ clip, volume }),
    });
    return { s, played };
  }

  it('does not play until started (off by default)', () => {
    const { s, played } = makeScheduler([0.5]);
    vi.advanceTimersByTime(10000);
    expect(played).toHaveLength(0);
    expect(s.isEnabled()).toBe(false);
  });

  it('plays after a randomized delay once enabled', () => {
    const { s, played } = makeScheduler([0, 0, 0]); // pick first clip, min delay, min volume
    s.enable();
    vi.advanceTimersByTime(999);
    expect(played).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(played).toHaveLength(1);
    expect(played[0].clip).toBe('a');
    expect(played[0].volume).toBeCloseTo(0.1, 5);
  });

  it('randomizes delay and volume within bounds across plays', () => {
    const { s, played } = makeScheduler([0.5, 0.5, 0.5]);
    s.enable();
    vi.advanceTimersByTime(3000); // delay = 1000 + 0.5*4000 = 3000
    expect(played).toHaveLength(1);
    expect(played[0].volume).toBeCloseTo(0.35, 5);
  });

  it('disable() stops further playback', () => {
    const { s, played } = makeScheduler([0, 0, 0]);
    s.enable();
    vi.advanceTimersByTime(1000);
    s.disable();
    vi.advanceTimersByTime(20000);
    expect(played).toHaveLength(1);
    expect(s.isEnabled()).toBe(false);
  });
});
