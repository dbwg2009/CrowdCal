# Deployment Instructions

Follow these steps to deploy the latest changes to CrowdCal.

## 1. Set Admin Password Environment Variable

```bash
# Windows PowerShell
$env:ADMIN_PASSWORD = "your-secure-password"

# Linux/macOS
export ADMIN_PASSWORD="your-secure-password"
```

## 2. Deploy Worker

Deploy the backend worker with all the new endpoints:

```bash
cd worker && npx wrangler deploy
```

## 3. Build & Deploy Frontend

Build the config with your password, then deploy:

```bash
# Inject password into config (required before deploy)
node build-config.js

# Deploy frontend
npx wrangler pages deploy ./frontend
```

⚠️ **Important:** Always run `node build-config.js` before deploying. It injects your password from the `ADMIN_PASSWORD` environment variable.

## New Features Deployed

### 1. Spotify Playlist Naming
- All playlists now prefixed with "Event - "
- Description includes submitter name

### 2. Event Information
- Event page shows organizer/submitter name
- Organizer appears at top of attendee list

### 3. ICS Calendar Notifications
- iCalendar feed now includes alarm/notification components
- Two reminders per event:
  - 1 day before event
  - 15 minutes before event
- Works with any calendar app (Apple Calendar, Google Calendar, Outlook, etc.)
- Users subscribe once, notifications handled by calendar app

### 4. Admin Dashboard
- Access at `/admin.html`
- Password-protected (configured in admin.js)
- View all events in table format
- Delete events with confirmation
- View event statistics

### 5. New API Routes
- `GET /api/events` - List all events (for admin)
- `DELETE /api/events/:id` - Delete event

## Testing

1. **Test Spotify Integration**
   - Create an event
   - Verify playlist name has "Event - " prefix
   - Verify playlist description includes submitter name

2. **Test Event Display**
   - View event page
   - Verify organizer name is displayed
   - Verify organizer appears in attendee list

3. **Test ICS Notifications**
   - Subscribe to calendar feed in your calendar app:
     - URL: `https://crowdcal-worker.dbwg2009.workers.dev/api/calendar.ics`
   - Create a new event
   - Verify calendar app receives the update
   - Check that alarms are set for 1 day and 15 minutes before

4. **Test Admin Dashboard**
   - Visit `/admin.html`
   - Enter admin password
   - Verify all events are listed
   - Test delete event with confirmation
   - Verify statistics are correct

## Troubleshooting

### Calendar Notifications Not Showing
- Verify calendar app supports VALARM components
- Check calendar app notification settings
- Ensure calendar sync is enabled
- Try manually refreshing calendar subscription

### Admin Dashboard Not Loading
- Check browser console for fetch errors
- Verify API endpoint is accessible
- Ensure password is correct

### Spotify Playlist Not Created
- Check worker logs for Spotify API errors
- Verify Spotify credentials are set
- Ensure SPOTIFY_REFRESH_TOKEN is valid

## Notes

- Admin password is hardcoded (consider implementing proper authentication for production)
- Deleted events also delete associated RSVPs
- ICS feed automatically includes alarm components for all events
- No database migrations needed for this deployment
