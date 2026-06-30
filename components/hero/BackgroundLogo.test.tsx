import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { BackgroundLogo } from './BackgroundLogo';

describe('BackgroundLogo', () => {
  it('exposes a named handle so Phase 2 can drive flicker/darkness', async () => {
    const renderer = await ReactThreeTestRenderer.create(<BackgroundLogo />);
    const group = renderer.scene.findAll((n) => n.props.name === 'background-logo');
    expect(group.length).toBe(1);
    await renderer.unmount();
  });
});
