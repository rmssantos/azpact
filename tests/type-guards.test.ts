import { describe, it, expect } from 'vitest';
import { isValidActionType, assertActionType, assertNever } from '@/lib/type-guards';

describe('Type Guards', () => {
  describe('isValidActionType', () => {
    it('should return true for valid action types', () => {
      expect(isValidActionType('ResizeVM')).toBe(true);
      expect(isValidActionType('StopVM')).toBe(true);
      expect(isValidActionType('DeallocateVM')).toBe(true);
      expect(isValidActionType('EnableEncryption')).toBe(true);
    });

    it('should return false for invalid action types', () => {
      expect(isValidActionType('InvalidAction')).toBe(false);
      expect(isValidActionType('')).toBe(false);
      expect(isValidActionType('resizevm')).toBe(false); // Case sensitive
    });

    it('should return false for non-string values', () => {
      expect(isValidActionType(null)).toBe(false);
      expect(isValidActionType(undefined)).toBe(false);
      expect(isValidActionType(123)).toBe(false);
      expect(isValidActionType({})).toBe(false);
      expect(isValidActionType([])).toBe(false);
    });
  });

  describe('assertActionType', () => {
    it('should return value for valid action types', () => {
      expect(assertActionType('ResizeVM')).toBe('ResizeVM');
      expect(assertActionType('StopVM')).toBe('StopVM');
    });

    it('should throw for invalid action types', () => {
      expect(() => assertActionType('InvalidAction')).toThrow('Invalid action type');
      expect(() => assertActionType('')).toThrow();
      expect(() => assertActionType(null)).toThrow();
      expect(() => assertActionType(123)).toThrow();
    });
  });

  describe('assertNever', () => {
    it('should throw with descriptive error', () => {
      expect(() => assertNever('unexpected' as never)).toThrow('Unexpected value');
    });
  });
});
