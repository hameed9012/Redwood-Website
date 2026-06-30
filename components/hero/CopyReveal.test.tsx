import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CopyReveal } from './CopyReveal';

describe('CopyReveal', () => {
  it('renders the fixed hero copy', () => {
    render(<CopyReveal />);
    expect(screen.getByText('Hello,')).toBeInTheDocument();
    expect(screen.getByText('We are The Redwood Co.')).toBeInTheDocument();
    expect(screen.getByText(/We are a/)).toBeInTheDocument();
  });

  it('renders the fixed lead-in and begins typing the first phrase', async () => {
    render(<CopyReveal />);
    expect(screen.getByText(/We are a/)).toBeInTheDocument();
    await screen.findByText((_, el) => !!el && el.classList.contains('text-rw-red') && el.textContent!.includes('A'));
  });
});
