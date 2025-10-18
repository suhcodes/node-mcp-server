/**
 * Ping Tool Handler Tests
 *
 * Tests for src/tools/ping/handler.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { pingHandler } from '../../../src/tools/ping/handler.js';
import type { ServerInfo } from '../../../src/tools/types.js';
import type { PingInput } from '../../../src/tools/ping/schema.js';

describe('Ping Tool Handler', () => {
  let mockServerInfo: ServerInfo;

  beforeEach(() => {
    mockServerInfo = {
      name: 'test-server',
      version: '1.0.0',
    };
  });

  describe('Response structure', () => {
    it('should return MCP-formatted response', async () => {
      const result = await pingHandler({}, mockServerInfo);

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
    });

    it('should return text content type', async () => {
      const result = await pingHandler({}, mockServerInfo);

      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should return valid JSON in text field', async () => {
      const result = await pingHandler({}, mockServerInfo);

      expect(() => JSON.parse(result.content[0].text)).not.toThrow();
    });
  });

  describe('Health status', () => {
    it('should return healthy status', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.status).toBe('healthy');
    });

    it('should always return healthy status regardless of input', async () => {
      const inputs: PingInput[] = [{}, { message: 'test' }, { message: '' }];

      for (const input of inputs) {
        const result = await pingHandler(input, mockServerInfo);
        const response = JSON.parse(result.content[0].text);
        expect(response.status).toBe('healthy');
      }
    });
  });

  describe('Server information', () => {
    it('should include server info in response', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.server).toBeDefined();
      expect(response.server).toEqual(mockServerInfo);
    });

    it('should include server name', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.server.name).toBe('test-server');
    });

    it('should include server version', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.server.version).toBe('1.0.0');
    });

    it('should use provided server info', async () => {
      const customServerInfo: ServerInfo = {
        name: 'custom-server',
        version: '2.5.1',
      };

      const result = await pingHandler({}, customServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.server).toEqual(customServerInfo);
    });
  });

  describe('Custom message handling', () => {
    it('should include custom message when provided', async () => {
      const result = await pingHandler({ message: 'Test message' }, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.message).toBe('Test message');
    });

    it('should not include message field when not provided', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.message).toBeUndefined();
      expect(Object.keys(response)).not.toContain('message');
    });

    it('should not include empty string message (treated as falsy)', async () => {
      const result = await pingHandler({ message: '' }, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      // Empty strings are falsy, so message is not included
      expect(response.message).toBeUndefined();
    });

    it('should handle long messages', async () => {
      const longMessage = 'a'.repeat(1000);
      const result = await pingHandler({ message: longMessage }, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.message).toBe(longMessage);
    });

    it('should handle special characters in message', async () => {
      const specialMessage = 'Hello! @#$%^&*() 世界 🌍';
      const result = await pingHandler({ message: specialMessage }, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.message).toBe(specialMessage);
    });
  });

  describe('Timestamp', () => {
    it('should include timestamp in response', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      const timestamp = new Date(response.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(timestamp.toISOString()).toBe(response.timestamp);
    });

    it('should return recent timestamp', async () => {
      const before = new Date();
      const result = await pingHandler({}, mockServerInfo);
      const after = new Date();

      const response = JSON.parse(result.content[0].text);
      const timestamp = new Date(response.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate new timestamp for each call', async () => {
      const result1 = await pingHandler({}, mockServerInfo);
      const response1 = JSON.parse(result1.content[0].text);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await pingHandler({}, mockServerInfo);
      const response2 = JSON.parse(result2.content[0].text);

      expect(response1.timestamp).not.toBe(response2.timestamp);
    });
  });

  describe('Response formatting', () => {
    it('should format response as pretty-printed JSON', async () => {
      const result = await pingHandler({}, mockServerInfo);

      // Pretty-printed JSON should contain newlines and indentation
      expect(result.content[0].text).toContain('\n');
      expect(result.content[0].text).toContain('  '); // 2-space indent
    });

    it('should be parseable and re-stringifiable', async () => {
      const result = await pingHandler({ message: 'test' }, mockServerInfo);
      const parsed = JSON.parse(result.content[0].text);
      const restringified = JSON.stringify(parsed, null, 2);

      expect(restringified).toBe(result.content[0].text);
    });
  });

  describe('Complete response validation', () => {
    it('should contain all required fields', async () => {
      const result = await pingHandler({}, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('server');
      expect(response).toHaveProperty('timestamp');
    });

    it('should contain all required fields with message', async () => {
      const result = await pingHandler({ message: 'test' }, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('server');
      expect(response).toHaveProperty('timestamp');
    });

    it('should match expected response structure', async () => {
      const result = await pingHandler({ message: 'test' }, mockServerInfo);
      const response = JSON.parse(result.content[0].text);

      expect(response).toMatchObject({
        status: 'healthy',
        message: 'test',
        server: {
          name: 'test-server',
          version: '1.0.0',
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });
  });
});
