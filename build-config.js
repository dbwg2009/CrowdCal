#!/usr/bin/env node
// Build script to inject environment variables into frontend config

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'frontend', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('❌ ERROR: ADMIN_PASSWORD environment variable not set');
  console.error('   Set it before deploying: export ADMIN_PASSWORD="your-password"');
  process.exit(1);
}

// Replace placeholder with actual password
configContent = configContent.replace(
  "'__ADMIN_PASSWORD__'",
  `'${adminPassword.replace(/'/g, "\\'")}'`
);

fs.writeFileSync(configPath, configContent);
console.log('✓ Injected ADMIN_PASSWORD into config.js');
