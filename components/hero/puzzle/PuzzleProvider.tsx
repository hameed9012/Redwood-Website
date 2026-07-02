'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { PeakRegistry, type PeakLetter } from '../peak';
import { isSolved, nearMissCount, PEAK_ORDER } from './order';
import { puzzleReducer, type PuzzlePhase } from './usePuzzleState';
import { SLOT_COUNT, slotWorldPosition } from './trayGeometry';

/** Where a suspended bottle should ease toward — or 'grabbed' to follow the drag target live. */
export type SuspendPoint = { x: number; y: number; z: number } | 'grabbed';

export interface DragState {
  grabbed: PeakLetter | null;
  target: { x: number; y: number; z: number };
}

export interface PuzzleContextValue {
  registry: PeakRegistry;
  phase: PuzzlePhase;
  slots: (PeakLetter | null)[];
  highlightIndex: number;
  setHighlightIndex: (i: number) => void;
  slotRectsRef: MutableRefObject<DOMRect[]>;
  drag: MutableRefObject<DragState>;
  suspendedRef: MutableRefObject<Partial<Record<PeakLetter, SuspendPoint>>>;
  placeInSlot: (letter: PeakLetter, slot: number) => void;
  release: (letter: PeakLetter) => void;
  check: () => void;
}

const PuzzleContext = createContext<PuzzleContextValue | null>(null);

const RESET_DELAY_MS = 2500;

export function PuzzleProvider({ children }: { children: ReactNode }) {
  const registry = useMemo(() => new PeakRegistry(), []);
  const [phase, dispatch] = useReducer(puzzleReducer, 'idle' as PuzzlePhase);
  const [slots, setSlots] = useState<(PeakLetter | null)[]>(() => Array(SLOT_COUNT).fill(null));
  const [highlightIndex, setHighlightIndexState] = useState(-1);

  const slotRectsRef = useRef<DOMRect[]>([]);
  const drag = useRef<DragState>({ grabbed: null, target: { x: 0, y: 1.1, z: 0 } });
  const suspendedRef = useRef<Partial<Record<PeakLetter, SuspendPoint>>>({});
  const slotsRef = useRef(slots);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't let a pending wrong-order reset fire against an unmounted provider.
  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const setHighlightIndex = useCallback((i: number) => {
    setHighlightIndexState((prev) => (prev === i ? prev : i));
  }, []);

  const check = useCallback(() => {
    const current = slotsRef.current;
    const solved = isSolved(current);
    const nearMiss = !solved && nearMissCount(current) === 3;
    dispatch({ type: 'checked', solved, nearMiss });

    if (!solved) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        const empty = Array(SLOT_COUNT).fill(null);
        slotsRef.current = empty;
        setSlots(empty);
        for (const letter of PEAK_ORDER) {
          delete suspendedRef.current[letter];
        }
        dispatch({ type: 'reset' });
      }, RESET_DELAY_MS);
    }
  }, []);

  const placeInSlot = useCallback(
    (letter: PeakLetter, slot: number) => {
      const [x, y, z] = slotWorldPosition(slot);
      suspendedRef.current[letter] = { x, y, z };
      const next = slotsRef.current.slice();
      next[slot] = letter;
      slotsRef.current = next;
      setSlots(next);
      if (next.every((s) => s !== null)) check();
    },
    [check],
  );

  const release = useCallback((letter: PeakLetter) => {
    delete suspendedRef.current[letter];
  }, []);

  const value: PuzzleContextValue = {
    registry,
    phase,
    slots,
    highlightIndex,
    setHighlightIndex,
    slotRectsRef,
    drag,
    suspendedRef,
    placeInSlot,
    release,
    check,
  };

  return createElement(PuzzleContext.Provider, { value }, children);
}

/** Throws if rendered outside a PuzzleProvider — use in DOM-side consumers that require it. */
export function usePuzzle(): PuzzleContextValue {
  const ctx = useContext(PuzzleContext);
  if (!ctx) throw new Error('usePuzzle must be used within a PuzzleProvider');
  return ctx;
}

/** Returns null outside a PuzzleProvider — use in scene components rendered without one in tests. */
export function usePuzzleMaybe(): PuzzleContextValue | null {
  return useContext(PuzzleContext);
}

/**
 * Bridges an existing puzzle context value (created above the R3F <Canvas>
 * boundary, where context does not propagate) into components rendered
 * inside the canvas, so both sides share the SAME value rather than each
 * side getting its own (mirrors FreezeBridge).
 */
export function PuzzleBridge({
  value,
  children,
}: {
  value: PuzzleContextValue;
  children: ReactNode;
}) {
  return createElement(PuzzleContext.Provider, { value }, children);
}
