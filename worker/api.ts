// Hono.js API routes for CrowdCal
import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { getDb } from './db.js';
import { refreshAccessToken, getSpotifyUserId, createCollaborativePlaylist, deletePlaylist, updatePlaylistName } from './spotify.js';
import { generateICal } from './calendar.js';
import { eq } from 'drizzle-orm';
import { events as eventsTable, rsvps as rsvpsTable, icsLogs as icsLogsTable } from '../db/schema.js';
import { Event, RSVP, Env } from './types.js';
import { getPlaylistInfo } from './spotify.js';

const api = new Hono();

// Event submission
api.post('/events', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);
  const body = await c.req.json();
  const id = nanoid();
  const now = new Date().toISOString();
  // Create Spotify playlist
  let spotify_playlist_url = '';
  try {
    const accessToken = await refreshAccessToken(env);
    spotify_playlist_url = await createCollaborativePlaylist(accessToken, body.name, body.submitted_by);
  } catch (e) {
    console.error('Spotify error:', e);
  }
  await db.insert(eventsTable).values({
    id,
    name: body.name,
    datetime: body.datetime,
    end_datetime: body.end_datetime || null,
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
  const env = c.env as Env;
  const db = getDb(env);
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
  const env = c.env as Env;
  const db = getDb(env);

  // Log the access for subscriber tracking
  try {
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    await db.insert(icsLogsTable).values({
      id: nanoid(),
      ip_address: ipAddress,
      user_agent: userAgent,
      accessed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error logging ICS access:', err);
    // Don't fail the request if logging fails
  }

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

// Get all events
api.get('/events', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);
  const events: Event[] = await db.select().from(eventsTable);
  const rsvps: RSVP[] = await db.select().from(rsvpsTable);
  return c.json({ events, rsvps });
});

// Update event
api.patch('/events/:id', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);
  const eventId = c.req.param('id');
  const body = await c.req.json() as any;

  // Get current event for comparison
  const currentEvent: Event | undefined = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).get();
  if (!currentEvent) return c.notFound();

  // Update event fields
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.datetime !== undefined) updates.datetime = body.datetime;
  if (body.end_datetime !== undefined) updates.end_datetime = body.end_datetime;
  if (body.location !== undefined) updates.location = body.location;
  if (body.description !== undefined) updates.description = body.description;
  if (body.submitted_by !== undefined) updates.submitted_by = body.submitted_by;

  if (Object.keys(updates).length > 0) {
    await db.update(eventsTable).set(updates).where(eq(eventsTable.id, eventId));
  }

  // Update Spotify playlist if name changed
  if (body.name && body.name !== currentEvent.name && currentEvent.spotify_playlist_url) {
    try {
      const accessToken = await refreshAccessToken(env);
      await updatePlaylistName(accessToken, currentEvent.spotify_playlist_url, body.name, body.submitted_by || currentEvent.submitted_by);
    } catch (err) {
      console.error('Error updating Spotify playlist:', err);
    }
  }

  // Handle RSVP changes
  if (body.rsvps) {
    const currentRsvps = await db.select().from(rsvpsTable).where(eq(rsvpsTable.event_id, eventId));
    const currentRsvpNames = new Set(currentRsvps.map((r: any) => r.name));
    const newRsvpNames = new Set(body.rsvps.filter((name: string) => name.trim()));

    // Delete removed RSVPs
    for (const rsvp of currentRsvps) {
      if (!newRsvpNames.has(rsvp.name)) {
        await db.delete(rsvpsTable).where(eq(rsvpsTable.id, rsvp.id));
      }
    }

    // Add new RSVPs
    for (const name of newRsvpNames) {
      if (!currentRsvpNames.has(name)) {
        const id = nanoid();
        const now = new Date().toISOString();
        await db.insert(rsvpsTable).values({ id, event_id: eventId, name, created_at: now });
      }
    }
  }

  return c.json({ ok: true });
});

// Get event details
api.get('/events/:id', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);
  const event = await db.select().from(eventsTable).where(eq(eventsTable.id, c.req.param('id'))).get();
  if (!event) return c.notFound();
  const rsvps = await db.select().from(rsvpsTable).where(eq(rsvpsTable.event_id, event.id));
  return c.json({ event, rsvps });
});

// Delete event
api.delete('/events/:id', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);
  const eventId = c.req.param('id');

  // Get event details before deleting
  const event: Event | undefined = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).get();

  // Delete RSVPs first (foreign key constraint)
  await db.delete(rsvpsTable).where(eq(rsvpsTable.event_id, eventId));

  // Delete the event
  await db.delete(eventsTable).where(eq(eventsTable.id, eventId));

  // Delete Spotify playlist if requested
  try {
    const body = await c.req.json() as any;
    if (body.deletePlaylist && event?.spotify_playlist_url) {
      const accessToken = await refreshAccessToken(env);
      await deletePlaylist(accessToken, event.spotify_playlist_url);
    }
  } catch (err) {
    console.error('Error deleting playlist:', err);
    // Don't fail the entire request if playlist deletion fails
  }

  return c.json({ ok: true });
});

// Get playlist info (track count, etc.)
api.get('/events/:id/playlist-info', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);
  const eventId = c.req.param('id');

  try {
    const event: Event | undefined = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId)).get();
    if (!event || !event.spotify_playlist_url) {
      return c.json({ error: 'Playlist not found' }, 404);
    }

    const accessToken = await refreshAccessToken(env);
    const playlistInfo = await getPlaylistInfo(accessToken, event.spotify_playlist_url);

    if (playlistInfo) {
      return c.json(playlistInfo);
    } else {
      return c.json({ error: 'Could not fetch playlist info' }, 500);
    }
  } catch (err) {
    console.error('Error fetching playlist info:', err);
    return c.json({ error: 'Error fetching playlist info' }, 500);
  }
});

// Get subscriber statistics
api.get('/stats/subscribers', async (c) => {
  const env = c.env as Env;
  const db = getDb(env);

  try {
    const logs: any[] = await db.select().from(icsLogsTable);

    // Group by IP + user-agent to identify unique subscribers
    const subscribers = new Map<string, { lastAccess: string; count: number }>();

    for (const log of logs) {
      const key = `${log.ip_address}||${log.user_agent}`;
      const existing = subscribers.get(key) || { lastAccess: log.accessed_at, count: 0 };
      existing.count += 1;
      if (new Date(log.accessed_at) > new Date(existing.lastAccess)) {
        existing.lastAccess = log.accessed_at;
      }
      subscribers.set(key, existing);
    }

    // Convert to array and sort by last access
    const subscriberList = Array.from(subscribers.entries()).map(([key, data]) => {
      const [ipAddress, userAgent] = key.split('||');
      return {
        ipAddress,
        userAgent,
        lastAccess: data.lastAccess,
        accessCount: data.count,
      };
    }).sort((a, b) => new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime());

    return c.json({
      totalUniqueSubscribers: subscriberList.length,
      totalAccesses: logs.length,
      subscribers: subscriberList,
    });
  } catch (err) {
    console.error('Error fetching subscriber stats:', err);
    return c.json({ error: 'Failed to fetch subscriber stats' }, 500);
  }
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

    const env = c.env as Env;
    const auth = 'Basic ' + btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
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
    const data = await res.json() as any;
    const refreshToken = data.refresh_token as string | undefined;
    if (!refreshToken) return c.text('no refresh_token returned', 500);
    return c.text(refreshToken);
  } catch (err) {
    return c.text('error during token exchange', 500);
  }
});

export default api;
