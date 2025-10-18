# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a generic MCP (Model Context Protocol) server bootstrap template for creating new MCP servers with TypeScript. It demonstrates the tool registry pattern with a simple `ping` tool example.

## Development Commands

```bash
# Bootstrap
yarn bootstrap        # Interactive setup to customize project name, author, version, etc.

# Development
yarn dev              # Run with hot reload using tsx watch
yarn build            # Build with Vite to dist/server.js

# Testing
yarn test             # Run all tests with Vitest
yarn test:unit        # Run unit tests only (tests/tools/)
yarn test:integration # Run integration tests (tests/integration/)
yarn test:bootstrap   # Run bootstrap script tests (unit + e2e)
yarn test:inspector   # Run bash script MCP Inspector tests
yarn test:inspector:ui # Open interactive MCP Inspector UI

# Linting
npx eslint .          # Run ESLint
npx prettier --check . # Check formatting
```

## Bootstrap Script

The `yarn bootstrap` command runs an interactive setup script that customizes the template for your project:

- Prompts for: project name, author, version, description, and Node version
- Updates all relevant files: `package.json`, `src/server.ts`, `inspector-config.json`, `scripts/test-inspector.sh`, `README.md`
- Creates `.nvmrc` with specified Node version
- Runs `yarn install` to install dependencies
- Validates all inputs (project name format, semver version, etc.)

**What gets updated:**
- `package.json`: name, author, version, description, engines.node
- `src/server.ts`: SERVER_NAME and SERVER_VERSION constants
- `inspector-config.json`: mcpServers key name
- `scripts/test-inspector.sh`: SERVER_NAME variable
- `.nvmrc`: Node version (created if doesn't exist)
- `README.md`: Project title and author section

**Bootstrap Script Testing:**

The bootstrap script has comprehensive test coverage:
- Unit tests (`tests/scripts/bootstrap.test.ts`): Test individual validation and update functions
- E2E tests (`tests/integration/bootstrap-e2e.test.ts`): Test complete bootstrap workflow in isolated environment
- Run tests with: `yarn test:bootstrap`

All bootstrap functions are exported from `scripts/bootstrap.js` for testing:
- Validation: `validateProjectName()`, `validateVersion()`, `validateNodeVersion()`
- Updates: `updatePackageJson()`, `updateServerTs()`, `updateInspectorConfig()`, `updateTestInspectorSh()`, `updateNvmrc()`, `updateReadme()`
- Each function accepts a `projectRoot` parameter for testing in temp directories

## Test Structure

Tests are organized to mirror the source folder structure for easy navigation:

```
tests/
├── tools/
│   └── ping/
│       ├── handler.test.ts      # Tests src/tools/ping/handler.ts
│       ├── schema.test.ts       # Tests src/tools/ping/schema.ts
│       └── definition.test.ts   # Tests src/tools/ping/definition.ts
├── utils/
│   └── logger/
│       └── logger.test.ts       # Tests src/utils/logger/logger.ts
├── scripts/
│   └── bootstrap.test.ts        # Tests scripts/bootstrap.js
├── server.test.ts               # Tests src/server.ts
└── integration/                 # Integration tests (separate folder)
    ├── ping-inspector.test.ts   # End-to-end MCP protocol tests
    └── bootstrap-e2e.test.ts    # End-to-end bootstrap workflow tests
```

**Test Naming Convention:**
- Unit tests: Match source filename exactly with `.test.ts` extension
  - `src/tools/ping/handler.ts` → `tests/tools/ping/handler.test.ts`
  - `src/utils/logger/logger.ts` → `tests/utils/logger/logger.test.ts`
- Integration tests: Descriptive names in `tests/integration/` folder
  - `ping-inspector.test.ts` - MCP Inspector integration tests
  - `bootstrap-e2e.test.ts` - End-to-end bootstrap workflow

**Adding Tests for New Tools:**

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

## Architecture

### Server Pattern (src/server.ts)

The MCP server follows a simple initialization pattern:

1. **Create Server**: Initialize with metadata (name, version) and capabilities
2. **Register Handlers**:
   - `ListToolsRequestSchema` → Returns `toolDefinitions` array
   - `CallToolRequestSchema` → Looks up and executes tool handlers
3. **Connect Transport**: Attach to stdio transport for MCP communication

Server metadata is defined at the top of `src/server.ts` as `SERVER_NAME` and `SERVER_VERSION`.

### Tool Registry Pattern (src/tools/)

All tools follow a four-file structure:

```
src/tools/
├── index.ts              # Central registry - exports toolDefinitions array and createToolHandlers()
├── types.ts              # Shared interfaces (ToolDefinition, ToolHandler, ServerInfo)
└── [tool-name]/
    ├── index.ts          # Re-exports all tool components
    ├── schema.ts         # Zod schemas for input/output validation
    ├── definition.ts     # MCP tool metadata (name, description, inputSchema)
    └── handler.ts        # Tool implementation logic
```

**Key concepts**:
- `toolDefinitions` is an array of tool metadata used by ListTools handler
- `createToolHandlers()` is a factory that receives `ServerInfo` and returns an object mapping tool names to async handler functions
- Each handler validates input with Zod schema before calling the actual tool handler
- All handlers must return `{ content: [{ type: 'text', text: string }] }` format

### Adding New Tools

1. Create folder in `src/tools/[new-tool]/` with the four files
2. Update `src/tools/index.ts`:
   ```typescript
   // Add import
   import { newToolDefinition, NewInputSchema, newHandler } from './new-tool/index.js';

   // Add to toolDefinitions array
   export const toolDefinitions: ToolDefinition[] = [
     pingToolDefinition,
     newToolDefinition,
   ];

   // Add to createToolHandlers
   export function createToolHandlers(serverInfo: ServerInfo) {
     return {
       ping: async (args: unknown) => { ... },
       new_tool: async (args: unknown) => {
         const validated = NewInputSchema.parse(args);
         return newHandler(validated, serverInfo);
       },
     };
   }
   ```

### Logging

The project uses a structured logger in `src/utils/logger/`.

- Logger instance is exported from `src/utils/logger/index.ts`
- Controlled by `LOG_LEVEL` environment variable: `debug`, `info` (default), `warn`, `error`
- Logs to stderr (stdout is reserved for MCP protocol communication)

## Build Configuration

- **Vite**: Bundles to ESM format, externalizes all dependencies, adds shebang banner
- **TypeScript**: Strict mode, ES2022 target, Node16 module resolution, path aliases (`@/*` → `./src/*`)
- **Output**: `dist/server.js` (executable via `node dist/server.js`)

## Testing with MCP Inspector

The `inspector-config.json` configures MCP Inspector to run the server via `npx tsx src/server.ts`.

Three test approaches:
1. **Bash script** (`scripts/test-inspector.sh`): Automated CLI tests
2. **Integration tests** (`tests/integration/`): TypeScript tests using MCP SDK Client
3. **Interactive UI**: Browser-based debugging interface

When adding new tools, update both the bash script and integration tests.

## Using with Claude Desktop

After building:
1. Add to Claude config at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
2. Use absolute path to `dist/server.js`
3. Restart Claude Desktop

Example config:
```json
{
  "mcpServers": {
    "node-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/node-mcp-server/dist/server.js"],
      "env": { "LOG_LEVEL": "info" }
    }
  }
}
```

## File Imports

All imports must use `.js` extension (TypeScript convention for ESM):
```typescript
import { logger } from './utils/logger/index.js';  // Correct
import { logger } from './utils/logger/index';     // Wrong
```
