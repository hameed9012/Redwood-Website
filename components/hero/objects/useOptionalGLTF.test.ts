import { describe, it, expect } from 'vitest';
import { shouldRenderGlb } from './useOptionalGLTF';

describe('shouldRenderGlb', () => {
  it('attempts GLB only when the probe confirms the file is present', () => {
    expect(shouldRenderGlb('present')).toBe(true);
  });

  it('falls back to procedural when absent or still pending', () => {
    expect(shouldRenderGlb('absent')).toBe(false);
    expect(shouldRenderGlb('pending')).toBe(false);
  });
});
