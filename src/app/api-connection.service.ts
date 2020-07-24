import {TokenService} from './token.service';
import {APP_SETTINGS} from './settings';
import SpotifyWebApi from 'spotify-web-api-js';
import {Base64} from 'js-base64';

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiConnectionService {


  get tokenUrl(): string {
    return APP_SETTINGS.tokenUrl;
  }

  get authUrl(): string {
    return APP_SETTINGS.authUrl;
  }

  get apiBasePath(): string {
    return APP_SETTINGS.apiBasePath;
  }

  get redirectUrl(): string {
    return APP_SETTINGS.redirectUri;
  }

  get clientId(): string {
    return APP_SETTINGS.clientId;
  }

  get clientSecret(): string {
    return APP_SETTINGS.clientSecret;
  }

  get clientName(): string {
    return APP_SETTINGS.clientName;
  }

  private constructor(private http: HttpClient) {
  }

  private api: SpotifyWebApi.SpotifyWebApiJs = null;

  public userId = null;

  getApi(): SpotifyWebApi.SpotifyWebApiJs {
    if (this.api == null) {
      this.api = new SpotifyWebApi();
      this.api.setAccessToken(TokenService.accessToken);
      this.api.getMe().then(value => this.userId = value.id).catch(this.handleError);
    }

    return this.api;
  }

  handleError(reason: any): void {
    if (reason.status === 401) {
      this.requestRefreshToken();
    } else {
      console.log(reason.message);
    }
  }

  private requestRefreshToken(): void {
    const options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
        .append('Authorization', 'Basic ' + Base64.encode(this.clientId + ':' + this.clientSecret))
    };
    this.http.post('https://accounts.spotify.com/api/token', 'grant_type=refresh_token&refresh_token=' + TokenService.refreshToken, options).subscribe(value => {
      console.log(value);
    });
  }


}
