# Environment & Secrets Setup Guide

All sensitive configuration is now managed through environment variables and excluded from version control.

## Files Created

- **.env** - Local environment variables (git-ignored) ✅ Created with your current values
- **.env.example** - Template showing required variables
- **.dev.vars.example** - Template for Cloudflare Worker secrets

## Frontend (admin.js)

### Setup Instructions

1. **Create `frontend/config.local.js`** (optional, for development):
```javascript
const CONFIG_LOCAL = {
  ADMIN_PASSWORD: 'your-password',
  API_BASE: 'http://localhost:8787/api', // for local dev
  EVENT_BASE: 'http://localhost:3000/event.html?id=',
};
```

2. The frontend loads from:
   - `config.js` (defaults and git-tracked)
   - `config.local.js` (local overrides, git-ignored)
   - localStorage (runtime overrides)

### Important Security Notes

⚠️ **Never commit `frontend/config.local.js`** - it's already in `.gitignore`

⚠️ **ADMIN_PASSWORD in frontend**: The current setup still allows entering a password in the browser. For production, consider:
- Validating password against a backend API
- Using OAuth or other authentication
- Storing password hash only (never plain text)

## Cloudflare Worker (.dev.vars)

### Local Development

1. Create `.dev.vars` file in root directory (git-ignored):
```
SPOTIFY_CLIENT_ID=your-value
SPOTIFY_CLIENT_SECRET=your-value
SPOTIFY_REFRESH_TOKEN=your-value
ADMIN_PASSWORD=your-password
```

2. Run `wrangler dev` - it will automatically read `.dev.vars`

### Production Deployment

Set these in Cloudflare Workers dashboard:
- Settings → Variables → Environment Variables

## Node.js Scripts (spotify-test.mjs)

### Setup

Set environment variables before running:

```bash
# Windows PowerShell
$env:SPOTIFY_CLIENT_ID = "your-id"
$env:SPOTIFY_CLIENT_SECRET = "your-secret"
$env:SPOTIFY_REFRESH_TOKEN = "your-token"
node spotify-test.mjs

# Linux/macOS
SPOTIFY_CLIENT_ID=your-id SPOTIFY_CLIENT_SECRET=your-secret SPOTIFY_REFRESH_TOKEN=your-token node spotify-test.mjs
```

Or use `.env` with dotenv:
```bash
npm install dotenv
# Then add to script: import dotenv from 'dotenv'; dotenv.config();
```

## ✅ What Changed

| File | Change |
|------|--------|
| `admin.js` | ❌ Removed hardcoded `ADMIN_PASSWORD`, `API_BASE`, `EVENT_BASE` → ✅ Load from `APP_CONFIG` |
| `spotify-test.mjs` | ❌ Removed hardcoded Spotify credentials → ✅ Load from `process.env` |
| `.gitignore` | ✅ Added `.env`, `.dev.vars`, `config.local.js` |
| `frontend/config.js` | ✅ Created - loads configuration safely |
| `.env` | ✅ Created (local only, git-ignored) |
| `.env.example` | ✅ Created (template) |
| `.dev.vars.example` | ✅ Created (template) |

## 🔒 Security Checklist

- [x] Secrets removed from version control
- [x] `.env` files git-ignored
- [x] Config templates provided
- [ ] Change `ADMIN_PASSWORD` to secure value
- [ ] Review frontend password handling for your use case
- [ ] Update Cloudflare Worker settings for production

## Running Your App

### Development
```bash
# With .env file
wrangler dev

# Or with .dev.vars file
wrangler dev
```

### Production
- Set environment variables in Cloudflare Workers dashboard
- No `.env` files needed (deployment reads from Cloudflare settings)
