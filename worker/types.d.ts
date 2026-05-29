// TypeScript types for CrowdCal
export interface Event {
  id: string;
  name: string;
  datetime: string; // ISO yyyy-mm-dd string
  end_datetime?: string | null; // Optional end time
  location?: string | null;
  description?: string | null;
  submitted_by: string;
  spotify_playlist_url?: string | null;
  created_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_REFRESH_TOKEN: string;
}
