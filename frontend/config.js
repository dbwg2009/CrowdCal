// Configuration for CrowdCal Admin
// ADMIN_PASSWORD injected at build time from environment variable

const CONFIG = {
  // Admin password - injected by build script at deploy time
  ADMIN_PASSWORD: null, // Will be replaced by build script

  // API endpoints
  API_BASE: 'https://crowdcal-worker.dbwg2009.workers.dev/api',
  EVENT_BASE: 'https://crowdcal.pages.dev/event.html?id=',
};

// Load local overrides if available
if (typeof CONFIG_LOCAL !== 'undefined') {
  Object.assign(CONFIG, CONFIG_LOCAL);
}

// Validate configuration
if (!CONFIG.ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD not configured. Ensure ADMIN_PASSWORD secret is set in Cloudflare.');
}

// Export for use in admin.js
window.APP_CONFIG = CONFIG;
