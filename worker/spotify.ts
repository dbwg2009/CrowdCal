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

export async function createCollaborativePlaylist(accessToken: string, name: string, submittedBy: string): Promise<string> {
  const playlistName = `Event - ${name}`;
  const playlistDescription = `Added by ${submittedBy} via CrowdCal`;
  const res = await fetch(`https://api.spotify.com/v1/me/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: playlistName, description: playlistDescription, collaborative: true, public: false }),
  });
  if (!res.ok) throw new Error(`Failed to create Spotify playlist: ${res.status}`);
  const data = await res.json() as any;
  return data.external_urls?.spotify as string;
}

export async function deletePlaylist(accessToken: string, playlistUrl: string): Promise<void> {
  // Extract playlist ID from URL (format: https://open.spotify.com/playlist/PLAYLIST_ID)
  const playlistId = playlistUrl.split('/playlist/')[1]?.split('?')[0];
  if (!playlistId) {
    console.error('Could not extract playlist ID from URL:', playlistUrl);
    return;
  }

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    console.error(`Failed to delete Spotify playlist: ${res.status}`);
  }
}

export async function updatePlaylistName(accessToken: string, playlistUrl: string, newName: string, submittedBy: string): Promise<void> {
  // Extract playlist ID from URL
  const playlistId = playlistUrl.split('/playlist/')[1]?.split('?')[0];
  if (!playlistId) {
    console.error('Could not extract playlist ID from URL:', playlistUrl);
    return;
  }

  const newPlaylistName = `Event - ${newName}`;
  const newDescription = `Added by ${submittedBy} via CrowdCal`;

  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newPlaylistName, description: newDescription }),
  });

  if (!res.ok) {
    console.error(`Failed to update Spotify playlist: ${res.status}`);
  }
}

export async function getPlaylistInfo(accessToken: string, playlistUrl: string): Promise<{ trackCount: number } | null> {
  try {
    // Extract playlist ID from URL
    const playlistId = playlistUrl.split('/playlist/')[1]?.split('?')[0];
    if (!playlistId) {
      console.error('Could not extract playlist ID from URL:', playlistUrl);
      return null;
    }

    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch Spotify playlist info: ${res.status}`);
      const errorText = await res.text();
      console.error('Error response:', errorText);
      return null;
    }

    const data = await res.json() as any;
    // Spotify API returns items.total for the track count
    const trackCount = data.items?.total ?? 0;
    console.log(`Fetched playlist ${playlistId}: ${trackCount} tracks`);
    return {
      trackCount,
    };
  } catch (err) {
    console.error('Error fetching playlist info:', err);
    return null;
  }
}
