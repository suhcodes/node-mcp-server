/**
 * Ping Tool
 *
 * Simple health check tool that validates server status.
 * Returns server health and optional custom message.
 */

export { PingInputSchema, type PingInput, type PingResponse } from './schema.js';
export { pingHandler } from './handler.js';
export { pingToolDefinition, pingTool } from './definition.js';
