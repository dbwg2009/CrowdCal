// Configuration for CrowdCal Admin
// DO NOT commit sensitive values to git
// Passwords injected at deploy time via environment variables

const CONFIG = {
  // Admin password - injected at build time or via config.local.js
  ADMIN_PASSWORD: '__ADMIN_PASSWORD__',

  // API endpoints
  API_BASE: 'https://crowdcal-worker.dbwg2009.workers.dev/api',
  EVENT_BASE: 'https://crowdcal.pages.dev/event.html?id=',
};

// Load local overrides if available (for development)
if (typeof CONFIG_LOCAL !== 'undefined') {
  Object.assign(CONFIG, CONFIG_LOCAL);
}

// Validate required config
if (!CONFIG.ADMIN_PASSWORD || CONFIG.ADMIN_PASSWORD === '__ADMIN_PASSWORD__') {
  console.error('ERROR: ADMIN_PASSWORD not configured. Set via environment variable or config.local.js');
}

// Export for use in admin.js
window.APP_CONFIG = CONFIG;
