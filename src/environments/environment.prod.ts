export const environment = {
  production: true,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_SETTINGS: {
    clientId: '7dc889b5812346ab848cadbe75a9d90f',
    clientSecret: '945d302ea7f24ca78caa5b55655cb862',
    clientName: 'Spotify Stats',
    redirectUri: 'https://kolkie.de/spotify-stats/callback',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBasePath: 'https://api.spotify.com/v1',
    assetsBasePath: 'https://kolkie.de/spotify-stats/assets/',
    playbackApiBasePath: 'https://kolkie.de/spotify-playback-api',
    avgColorApiBasePath: 'https://kolkie.de/avg-color-api'
  }
};
