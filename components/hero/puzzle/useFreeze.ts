'use client';

import { createContext, useContext, useRef, createElement, type ReactNode, type MutableRefObject } from 'react';

const defaultRef: MutableRefObject<boolean> = { current: false };
const FreezeContext = createContext<MutableRefObject<boolean>>(defaultRef);

/**
 * Scene-wide freeze switch (the drain flips it). A ref — not state — so setting
 * it never re-renders the scene; every animating useFrame early-returns on it.
 */
export function useFreeze(): MutableRefObject<boolean> {
  return useContext(FreezeContext);
}

export function FreezeProvider({ children }: { children: ReactNode }) {
  const frozen = useRef(false);
  return createElement(FreezeContext.Provider, { value: frozen }, children);
}

/**
 * Bridges an existing freeze ref (created above the R3F <Canvas> boundary,
 * where context does not propagate) into components rendered inside the
 * canvas, so both sides share the SAME ref rather than each getting their own.
 */
export function FreezeBridge({
  freezeRef,
  children,
}: {
  freezeRef: MutableRefObject<boolean>;
  children: ReactNode;
}) {
  return createElement(FreezeContext.Provider, { value: freezeRef }, children);
}
