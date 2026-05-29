// Handles RSVP form and event details for CrowdCal event page
const eventId = new URLSearchParams(location.search).get('id');
const rsvpForm = document.getElementById('rsvp-form');
const rsvpResult = document.getElementById('rsvp-result');
const attendeeList = document.getElementById('attendee-list');
const CALENDAR_BASE = 'https://crowdcal-worker.dbwg2009.workers.dev/api/calendar.ics';

// Icon set for deterministic name-based assignment
const ICON_SET = ['🎸', '🎨', '🎭', '🎪', '🎲', '🎯', '🏆', '🎬', '🎤', '🎧', '🎮', '🚀', '🌟', '⚡', '🔥', '💎', '🌈', '🦄', '🐉', '🦋', '🍕', '🍦', '🌮', '🎂', '🍰', '🎉', '🎊', '🌺', '🌸', '🌻'];

// Deterministic hash function to map names to icons
function getIconForName(name) {
  if (!name) return '👤';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const index = Math.abs(hash) % ICON_SET.length;
  return ICON_SET[index];
}

async function loadEvent() {
  const res = await fetch(`https://crowdcal-worker.dbwg2009.workers.dev/api/events/${eventId}`);
  if (!res.ok) return;
  const { event, rsvps } = await res.json();
  allEventData = event;

  document.getElementById('event-name').textContent = event.name;

  // Display datetime with optional end time and duration
  const startDate = new Date(event.datetime);
  let datetimeText = startDate.toLocaleString();

  if (event.end_datetime) {
    const endDate = new Date(event.end_datetime);
    datetimeText += ` - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Calculate duration
    const durationMs = endDate - startDate;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    let durationText = '';
    if (hours > 0) durationText += `${hours}h`;
    if (minutes > 0) durationText += ` ${minutes}m`;

    document.getElementById('event-duration').classList.add('show');
    document.getElementById('duration-text').textContent = durationText || '0m';
  }

  document.getElementById('event-datetime').textContent = datetimeText;
  document.getElementById('event-location').textContent = event.location || 'TBA';
  document.getElementById('event-organizer').textContent = event.submitted_by;
  document.getElementById('event-description').textContent = event.description || 'No description provided';

  // Load saved RSVP name from cookie
  const savedName = getCookie('crowdcal_rsvp_name');
  if (savedName) {
    rsvpForm.elements['name'].value = savedName;
  }

  if (event.spotify_playlist_url) {
    document.getElementById('event-playlist').href = event.spotify_playlist_url;
    document.getElementById('event-playlist').style.display = 'inline-block';

    // Fetch playlist track count
    try {
      const playlistRes = await fetch(`https://crowdcal-worker.dbwg2009.workers.dev/api/events/${eventId}/playlist-info`);
      if (playlistRes.ok) {
        const playlistData = await playlistRes.json();
        console.log('Event page playlist data:', playlistData);
        if (playlistData.trackCount !== undefined) {
          const trackText = playlistData.trackCount === 1 ? '1 song' : `${playlistData.trackCount} songs`;
          const playlistLink = document.getElementById('event-playlist');
          playlistLink.textContent = `Open Playlist (${trackText})`;
        }
      }
    } catch (err) {
      console.error('Error fetching playlist info:', err);
    }
  } else {
    document.getElementById('event-playlist').parentElement.innerHTML = '<strong>🎵 Spotify Playlist:</strong><span>Not available</span>';
  }

  // Render attendees as cards
  const organizerIcon = getIconForName(event.submitted_by);
  const attendeeCards = [
    `<div class="chip">${organizerIcon} ${escapeHtml(event.submitted_by)} <span style="font-size: 0.8em;">(organizer)</span></div>`,
    ...rsvps.map(r => {
      const icon = getIconForName(r.name);
      return `<div class="chip">${icon} ${escapeHtml(r.name)}</div>`;
    })
  ];

  if (attendeeCards.length === 1 && rsvps.length === 0) {
    attendeeList.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No RSVPs yet. Be the first!</p>';
  } else {
    attendeeList.innerHTML = attendeeCards.join('');
  }

  // Update attendee summary with icons
  const summaryAttendees = [
    { name: event.submitted_by, icon: organizerIcon },
    ...rsvps.map(r => ({ name: r.name, icon: getIconForName(r.name) }))
  ];
  document.getElementById('attendee-summary').innerHTML = summaryAttendees
    .map(a => `<span title="${escapeHtml(a.name)}" style="cursor: help;">${a.icon}</span>`)
    .join('');

  // Set calendar ICS link
  document.getElementById('calendar-link').href = CALENDAR_BASE;
}

// Live icon preview as user types
const nameInput = rsvpForm.elements['name'];
const iconPreview = document.getElementById('icon-preview');

nameInput.addEventListener('input', (e) => {
  const name = e.target.value.trim();
  if (name) {
    const icon = getIconForName(name);
    iconPreview.textContent = `${icon} Your icon`;
    iconPreview.style.display = 'block';
  } else {
    iconPreview.style.display = 'none';
  }
});

rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  rsvpResult.textContent = '';
  rsvpResult.className = '';
  const name = rsvpForm.elements['name'].value;

  // Save name to cookie
  setCookie('crowdcal_rsvp_name', name, 365 * 10); // 10 years

  try {
    const res = await fetch(`https://crowdcal-worker.dbwg2009.workers.dev/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      rsvpForm.reset();
      // Restore the name in the field since we cleared it
      rsvpForm.elements['name'].value = name;
      rsvpResult.textContent = '✓ RSVP received! Thank you for confirming!';
      rsvpResult.classList.add('success');
      rsvpResult.style.display = 'block';
      loadEvent();
    } else {
      rsvpResult.textContent = 'Error submitting RSVP. Please try again.';
      rsvpResult.classList.add('error');
      rsvpResult.style.display = 'block';
    }
  } catch (err) {
    rsvpResult.textContent = 'Network error. Please check your connection.';
    rsvpResult.classList.add('error');
    rsvpResult.style.display = 'block';
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cookie utilities
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/;SameSite=Lax';
}

function getCookie(name) {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}


loadEvent();
