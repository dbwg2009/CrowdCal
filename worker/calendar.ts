// iCal feed generation for CrowdCal
import ical, { ICalEventData } from 'ical-generator';
import { Event, RSVP } from './types';

export function generateICal(events: Event[], rsvpCounts: Record<string, number>): string {
  const cal = ical({ name: 'CrowdCal Events' });
  for (const event of events) {
    cal.createEvent({
      id: event.id,
      start: new Date(event.datetime),
      end: new Date(new Date(event.datetime).getTime() + 2 * 60 * 60 * 1000), // 2h default
      summary: event.name,
      location: event.location,
      description: [
        event.description || '',
        `RSVP: https://<your-domain>/events/${event.id}`,
        event.spotify_playlist_url ? `Spotify: ${event.spotify_playlist_url}` : '',
        `Attendees: ${rsvpCounts[event.id] || 0}`
      ].filter(Boolean).join('\n'),
      url: `https://<your-domain>/events/${event.id}`,
    } as ICalEventData);
  }
  return cal.toString();
}
