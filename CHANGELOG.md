# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Spotify playlist naming: All playlists now prefixed with "Event - " followed by event name
- Spotify playlist description: Includes submitter name ("Added by {name} via CrowdCal")
- Event organizer display: Shows submitter name as organizer on event page
- Event organizer in attendee list: Organizer appears at top of RSVP list
- ICS calendar notifications: VALARM components added to iCalendar feed for automatic notifications
  - 1 day before event notification
  - 15 minutes before event notification
  - Works with any calendar app (Apple Calendar, Google Calendar, Outlook, etc.)
- Admin dashboard: New admin interface at `/admin.html` with password protection
- Admin features:
  - View all events in a table with full details
  - Delete events with confirmation dialog
  - View event attendee count and creation date
  - Display total event and RSVP statistics
  - Manage RSVPs per event
- New API routes:
  - `GET /api/events` - List all events with RSVPs (for admin dashboard)
  - `DELETE /api/events/:id` - Delete an event and its RSVPs

### Changed
- CORS configuration updated to allow DELETE method
- Event page now displays organizer information
- iCalendar feed now includes alarm/notification components

### Technical Details
- New files: `frontend/admin.html`, `frontend/admin.js`
- Admin password: Hardcoded for now, configurable in `frontend/admin.js`
- Calendar generation now includes VALARM components with DISPLAY action
