// Configuration for CrowdCal Admin
// config.local.js is auto-generated from ADMIN_PASSWORD secret at deploy time

const CONFIG = {
  // Admin password - loaded from config.local.js (generated at build time)
  ADMIN_PASSWORD: null,

  // API endpoints
  API_BASE: 'https://crowdcal-worker.dbwg2009.workers.dev/api',
  EVENT_BASE: 'https://crowdcal.pages.dev/event.html?id=',
};

// Load secrets from config.local.js (auto-generated at deploy time)
if (typeof CONFIG_LOCAL !== 'undefined') {
  Object.assign(CONFIG, CONFIG_LOCAL);
}

// Validate configuration
if (!CONFIG.ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD not configured. Ensure ADMIN_PASSWORD secret is set in Cloudflare.');
}

// Export for use in admin.js
window.APP_CONFIG = CONFIG;
