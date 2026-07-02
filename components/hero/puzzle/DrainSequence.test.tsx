import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { TankScene } from '../TankScene';
import { PeakRegistry } from '../peak';
import { qualityFor } from '../quality';

describe('DrainSequence integration', () => {
  it('TankScene still assembles (with the sceneShift wrap) and DrainSequence no-ops without a provider', async () => {
    const registry = new PeakRegistry();
    const renderer = await ReactThreeTestRenderer.create(
      <TankScene registry={registry} quality={qualityFor('high')} />,
    );
    // The wrap must not break the scene contents or the addressable logo.
    expect(registry.isComplete()).toBe(true);
    const logo = renderer.scene.findAll((n) => n.props.name === 'background-logo');
    expect(logo.length).toBe(1);
    await renderer.unmount();
  });
});
