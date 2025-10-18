/**
 * Generic MCP Server Bootstrap
 *
 * A simple MCP server template that demonstrates the basic structure
 * for creating Model Context Protocol servers.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger/index.js';
import { toolDefinitions, createToolHandlers } from './tools/index.js';

// Server metadata
const SERVER_NAME = 'node-mcp-server';
const SERVER_VERSION = '0.1.0';

/**
 * Initialize and configure the MCP server
 */
async function createServer() {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Create tool handlers with server context
  const serverInfo = { name: SERVER_NAME, version: SERVER_VERSION };
  const toolHandlers = createToolHandlers(serverInfo);

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info('Listing available tools', { count: toolDefinitions.length });

    return {
      tools: toolDefinitions,
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info('Tool called', { toolName: name, args });

    try {
      // Look up the tool handler
      const handler = toolHandlers[name];

      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Execute the tool handler
      return await handler(args);
    } catch (error) {
      logger.error('Tool execution failed', {
        toolName: name,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main() {
  try {
    logger.info('Starting MCP Server', {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });

    // Create and start the server
    const server = await createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    logger.info('Server connected and ready');
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

// Run the server
main();
