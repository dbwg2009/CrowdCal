const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || '';

// Step 1: refresh token
console.log('--- Refreshing access token...');
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN,
  }).toString(),
});

const tokenData = await tokenRes.json();
console.log('Token response status:', tokenRes.status);
console.log('Token response:', JSON.stringify(tokenData, null, 2));

if (!tokenRes.ok) process.exit(1);
const accessToken = tokenData.access_token;

// Step 2: get user ID
console.log('\n--- Getting Spotify user...');
const meRes = await fetch('https://api.spotify.com/v1/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});
const meData = await meRes.json();
console.log('Me response status:', meRes.status);
console.log('Me response:', JSON.stringify(meData, null, 2));

if (!meRes.ok) process.exit(1);
const userId = meData.id;

// Step 3: create playlist
console.log('\n--- Creating playlist...');
const playlistRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'CrowdCal Test', collaborative: false, public: true }),
});
const playlistData = await playlistRes.json();
console.log('Playlist response status:', playlistRes.status);
console.log('Playlist response:', JSON.stringify(playlistData, null, 2));