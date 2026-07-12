import { describe, it, expect } from 'vitest';
import { parseDonation, ORDER_BUTTON, DONATE_BUTTON, DONATE_MODAL, DONATE_AMOUNT, DONATE_NAME, PUBLIC_DONATION_THRESHOLD, storefrontEmbed, storefrontButtons, donateModal, donationLogLine, donationPublicLine } from './storefront';

describe('parseDonation', () => {
  it('accepts whole positive dollars, stripping $ , and spaces', () => {
    expect(parseDonation('50000')).toEqual({ ok: true, amount: 50000 });
    expect(parseDonation('$50,000')).toEqual({ ok: true, amount: 50000 });
    expect(parseDonation('  1000 ')).toEqual({ ok: true, amount: 1000 });
  });

  it('rejects zero, negatives, decimals, and non-numeric', () => {
    for (const bad of ['0', '-5', '1.5', 'abc', '']) {
      expect(parseDonation(bad).ok).toBe(false);
    }
  });
});

describe('storefront ids + threshold', () => {
  it('has the expected custom ids and public threshold', () => {
    expect([ORDER_BUTTON, DONATE_BUTTON, DONATE_MODAL, DONATE_AMOUNT, DONATE_NAME])
      .toEqual(['rw_order', 'rw_donate', 'rw_donate_modal', 'amount', 'name']);
    expect(PUBLIC_DONATION_THRESHOLD).toBe(50000);
  });
});

describe('storefront builders', () => {
  it('embed has a title and the info tone color', () => {
    const e = storefrontEmbed().toJSON();
    expect(e.title).toBeTruthy();
    expect(e.color).toBe(0xc1272d); // TONE_COLOR.info
  });

  it('button row has order + donate buttons', () => {
    const row = storefrontButtons().toJSON() as { components: { custom_id: string }[] };
    expect(row.components.map((c) => c.custom_id)).toEqual(['rw_order', 'rw_donate']);
  });

  it('modal has custom id and required amount + optional name fields', () => {
    const m = donateModal().toJSON() as {
      custom_id: string;
      components: { components: { custom_id: string; required?: boolean }[] }[];
    };
    expect(m.custom_id).toBe('rw_donate_modal');
    const fields = m.components.map((row) => row.components[0]);
    expect(fields.map((f) => f.custom_id)).toEqual(['amount', 'name']);
    expect(fields[0].required).toBe(true);
    expect(fields[1].required).toBe(false);
  });
});

describe('donation lines', () => {
  it('names the donor when given, applies formatMoney', () => {
    expect(donationLogLine(50000, 'Lucia')).toContain('Lucia');
    expect(donationLogLine(50000, 'Lucia')).toContain('$50,000');
    expect(donationPublicLine(50000, 'Lucia')).toContain('Lucia');
    expect(donationPublicLine(50000, 'Lucia')).toContain('$50,000');
  });

  it('falls back to anonymous wording when name is null', () => {
    expect(donationLogLine(1000, null)).toContain('anonymous');
    expect(donationPublicLine(1000, null)).toContain('anonymous benefactor');
  });
});
