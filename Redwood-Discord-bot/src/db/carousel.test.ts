import { describe, it, expect } from 'vitest';
import { carouselFilename } from './carousel';

describe('carouselFilename', () => {
  it('is <digits>-<hex>.<ext>', () => {
    expect(carouselFilename('png')).toMatch(/^\d+-[0-9a-f]{8}\.png$/);
    expect(carouselFilename('jpg')).toMatch(/^\d+-[0-9a-f]{8}\.jpg$/);
  });
});
