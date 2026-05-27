# CrowdCal

A full-stack group event calendar app built with Cloudflare Workers (Hono.js), D1 (SQLite) with Drizzle ORM, and a vanilla HTML/CSS/JS frontend. Features iCal feed, RSVP system, and Spotify playlist integration.

## Features
- Mobile-friendly event submission form
- iCal feed for calendar subscriptions
- RSVP system (no auth)
- Spotify collaborative playlist per event

## Stack
- Cloudflare Workers (Hono.js, TypeScript)
- Cloudflare D1 (SQLite) with Drizzle ORM
- Cloudflare Pages frontend (vanilla HTML/CSS/JS)
- ical-generator for iCal feed
- spotify-web-api-node for Spotify integration

## Setup Instructions
1. Clone this repo and install dependencies in `/worker` and `/db`.
2. Configure Cloudflare D1 and set up your database using Drizzle migrations.
3. Set up Cloudflare Worker secrets for Spotify (client_id, client_secret, refresh_token).
4. Deploy the Worker and Pages frontend.

## Spotify OAuth Setup
- Follow the instructions in `/worker/spotify/README.md` to obtain a refresh token for your account.

## Deployment
- Use `wrangler.toml` for D1 binding and Worker deployment.
- Deploy frontend to Cloudflare Pages.

## iCal Feed
- Subscribe to `https://<your-domain>/api/calendar.ics` in Google Calendar, Apple Calendar, Outlook, etc.

## Requirements
- No UI component libraries, no raw SQL (use Drizzle ORM)
- TypeScript strict mode
- Conventional commits
- All money as integer pence, dates as ISO strings
