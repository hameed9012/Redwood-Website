import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { OpenBottle } from './OpenBottle';

describe('OpenBottle', () => {
  it('mounts the bottle plus its loose contents (a points cloud) without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<OpenBottle seed={3} />);
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(1);
    expect(renderer.scene.findAllByType('Points').length).toBe(1);
    await renderer.unmount();
  });
});
