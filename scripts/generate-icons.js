#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const sourceCandidates = [
    path.join(projectRoot, 'security-camera.png'),
    path.join(projectRoot, 'src', 'assets', 'security-camera.png')
  ];
  const sourcePng = sourceCandidates.find((candidate) => fs.existsSync(candidate));
  const assetsDir = path.join(projectRoot, 'assets');
  const targetPng = path.join(assetsDir, 'security-camera.png');
  const targetIco = path.join(assetsDir, 'icon.ico');

  if (!sourcePng) {
    throw new Error(`Missing source icon. Looked in: ${sourceCandidates.join(', ')}`);
  }

  fs.mkdirSync(assetsDir, { recursive: true });

  // Keep a PNG copy for Linux packaging.
  fs.copyFileSync(sourcePng, targetPng);

  // Generate the Windows .ico file from the PNG source.
  const icoBuffer = await pngToIco(sourcePng);
  fs.writeFileSync(targetIco, icoBuffer);

  console.log('Icons prepared:');
  console.log(`- ${targetPng}`);
  console.log(`- ${targetIco}`);
}

main().catch((error) => {
  console.error('Failed to prepare icons:', error.message);
  process.exit(1);
});
