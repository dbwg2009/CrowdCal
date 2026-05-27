// Hono.js API routes for CrowdCal
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { getDb } from './db';
import { refreshAccessToken, getSpotifyUserId, createCollaborativePlaylist } from './spotify';
import { generateICal } from './calendar';
import { eq } from 'drizzle-orm';
import { events as eventsTable, rsvps as rsvpsTable } from '../db/schema';
import { Event, RSVP } from './types';

const api = new Hono();

// Event submission
api.post('/events', async (c) => {
  const db = getDb(c.env);
  const body = await c.req.json();
  const id = nanoid();
  const now = new Date().toISOString();
  // Create Spotify playlist
  let spotify_playlist_url = '';
  try {
    const accessToken = await refreshAccessToken(c.env as any);
    const userId = await getSpotifyUserId(accessToken);
    spotify_playlist_url = await createCollaborativePlaylist(accessToken, userId, body.name);
  } catch (e) {
    // Ignore Spotify errors, allow event creation
  }
  await db.insert(eventsTable).values({
    id,
    name: body.name,
    datetime: body.datetime,
    location: body.location,
    description: body.description,
    submitted_by: body.submitted_by,
    spotify_playlist_url,
    created_at: now,
  });
  return c.json({ id }, 201);
});

// RSVP submission
api.post('/events/:id/rsvp', async (c) => {
  const db = getDb(c.env);
  const event_id = c.req.param('id');
  const body = await c.req.json();
  const id = nanoid();
  const now = new Date().toISOString();
  await db.insert(rsvpsTable).values({
    id,
    event_id,
    name: body.name,
    created_at: now,
  });
  return c.json({ ok: true });
});

// Get iCal feed
api.get('/calendar.ics', async (c) => {
  const db = getDb(c.env);
  const events: Event[] = await db.select().from(eventsTable);
  const rsvps: RSVP[] = await db.select().from(rsvpsTable);
  const rsvpCounts: Record<string, number> = {};
  for (const rsvp of rsvps) {
    rsvpCounts[rsvp.event_id] = (rsvpCounts[rsvp.event_id] || 0) + 1;
  }
  const baseUrl = new URL(c.req.url).origin;
  const ical = generateICal(events, rsvpCounts, baseUrl);
  c.header('Content-Type', 'text/calendar');
  return c.body(ical);
});

// Get event details
api.get('/events/:id', async (c) => {
  const db = getDb(c.env);
  const event = await db.select().from(eventsTable).where(eq(eventsTable.id, c.req.param('id'))).get();
  if (!event) return c.notFound();
  const rsvps = await db.select().from(rsvpsTable).where(eq(rsvpsTable.event_id, event.id));
  return c.json({ event, rsvps });
});

// Spotify OAuth callback (one-time use to exchange code for refresh token)
api.get('/spotify/callback', async (c) => {
  try {
    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');
    if (!code) return c.text('missing code', 400);
    const redirectUri = `${url.origin}/api/spotify/callback`;
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', redirectUri);

    const auth = 'Basic ' + btoa(`${(c.env as any).SPOTIFY_CLIENT_ID}:${(c.env as any).SPOTIFY_CLIENT_SECRET}`);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text();
      return c.text(`token exchange failed: ${res.status} ${text}`, 500);
    }
    const data = await res.json();
    const refreshToken = data.refresh_token;
    if (!refreshToken) return c.text('no refresh_token returned', 500);
    return c.text(refreshToken);
  } catch (err) {
    return c.text('error during token exchange', 500);
  }
});

export default api;
