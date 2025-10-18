/**
 * Bootstrap Script Unit Tests
 *
 * Tests for the bootstrap script's validation and file update functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
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

describe('Bootstrap Script - Validation Functions', () => {
  describe('validateProjectName', () => {
    it('should accept valid lowercase project names', () => {
      expect(validateProjectName('my-mcp-server')).toBe(true);
      expect(validateProjectName('awesome-server')).toBe(true);
      expect(validateProjectName('mcp-tools')).toBe(true);
    });

    it('should accept scoped package names', () => {
      expect(validateProjectName('@myorg/mcp-server')).toBe(true);
      expect(validateProjectName('@company/awesome-tools')).toBe(true);
    });

    it('should accept names with numbers', () => {
      expect(validateProjectName('mcp-server-2')).toBe(true);
      expect(validateProjectName('v2-server')).toBe(true);
    });

    it('should reject uppercase characters', () => {
      expect(() => validateProjectName('MyMcpServer')).toThrow();
      expect(() => validateProjectName('UPPERCASE')).toThrow();
    });

    it('should reject names with spaces', () => {
      expect(() => validateProjectName('my mcp server')).toThrow();
      expect(() => validateProjectName('invalid name')).toThrow();
    });

    it('should reject names starting with invalid characters', () => {
      expect(() => validateProjectName('.server')).toThrow();
      expect(() => validateProjectName('_server')).toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => validateProjectName('')).toThrow();
    });
  });

  describe('validateVersion', () => {
    it('should accept valid semver versions', () => {
      expect(validateVersion('1.0.0')).toBe(true);
      expect(validateVersion('0.1.0')).toBe(true);
      expect(validateVersion('10.20.30')).toBe(true);
    });

    it('should accept pre-release versions', () => {
      expect(validateVersion('1.0.0-beta.1')).toBe(true);
      expect(validateVersion('2.0.0-alpha')).toBe(true);
      expect(validateVersion('1.0.0-rc.1')).toBe(true);
    });

    it('should reject invalid version formats', () => {
      expect(() => validateVersion('1.0')).toThrow();
      expect(() => validateVersion('v1.0.0')).toThrow();
      expect(() => validateVersion('1')).toThrow();
      expect(() => validateVersion('abc')).toThrow();
    });

    it('should reject versions with extra characters', () => {
      expect(() => validateVersion('1.0.0.0')).toThrow();
      expect(() => validateVersion('1.0.0 beta')).toThrow();
    });
  });

  describe('validateNodeVersion', () => {
    it('should accept versions with v prefix', () => {
      expect(validateNodeVersion('v20.19.0')).toBe(true);
      expect(validateNodeVersion('v18.0.0')).toBe(true);
    });

    it('should accept versions without v prefix', () => {
      expect(validateNodeVersion('20.19.0')).toBe(true);
      expect(validateNodeVersion('18.0.0')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(() => validateNodeVersion('20.19')).toThrow();
      expect(() => validateNodeVersion('v20')).toThrow();
      expect(() => validateNodeVersion('node20.19.0')).toThrow();
    });
  });
});

describe('Bootstrap Script - File Update Functions', () => {
  let tempDir: string;
  let testConfig: {
    projectName: string;
    author: string;
    version: string;
    description: string;
    nodeVersion: string;
  };

  beforeEach(() => {
    // Create temporary directory for each test
    tempDir = mkdtempSync(join(tmpdir(), 'bootstrap-test-'));

    // Create src directory
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    mkdirSync(join(tempDir, 'scripts'), { recursive: true });

    // Test configuration
    testConfig = {
      projectName: 'test-mcp-server',
      author: 'Test Author',
      version: '2.0.0',
      description: 'A test MCP server',
      nodeVersion: 'v20.19.0',
    };
  });

  afterEach(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('updatePackageJson', () => {
    beforeEach(() => {
      // Create a mock package.json
      const mockPackageJson = {
        name: 'node-mcp-server',
        version: '0.1.0',
        description: 'Generic MCP server bootstrap template',
        author: 'suhcodes',
        engines: {
          node: '>=20.19.0',
        },
      };
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify(mockPackageJson, null, 2)
      );
    });

    it('should update all package.json fields correctly', () => {
      updatePackageJson(testConfig, tempDir);

      const updatedPackageJson = JSON.parse(
        readFileSync(join(tempDir, 'package.json'), 'utf8')
      );

      expect(updatedPackageJson.name).toBe('test-mcp-server');
      expect(updatedPackageJson.version).toBe('2.0.0');
      expect(updatedPackageJson.description).toBe('A test MCP server');
      expect(updatedPackageJson.author).toBe('Test Author');
      expect(updatedPackageJson.engines.node).toBe('>=20.19.0');
    });

    it('should handle node version without v prefix', () => {
      const configWithoutV = { ...testConfig, nodeVersion: '18.0.0' };
      updatePackageJson(configWithoutV, tempDir);

      const updatedPackageJson = JSON.parse(
        readFileSync(join(tempDir, 'package.json'), 'utf8')
      );

      expect(updatedPackageJson.engines.node).toBe('>=18.0.0');
    });

    it('should preserve other package.json fields', () => {
      const originalPackageJson = JSON.parse(
        readFileSync(join(tempDir, 'package.json'), 'utf8')
      );
      originalPackageJson.dependencies = { zod: '^4.1.12' };
      writeFileSync(
        join(tempDir, 'package.json'),
        JSON.stringify(originalPackageJson, null, 2)
      );

      updatePackageJson(testConfig, tempDir);

      const updatedPackageJson = JSON.parse(
        readFileSync(join(tempDir, 'package.json'), 'utf8')
      );

      expect(updatedPackageJson.dependencies).toEqual({ zod: '^4.1.12' });
    });
  });

  describe('updateServerTs', () => {
    beforeEach(() => {
      // Create a mock server.ts file
      const mockServerTs = `// Server metadata
const SERVER_NAME = 'node-mcp-server';
const SERVER_VERSION = '0.1.0';

function createServer() {
  // Server logic
}`;
      writeFileSync(join(tempDir, 'src', 'server.ts'), mockServerTs);
    });

    it('should update SERVER_NAME constant', () => {
      updateServerTs(testConfig, tempDir);

      const updatedServerTs = readFileSync(
        join(tempDir, 'src', 'server.ts'),
        'utf8'
      );

      expect(updatedServerTs).toContain("const SERVER_NAME = 'test-mcp-server';");
    });

    it('should update SERVER_VERSION constant', () => {
      updateServerTs(testConfig, tempDir);

      const updatedServerTs = readFileSync(
        join(tempDir, 'src', 'server.ts'),
        'utf8'
      );

      expect(updatedServerTs).toContain("const SERVER_VERSION = '2.0.0';");
    });

    it('should preserve the rest of the file', () => {
      updateServerTs(testConfig, tempDir);

      const updatedServerTs = readFileSync(
        join(tempDir, 'src', 'server.ts'),
        'utf8'
      );

      expect(updatedServerTs).toContain('function createServer()');
      expect(updatedServerTs).toContain('// Server logic');
    });

    it('should handle double quotes in constants', () => {
      const mockServerTsDoubleQuotes = `const SERVER_NAME = "node-mcp-server";
const SERVER_VERSION = "0.1.0";`;
      writeFileSync(
        join(tempDir, 'src', 'server.ts'),
        mockServerTsDoubleQuotes
      );

      updateServerTs(testConfig, tempDir);

      const updatedServerTs = readFileSync(
        join(tempDir, 'src', 'server.ts'),
        'utf8'
      );

      expect(updatedServerTs).toContain("SERVER_NAME = 'test-mcp-server'");
      expect(updatedServerTs).toContain("SERVER_VERSION = '2.0.0'");
    });
  });

  describe('updateInspectorConfig', () => {
    beforeEach(() => {
      // Create a mock inspector-config.json
      const mockInspectorConfig = {
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
        JSON.stringify(mockInspectorConfig, null, 2)
      );
    });

    it('should rename the server key', () => {
      updateInspectorConfig(testConfig, tempDir);

      const updatedConfig = JSON.parse(
        readFileSync(join(tempDir, 'inspector-config.json'), 'utf8')
      );

      expect(updatedConfig.mcpServers['test-mcp-server']).toBeDefined();
      expect(updatedConfig.mcpServers['node-mcp-server']).toBeUndefined();
    });

    it('should preserve server configuration', () => {
      updateInspectorConfig(testConfig, tempDir);

      const updatedConfig = JSON.parse(
        readFileSync(join(tempDir, 'inspector-config.json'), 'utf8')
      );

      expect(updatedConfig.mcpServers['test-mcp-server'].command).toBe('npx');
      expect(updatedConfig.mcpServers['test-mcp-server'].args).toEqual([
        'tsx',
        'src/server.ts',
      ]);
      expect(updatedConfig.mcpServers['test-mcp-server'].env.LOG_LEVEL).toBe(
        'error'
      );
    });
  });

  describe('updateTestInspectorSh', () => {
    beforeEach(() => {
      // Create a mock test-inspector.sh file
      const mockTestScript = `#!/bin/bash
CONFIG_FILE="inspector-config.json"
SERVER_NAME="node-mcp-server"

echo "Testing server: $SERVER_NAME"`;
      writeFileSync(join(tempDir, 'scripts', 'test-inspector.sh'), mockTestScript);
    });

    it('should update SERVER_NAME variable', () => {
      updateTestInspectorSh(testConfig, tempDir);

      const updatedScript = readFileSync(
        join(tempDir, 'scripts', 'test-inspector.sh'),
        'utf8'
      );

      expect(updatedScript).toContain('SERVER_NAME="test-mcp-server"');
    });

    it('should preserve the rest of the script', () => {
      updateTestInspectorSh(testConfig, tempDir);

      const updatedScript = readFileSync(
        join(tempDir, 'scripts', 'test-inspector.sh'),
        'utf8'
      );

      expect(updatedScript).toContain('#!/bin/bash');
      expect(updatedScript).toContain('CONFIG_FILE="inspector-config.json"');
      expect(updatedScript).toContain('echo "Testing server: $SERVER_NAME"');
    });
  });

  describe('updateNvmrc', () => {
    it('should create .nvmrc with v prefix', () => {
      updateNvmrc(testConfig, tempDir);

      const nvmrcContent = readFileSync(join(tempDir, '.nvmrc'), 'utf8').trim();

      expect(nvmrcContent).toBe('v20.19.0');
    });

    it('should add v prefix if not present', () => {
      const configWithoutV = { ...testConfig, nodeVersion: '18.0.0' };
      updateNvmrc(configWithoutV, tempDir);

      const nvmrcContent = readFileSync(join(tempDir, '.nvmrc'), 'utf8').trim();

      expect(nvmrcContent).toBe('v18.0.0');
    });

    it('should not duplicate v prefix', () => {
      updateNvmrc(testConfig, tempDir);

      const nvmrcContent = readFileSync(join(tempDir, '.nvmrc'), 'utf8').trim();

      expect(nvmrcContent).toBe('v20.19.0');
      expect(nvmrcContent).not.toBe('vv20.19.0');
    });
  });

  describe('updateReadme', () => {
    beforeEach(() => {
      // Create a mock README.md
      const mockReadme = `# Node MCP Server Bootstrap

A generic, minimal Model Context Protocol (MCP) server bootstrap template. This provides a clean starting point for creating new MCP servers with TypeScript, featuring a simple example tool and best practices.

## Features

- Some features

## Author

suhcodes

## License

MIT`;
      writeFileSync(join(tempDir, 'README.md'), mockReadme);
    });

    it('should update the title', () => {
      updateReadme(testConfig, tempDir);

      const updatedReadme = readFileSync(join(tempDir, 'README.md'), 'utf8');

      expect(updatedReadme).toContain('# Test Mcp Server');
    });

    it('should update the author section', () => {
      updateReadme(testConfig, tempDir);

      const updatedReadme = readFileSync(join(tempDir, 'README.md'), 'utf8');

      expect(updatedReadme).toContain('## Author\n\nTest Author');
    });

    it('should update description if it contains "bootstrap template"', () => {
      updateReadme(testConfig, tempDir);

      const updatedReadme = readFileSync(join(tempDir, 'README.md'), 'utf8');

      expect(updatedReadme).toContain('A test MCP server');
    });

    it('should handle scoped package names correctly in title', () => {
      const scopedConfig = { ...testConfig, projectName: '@myorg/awesome-server' };
      updateReadme(scopedConfig, tempDir);

      const updatedReadme = readFileSync(join(tempDir, 'README.md'), 'utf8');

      expect(updatedReadme).toContain('# Awesome Server');
    });

    it('should preserve other sections', () => {
      updateReadme(testConfig, tempDir);

      const updatedReadme = readFileSync(join(tempDir, 'README.md'), 'utf8');

      expect(updatedReadme).toContain('## Features');
      expect(updatedReadme).toContain('## License');
      expect(updatedReadme).toContain('MIT');
    });
  });
});
