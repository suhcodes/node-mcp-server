/**
 * Tool Registry
 *
 * Central registry for all MCP tools.
 * This module exports tool definitions and handlers for use by the MCP server.
 *
 * To add a new tool:
 * 1. Create a new folder in src/tools/ (e.g., my-tool/)
 * 2. Import it here
 * 3. Add it to the toolDefinitions array
 * 4. Add its handler to the createToolHandlers function
 */

import { pingToolDefinition, PingInputSchema, pingHandler, type PingInput } from './ping/index.js';
import type { ToolDefinition, ServerInfo } from './types.js';

/**
 * Array of all tool definitions
 * Used by the MCP server's ListTools handler
 */
export const toolDefinitions: ToolDefinition[] = [pingToolDefinition];

/**
 * Create tool handlers with server context
 *
 * This factory function creates handlers that have access to server metadata,
 * allowing tools to be context-aware.
 *
 * @param serverInfo - Server metadata (name, version)
 * @returns Object mapping tool names to handler functions
 */
export function createToolHandlers(
  serverInfo: ServerInfo
): Record<string, (args: unknown) => Promise<unknown>> {
  return {
    ping: async (args: unknown) => {
      const validated = PingInputSchema.parse(args);
      return pingHandler(validated, serverInfo);
    },
  };
}

/**
 * Re-export types and schemas for use in tests
 */
export type { PingInput };
export { PingInputSchema, pingHandler, pingToolDefinition };
