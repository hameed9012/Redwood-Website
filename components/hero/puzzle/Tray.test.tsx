import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tray } from './Tray';

describe('Tray', () => {
  it('renders four slots', () => {
    render(<Tray slots={[null, null, null, null]} />);
    expect(screen.getAllByTestId('tray-slot')).toHaveLength(4);
  });
  it('marks filled slots and the highlighted slot', () => {
    render(<Tray slots={['P', null, null, null]} highlightIndex={2} />);
    const slots = screen.getAllByTestId('tray-slot');
    expect(slots[0].dataset.filled).toBe('true');
    expect(slots[1].dataset.filled).toBe('false');
    expect(slots[2].dataset.highlight).toBe('true');
  });
});
