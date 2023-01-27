// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_SETTINGS: {
    clientId: '7dc889b5812346ab848cadbe75a9d90f',
    clientSecret: '',
    clientName: 'Spotify Stats',
    redirectUri: 'http://localhost:4200/callback',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBasePath: 'https://api.spotify.com/v1',
    assetsBasePath: 'http://localhost:4200/assets/',
    playbackApiBasePath: 'https://kolkie.de/spotify-playback-api',
    avgColorApiBasePath: 'https://kolkie.de/avg-color-api',
    unleashProxyUrl: 'https://kolkie.de/unleash-spotify/proxy',
    songStatApiBasePath: 'https://kolkie.de/spotify-stat-api'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
