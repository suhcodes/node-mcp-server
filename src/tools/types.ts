/**
 * Shared types and interfaces for MCP tools
 */

import { z } from 'zod';

/**
 * Tool definition structure matching MCP SDK format
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool handler function signature
 * Takes validated input arguments and returns MCP-formatted response
 */
export type ToolHandler<T = unknown> = (
  args: T
) => Promise<{
  content: Array<{
    type: 'text';
    text: string;
  }>;
}>;

/**
 * Complete tool with definition and handler
 */
export interface Tool<T = unknown> {
  definition: ToolDefinition;
  schema: z.ZodType<T>;
  handler: ToolHandler<T>;
}

/**
 * Server metadata
 */
export interface ServerInfo {
  name: string;
  version: string;
}

/**
 * Base response structure for tools
 */
export interface BaseToolResponse {
  status: string;
  timestamp: string;
}
