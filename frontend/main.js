// Handles event form submission for CrowdCal
const form = document.getElementById('event-form');
const result = document.getElementById('form-result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      form.reset();
      result.textContent = 'Event created!';
    } else {
      const err = await res.text();
      result.textContent = 'Error: ' + err;
    }
  } catch (err) {
    result.textContent = 'Network error.';
  }
});
