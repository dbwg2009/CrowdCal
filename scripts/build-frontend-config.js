#!/usr/bin/env node
// Build script - injects ADMIN_PASSWORD into frontend config

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

// Read config.js
const configPath = path.join(__dirname, '..', 'frontend', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the placeholder with actual password
configContent = configContent.replace(
  'ADMIN_PASSWORD: null,',
  `ADMIN_PASSWORD: '${adminPassword.replace(/'/g, "\\'")}',`
);

// Write back to config.js
fs.writeFileSync(configPath, configContent);
console.log('✓ Injected ADMIN_PASSWORD into frontend/config.js');
