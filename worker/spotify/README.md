# Spotify OAuth Setup for CrowdCal

CrowdCal uses the Spotify Authorization Code flow with a refresh token. You only need to do this once; your account will own all event playlists.

## Steps
1. Go to the Spotify Developer Dashboard and create an app.
2. Set the Redirect URI to a local endpoint (e.g., http://localhost:8787/api/spotify/callback).
3. Note your Client ID and Client Secret.
4. Use a tool like curl or Postman to perform the OAuth flow and obtain a refresh token.
5. Add your `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN` to `.dev.vars` and Cloudflare secrets.

See https://developer.spotify.com/documentation/web-api/tutorials/code-flow for details.