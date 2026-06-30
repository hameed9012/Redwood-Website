import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Tanker } from './Tanker';

describe('Tanker', () => {
  it('mounts shoreline + procedural truck block + pour stream without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Tanker />);
    expect(renderer.scene.findAllByType('Mesh').length).toBeGreaterThanOrEqual(2);
    await renderer.unmount();
  });
});
