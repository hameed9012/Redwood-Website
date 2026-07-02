import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from './page';

describe('LoginPage (placeholder)', () => {
  it('renders the Employee Access stub with a disabled secret-name field', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /employee access/i })).toBeInTheDocument();
    const input = screen.getByLabelText(/secret name/i);
    expect(input).toBeDisabled();
    expect(screen.getByText(/issued out-of-band/i)).toBeInTheDocument();
  });
});
