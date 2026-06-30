import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { CausticsPlane } from './CausticsPlane';

describe('CausticsPlane', () => {
  it('renders a mesh with a ShaderMaterial without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<CausticsPlane intensity={0.5} />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBe(1);
    await renderer.unmount();
  });
});
