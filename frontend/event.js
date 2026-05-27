// Handles RSVP form and event details for CrowdCal event page
const eventId = location.pathname.split('/').pop();
const rsvpForm = document.getElementById('rsvp-form');
const rsvpResult = document.getElementById('rsvp-result');
const attendeeList = document.getElementById('attendee-list');

async function loadEvent() {
  const res = await fetch(`/api/events/${eventId}`);
  if (!res.ok) return;
  const { event, rsvps } = await res.json();
  document.getElementById('event-name').textContent = event.name;
  document.getElementById('event-datetime').textContent = event.datetime;
  document.getElementById('event-location').textContent = event.location || '';
  document.getElementById('event-description').textContent = event.description || '';
  document.getElementById('event-playlist').href = event.spotify_playlist_url || '#';
  attendeeList.innerHTML = rsvps.map(r => `<li>${r.name}</li>`).join('');
}

rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  rsvpResult.textContent = '';
  const name = rsvpForm.elements['name'].value;
  const res = await fetch(`/api/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (res.ok) {
    rsvpForm.reset();
    rsvpResult.textContent = 'RSVP received!';
    loadEvent();
  } else {
    rsvpResult.textContent = 'Error submitting RSVP.';
  }
});

loadEvent();
