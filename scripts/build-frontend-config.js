#!/usr/bin/env node
// Build script - generates frontend config from environment secrets
// Runs automatically during: wrangler pages deploy ./frontend

const fs = require('fs');
const path = require('path');

const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword) {
  console.error('❌ ERROR: ADMIN_PASSWORD not set');
  console.error('   Set it in Cloudflare Pages settings or via wrangler secret');
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
console.log('✓ Generated frontend/config.local.js from ADMIN_PASSWORD secret');
