// TypeScript types for CrowdCal
export interface Event {
  id: string;
  name: string;
  datetime: string; // ISO yyyy-mm-dd string
  location?: string;
  description?: string;
  submitted_by: string;
  spotify_playlist_url?: string;
  created_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}
