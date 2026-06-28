import { describe, it, expect } from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import { Bubbles } from './Bubbles';

describe('Bubbles', () => {
  it('renders a points object without crashing', async () => {
    const renderer = await ReactThreeTestRenderer.create(<Bubbles count={30} />);
    const points = renderer.scene.findAllByType('Points');
    expect(points.length).toBe(1);
    await renderer.unmount();
  });
});
