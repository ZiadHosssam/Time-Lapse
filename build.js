#!/usr/bin/env node

/**
 * Build helper script for Study CCTV Desktop
 * This script runs electron-builder with the appropriate configuration
 * Usage: node build.js [options]
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const projectRoot = __dirname;
const isDev = process.argv.includes('--dev');
const isDryRun = process.argv.includes('--dry-run');
const targetPlatform = process.argv.find(arg => arg.startsWith('--platform='))?.split('=')[1];

console.log('📦 Study CCTV Desktop Build Helper');
console.log('==================================\n');

// Check if electron-builder is installed
const builderPath = path.join(projectRoot, 'node_modules', '.bin', 'electron-builder');
const globalBuilder = 'electron-builder';

let builder = null;
let builderCmd = null;

// Try local installation first
if (fs.existsSync(builderPath)) {
  builder = builderPath;
  builderCmd = 'node';
} else {
  // Fall back to global or npx
  builder = globalBuilder;
  builderCmd = 'npx';
}

console.log(`✓ Using builder: ${builderCmd === 'node' ? 'local installation' : 'global/npx'}`);

const args = [];

// Add build type
if (isDev) {
  args.push('--dir');
  console.log('✓ Building in test mode (--dir)');
} else {
  console.log('✓ Building distribution packages');
}

// Add platform
if (targetPlatform) {
  args.push(`--${targetPlatform}`);
  console.log(`✓ Target platform: ${targetPlatform}`);
}

// Add dry-run if requested
if (isDryRun) {
  args.push('--dry-run');
  console.log('✓ Dry run mode enabled');
}

console.log('\nStarting build...\n');

// Run electron-builder
const command = builderCmd === 'node' ? builderPath : builder;
const child = spawn(command, [command === builderPath ? '' : builder, ...args].filter(Boolean), {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✓ Build completed successfully!');
    console.log('📁 Built packages are in the dist/ directory');
  } else {
    console.error(`\n✗ Build failed with exit code ${code}`);
    process.exit(code);
  }
});

child.on('error', (error) => {
  console.error('✗ Build error:', error.message);
  process.exit(1);
});
