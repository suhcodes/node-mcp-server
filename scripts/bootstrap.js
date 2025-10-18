#!/usr/bin/env node

/**
 * Bootstrap Script for MCP Server Template
 *
 * This script customizes the template by prompting for project details
 * and updating all relevant files accordingly.
 */

import * as readline from 'readline';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_PROJECT_ROOT = join(__dirname, '..');

// ANSI color codes
export const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Create readline interface for user input
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input with a default value
 */
function prompt(rl, question, defaultValue = '') {
  return new Promise((resolve) => {
    const displayDefault = defaultValue ? ` (${colors.cyan}${defaultValue}${colors.reset})` : '';
    rl.question(`${colors.blue}?${colors.reset} ${question}${displayDefault}: `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Validate project name (npm package name rules)
 */
export function validateProjectName(name) {
  const pattern = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  if (!pattern.test(name)) {
    throw new Error(
      'Project name must be lowercase and can contain letters, numbers, hyphens, and underscores'
    );
  }
  return true;
}

/**
 * Validate version string (semver format)
 */
export function validateVersion(version) {
  const pattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  if (!pattern.test(version)) {
    throw new Error('Version must follow semver format (e.g., 1.0.0 or 1.0.0-beta.1)');
  }
  return true;
}

/**
 * Validate Node version format
 */
export function validateNodeVersion(version) {
  const pattern = /^v?\d+\.\d+\.\d+$/;
  if (!pattern.test(version)) {
    throw new Error('Node version must be in format: v20.19.0 or 20.19.0');
  }
  return true;
}

/**
 * Update package.json with new values
 */
export function updatePackageJson(config, projectRoot = DEFAULT_PROJECT_ROOT) {
  const packagePath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

  packageJson.name = config.projectName;
  packageJson.version = config.version;
  packageJson.description = config.description;
  packageJson.author = config.author;

  // Ensure node version starts with >= and doesn't have 'v' prefix
  const nodeVersion = config.nodeVersion.replace(/^v/, '');
  packageJson.engines.node = `>=${nodeVersion}`;

  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  return packagePath;
}

/**
 * Update src/server.ts with new server name and version
 */
export function updateServerTs(config, projectRoot = DEFAULT_PROJECT_ROOT) {
  const serverPath = join(projectRoot, 'src', 'server.ts');
  let content = readFileSync(serverPath, 'utf8');

  // Update SERVER_NAME constant
  content = content.replace(
    /const SERVER_NAME = ['"].*?['"];/,
    `const SERVER_NAME = '${config.projectName}';`
  );

  // Update SERVER_VERSION constant
  content = content.replace(
    /const SERVER_VERSION = ['"].*?['"];/,
    `const SERVER_VERSION = '${config.version}';`
  );

  writeFileSync(serverPath, content);
  return serverPath;
}

/**
 * Update inspector-config.json with new server name
 */
export function updateInspectorConfig(config, projectRoot = DEFAULT_PROJECT_ROOT) {
  const configPath = join(projectRoot, 'inspector-config.json');
  const inspectorConfig = JSON.parse(readFileSync(configPath, 'utf8'));

  // Get the old server name (first key in mcpServers)
  const oldServerName = Object.keys(inspectorConfig.mcpServers)[0];

  // Replace the old server entry with new one
  const serverConfig = inspectorConfig.mcpServers[oldServerName];
  delete inspectorConfig.mcpServers[oldServerName];
  inspectorConfig.mcpServers[config.projectName] = serverConfig;

  writeFileSync(configPath, JSON.stringify(inspectorConfig, null, 2) + '\n');
  return configPath;
}

/**
 * Update scripts/test-inspector.sh with new server name
 */
export function updateTestInspectorSh(config, projectRoot = DEFAULT_PROJECT_ROOT) {
  const scriptPath = join(projectRoot, 'scripts', 'test-inspector.sh');
  let content = readFileSync(scriptPath, 'utf8');

  // Update SERVER_NAME variable
  content = content.replace(
    /SERVER_NAME=["'].*?["']/,
    `SERVER_NAME="${config.projectName}"`
  );

  writeFileSync(scriptPath, content);
  return scriptPath;
}

/**
 * Create or update .nvmrc file
 */
export function updateNvmrc(config, projectRoot = DEFAULT_PROJECT_ROOT) {
  const nvmrcPath = join(projectRoot, '.nvmrc');
  // Ensure version has 'v' prefix for .nvmrc
  const version = config.nodeVersion.startsWith('v')
    ? config.nodeVersion
    : `v${config.nodeVersion}`;

  writeFileSync(nvmrcPath, version + '\n');
  return nvmrcPath;
}

/**
 * Update README.md with project name and author
 */
export function updateReadme(config, projectRoot = DEFAULT_PROJECT_ROOT) {
  const readmePath = join(projectRoot, 'README.md');
  let content = readFileSync(readmePath, 'utf8');

  // Update the title (first heading)
  content = content.replace(
    /^# .+$/m,
    `# ${config.projectName.split('/').pop().split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
  );

  // Update author section
  content = content.replace(/^## Author\s+\S+/m, `## Author\n\n${config.author}`);

  // Update description in the first paragraph (if it's a generic template description)
  const lines = content.split('\n');
  const firstParaIndex = lines.findIndex((line, i) => i > 0 && line.trim() && !line.startsWith('#'));
  if (firstParaIndex !== -1 && lines[firstParaIndex].includes('bootstrap template')) {
    lines[firstParaIndex] = config.description;
    content = lines.join('\n');
  }

  writeFileSync(readmePath, content);
  return readmePath;
}

/**
 * Run yarn install
 */
function installDependencies() {
  console.log(`\n${colors.blue}Installing dependencies...${colors.reset}`);
  try {
    execSync('yarn install', {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    console.log(`${colors.green}✓${colors.reset} Dependencies installed`);
  } catch (error) {
    console.error(`${colors.yellow}⚠${colors.reset} Failed to install dependencies. Please run 'yarn install' manually.`);
  }
}

/**
 * Display welcome message
 */
function displayWelcome() {
  console.log(`\n${colors.bold}${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║   MCP Server Bootstrap Configuration   ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);
  console.log(`This script will customize your MCP server project.\n`);
}

/**
 * Display summary of configuration
 */
function displaySummary(config) {
  console.log(`\n${colors.bold}Configuration Summary:${colors.reset}`);
  console.log(`  Project Name: ${colors.cyan}${config.projectName}${colors.reset}`);
  console.log(`  Author:       ${colors.cyan}${config.author}${colors.reset}`);
  console.log(`  Version:      ${colors.cyan}${config.version}${colors.reset}`);
  console.log(`  Description:  ${colors.cyan}${config.description}${colors.reset}`);
  console.log(`  Node Version: ${colors.cyan}${config.nodeVersion}${colors.reset}\n`);
}

/**
 * Confirm with user before proceeding
 */
function confirmProceed(rl) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}Proceed with these changes? (Y/n):${colors.reset} `, (answer) => {
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === '' || normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Main bootstrap function
 */
async function bootstrap() {
  const rl = createInterface();

  try {
    displayWelcome();

    // Collect user input
    const config = {
      projectName: await prompt(rl, 'Project name', 'my-mcp-server'),
      author: await prompt(rl, 'Author', 'Your Name'),
      version: await prompt(rl, 'Version', '1.0.0'),
      description: await prompt(rl, 'Description', 'My custom MCP server'),
      nodeVersion: await prompt(rl, 'Node version', 'v20.19.0'),
    };

    // Validate inputs
    try {
      validateProjectName(config.projectName);
      validateVersion(config.version);
      validateNodeVersion(config.nodeVersion);
    } catch (error) {
      console.error(`\n${colors.yellow}⚠ Validation Error:${colors.reset} ${error.message}\n`);
      rl.close();
      process.exit(1);
    }

    displaySummary(config);

    // Confirm before proceeding
    const proceed = await confirmProceed(rl);
    if (!proceed) {
      console.log(`\n${colors.yellow}Bootstrap cancelled.${colors.reset}\n`);
      rl.close();
      process.exit(0);
    }

    console.log(`\n${colors.blue}Updating project files...${colors.reset}\n`);

    // Update all files
    const projectRoot = DEFAULT_PROJECT_ROOT;
    updatePackageJson(config, projectRoot);
    console.log(`${colors.green}✓${colors.reset} Updated package.json`);

    updateServerTs(config, projectRoot);
    console.log(`${colors.green}✓${colors.reset} Updated src/server.ts`);

    updateInspectorConfig(config, projectRoot);
    console.log(`${colors.green}✓${colors.reset} Updated inspector-config.json`);

    updateTestInspectorSh(config, projectRoot);
    console.log(`${colors.green}✓${colors.reset} Updated scripts/test-inspector.sh`);

    updateNvmrc(config, projectRoot);
    console.log(`${colors.green}✓${colors.reset} ${existsSync(join(projectRoot, '.nvmrc')) ? 'Updated' : 'Created'} .nvmrc`);

    updateReadme(config, projectRoot);
    console.log(`${colors.green}✓${colors.reset} Updated README.md`);

    // Install dependencies
    installDependencies();

    // Success message
    console.log(`\n${colors.green}${colors.bold}✓ Bootstrap complete!${colors.reset} Your project is ready.\n`);
    console.log(`${colors.cyan}Next steps:${colors.reset}`);
    console.log(`  1. Review the updated files`);
    console.log(`  2. Run ${colors.cyan}yarn dev${colors.reset} to start development`);
    console.log(`  3. Run ${colors.cyan}yarn test${colors.reset} to verify everything works\n`);

  } catch (error) {
    console.error(`\n${colors.yellow}⚠ Error:${colors.reset} ${error.message}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the bootstrap
bootstrap();
