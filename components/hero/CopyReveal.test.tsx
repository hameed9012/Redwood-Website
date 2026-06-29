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

  it('renders the first cycling phrase', () => {
    render(<CopyReveal />);
    expect(screen.getByText('A Pharmaceutical company')).toBeInTheDocument();
  });
});
