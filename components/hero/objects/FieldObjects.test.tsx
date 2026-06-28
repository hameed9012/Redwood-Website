import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { FieldObjects } from './FieldObjects';

describe('FieldObjects', () => {
  it('renders the requested number of field objects without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<FieldObjects count={6} />);
    const meshes = renderer.scene.findAllByType('Mesh');
    expect(meshes.length).toBeGreaterThanOrEqual(6);
    await renderer.unmount();
  });
});
