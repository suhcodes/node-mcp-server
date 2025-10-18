/**
 * Ping Tool Definition
 */

import type { Tool } from '../types.js';
import type { PingInput } from './schema.js';
import { PingInputSchema } from './schema.js';

/**
 * Ping tool definition for MCP server
 */
export const pingToolDefinition = {
  name: 'ping',
  description:
    'Simple health check tool that validates server status. ' +
    'Returns server health and optional custom message.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      message: {
        type: 'string',
        description: 'Optional custom message to include in response',
      },
    },
  },
};

/**
 * Complete ping tool export
 * Includes definition, schema, and handler
 */
export const pingTool: Tool<PingInput> = {
  definition: pingToolDefinition,
  schema: PingInputSchema,
  handler: async (args: PingInput) => {
    // Note: This will be called from server.ts with proper context
    // The server will inject serverInfo
    throw new Error('Ping handler must be called with server context');
  },
};
