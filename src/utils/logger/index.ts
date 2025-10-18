/**
 * Simple structured logger for the MCP server
 */

export { Logger } from './logger.js';
export type { LogLevel, LogEntry } from './types.js';

// Default logger instance
import { Logger } from './logger.js';
import type { LogLevel } from './types.js';

export const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || 'info');
