/**
 * Bootstrap Script End-to-End Integration Tests
 *
 * Tests the complete bootstrap workflow in an isolated environment
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, cpSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  validateProjectName,
  validateVersion,
  validateNodeVersion,
  updatePackageJson,
  updateServerTs,
  updateInspectorConfig,
  updateTestInspectorSh,
  updateNvmrc,
  updateReadme,
} from '../../scripts/bootstrap.js';

describe('Bootstrap Script - End-to-End Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory with realistic project structure
    tempDir = mkdtempSync(join(tmpdir(), 'bootstrap-e2e-'));

    // Create directory structure
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    mkdirSync(join(tempDir, 'scripts'), { recursive: true });

    // Create realistic package.json
    const packageJson = {
      name: 'node-mcp-server',
      version: '0.1.0',
      description: 'Generic MCP server bootstrap template for creating new Model Context Protocol servers',
      packageManager: 'yarn@4.10.3',
      type: 'module',
      main: './dist/server.js',
      bin: './bin/cli.js',
      scripts: {
        bootstrap: 'node scripts/bootstrap.js',
        dev: 'tsx watch src/server.ts',
        start: 'node dist/server.js',
        build: 'vite build',
      },
      keywords: ['mcp', 'bootstrap', 'model-context-protocol'],
      author: 'suhcodes',
      license: 'MIT',
      engines: {
        node: '>=20.19.0',
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.20.1',
        zod: '^4.1.12',
      },
    };
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create realistic src/server.ts
    const serverTs = `/**
 * Generic MCP Server Bootstrap
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Server metadata
const SERVER_NAME = 'node-mcp-server';
const SERVER_VERSION = '0.1.0';

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

  return server;
}

main();
`;
    writeFileSync(join(tempDir, 'src', 'server.ts'), serverTs);

    // Create realistic inspector-config.json
    const inspectorConfig = {
      mcpServers: {
        'node-mcp-server': {
          command: 'npx',
          args: ['tsx', 'src/server.ts'],
          env: {
            LOG_LEVEL: 'error',
          },
        },
      },
    };
    writeFileSync(
      join(tempDir, 'inspector-config.json'),
      JSON.stringify(inspectorConfig, null, 2)
    );

    // Create realistic test-inspector.sh
    const testScript = `#!/bin/bash

set -e

echo "==================================="
echo "MCP Inspector Integration Tests"
echo "==================================="

CONFIG_FILE="inspector-config.json"
SERVER_NAME="node-mcp-server"

echo "Testing: \${SERVER_NAME}"
`;
    writeFileSync(join(tempDir, 'scripts', 'test-inspector.sh'), testScript);

    // Create realistic README.md
    const readme = `# Node MCP Server Bootstrap

A generic, minimal Model Context Protocol (MCP) server bootstrap template. This provides a clean starting point for creating new MCP servers with TypeScript, featuring a simple example tool and best practices.

## Features

- Minimal Setup
- Simple Example
- Testing Included

## Quick Start

### Installation

\`\`\`bash
yarn install
\`\`\`

## Author

suhcodes

## License

MIT
`;
    writeFileSync(join(tempDir, 'README.md'), readme);
  });

  afterEach(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should successfully bootstrap a complete project', () => {
    const config = {
      projectName: 'my-awesome-mcp',
      author: 'Jane Developer',
      version: '1.0.0',
      description: 'An awesome MCP server for amazing things',
      nodeVersion: 'v20.19.0',
    };

    // Validate configuration
    expect(() => validateProjectName(config.projectName)).not.toThrow();
    expect(() => validateVersion(config.version)).not.toThrow();
    expect(() => validateNodeVersion(config.nodeVersion)).not.toThrow();

    // Run all update functions
    updatePackageJson(config, tempDir);
    updateServerTs(config, tempDir);
    updateInspectorConfig(config, tempDir);
    updateTestInspectorSh(config, tempDir);
    updateNvmrc(config, tempDir);
    updateReadme(config, tempDir);

    // Verify package.json was updated correctly
    const packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('my-awesome-mcp');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.description).toBe('An awesome MCP server for amazing things');
    expect(packageJson.author).toBe('Jane Developer');
    expect(packageJson.engines.node).toBe('>=20.19.0');

    // Verify server.ts was updated correctly
    const serverTs = readFileSync(join(tempDir, 'src', 'server.ts'), 'utf8');
    expect(serverTs).toContain("const SERVER_NAME = 'my-awesome-mcp';");
    expect(serverTs).toContain("const SERVER_VERSION = '1.0.0';");

    // Verify inspector-config.json was updated correctly
    const inspectorConfig = JSON.parse(
      readFileSync(join(tempDir, 'inspector-config.json'), 'utf8')
    );
    expect(inspectorConfig.mcpServers['my-awesome-mcp']).toBeDefined();
    expect(inspectorConfig.mcpServers['node-mcp-server']).toBeUndefined();

    // Verify test-inspector.sh was updated correctly
    const testScript = readFileSync(join(tempDir, 'scripts', 'test-inspector.sh'), 'utf8');
    expect(testScript).toContain('SERVER_NAME="my-awesome-mcp"');

    // Verify .nvmrc was created correctly
    const nvmrc = readFileSync(join(tempDir, '.nvmrc'), 'utf8').trim();
    expect(nvmrc).toBe('v20.19.0');

    // Verify README.md was updated correctly
    const readme = readFileSync(join(tempDir, 'README.md'), 'utf8');
    expect(readme).toContain('# My Awesome Mcp');
    expect(readme).toContain('## Author\n\nJane Developer');
    expect(readme).toContain('An awesome MCP server for amazing things');
  });

  it('should handle scoped package names correctly', () => {
    const config = {
      projectName: '@mycompany/data-tools',
      author: 'DevOps Team',
      version: '2.5.1',
      description: 'Internal data processing tools',
      nodeVersion: '18.0.0',
    };

    // Run all update functions
    updatePackageJson(config, tempDir);
    updateServerTs(config, tempDir);
    updateInspectorConfig(config, tempDir);
    updateTestInspectorSh(config, tempDir);
    updateNvmrc(config, tempDir);
    updateReadme(config, tempDir);

    // Verify package.json
    const packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('@mycompany/data-tools');

    // Verify server.ts
    const serverTs = readFileSync(join(tempDir, 'src', 'server.ts'), 'utf8');
    expect(serverTs).toContain("const SERVER_NAME = '@mycompany/data-tools';");

    // Verify inspector-config.json
    const inspectorConfig = JSON.parse(
      readFileSync(join(tempDir, 'inspector-config.json'), 'utf8')
    );
    expect(inspectorConfig.mcpServers['@mycompany/data-tools']).toBeDefined();

    // Verify test-inspector.sh
    const testScript = readFileSync(join(tempDir, 'scripts', 'test-inspector.sh'), 'utf8');
    expect(testScript).toContain('SERVER_NAME="@mycompany/data-tools"');

    // Verify README title extracts just the package name
    const readme = readFileSync(join(tempDir, 'README.md'), 'utf8');
    expect(readme).toContain('# Data Tools');
  });

  it('should handle Node version without v prefix', () => {
    const config = {
      projectName: 'version-test-server',
      author: 'Tester',
      version: '1.0.0',
      description: 'Testing version handling',
      nodeVersion: '22.5.1', // No 'v' prefix
    };

    updatePackageJson(config, tempDir);
    updateNvmrc(config, tempDir);

    // Verify package.json removes v prefix for engines.node
    const packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
    expect(packageJson.engines.node).toBe('>=22.5.1');

    // Verify .nvmrc adds v prefix
    const nvmrc = readFileSync(join(tempDir, '.nvmrc'), 'utf8').trim();
    expect(nvmrc).toBe('v22.5.1');
  });

  it('should preserve existing package.json fields not being updated', () => {
    const config = {
      projectName: 'preserve-test',
      author: 'Test Author',
      version: '3.0.0',
      description: 'Testing field preservation',
      nodeVersion: 'v20.19.0',
    };

    // Get original package.json
    const originalPackageJson = JSON.parse(
      readFileSync(join(tempDir, 'package.json'), 'utf8')
    );

    // Update package.json
    updatePackageJson(config, tempDir);

    // Verify preserved fields
    const updatedPackageJson = JSON.parse(
      readFileSync(join(tempDir, 'package.json'), 'utf8')
    );

    expect(updatedPackageJson.packageManager).toBe(originalPackageJson.packageManager);
    expect(updatedPackageJson.type).toBe(originalPackageJson.type);
    expect(updatedPackageJson.scripts).toEqual(originalPackageJson.scripts);
    expect(updatedPackageJson.dependencies).toEqual(originalPackageJson.dependencies);
    expect(updatedPackageJson.keywords).toEqual(originalPackageJson.keywords);
    expect(updatedPackageJson.license).toBe(originalPackageJson.license);
  });

  it('should preserve code structure in server.ts', () => {
    const config = {
      projectName: 'structure-test',
      author: 'Test',
      version: '1.0.0',
      description: 'Testing structure preservation',
      nodeVersion: 'v20.19.0',
    };

    // Get original server.ts
    const originalServerTs = readFileSync(join(tempDir, 'src', 'server.ts'), 'utf8');

    // Update server.ts
    updateServerTs(config, tempDir);

    // Verify preserved code
    const updatedServerTs = readFileSync(join(tempDir, 'src', 'server.ts'), 'utf8');

    expect(updatedServerTs).toContain('async function createServer()');
    expect(updatedServerTs).toContain('import { Server }');
    expect(updatedServerTs).toContain('capabilities:');
    expect(updatedServerTs).toContain('main();');
  });

  it('should handle multiple sequential bootstraps', () => {
    const config1 = {
      projectName: 'first-bootstrap',
      author: 'Author One',
      version: '1.0.0',
      description: 'First bootstrap',
      nodeVersion: 'v18.0.0',
    };

    const config2 = {
      projectName: 'second-bootstrap',
      author: 'Author Two',
      version: '2.0.0',
      description: 'Second bootstrap',
      nodeVersion: 'v20.0.0',
    };

    // First bootstrap
    updatePackageJson(config1, tempDir);
    updateServerTs(config1, tempDir);
    updateInspectorConfig(config1, tempDir);

    // Verify first bootstrap
    let packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('first-bootstrap');

    // Second bootstrap
    updatePackageJson(config2, tempDir);
    updateServerTs(config2, tempDir);
    updateInspectorConfig(config2, tempDir);

    // Verify second bootstrap overwrites first
    packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('second-bootstrap');
    expect(packageJson.author).toBe('Author Two');
    expect(packageJson.version).toBe('2.0.0');

    const serverTs = readFileSync(join(tempDir, 'src', 'server.ts'), 'utf8');
    expect(serverTs).toContain("const SERVER_NAME = 'second-bootstrap';");
    expect(serverTs).toContain("const SERVER_VERSION = '2.0.0';");
  });

  it('should handle pre-release version numbers', () => {
    const config = {
      projectName: 'prerelease-test',
      author: 'Test Author',
      version: '1.0.0-beta.5',
      description: 'Testing pre-release versions',
      nodeVersion: 'v20.19.0',
    };

    // Validate version
    expect(() => validateVersion(config.version)).not.toThrow();

    // Update files
    updatePackageJson(config, tempDir);
    updateServerTs(config, tempDir);

    // Verify version is preserved correctly
    const packageJson = JSON.parse(readFileSync(join(tempDir, 'package.json'), 'utf8'));
    expect(packageJson.version).toBe('1.0.0-beta.5');

    const serverTs = readFileSync(join(tempDir, 'src', 'server.ts'), 'utf8');
    expect(serverTs).toContain("const SERVER_VERSION = '1.0.0-beta.5';");
  });
});
