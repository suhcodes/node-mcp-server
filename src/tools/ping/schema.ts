/**
 * Ping Tool Schema
 */

import { z } from 'zod';
import type { BaseToolResponse, ServerInfo } from '../types.js';

/**
 * Input schema for ping tool
 */
export const PingInputSchema = z.object({
  message: z.string().optional().describe('Optional custom message to include in response'),
});

export type PingInput = z.infer<typeof PingInputSchema>;

/**
 * Response structure for ping tool
 */
export interface PingResponse extends BaseToolResponse {
  status: 'healthy';
  message?: string;
  server: ServerInfo;
}
