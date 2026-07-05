import { describe, it, expect } from 'vitest';
import { puzzleReducer, type PuzzlePhase } from './usePuzzleState';

describe('puzzleReducer', () => {
  it('all-correct → solved', () => {
    expect(puzzleReducer('idle', { type: 'checked', solved: true, nearMiss: false })).toBe('solved');
  });
  it('3/4 → near-miss then back to idle on reset', () => {
    const s: PuzzlePhase = puzzleReducer('idle', { type: 'checked', solved: false, nearMiss: true });
    expect(s).toBe('near-miss');
    expect(puzzleReducer(s, { type: 'reset' })).toBe('idle');
  });
  it('wrong (not near-miss) stays idle-bound via checking', () => {
    expect(puzzleReducer('idle', { type: 'checked', solved: false, nearMiss: false })).toBe('checking');
    expect(puzzleReducer('checking', { type: 'reset' })).toBe('idle');
  });
  it('solved is terminal', () => {
    expect(puzzleReducer('solved', { type: 'reset' })).toBe('solved');
  });
});
