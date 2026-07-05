import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CtaButtons } from './CtaButtons';

describe('CtaButtons', () => {
  it('Join Us links to the Discord invite in a new tab', () => {
    render(<CtaButtons />);
    const join = screen.getByRole('link', { name: /join us/i });
    expect(join).toHaveAttribute('href', 'https://discord.gg/vPCWTzMXRa');
    expect(join).toHaveAttribute('target', '_blank');
    expect(join).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('Apply Now links to the application form in a new tab', () => {
    render(<CtaButtons />);
    const apply = screen.getByRole('link', { name: /apply now/i });
    expect(apply).toHaveAttribute('href', 'https://forms.gle/YuD42ThW4E6smmfaA');
    expect(apply).toHaveAttribute('target', '_blank');
    expect(apply).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
