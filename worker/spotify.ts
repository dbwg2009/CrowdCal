// Spotify integration for CrowdCal
import SpotifyWebApi from 'spotify-web-api-node';

export function getSpotifyApi() {
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8787/api/spotify/callback',
  });
}

export async function refreshAccessToken(api: SpotifyWebApi) {
  api.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN!);
  const data = await api.refreshAccessToken();
  api.setAccessToken(data.body.access_token);
}

export async function createCollaborativePlaylist(api: SpotifyWebApi, name: string) {
  const me = await api.getMe();
  const playlist = await api.createPlaylist(me.body.id, name, { collaborative: true, public: false });
  return playlist.body.external_urls.spotify;
}
