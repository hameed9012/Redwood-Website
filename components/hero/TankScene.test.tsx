import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { TankScene } from './TankScene';
import { PeakRegistry } from './peak';
import { qualityFor } from './quality';

describe('TankScene', () => {
  it('assembles field, hero bottles, bubbles, caustics, and logo, and completes the registry', async () => {
    const registry = new PeakRegistry();
    const renderer = await ReactThreeTestRenderer.create(
      <TankScene registry={registry} quality={qualityFor('high')} />,
    );
    expect(registry.isComplete()).toBe(true);
    const points = renderer.scene.findAllByType('Points'); // bubbles
    expect(points.length).toBeGreaterThanOrEqual(1);
    const logo = renderer.scene.findAll((n) => n.props.name === 'background-logo');
    expect(logo.length).toBe(1);
    await renderer.unmount();
  });
});
