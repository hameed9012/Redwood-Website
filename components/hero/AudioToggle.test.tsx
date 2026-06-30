import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioToggle } from './AudioToggle';

describe('AudioToggle', () => {
  it('starts off and never auto-enables', () => {
    render(<AudioToggle />);
    const btn = screen.getByRole('button', { name: /sound/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles aria-pressed on click', () => {
    render(<AudioToggle />);
    const btn = screen.getByRole('button', { name: /sound/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });
});
