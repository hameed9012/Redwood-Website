import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { WaterSurface } from './WaterSurface';

describe('WaterSurface', () => {
  it('mounts a mesh with a ShaderMaterial without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<WaterSurface />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(1);
    await renderer.unmount();
  });
});
