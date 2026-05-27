// Spotify integration for CrowdCal using native fetch (Cloudflare Workers compatible)
import { Env } from './types.js';

function basicAuth(clientId: string, clientSecret: string) {
  return 'Basic ' + btoa(`${clientId}:${clientSecret}`);
}

export async function refreshAccessToken(env: Env): Promise<string> {
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', env.SPOTIFY_REFRESH_TOKEN);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': basicAuth(env.SPOTIFY_CLIENT_ID, env.SPOTIFY_CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh Spotify token: ${res.status}`);
  }
  const data = await res.json() as any;
  return data.access_token as string;
}

export async function getSpotifyUserId(accessToken: string): Promise<string> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Spotify user');
  const data = await res.json() as any;
  return data.id as string;
}

export async function createCollaborativePlaylist(accessToken: string, userId: string, name: string): Promise<string> {
  const res = await fetch(`https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, collaborative: true, public: false }),
  });
  if (!res.ok) throw new Error(`Failed to create Spotify playlist: ${res.status}`);
  const data = await res.json() as any;
  return data.external_urls?.spotify as string;
}
