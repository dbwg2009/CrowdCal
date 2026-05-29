// Handles event form submission for CrowdCal
const form = document.getElementById('event-form');
const result = document.getElementById('form-result');
const API_BASE = 'https://crowdcal-worker.dbwg2009.workers.dev/api';
const EVENT_BASE = 'https://crowdcal.pages.dev/event.html?id=';

let lastCreatedEventId = null;

function setDuration(minutes) {
  const startTime = document.getElementById('start-time').value;
  if (!startTime) {
    alert('Please set a start time first');
    return;
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + minutes * 60 * 1000);

  const year = end.getFullYear();
  const month = String(end.getMonth() + 1).padStart(2, '0');
  const day = String(end.getDate()).padStart(2, '0');
  const hours = String(end.getHours()).padStart(2, '0');
  const mins = String(end.getMinutes()).padStart(2, '0');

  document.getElementById('end-time').value = `${year}-${month}-${day}T${hours}:${mins}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const eventData = await res.json();
      lastCreatedEventId = eventData.id;
      showSuccessState(eventData.id);
    } else {
      const err = await res.text();
      showError('Error: ' + err);
    }
  } catch (err) {
    showError('Network error.');
  }
});

function showSuccessState(eventId) {
  document.getElementById('form-container').style.display = 'none';
  document.getElementById('success-container').style.display = 'block';

  const eventLink = `${EVENT_BASE}${eventId}`;
  document.getElementById('success-link').textContent = eventLink;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copySuccessLink() {
  const link = document.getElementById('success-link').textContent;
  navigator.clipboard.writeText(link).then(() => {
    alert('Event link copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy link');
  });
}

function openSuccessEvent() {
  const eventLink = `${EVENT_BASE}${lastCreatedEventId}`;
  window.open(eventLink, '_blank');
}

function shareSuccessEvent() {
  const eventLink = `${EVENT_BASE}${lastCreatedEventId}`;
  const title = document.querySelector('input[name="name"]').value;

  if (navigator.share) {
    navigator.share({
      title: 'CrowdCal - ' + title,
      text: 'Check out this event and RSVP!',
      url: eventLink,
    }).catch(() => {
      // Share API not available, fallback to copy
      navigator.clipboard.writeText(eventLink);
      alert('Link copied! Share it however you like.');
    });
  } else {
    navigator.clipboard.writeText(eventLink);
    alert('Link copied! Share it however you like.');
  }
}

function viewCalendar() {
  window.location.href = 'https://crowdcal.pages.dev/';
}

function createAnother() {
  document.getElementById('form-container').style.display = 'block';
  document.getElementById('success-container').style.display = 'none';
  form.reset();
  lastCreatedEventId = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
  result.textContent = message;
  result.classList.add('error');
  result.style.display = 'block';
}
