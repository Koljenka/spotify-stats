// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  APP_SETTINGS: {
    clientId: '7dc889b5812346ab848cadbe75a9d90f',
    clientSecret: '945d302ea7f24ca78caa5b55655cb862',
    clientName: 'Spotify Stats',
    redirectUri: 'http://localhost:4200/callback',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBasePath: 'https://api.spotify.com/v1',
    assetsBasePath: 'http://localhost:4200/assets/'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
