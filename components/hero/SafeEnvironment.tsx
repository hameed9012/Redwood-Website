'use client';

import { Component, Suspense, type ComponentProps, type ReactNode } from 'react';
import { Environment } from '@react-three/drei';

/**
 * Renders nothing if its child throws while loading — so a failed/missing HDRI
 * (a 404 on a CDN, a blocked fetch, a slow network) can NEVER crash the whole
 * R3F tree to a black screen. The water shader + lights don't need the env map;
 * without it the glass just loses some reflections. Mirrors Tanker's GlbBoundary.
 */
class EnvBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Drop-in for drei's <Environment> that degrades gracefully instead of crashing. */
export function SafeEnvironment(props: ComponentProps<typeof Environment>) {
  return (
    <EnvBoundary>
      <Suspense fallback={null}>
        <Environment {...props} />
      </Suspense>
    </EnvBoundary>
  );
}
