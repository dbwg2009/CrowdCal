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
    'X-WR-CALNAME:Salt>Caramel',
    'X-WR-CALDESC:Group calendar with community events',
    'X-WR-TIMEZONE:Europe/London',
  ];

  for (const event of events) {
    const eventUrl = `https://crowdcal.pages.dev/event.html?id=${event.id}`;
    // Parse datetime as Europe/London time (stored as local datetime without timezone)
    const match = event.datetime.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    const [, year, month, day, hours, minutes] = match || ['', '2000', '01', '01', '00', '00'];
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    // Subtract 1 hour to offset timezone display issue for existing calendar subscriptions
    start.setTime(start.getTime() - 60 * 60 * 1000);

    // Use end_datetime if provided, otherwise default to 2 hours after start
    let end: Date;
    if (event.end_datetime) {
      const endMatch = event.end_datetime.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      const [, endYear, endMonth, endDay, endHours, endMinutes] = endMatch || ['', '2000', '01', '01', '00', '00'];
      end = new Date(Number(endYear), Number(endMonth) - 1, Number(endDay), Number(endHours), Number(endMinutes));
      end.setTime(end.getTime() - 60 * 60 * 1000);
    } else {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
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
    lines.push(`SUMMARY:${escapeICal(event.name)} - Click to RSVP`);
    if (event.location) lines.push(`LOCATION:${escapeICal(event.location)}`);
    if (descriptionParts.length) lines.push(`DESCRIPTION:${escapeICal(descriptionParts.join('\n'))}`);
    lines.push(`URL:${eventUrl}`);

    // Add alarm for immediate notification when event is created
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('TRIGGER:PT0M');
    lines.push(`DESCRIPTION:New event: ${escapeICal(event.name)} added by ${escapeICal(event.submitted_by)}`);
    lines.push('END:VALARM');

    // Add alarm for notification 1 week before
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('TRIGGER:-P1W');
    lines.push(`DESCRIPTION:Upcoming: ${escapeICal(event.name)} is in 1 week`);
    lines.push('END:VALARM');

    // Add alarm for notification 1 day before
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('TRIGGER:-P1D');
    lines.push(`DESCRIPTION:Reminder: ${escapeICal(event.name)} is tomorrow`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
