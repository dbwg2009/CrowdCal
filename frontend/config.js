// Configuration for CrowdCal Admin
// DO NOT commit sensitive values to git
// Create config.local.js to override these values

const CONFIG = {
  // Admin password - should be set securely
  // Never hardcode in production - use backend validation instead
  ADMIN_PASSWORD: localStorage.getItem('crowdcal_admin_password_hash') ? null : 'CHANGE_ME',

  // API endpoints
  API_BASE: 'https://crowdcal-worker.dbwg2009.workers.dev/api',
  EVENT_BASE: 'https://crowdcal.pages.dev/event.html?id=',
};

// Load local overrides if available
if (typeof CONFIG_LOCAL !== 'undefined') {
  Object.assign(CONFIG, CONFIG_LOCAL);
}

// Export for use in admin.js
window.APP_CONFIG = CONFIG;
