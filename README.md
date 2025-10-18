# Node MCP Server Bootstrap

A generic, minimal Model Context Protocol (MCP) server bootstrap template. This provides a clean starting point for creating new MCP servers with TypeScript, featuring a simple example tool and best practices.

## Features

- 🚀 **Minimal Setup**: Only essential dependencies (MCP SDK + Zod)
- 🛠️ **Simple Example**: Single `ping` tool demonstrating the pattern
- ✅ **Testing Included**: Unit tests, integration tests, and MCP Inspector tests
- 🔍 **Inspector Integration**: Automated bash tests and interactive UI for debugging
- 📦 **TypeScript**: Fully typed with strict mode
- 🔨 **Build Tools**: Vite for fast bundling
- 🎯 **Clean Architecture**: Tool registry pattern for easy expansion
- 📝 **Well Documented**: Comprehensive inline documentation

## Project Structure

```
node-mcp-server/
├── src/
│   ├── server.ts              # Main MCP server
│   ├── tools/
│   │   ├── index.ts           # Tool registry
│   │   ├── types.ts           # Shared types
│   │   └── ping/              # Example ping tool
│   │       ├── schema.ts      # Zod schema
│   │       ├── definition.ts  # Tool metadata
│   │       ├── handler.ts     # Tool implementation
│   │       └── index.ts       # Exports
│   └── utils/
│       └── logger/            # Structured logger
├── tests/                     # Tests mirror src/ structure
│   ├── tools/
│   │   └── ping/
│   │       ├── handler.test.ts      # Unit tests for handler
│   │       ├── schema.test.ts       # Unit tests for schema
│   │       └── definition.test.ts   # Unit tests for definition
│   ├── utils/
│   │   └── logger/
│   │       └── logger.test.ts       # Unit tests for logger
│   ├── scripts/
│   │   └── bootstrap.test.ts        # Bootstrap script tests
│   ├── server.test.ts               # Server tests
│   └── integration/
│       ├── ping-inspector.test.ts   # MCP protocol integration tests
│       └── bootstrap.test.ts        # Bootstrap E2E tests
├── scripts/
│   ├── bootstrap.js           # Interactive project setup
│   └── test-inspector.sh      # Bash inspector tests
├── bin/
│   └── cli.js                 # CLI wrapper (Yarn PnP support)
├── inspector-config.json      # MCP Inspector configuration
└── dist/                      # Compiled output
```

## Quick Start

### Bootstrap Your Project

The easiest way to get started is using the interactive bootstrap script:

```bash
# Run the bootstrap script to customize the template
yarn bootstrap
```

This will prompt you to enter:
- Project name
- Author name
- Version (default: 1.0.0)
- Description
- Node version (default: v20.19.0)

The script automatically updates all files and installs dependencies.

### Manual Installation

If you prefer to set up manually:

```bash
# Install dependencies
yarn install
```

### Development

```bash
# Run in development mode with hot reload
yarn dev
```

### Build

```bash
# Build the project
yarn build
```

### Testing

```bash
# Run all tests
yarn test

# Run only unit tests
yarn test:unit

# Run integration tests
yarn test:integration

# Run bootstrap script tests (unit + E2E)
yarn test:bootstrap

# Run MCP Inspector tests (bash script)
yarn test:inspector

# Open interactive MCP Inspector UI
yarn test:inspector:ui
```

## Test Structure

Tests are organized to mirror the source folder structure for easy navigation. Each source file has a corresponding test file in the same relative location:

```
src/tools/ping/handler.ts    → tests/tools/ping/handler.test.ts
src/tools/ping/schema.ts     → tests/tools/ping/schema.test.ts
src/tools/ping/definition.ts → tests/tools/ping/definition.test.ts
src/utils/logger/logger.ts   → tests/utils/logger/logger.test.ts
src/server.ts                → tests/server.test.ts
```

**Test Categories:**

- **Unit Tests**: Test individual components in isolation
  - Tool handlers, schemas, and definitions
  - Utility functions like the logger
  - Bootstrap script validation and update functions

- **Integration Tests** (`tests/integration/`): Test complete workflows
  - `ping-inspector.test.ts`: MCP protocol communication via SDK Client
  - `bootstrap.test.ts`: End-to-end bootstrap workflow in isolated environment

### Adding Tests for New Tools

When creating a new tool (e.g., `my-tool`), create corresponding test files:

```bash
# Source files
src/tools/my-tool/
├── handler.ts
├── schema.ts
├── definition.ts
└── index.ts

# Test files (mirror structure)
tests/tools/my-tool/
├── handler.test.ts      # Test handler logic
├── schema.test.ts       # Test Zod schema validation
└── definition.test.ts   # Test tool metadata
```

## How It Works

### The Ping Tool

The included `ping` tool demonstrates the complete pattern for MCP tool implementation:

1. **Schema** (`schema.ts`): Defines input/output types with Zod validation
2. **Definition** (`definition.ts`): Provides tool metadata for MCP protocol
3. **Handler** (`handler.ts`): Contains the actual tool logic
4. **Index** (`index.ts`): Exports all components

When called, the ping tool:

- Logs "Hello from ping tool!" using the structured logger
- Returns server health status and optional custom message
- Demonstrates the MCP response format

### Server Architecture

The server (`src/server.ts`) follows this pattern:

1. **Initialize**: Create MCP Server with capabilities
2. **Register Handlers**:
   - `ListTools`: Returns available tools
   - `CallTool`: Executes tool handlers with validation
3. **Connect**: Attach to stdio transport for communication

### Adding New Tools

To add a new tool:

1. **Create tool files** in `src/tools/` (e.g., `my-tool/`):
   - `schema.ts` - Zod input/output validation schemas
   - `definition.ts` - MCP tool metadata
   - `handler.ts` - Tool implementation logic
   - `index.ts` - Re-exports all components

2. **Create test files** in `tests/tools/my-tool/`:
   - `schema.test.ts` - Test Zod schema validation
   - `definition.test.ts` - Test tool metadata
   - `handler.test.ts` - Test handler logic

3. **Register in `src/tools/index.ts`**:

```typescript
// Add to imports
import { myToolDefinition, MyToolInputSchema, myToolHandler } from './my-tool/index.js';

// Add to toolDefinitions array
export const toolDefinitions: ToolDefinition[] = [
  pingToolDefinition,
  myToolDefinition, // Add here
];

// Add to createToolHandlers
export function createToolHandlers(serverInfo: ServerInfo) {
  return {
    ping: async (args: unknown) => {
      const validated = PingInputSchema.parse(args);
      return pingHandler(validated, serverInfo);
    },
    my_tool: async (args: unknown) => {
      const validated = MyToolInputSchema.parse(args);
      return myToolHandler(validated, serverInfo);
    },
  };
}
```

4. **Add integration tests** in `tests/integration/` and update `scripts/test-inspector.sh` with new tool tests

## Dependencies

### Runtime

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `zod`: Runtime schema validation

### Development

- `typescript`: Type checking
- `vite`: Build tool
- `vitest`: Testing framework
- `tsx`: Development TypeScript executor
- `eslint`: Code linting
- `prettier`: Code formatting

## Configuration

### TypeScript

The project uses strict TypeScript configuration with:

- ES2022 target
- Node16 module resolution
- Path aliases (`@/*` → `./src/*`)
- Source maps enabled

### Build

Vite is configured to:

- Bundle as ES module
- Target Node 20+
- Externalize all dependencies
- Add shebang banner to output

### Logging

Set the `LOG_LEVEL` environment variable to control logging:

- `debug`: All logs
- `info`: Info, warn, error (default)
- `warn`: Warn and error only
- `error`: Errors only

### File Imports

All imports must use `.js` extension (TypeScript convention for ESM):

```typescript
import { logger } from './utils/logger/index.js';  // Correct
import { logger } from './utils/logger/index';     // Wrong - will fail
```

This is required because TypeScript compiles to ESM format and Node.js requires explicit file extensions for ES modules.

## Testing with MCP Inspector

This template includes comprehensive testing using the MCP Inspector tool, which validates your server's MCP protocol implementation.

### Inspector Configuration

The `inspector-config.json` file configures the MCP Inspector to connect to your server:

```json
{
  "mcpServers": {
    "node-mcp-server": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "env": {
        "LOG_LEVEL": "error"
      }
    }
  }
}
```

### Running Inspector Tests

There are two ways to test your MCP server with the inspector:

#### 1. Automated Bash Script Tests

Run the automated test suite that validates all server functionality:

```bash
yarn test:inspector
```

This runs `scripts/test-inspector.sh`, which tests:
- Server connection and tool listing
- Ping tool basic functionality
- Response structure validation
- Custom message parameter handling
- Server metadata presence

The script provides color-coded output and a summary of passed/failed tests.

#### 2. Integration Tests (TypeScript)

Run comprehensive integration tests using Vitest and the MCP SDK:

```bash
yarn test:integration
```

These tests (`tests/integration/ping-inspector.test.ts`) verify:
- Tool listing via MCP protocol
- Tool execution with various arguments
- Response format validation
- Error handling for invalid inputs
- Multiple consecutive tool calls
- Timestamp validation

#### 3. Interactive Inspector UI

Launch the interactive MCP Inspector web interface:

```bash
yarn test:inspector:ui
```

This opens a browser-based UI where you can:
- Manually test tools
- Inspect request/response payloads
- Debug server behavior in real-time

### Adding Inspector Tests for New Tools

When you add new tools, update both test files:

**Bash script** (`scripts/test-inspector.sh`):
```bash
run_test "Your new tool test" \
    "npx mcp-inspector --config $CONFIG_FILE --server $SERVER_NAME --cli --method tools/call --tool-name your_tool --arguments '{}'" \
    'expected_pattern_in_output'
```

**Integration test** (`tests/integration/ping-inspector.test.ts`):
```typescript
it('should call your new tool', async () => {
  const response = await client.callTool({
    name: 'your_tool',
    arguments: {},
  });

  expect(response.content).toBeDefined();
  // Add your assertions
});
```

## Using with Claude Desktop

To use this MCP server with Claude Desktop, add it to your Claude configuration file.

### Configuration File Location

The configuration file is located at:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Configuration

Add this to your configuration file:

```json
{
  "mcpServers": {
     "node-mcp-server": {
      "command": "npx",
      "args": ["-y", "/absolute/path/to/node-mcp-server"]
    }
  }
}
```

Replace `/absolute/path/to/node-mcp-server` with the actual absolute path to this project directory.

**Note**: The `npx` command works with the package via `bin/cli.js`, which automatically handles both Yarn PnP and standard node_modules installations. The `-y` flag ensures npx runs without prompting for confirmation.

### Verifying Installation

After updating the configuration:

1. Restart Claude Desktop
2. The MCP server should appear in the MCP tools list
3. You can test it by asking Claude to use the `ping` tool

## Customizing This Template

This is a generic template designed to be customized for your specific use case:

1. **Update Server Name**: Change `SERVER_NAME` and `SERVER_VERSION` in `src/server.ts`
2. **Update Package Info**: Modify `name`, `description`, and `version` in `package.json`
3. **Customize or Remove Ping Tool**: Either remove it or use it as a template for your own tools
4. **Add Your Tools**: Create new tools following the established pattern
5. **Update README**: Customize this documentation for your specific server

## License

MIT - See LICENSE.txt for details

## Author

suhcodes

## Next Steps

1. Customize the server name and metadata
2. Remove or modify the example ping tool
3. Add your own tools following the established pattern
4. Write tests for your tools
5. Update this README with your project details
6. Build and deploy your MCP server!

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK on GitHub](https://github.com/modelcontextprotocol/sdk)
- [Zod Documentation](https://zod.dev/)
