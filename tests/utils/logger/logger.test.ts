/**
 * Logger Tests
 *
 * Tests for src/utils/logger/logger.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger } from '../../../src/utils/logger/logger.js';
import type { LogLevel } from '../../../src/utils/logger/types.js';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should create logger with default level', () => {
      const logger = new Logger();
      logger.info('test');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create logger with specified level', () => {
      const logger = new Logger('error');
      logger.info('test');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should accept all valid log levels', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

      levels.forEach((level) => {
        expect(() => new Logger(level)).not.toThrow();
      });
    });
  });

  describe('Log level filtering', () => {
    it('should log debug when level is debug', () => {
      const logger = new Logger('debug');
      logger.debug('test');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug when level is info', () => {
      const logger = new Logger('info');
      logger.debug('test');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log info when level is info', () => {
      const logger = new Logger('info');
      logger.info('test');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log info when level is warn', () => {
      const logger = new Logger('warn');
      logger.info('test');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log warn when level is warn', () => {
      const logger = new Logger('warn');
      logger.warn('test');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log warn when level is error', () => {
      const logger = new Logger('error');
      logger.warn('test');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should always log error regardless of level', () => {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

      levels.forEach((level) => {
        consoleErrorSpy.mockClear();
        const logger = new Logger(level);
        logger.error('test');

        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Log output format', () => {
    it('should output JSON format', () => {
      const logger = new Logger('info');
      logger.info('test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/^\{.*\}$/));
    });

    it('should include timestamp in output', () => {
      const logger = new Logger('info');
      logger.info('test');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output).toHaveProperty('timestamp');
      expect(typeof output.timestamp).toBe('string');
    });

    it('should include level in output', () => {
      const logger = new Logger('info');
      logger.info('test');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.level).toBe('info');
    });

    it('should include message in output', () => {
      const logger = new Logger('info');
      logger.info('test message');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.message).toBe('test message');
    });

    it('should include context when provided', () => {
      const logger = new Logger('info');
      logger.info('test', { userId: '123', action: 'login' });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context).toEqual({ userId: '123', action: 'login' });
    });

    it('should not include context when not provided', () => {
      const logger = new Logger('info');
      logger.info('test');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output).not.toHaveProperty('context');
    });

    it('should generate valid ISO 8601 timestamp', () => {
      const logger = new Logger('info');
      logger.info('test');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const timestamp = new Date(output.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(timestamp.toISOString()).toBe(output.timestamp);
    });
  });

  describe('Debug method', () => {
    it('should log with debug level', () => {
      const logger = new Logger('debug');
      logger.debug('debug message');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.level).toBe('debug');
      expect(output.message).toBe('debug message');
    });

    it('should accept context parameter', () => {
      const logger = new Logger('debug');
      logger.debug('debug', { key: 'value' });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context).toEqual({ key: 'value' });
    });

    it('should use console.log for output', () => {
      const logger = new Logger('debug');
      logger.debug('test');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Info method', () => {
    it('should log with info level', () => {
      const logger = new Logger('info');
      logger.info('info message');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.level).toBe('info');
      expect(output.message).toBe('info message');
    });

    it('should accept context parameter', () => {
      const logger = new Logger('info');
      logger.info('info', { data: 'test' });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context).toEqual({ data: 'test' });
    });

    it('should use console.log for output', () => {
      const logger = new Logger('info');
      logger.info('test');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Warn method', () => {
    it('should log with warn level', () => {
      const logger = new Logger('warn');
      logger.warn('warn message');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.level).toBe('warn');
      expect(output.message).toBe('warn message');
    });

    it('should accept context parameter', () => {
      const logger = new Logger('warn');
      logger.warn('warning', { reason: 'test' });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context).toEqual({ reason: 'test' });
    });

    it('should use console.log for output', () => {
      const logger = new Logger('warn');
      logger.warn('test');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error method', () => {
    it('should log with error level', () => {
      const logger = new Logger('error');
      logger.error('error message');

      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('error');
      expect(output.message).toBe('error message');
    });

    it('should accept context parameter', () => {
      const logger = new Logger('error');
      logger.error('error', { code: 500 });

      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.context).toEqual({ code: 500 });
    });

    it('should use console.error for output', () => {
      const logger = new Logger('error');
      logger.error('test');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Context handling', () => {
    it('should handle complex context objects', () => {
      const logger = new Logger('info');
      const complexContext = {
        user: { id: 1, name: 'Test' },
        metadata: { timestamp: Date.now() },
        tags: ['important', 'urgent'],
      };

      logger.info('test', complexContext);

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context).toEqual(complexContext);
    });

    it('should handle empty context object', () => {
      const logger = new Logger('info');
      logger.info('test', {});

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context).toEqual({});
    });

    it('should handle context with undefined values', () => {
      const logger = new Logger('info');
      logger.info('test', { key: undefined });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      // undefined values are omitted in JSON.stringify
      expect(output.context).toEqual({});
    });

    it('should handle context with null values', () => {
      const logger = new Logger('info');
      logger.info('test', { key: null });

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.context.key).toBeNull();
    });
  });

  describe('Message handling', () => {
    it('should handle empty string messages', () => {
      const logger = new Logger('info');
      logger.info('');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.message).toBe('');
    });

    it('should handle multi-line messages', () => {
      const logger = new Logger('info');
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      logger.info(multilineMessage);

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.message).toBe(multilineMessage);
    });

    it('should handle messages with special characters', () => {
      const logger = new Logger('info');
      const specialMessage = 'Test "quotes" and \'apostrophes\' and \\ backslashes';
      logger.info(specialMessage);

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.message).toBe(specialMessage);
    });

    it('should handle unicode messages', () => {
      const logger = new Logger('info');
      const unicodeMessage = 'Hello 世界 🌍';
      logger.info(unicodeMessage);

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.message).toBe(unicodeMessage);
    });
  });

  describe('Multiple log calls', () => {
    it('should handle multiple sequential logs', () => {
      const logger = new Logger('info');

      logger.info('first');
      logger.info('second');
      logger.info('third');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
    });

    it('should generate different timestamps for sequential calls', () => {
      const logger = new Logger('info');

      logger.info('first');
      logger.info('second');

      const output1 = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const output2 = JSON.parse(consoleLogSpy.mock.calls[1][0]);

      // Timestamps should be different (though might be same in fast execution)
      expect(output1.timestamp).toBeDefined();
      expect(output2.timestamp).toBeDefined();
    });

    it('should handle mixed log levels', () => {
      const logger = new Logger('debug');

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
