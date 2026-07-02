import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { PuzzleProvider, usePuzzle, usePuzzleMaybe } from './PuzzleProvider';
import type { PeakLetter } from '../peak';

function NoProviderProbe() {
  const ctx = usePuzzleMaybe();
  return <div data-testid="probe">{ctx === null ? 'null' : 'present'}</div>;
}

function Probe({ onPlace }: { onPlace?: (place: (letter: PeakLetter, slot: number) => void) => void }) {
  const ctx = usePuzzle();
  if (onPlace) onPlace(ctx.placeInSlot);
  return (
    <div>
      <div data-testid="phase">{ctx.phase}</div>
      <div data-testid="slots">{ctx.slots.length}</div>
      <div data-testid="slots-values">{ctx.slots.map((s) => s ?? '_').join(',')}</div>
    </div>
  );
}

describe('PuzzleProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <PuzzleProvider>
        <div data-testid="child">hi</div>
      </PuzzleProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('usePuzzleMaybe returns null outside a provider', () => {
    render(<NoProviderProbe />);
    expect(screen.getByTestId('probe').textContent).toBe('null');
  });

  it('exposes slots of length 4, phase idle, and solves on correct order', () => {
    let place: (letter: PeakLetter, slot: number) => void = () => {};
    render(
      <PuzzleProvider>
        <Probe onPlace={(p) => { place = p; }} />
      </PuzzleProvider>,
    );

    expect(screen.getByTestId('slots').textContent).toBe('4');
    expect(screen.getByTestId('phase').textContent).toBe('idle');

    act(() => {
      place('P', 0);
      place('E', 1);
      place('A', 2);
      place('K', 3);
    });

    expect(screen.getByTestId('phase').textContent).toBe('solved');
  });

  it('wrong order goes to checking, then resets to idle with empty slots after ~2.5s', () => {
    vi.useFakeTimers();
    let place: (letter: PeakLetter, slot: number) => void = () => {};
    render(
      <PuzzleProvider>
        <Probe onPlace={(p) => { place = p; }} />
      </PuzzleProvider>,
    );

    act(() => {
      place('P', 0);
      place('E', 1);
      place('K', 2);
      place('A', 3);
      // flush the queueMicrotask that triggers check()
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId('phase').textContent).toBe('checking');

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(screen.getByTestId('phase').textContent).toBe('idle');
    expect(screen.getByTestId('slots-values').textContent).toBe('_,_,_,_');
  });
});
