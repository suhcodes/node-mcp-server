/**
 * Ping Tool Handler
 */

import { logger } from '../../utils/logger/index.js';
import type { ServerInfo } from '../types.js';
import type { PingInput, PingResponse } from './schema.js';

/**
 * Ping tool handler implementation
 *
 * @param args - Validated ping arguments
 * @param serverInfo - Server metadata (name, version)
 * @returns MCP-formatted tool response
 */
export async function pingHandler(args: PingInput, serverInfo: ServerInfo) {
  logger.info('Hello from ping tool!', { args });

  // Build response object
  const response: PingResponse = {
    status: 'healthy',
    ...(args.message && { message: args.message }),
    server: serverInfo,
    timestamp: new Date().toISOString(),
  };

  logger.debug('Ping tool executed successfully');

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}
