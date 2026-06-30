import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CopyReveal } from './CopyReveal';

describe('CopyReveal', () => {
  it('renders the fixed hero copy', () => {
    render(<CopyReveal />);
    expect(screen.getByText('Hello,')).toBeInTheDocument();
    expect(screen.getByText('We are The Redwood Co.')).toBeInTheDocument();
  });

  it('begins typing the first phrase into the red span', async () => {
    render(<CopyReveal />);
    // The lead-in is "We are " (no trailing "a", so phrases like "A Pharmaceutical
    // company" don't double the article). The typewriter fills the red span.
    await screen.findByText(
      (_, el) => !!el && el.classList.contains('text-rw-red') && el.textContent!.includes('A'),
    );
  });
});
