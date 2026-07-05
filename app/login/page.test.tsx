import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import LoginPage from './page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

describe('LoginPage', () => {
  it('renders Employee Access with a live (enabled) secret-name field', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
    expect(screen.getByRole('heading', { name: /employee access/i })).toBeInTheDocument();
    const input = screen.getByLabelText(/secret name/i);
    expect(input).toBeEnabled();
    expect(screen.getByText(/issued out-of-band/i)).toBeInTheDocument();
  });
});
