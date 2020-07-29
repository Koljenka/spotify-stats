import {isDevMode} from '@angular/core';

export let APP_SETTINGS ={
  clientId: '7dc889b5812346ab848cadbe75a9d90f',
  clientSecret: '945d302ea7f24ca78caa5b55655cb862',
  clientName: 'Spotify Stats',
  redirectUri: isDevMode() ? 'http://localhost:4200/callback' : 'https://kolkie.de/spotify-stats/callback',
  authUrl: 'https://accounts.spotify.com/authorize',
  tokenUrl: 'https://accounts.spotify.com/api/token',
  apiBasePath: 'https://api.spotify.com/v1'
};
