// Admin dashboard for CrowdCal
// Configuration is loaded from config.js (APP_CONFIG)
const ADMIN_PASSWORD = APP_CONFIG.ADMIN_PASSWORD;
const API_BASE = APP_CONFIG.API_BASE;
const EVENT_BASE = APP_CONFIG.EVENT_BASE;

let currentEventId = null;
let allEvents = [];
let allRsvps = [];

function initializeLogin() {
  const savedPassword = localStorage.getItem('crowdcal_admin_password');
  if (savedPassword) {
    document.getElementById('password').value = savedPassword;
    document.getElementById('remember-password').checked = true;
  }
}

function login() {
  const password = document.getElementById('password').value;
  if (password === ADMIN_PASSWORD) {
    const rememberPassword = document.getElementById('remember-password').checked;
    if (rememberPassword) {
      localStorage.setItem('crowdcal_admin_password', password);
    } else {
      localStorage.removeItem('crowdcal_admin_password');
    }
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadData();
  } else {
    alert('Invalid password');
  }
}

function logout() {
  const rememberPassword = document.getElementById('remember-password').checked;
  if (!rememberPassword) {
    localStorage.removeItem('crowdcal_admin_password');
  }
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('password').value = '';
}

async function loadData() {
  try {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) {
      alert('Error loading events: ' + res.status);
      return;
    }

    const data = await res.json();
    allEvents = data.events || [];
    allRsvps = data.rsvps || [];

    // Load subscriber stats
    try {
      const statsRes = await fetch(`${API_BASE}/stats/subscribers`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        window.subscriberStats = statsData;
      }
    } catch (err) {
      console.error('Error loading subscriber stats:', err);
    }

    updateDashboard();
  } catch (err) {
    console.error('Error loading data:', err);
    alert('Error loading data: ' + err.message);
  }
}

function updateDashboard() {
  // Update stats
  document.getElementById('event-count').textContent = allEvents.length;
  document.getElementById('rsvp-count').textContent = allRsvps.length;
  if (window.subscriberStats) {
    document.getElementById('subscriber-count').textContent = window.subscriberStats.totalUniqueSubscribers;
  }

  // Update table
  const tbody = document.getElementById('events-tbody');
  tbody.innerHTML = '';

  for (const event of allEvents) {
    const rsvpCount = allRsvps.filter(r => r.event_id === event.id).length;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(event.name)}</td>
      <td>${event.datetime}</td>
      <td>${escapeHtml(event.location || '')}</td>
      <td>${escapeHtml(event.submitted_by)}</td>
      <td>${rsvpCount}</td>
      <td>${event.spotify_playlist_url ? `<a href="${event.spotify_playlist_url}" target="_blank" style="color: var(--primary);">Open</a>` : '-'}</td>
      <td><button type="button" class="btn btn-small btn-outline" onclick="viewEventPreview('${event.id}', '${escapeHtml(event.name).replace(/'/g, "\\'")}')">View</button></td>
      <td>
        <div class="action-buttons">
          <button type="button" class="btn btn-small" onclick="viewRsvps('${event.id}', '${escapeHtml(event.name).replace(/'/g, "\\'")}')">RSVPs</button>
          <button type="button" class="btn btn-small btn-secondary" onclick="editEvent('${event.id}')">Edit</button>
          <button type="button" class="btn btn-small btn-danger" onclick="deleteEvent('${event.id}')">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  }

  // Update subscribers table
  updateSubscribersTable();
}

function updateSubscribersTable() {
  const tbody = document.getElementById('subscribers-tbody');
  tbody.innerHTML = '';

  if (!window.subscriberStats || !window.subscriberStats.subscribers) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No subscribers yet</td></tr>';
    return;
  }

  for (const subscriber of window.subscriberStats.subscribers) {
    const row = document.createElement('tr');
    const lastAccess = new Date(subscriber.lastAccess).toLocaleString();
    const appName = subscriber.userAgent.includes('Google') ? 'Google Calendar'
      : subscriber.userAgent.includes('Apple') ? 'Apple Calendar'
      : subscriber.userAgent.includes('Outlook') ? 'Outlook'
      : subscriber.userAgent.includes('Mozilla') ? 'Web Browser'
      : 'Calendar App';

    row.innerHTML = `
      <td>${escapeHtml(subscriber.ipAddress)}</td>
      <td>${escapeHtml(appName)}</td>
      <td>${lastAccess}</td>
      <td>${subscriber.accessCount}</td>
    `;
    tbody.appendChild(row);
  }
}

async function viewEventPreview(eventId, eventName) {
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;

  currentEventId = eventId;
  document.getElementById('preview-event-name').textContent = eventName;
  document.getElementById('preview-datetime').textContent = new Date(event.datetime).toLocaleString();
  document.getElementById('preview-location').textContent = event.location || '-';
  document.getElementById('preview-organizer').textContent = event.submitted_by;
  document.getElementById('preview-description').innerHTML = renderMarkdown(event.description);
  if (event.spotify_playlist_url) {
    // Fetch playlist info
    try {
      const playlistRes = await fetch(`${API_BASE}/events/${eventId}/playlist-info`);
      if (playlistRes.ok) {
        const playlistData = await playlistRes.json();
        console.log('Playlist data:', playlistData);
        if (playlistData.trackCount !== undefined) {
          const trackText = playlistData.trackCount === 1 ? '1 song' : `${playlistData.trackCount} songs`;
          document.getElementById('preview-spotify').innerHTML =
            `<a href="${event.spotify_playlist_url}" target="_blank" style="color: var(--primary);">Open Playlist</a> <small style="color: var(--text-secondary);">(${trackText})</small>`;
        } else {
          document.getElementById('preview-spotify').innerHTML =
            `<a href="${event.spotify_playlist_url}" target="_blank" style="color: var(--primary);">Open Playlist</a>`;
        }
      } else {
        console.error('Playlist info fetch failed:', playlistRes.status);
        document.getElementById('preview-spotify').innerHTML =
          `<a href="${event.spotify_playlist_url}" target="_blank" style="color: var(--primary);">Open Playlist</a>`;
      }
    } catch (err) {
      console.error('Error fetching playlist info:', err);
      document.getElementById('preview-spotify').innerHTML =
        `<a href="${event.spotify_playlist_url}" target="_blank" style="color: var(--primary);">Open Playlist</a>`;
    }
  } else {
    document.getElementById('preview-spotify').innerHTML = '-';
  }

  const eventLink = `${EVENT_BASE}${eventId}`;
  document.getElementById('preview-link-text').textContent = eventLink;

  document.getElementById('event-preview-modal').classList.add('active');
}

function closeEventPreview() {
  document.getElementById('event-preview-modal').classList.remove('active');
  currentEventId = null;
}

function copyEventLink() {
  const linkText = document.getElementById('preview-link-text').textContent;
  navigator.clipboard.writeText(linkText).then(() => {
    alert('Event link copied to clipboard!');
  }).catch(() => {
    alert('Failed to copy link');
  });
}

function openEventInNewTab() {
  const eventLink = `${EVENT_BASE}${currentEventId}`;
  window.open(eventLink, '_blank');
}

function editEvent(eventId) {
  currentEventId = eventId;
  const event = allEvents.find(e => e.id === eventId);
  if (!event) return;

  document.getElementById('modal-title').textContent = 'Edit Event';
  document.getElementById('modal-name').value = event.name;
  document.getElementById('modal-datetime').value = formatDatetimeLocal(event.datetime);
  document.getElementById('modal-end-datetime').value = event.end_datetime ? formatDatetimeLocal(event.end_datetime) : '';
  document.getElementById('modal-location').value = event.location || '';
  document.getElementById('modal-description').value = event.description || '';
  document.getElementById('modal-submitted-by').value = event.submitted_by;

  // Load RSVPs
  const eventRsvps = allRsvps.filter(r => r.event_id === eventId);
  const rsvpsContainer = document.getElementById('rsvps-container');
  rsvpsContainer.innerHTML = '';
  for (const rsvp of eventRsvps) {
    const div = document.createElement('div');
    div.className = 'rsvp-item';
    div.innerHTML = `
      <input type="text" value="${escapeHtml(rsvp.name)}">
      <button type="button" class="btn btn-small btn-danger" onclick="this.parentElement.remove()">Remove</button>
    `;
    rsvpsContainer.appendChild(div);
  }

  document.getElementById('event-modal').classList.add('active');
}

function setEditDuration(minutes) {
  const startDatetime = document.getElementById('modal-datetime').value;
  if (!startDatetime) return;

  const startDate = new Date(startDatetime);
  const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);

  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  const hours = String(endDate.getHours()).padStart(2, '0');
  const mins = String(endDate.getMinutes()).padStart(2, '0');

  document.getElementById('modal-end-datetime').value = `${year}-${month}-${day}T${hours}:${mins}`;
}

function addRsvpField() {
  const rsvpsContainer = document.getElementById('rsvps-container');
  const div = document.createElement('div');
  div.className = 'rsvp-item';
  div.innerHTML = `
    <input type="text" placeholder="Guest name">
    <button type="button" class="btn btn-small btn-danger" onclick="this.parentElement.remove()">Remove</button>
  `;
  rsvpsContainer.appendChild(div);
}

function closeModal() {
  document.getElementById('event-modal').classList.remove('active');
  currentEventId = null;
}

function deleteEvent(eventId) {
  currentEventId = eventId;
  document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('active');
  currentEventId = null;
}

async function confirmDelete() {
  if (!currentEventId) return;

  const deletePlaylist = document.getElementById('delete-playlist-checkbox').checked;
  const event = allEvents.find(e => e.id === currentEventId);

  try {
    const res = await fetch(`${API_BASE}/events/${currentEventId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deletePlaylist: deletePlaylist,
        playlistUrl: event?.spotify_playlist_url || '',
      }),
    });

    if (res.ok) {
      closeDeleteModal();
      allEvents = allEvents.filter(e => e.id !== currentEventId);
      allRsvps = allRsvps.filter(r => r.event_id !== currentEventId);
      updateDashboard();
      alert('Event deleted successfully');
    } else {
      alert('Error deleting event');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function saveEvent(e) {
  e.preventDefault();

  if (!currentEventId) return;

  const name = document.getElementById('modal-name').value;
  const datetime = document.getElementById('modal-datetime').value;
  const end_datetime = document.getElementById('modal-end-datetime').value.trim() || null;
  const location = document.getElementById('modal-location').value;
  const description = document.getElementById('modal-description').value;
  const submitted_by = document.getElementById('modal-submitted-by').value;

  // Collect RSVPs from the modal
  const rsvpInputs = document.querySelectorAll('#rsvps-container input[type="text"]');
  const rsvps = [];
  rsvpInputs.forEach(input => {
    const value = input.value.trim();
    if (value) rsvps.push(value);
  });

  try {
    const res = await fetch(`${API_BASE}/events/${currentEventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        datetime,
        end_datetime,
        location,
        description,
        submitted_by,
        rsvps,
      }),
    });

    if (res.ok) {
      closeModal();
      loadData();
      alert('Event updated successfully');
    } else {
      alert('Error updating event');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function viewRsvps(eventId, eventName) {
  currentEventId = eventId;
  document.getElementById('rsvp-event-name').textContent = eventName;
  renderRsvpList();
  document.getElementById('rsvp-modal').classList.add('active');
}

function renderRsvpList() {
  const eventRsvps = allRsvps.filter(r => r.event_id === currentEventId);
  const rsvpsList = document.getElementById('rsvps-list');
  const noRsvpsMessage = document.getElementById('no-rsvps-message');

  if (eventRsvps.length === 0) {
    rsvpsList.innerHTML = '';
    noRsvpsMessage.style.display = 'block';
  } else {
    noRsvpsMessage.style.display = 'none';
    rsvpsList.innerHTML = eventRsvps.map(rsvp => {
      const rsvpDate = new Date(rsvp.created_at);
      const formattedTime = rsvpDate.toLocaleDateString() + ' ' + rsvpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="rsvp-item">
          <div>
            <strong>${escapeHtml(rsvp.name)}</strong>
            <small>RSVP'd ${formattedTime}</small>
          </div>
        </div>
      `;
    }).join('');
  }
}

function closeRsvpModal() {
  document.getElementById('rsvp-modal').classList.remove('active');
  currentEventId = null;
}

async function refreshRsvpData() {
  await loadData();
  renderRsvpList();
}

async function refreshAllData() {
  await loadData();
}

function exportRsvpCsv() {
  const event = allEvents.find(e => e.id === currentEventId);
  if (!event) return;

  const eventRsvps = allRsvps.filter(r => r.event_id === currentEventId);
  let csv = 'Name,Date & Time RSVPd\n';
  for (const rsvp of eventRsvps) {
    const rsvpDate = new Date(rsvp.created_at);
    const formattedTime = rsvpDate.toLocaleDateString() + ' ' + rsvpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    csv += `"${rsvp.name.replace(/"/g, '""')}","${formattedTime}"\n`;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${event.name}-rsvps.csv`);
  link.click();
  URL.revokeObjectURL(url);
}

function exportRsvpPdf() {
  const event = allEvents.find(e => e.id === currentEventId);
  if (!event) return;

  const eventRsvps = allRsvps.filter(r => r.event_id === currentEventId);

  let pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<<>>/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 600>>stream
BT
/F1 12 Tf
50 750 Td
(${event.name} - RSVP List) Tj
0 -20 Td
(Date Generated: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
`;

  let yPos = 690;
  for (const rsvp of eventRsvps) {
    const rsvpDate = new Date(rsvp.created_at);
    const formattedTime = rsvpDate.toLocaleDateString() + ' ' + rsvpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    pdfContent += `(- ${rsvp.name} - ${formattedTime}) Tj\n0 -15 Td\n`;
  }

  pdfContent += `ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer<</Size 5/Root 1 0 R>>
startxref
815
%%EOF`;

  const blob = new Blob([pdfContent], { type: 'application/pdf' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${event.name}-rsvps.pdf`);
  link.click();
  URL.revokeObjectURL(url);
}

function printRsvpList() {
  const event = allEvents.find(e => e.id === currentEventId);
  if (!event) return;

  const eventRsvps = allRsvps.filter(r => r.event_id === currentEventId);

  let printContent = `<html><head><title>${event.name} - RSVP List</title></head><body>`;
  printContent += `<h1>${event.name}</h1>`;
  printContent += `<p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>`;
  printContent += `<h2>RSVPs (${eventRsvps.length})</h2><ul>`;

  for (const rsvp of eventRsvps) {
    const rsvpDate = new Date(rsvp.created_at);
    const formattedTime = rsvpDate.toLocaleDateString() + ' ' + rsvpDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    printContent += `<li>${escapeHtml(rsvp.name)} - ${formattedTime}</li>`;
  }

  printContent += `</ul></body></html>`;

  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

function formatDatetimeLocal(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(text) {
  if (!text) return '<p>No description provided</p>';
  const html = marked.parse(text);
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'] });
}

// Initialize page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
  initializeLogin();
}
