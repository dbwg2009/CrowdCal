// iCal feed generation for CrowdCal
import { Event } from './types.js';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatDateTime(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeICal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function generateICal(events: Event[], rsvpCounts: Record<string, number>, baseUrl: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CrowdCal//EN',
    'CALSCALE:GREGORIAN',
  ];

  for (const event of events) {
    const eventUrl = `${baseUrl}/events/${event.id}`;
    const start = new Date(event.datetime);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const descriptionParts = [
      event.description || '',
      `RSVP: ${eventUrl}`,
      event.spotify_playlist_url ? `Spotify: ${event.spotify_playlist_url}` : '',
      `Attendees: ${rsvpCounts[event.id] || 0}`,
    ].filter(Boolean);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}`);
    lines.push(`DTSTAMP:${formatDateTime(new Date())}`);
    lines.push(`DTSTART:${formatDateTime(start)}`);
    lines.push(`DTEND:${formatDateTime(end)}`);
    lines.push(`SUMMARY:${escapeICal(event.name)}`);
    if (event.location) lines.push(`LOCATION:${escapeICal(event.location)}`);
    if (descriptionParts.length) lines.push(`DESCRIPTION:${escapeICal(descriptionParts.join('\n'))}`);
    lines.push(`URL:${eventUrl}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
