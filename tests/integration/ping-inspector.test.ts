/**
 * Integration tests for ping tool using MCP Inspector
 *
 * These tests verify end-to-end MCP protocol communication by:
 * 1. Spawning the actual MCP server process
 * 2. Connecting an MCP Inspector client
 * 3. Testing tool listing and execution
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Ping Tool - MCP Inspector Integration', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    // Path to the built server or use tsx to run the source directly
    const serverPath = path.resolve(__dirname, '../../src/server.ts');

    // Create MCP client
    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Create stdio transport connected to the server process
    transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', serverPath],
      env: {
        ...process.env,
        LOG_LEVEL: 'error', // Reduce noise in tests
      },
    });

    // Connect client to server
    await client.connect(transport);
  }, 10000); // 10 second timeout for server startup

  afterAll(async () => {
    // Clean up client connection
    await client.close();
  });

  it('should list available tools including ping', async () => {
    const response = await client.listTools();

    expect(response.tools).toBeDefined();
    expect(Array.isArray(response.tools)).toBe(true);
    expect(response.tools.length).toBeGreaterThan(0);

    // Find the ping tool
    const pingTool = response.tools.find((tool) => tool.name === 'ping');
    expect(pingTool).toBeDefined();
    expect(pingTool?.name).toBe('ping');
    expect(pingTool?.description).toContain('health check tool');
    expect(pingTool?.inputSchema).toBeDefined();
    expect(pingTool?.inputSchema.type).toBe('object');
  });

  it('should call ping tool without message and return healthy status', async () => {
    const response = await client.callTool({
      name: 'ping',
      arguments: {},
    });

    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBe(1);
    expect(response.content[0].type).toBe('text');

    // Parse the response
    const responseText = response.content[0].text;
    const parsedResponse = JSON.parse(responseText);

    expect(parsedResponse.status).toBe('healthy');
    expect(parsedResponse.server).toBeDefined();
    expect(parsedResponse.server.name).toBe('node-mcp-server');
    expect(parsedResponse.server.version).toBe('0.1.0');
    expect(parsedResponse.timestamp).toBeDefined();
    expect(parsedResponse.message).toBeUndefined();
  });

  it('should call ping tool with custom message', async () => {
    const customMessage = 'Hello from integration test!';

    const response = await client.callTool({
      name: 'ping',
      arguments: {
        message: customMessage,
      },
    });

    expect(response.content).toBeDefined();
    expect(response.content.length).toBe(1);
    expect(response.content[0].type).toBe('text');

    // Parse the response
    const responseText = response.content[0].text;
    const parsedResponse = JSON.parse(responseText);

    expect(parsedResponse.status).toBe('healthy');
    expect(parsedResponse.message).toBe(customMessage);
    expect(parsedResponse.server).toBeDefined();
    expect(parsedResponse.timestamp).toBeDefined();
  });

  it('should validate timestamp format in ping response', async () => {
    const response = await client.callTool({
      name: 'ping',
      arguments: {},
    });

    const responseText = response.content[0].text;
    const parsedResponse = JSON.parse(responseText);

    // Verify timestamp is a valid ISO 8601 string
    expect(parsedResponse.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify it can be parsed as a date
    const timestamp = new Date(parsedResponse.timestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');

    // Verify timestamp is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - timestamp.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });

  it('should reject invalid arguments with validation error', async () => {
    await expect(
      client.callTool({
        name: 'ping',
        arguments: {
          message: 12345, // Invalid: should be string
        },
      })
    ).rejects.toThrow();
  });

  it('should handle multiple consecutive ping calls', async () => {
    const results = [];

    // Make 5 consecutive ping calls
    for (let i = 0; i < 5; i++) {
      const response = await client.callTool({
        name: 'ping',
        arguments: {
          message: `Call ${i + 1}`,
        },
      });

      const responseText = response.content[0].text;
      const parsedResponse = JSON.parse(responseText);
      results.push(parsedResponse);
    }

    // Verify all calls succeeded
    expect(results).toHaveLength(5);
    results.forEach((result, index) => {
      expect(result.status).toBe('healthy');
      expect(result.message).toBe(`Call ${index + 1}`);
    });

    // Verify timestamps are in chronological order
    for (let i = 1; i < results.length; i++) {
      const prevTime = new Date(results[i - 1].timestamp).getTime();
      const currTime = new Date(results[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });
});
