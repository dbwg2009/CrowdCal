// Configuration for CrowdCal Admin
// DO NOT commit sensitive values to git
// Create config.local.js to override these values

const CONFIG = {
  // Admin password - MUST be set via config.local.js or environment
  // Never hardcode in this file - it's committed to git!
  ADMIN_PASSWORD: null,

  // API endpoints
  API_BASE: 'https://crowdcal-worker.dbwg2009.workers.dev/api',
  EVENT_BASE: 'https://crowdcal.pages.dev/event.html?id=',
};

// Load local overrides if available
if (typeof CONFIG_LOCAL !== 'undefined') {
  Object.assign(CONFIG, CONFIG_LOCAL);
}

// Validate required config for production
if (!CONFIG.ADMIN_PASSWORD) {
  console.error('ERROR: ADMIN_PASSWORD not configured. Create frontend/config.local.js with your password.');
}

// Export for use in admin.js
window.APP_CONFIG = CONFIG;
