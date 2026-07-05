import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  afterEach(() => vi.useRealTimers());

  it('renders the spinning mark and a fact line', () => {
    vi.useFakeTimers();
    render(<LoadingScreen onComplete={() => {}} />);
    expect(screen.getByAltText(/redwood peak/i)).toBeInTheDocument();
    expect(screen.getByTestId('loading-fact').textContent!.length).toBeGreaterThan(0);
  });

  it('rotates facts and fires onComplete after the randomized duration', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    render(<LoadingScreen onComplete={done} rng={() => 0} />); // duration = 2500ms, deterministic facts
    const first = screen.getByTestId('loading-fact').textContent;
    act(() => { vi.advanceTimersByTime(1500); });
    // fact should have rotated at least once by 1.5s (1.4s interval)
    expect(screen.getByTestId('loading-fact').textContent).not.toBe(first);
    expect(done).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1100); }); // total 2600 > 2500
    expect(done).toHaveBeenCalledTimes(1);
  });
});
