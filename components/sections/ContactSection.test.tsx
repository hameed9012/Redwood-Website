import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactSection } from './ContactSection';

// Simulate the no-creds / failed-storage path — the reference must still show.
vi.mock('@/lib/supabase', () => ({
  submitInquiry: vi.fn(async () => false),
}));

describe('ContactSection', () => {
  it('keeps submit disabled until a Discord username is entered', () => {
    render(<ContactSection />);
    expect(screen.getByRole('button', { name: /submit inquiry/i })).toBeDisabled();
  });

  it('shows an RW reference number after submit even when storage is skipped', async () => {
    render(<ContactSection />);
    fireEvent.change(screen.getByPlaceholderText(/yourname/i), { target: { value: 'tester' } });
    fireEvent.click(screen.getByRole('button', { name: /submit inquiry/i }));
    await waitFor(() =>
      expect(screen.getByText(/Inquiry #RW-[A-Z0-9]{5} logged/)).toBeInTheDocument(),
    );
  });

  it('does not submit a blank username (form gate)', () => {
    render(<ContactSection />);
    // Button is disabled with empty input; clicking cannot mint a reference.
    fireEvent.click(screen.getByRole('button', { name: /submit inquiry/i }));
    expect(screen.queryByText(/Inquiry #RW-/)).not.toBeInTheDocument();
  });
});
