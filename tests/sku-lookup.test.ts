import { describe, it, expect } from 'vitest';
import { getSKU } from '@/data/skus';

describe('SKU Lookup', () => {
  describe('getSKU', () => {
    it('should return SKU info for valid SKU names', () => {
      const sku = getSKU('Standard_D4s_v5');

      expect(sku).toBeDefined();
      expect(sku?.name).toBe('Standard_D4s_v5');
      expect(sku?.family).toBeDefined();
      expect(sku?.vCPUs).toBeGreaterThan(0);
      expect(sku?.memoryGB).toBeGreaterThan(0);
    });

    it('should return undefined for invalid SKU names', () => {
      expect(getSKU('Invalid_SKU')).toBeUndefined();
      expect(getSKU('')).toBeUndefined();
      expect(getSKU('Standard_FAKE_v99')).toBeUndefined();
    });

    it('should return SKU with correct processor type', () => {
      const sku = getSKU('Standard_D4s_v5');

      if (sku) {
        expect(['Intel', 'AMD', 'ARM']).toContain(sku.processor);
      }
    });

    it('should return SKU with valid generation support', () => {
      const sku = getSKU('Standard_D4s_v5');

      if (sku) {
        expect(Array.isArray(sku.generation)).toBe(true);
        expect(sku.generation.length).toBeGreaterThan(0);
        expect(sku.generation.every(g => ['Gen1', 'Gen2'].includes(g))).toBe(true);
      }
    });
  });
});
