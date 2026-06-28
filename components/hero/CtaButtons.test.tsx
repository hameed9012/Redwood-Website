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

  it('Apply Now is disabled with a "soon" label and no dead href', () => {
    render(<CtaButtons />);
    const apply = screen.getByRole('button', { name: /applications opening soon/i });
    expect(apply).toBeDisabled();
  });
});
