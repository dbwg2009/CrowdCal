#!/usr/bin/env node
// Build script - generates frontend config from environment secrets

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('❌ ERROR: ADMIN_PASSWORD not set');
  console.error('   Set it: $env:ADMIN_PASSWORD = "your-password" (PowerShell)');
  process.exit(1);
}

// Generate config.local.js with the secret
const configContent = `// AUTO-GENERATED - do not edit
// Generated from ADMIN_PASSWORD environment variable

const CONFIG_LOCAL = {
  ADMIN_PASSWORD: '${adminPassword.replace(/'/g, "\\'")}',
};
`;

const outputPath = path.join(__dirname, '..', 'frontend', 'config.local.js');
fs.writeFileSync(outputPath, configContent);
console.log('✓ Generated frontend/config.local.js from ADMIN_PASSWORD');
