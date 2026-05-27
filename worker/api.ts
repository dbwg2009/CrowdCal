// Hono.js API routes for CrowdCal
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { getDb } from './db';
import { getSpotifyApi, refreshAccessToken, createCollaborativePlaylist } from './spotify';
import { generateICal } from './calendar';
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
    const apiClient = getSpotifyApi();
    await refreshAccessToken(apiClient);
    spotify_playlist_url = await createCollaborativePlaylist(apiClient, body.name);
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
  const ical = generateICal(events, rsvpCounts);
  c.header('Content-Type', 'text/calendar');
  return c.body(ical);
});

// Get event details
api.get('/events/:id', async (c) => {
  const db = getDb(c.env);
  const event = await db.select().from(eventsTable).where(eventsTable.id.eq(c.req.param('id'))).get();
  if (!event) return c.notFound();
  const rsvps = await db.select().from(rsvpsTable).where(rsvpsTable.event_id.eq(event.id));
  return c.json({ event, rsvps });
});

export default api;
