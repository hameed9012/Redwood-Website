'use client';

import { useReducer } from 'react';

export type PuzzlePhase = 'idle' | 'checking' | 'near-miss' | 'solved';

export type PuzzleAction =
  | { type: 'checked'; solved: boolean; nearMiss: boolean }
  | { type: 'reset' };

/**
 * Phase machine for the tray check. 'checking' = a wrong (non-near-miss) fill is
 * pending its drift-back; 'near-miss' = 3/4 correct (logo flicker) pending drift-
 * back; 'solved' is terminal — the drain owns everything after.
 */
export function puzzleReducer(state: PuzzlePhase, action: PuzzleAction): PuzzlePhase {
  if (state === 'solved') return 'solved';
  switch (action.type) {
    case 'checked':
      if (action.solved) return 'solved';
      return action.nearMiss ? 'near-miss' : 'checking';
    case 'reset':
      return 'idle';
  }
}

export function usePuzzleState() {
  return useReducer(puzzleReducer, 'idle' as PuzzlePhase);
}
