/**
 * Ping Tool Schema Tests
 *
 * Tests for src/tools/ping/schema.ts
 */

import { describe, it, expect } from 'vitest';
import { PingInputSchema } from '../../../src/tools/ping/schema.js';

describe('Ping Tool Schema', () => {
  describe('PingInputSchema validation', () => {
    it('should accept valid input with message', () => {
      const result = PingInputSchema.parse({ message: 'Hello' });
      expect(result).toEqual({ message: 'Hello' });
    });

    it('should accept empty input', () => {
      const result = PingInputSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept input without message', () => {
      const result = PingInputSchema.parse({ message: undefined });
      expect(result).toEqual({});
    });

    it('should accept input with empty string message', () => {
      const result = PingInputSchema.parse({ message: '' });
      expect(result).toEqual({ message: '' });
    });

    it('should reject input with non-string message', () => {
      expect(() => PingInputSchema.parse({ message: 123 })).toThrow();
      expect(() => PingInputSchema.parse({ message: true })).toThrow();
      expect(() => PingInputSchema.parse({ message: {} })).toThrow();
      expect(() => PingInputSchema.parse({ message: [] })).toThrow();
    });

    it('should accept long message strings', () => {
      const longMessage = 'a'.repeat(1000);
      const result = PingInputSchema.parse({ message: longMessage });
      expect(result).toEqual({ message: longMessage });
    });

    it('should accept message with special characters', () => {
      const specialMessage = 'Hello! @#$%^&*() 世界 🌍';
      const result = PingInputSchema.parse({ message: specialMessage });
      expect(result).toEqual({ message: specialMessage });
    });

    it('should ignore extra properties', () => {
      const result = PingInputSchema.parse({
        message: 'test',
        extraProp: 'ignored',
      });
      expect(result).toEqual({ message: 'test' });
      expect(result).not.toHaveProperty('extraProp');
    });
  });
});
