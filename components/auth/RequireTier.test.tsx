import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { RequireTier } from './RequireTier';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

const renderGuard = (required: 'recruit' | 'employee' | 'high-command') =>
  render(
    <AuthProvider>
      <RequireTier required={required}>
        <div>classified</div>
      </RequireTier>
    </AuthProvider>,
  );

describe('RequireTier', () => {
  beforeEach(() => {
    replace.mockClear();
    window.localStorage.clear();
  });

  it('redirects to /login and hides children when unauthenticated', async () => {
    renderGuard('employee');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('classified')).not.toBeInTheDocument();
  });

  it('redirects when the session tier is below the requirement', async () => {
    window.localStorage.setItem('rw.session', JSON.stringify({ tier: 'recruit', name: 'minnow', at: 1 }));
    renderGuard('employee');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('classified')).not.toBeInTheDocument();
  });

  it('renders children when the session meets the requirement', async () => {
    window.localStorage.setItem('rw.session', JSON.stringify({ tier: 'high-command', name: 'leviathan', at: 1 }));
    renderGuard('employee');
    await waitFor(() => expect(screen.getByText('classified')).toBeInTheDocument());
    expect(replace).not.toHaveBeenCalled();
  });
});
