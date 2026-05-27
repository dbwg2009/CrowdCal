# CrowdCal

CrowdCal is a self-hosted group event calendar. Friends submit events via a simple web form; events appear in a subscribeable iCal feed compatible with Google Calendar, Apple Calendar, and Outlook. Each event automatically receives a collaborative Spotify playlist and has a no-auth RSVP page.

## Tech stack

- Cloudflare Workers with Hono.js and TypeScript
- Cloudflare D1 (SQLite) via Drizzle ORM
- Cloudflare Pages (vanilla HTML/CSS/JS) for the frontend
- Worker-safe iCal feed generation using native string output
- Spotify Web API accessed via native `fetch()` calls (no Node.js SDK)

## Prerequisites

- Node.js 18+ and `npm`
- Wrangler CLI: `npm install -g wrangler` then `npx wrangler login`
- A Cloudflare account (free tier is sufficient)
- A Spotify account and a Spotify developer app (for a Client ID/Secret)

## First time setup (exact steps)

1. Clone the repository:

```bash
git clone https://github.com/dbwg2009/CrowdCal.git
cd CrowdCal
```

2. Install dependencies for the worker and database code:

```bash
cd worker
npm install
cd ../db
npm install
cd ..
```

3. Create the D1 database (locally in Cloudflare):

```bash
npx wrangler d1 create crowdcal
```

Note the `database_id` printed by the command. Open `wrangler.toml` and add it under `[[d1_databases]]` like this:

```toml
[[d1_databases]]
binding = "DB"
database_id = "<paste-database-id-here>"
```

4. Run the Drizzle migration(s):

Identify the migration file(s) in `db/migrations/` and run (example):

```bash
npx wrangler d1 execute crowdcal --file=./db/migrations/001_init.sql
```

Replace the filename with the actual migration filename present in `db/migrations/`.

5. Create local environment variables for development.

If a `.dev.vars.example` file exists, copy it; otherwise create a `.dev.vars` file at the project root with these three entries:

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

Fill in `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` from your Spotify developer dashboard. The `SPOTIFY_REFRESH_TOKEN` is obtained from the one-time OAuth flow described below.

6. Start the worker locally:

```bash
cd worker
npx wrangler dev
```

By default the worker will run at `http://localhost:8787`.

7. Serve or open the frontend.

- You can open `frontend/index.html` directly in a browser for quick testing, or use any static server (e.g. `npx serve frontend`).

## Spotify OAuth setup — one-time only

This step exchanges an authorization code for a `refresh_token` which CrowdCal uses to create playlists. Do this only once for the Spotify account that will own the playlists.

1. Go to the Spotify Developer Dashboard (https://developer.spotify.com/dashboard), create an app, and copy the **Client ID** and **Client Secret**.

2. In your Spotify app settings, add the redirect URI:

```
http://localhost:8787/api/spotify/callback
```

3. Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to your `.dev.vars` file (or set them as secrets when deploying).

4. Start the worker locally if it isn't already running:

```bash
cd worker
npx wrangler dev
```

5. Construct and open this authorization URL in your browser (replace `CLIENT_ID`):

```
https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost:8787/api/spotify/callback&scope=playlist-modify-public%20playlist-modify-private
```

6. Approve the Spotify permissions prompt. Spotify will redirect you to `http://localhost:8787/api/spotify/callback`.

7. The callback route will display a plain-text `refresh_token`. Copy the `refresh_token` value and add it to your `.dev.vars` as `SPOTIFY_REFRESH_TOKEN`.

8. You do not need to repeat this process. Playlists created by CrowdCal will be owned by the Spotify account whose credentials you provided.

## Local development

- Worker: run `npx wrangler dev` inside the `worker` directory (listens at `http://localhost:8787`).
- Frontend: open `frontend/index.html` or serve the `frontend/` folder with any static server.
- Ensure `.dev.vars` (or your environment) provides `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`.

API endpoints (local):

- POST `/api/events` — submit an event
- POST `/api/events/:id/rsvp` — submit an RSVP
- GET `/api/calendar.ics` — iCal feed
- GET `/api/events/:id` — event details and RSVPs
- GET `/api/spotify/callback` — one-time OAuth callback to exchange code for `refresh_token`

## Deployment

1. Build and deploy the worker:

```bash
cd worker
npx wrangler deploy
```

2. Set secrets in Cloudflare (do not commit secrets to `wrangler.toml`):

```bash
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
```

3. Deploy the frontend to Cloudflare Pages (optional):

```bash
npx wrangler pages deploy ./frontend
```

4. After deployment note your worker domain from the deploy output (e.g. `crowdcal-worker.<yoursubdomain>.workers.dev`).

The iCal feed URL for subscriptions will be:

```
https://<your-worker-domain>/api/calendar.ics
```

## Subscribing to the calendar

- Google Calendar: Settings → Add other calendars → From URL → paste the iCal URL above.
- Apple Calendar: File → New Calendar Subscription → paste the iCal URL.
- Outlook: Add calendar → Subscribe from web → paste the iCal URL.

Updates appear automatically whenever anyone adds an event.

## Project structure

- `worker/` — Cloudflare Worker source (Hono routes, Spotify integration, calendar generation, DB access)
  - `api.ts` — Hono route definitions for the REST API (events, RSVPs, calendar feed, OAuth callback)
  - `spotify.ts` — Spotify helper functions using native `fetch()` (token refresh, create playlist)
  - `calendar.ts` — Builds iCal data with a Worker-safe manual iCal generator (accepts `baseUrl`)
  - `db.ts` — D1 database helper to get a Drizzle client
  - `types.d.ts` — shared TypeScript types and `Env` definition for worker bindings

- `db/` — database migration files and schema definitions (Drizzle schema)
  - `schema.ts` — table definitions used by the worker
  - `migrations/` — migration SQL files for initializing the D1 database

- `frontend/` — static frontend (HTML/CSS/JS)
  - `index.html`, `main.js`, `style.css` — submission form and list pages
  - `event.html`, `event.js` — per-event RSVP page

- `wrangler.toml` — Wrangler configuration for the Worker and D1 bindings

## Known issues and important notes

- `ical-generator` is not compatible with Cloudflare Workers because it requires Node.js `fs`. iCal feeds are generated using a Worker-safe custom generator.
- `spotify-web-api-node` was removed because it does not run on Cloudflare Workers. Spotify integration is implemented with native `fetch()` calls.
- Drizzle D1 requires `eq()` from `drizzle-orm` inside `.where()`; chained `.eq()` on columns is not supported.
- `process.env` does not exist in Cloudflare Workers. The worker reads secrets from the `env` object available in route handlers (see `worker/types.d.ts` and `api.ts`).
- The Spotify OAuth callback route at `/api/spotify/callback` is intended only for the one-time setup to obtain a `refresh_token`. Remove or protect this route before exposing your worker publicly if you prefer tighter security.

## Troubleshooting

- If playlist creation fails during event creation the event is still stored; check worker logs for the error.
- If `calendar.ics` returns no events, verify your D1 binding (`wrangler.toml`) and that migrations ran successfully.

If you want help deploying or testing any specific step, tell me which step and I'll walk through it.
