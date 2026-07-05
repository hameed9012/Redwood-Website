import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LoginForm } from './LoginForm';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

const renderForm = () =>
  render(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>,
  );

describe('LoginForm', () => {
  beforeEach(() => {
    push.mockClear();
    window.localStorage.clear();
  });

  it('signs in at the right tier and routes to /portal for a recognized name', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/secret name/i), { target: { value: 'tidewater' } });
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/portal'));
    expect(JSON.parse(window.localStorage.getItem('rw.session') as string).tier).toBe('employee');
  });

  it('refuses an unrecognized name without routing or persisting a session', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/secret name/i), { target: { value: 'not-a-real-name' } });
    fireEvent.click(screen.getByRole('button', { name: /enter/i }));
    await waitFor(() => expect(screen.getByText(/not on any list/i)).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
    expect(window.localStorage.getItem('rw.session')).toBeNull();
  });
});
