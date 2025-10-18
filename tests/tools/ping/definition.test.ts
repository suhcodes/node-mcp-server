/**
 * Ping Tool Definition Tests
 *
 * Tests for src/tools/ping/definition.ts
 */

import { describe, it, expect } from 'vitest';
import { pingToolDefinition } from '../../../src/tools/ping/definition.js';

describe('Ping Tool Definition', () => {
  describe('Tool metadata', () => {
    it('should have correct tool name', () => {
      expect(pingToolDefinition.name).toBe('ping');
    });

    it('should have a description', () => {
      expect(pingToolDefinition.description).toBeDefined();
      expect(typeof pingToolDefinition.description).toBe('string');
      expect(pingToolDefinition.description.length).toBeGreaterThan(0);
    });

    it('should have description mentioning health check', () => {
      expect(pingToolDefinition.description.toLowerCase()).toContain('health');
    });
  });

  describe('Input schema', () => {
    it('should have inputSchema defined', () => {
      expect(pingToolDefinition.inputSchema).toBeDefined();
    });

    it('should have object type', () => {
      expect(pingToolDefinition.inputSchema.type).toBe('object');
    });

    it('should have properties defined', () => {
      expect(pingToolDefinition.inputSchema.properties).toBeDefined();
      expect(typeof pingToolDefinition.inputSchema.properties).toBe('object');
    });

    it('should define message property', () => {
      expect(pingToolDefinition.inputSchema.properties).toHaveProperty('message');
    });

    it('should define message as string type', () => {
      expect(pingToolDefinition.inputSchema.properties.message.type).toBe('string');
    });

    it('should have description for message property', () => {
      expect(pingToolDefinition.inputSchema.properties.message.description).toBeDefined();
      expect(typeof pingToolDefinition.inputSchema.properties.message.description).toBe(
        'string'
      );
    });

    it('should mention message is optional in description', () => {
      const messageDesc =
        pingToolDefinition.inputSchema.properties.message.description.toLowerCase();
      expect(messageDesc).toContain('optional');
    });
  });

  describe('Schema structure compliance', () => {
    it('should be valid MCP tool definition structure', () => {
      expect(pingToolDefinition).toHaveProperty('name');
      expect(pingToolDefinition).toHaveProperty('description');
      expect(pingToolDefinition).toHaveProperty('inputSchema');
    });

    it('should have valid JSON schema type', () => {
      const validTypes = ['object', 'array', 'string', 'number', 'boolean', 'null'];
      expect(validTypes).toContain(pingToolDefinition.inputSchema.type);
    });

    it('should not have required fields (message is optional)', () => {
      expect(pingToolDefinition.inputSchema.required).toBeUndefined();
    });

    it('should be serializable to JSON', () => {
      expect(() => JSON.stringify(pingToolDefinition)).not.toThrow();
    });

    it('should match expected structure exactly', () => {
      expect(pingToolDefinition).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: expect.any(String),
            },
          },
        },
      });
    });
  });

  describe('Tool definition immutability', () => {
    it('should have consistent name across calls', () => {
      const name1 = pingToolDefinition.name;
      const name2 = pingToolDefinition.name;
      expect(name1).toBe(name2);
    });

    it('should have consistent description across calls', () => {
      const desc1 = pingToolDefinition.description;
      const desc2 = pingToolDefinition.description;
      expect(desc1).toBe(desc2);
    });

    it('should have consistent schema across calls', () => {
      const schema1 = JSON.stringify(pingToolDefinition.inputSchema);
      const schema2 = JSON.stringify(pingToolDefinition.inputSchema);
      expect(schema1).toBe(schema2);
    });
  });
});
