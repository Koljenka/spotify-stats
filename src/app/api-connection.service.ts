import {StorageService} from './storage.service';
import SpotifyWebApi from 'spotify-web-api-js';
import {Base64} from 'js-base64';

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {interval, Observable} from 'rxjs';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiConnectionService {


  get tokenUrl(): string {
    return environment.APP_SETTINGS.tokenUrl;
  }

  get authUrl(): string {
    return environment.APP_SETTINGS.authUrl;
  }

  get apiBasePath(): string {
    return environment.APP_SETTINGS.apiBasePath;
  }

  get redirectUrl(): string {
    return environment.APP_SETTINGS.redirectUri;
  }

  get clientId(): string {
    return environment.APP_SETTINGS.clientId;
  }

  get clientSecret(): string {
    return environment.APP_SETTINGS.clientSecret;
  }

  get clientName(): string {
    return environment.APP_SETTINGS.clientName;
  }

  interval: Observable<number>;

  private constructor(private http: HttpClient) {
    this.checkToken();
    if (this.interval === null || this.interval === undefined) {
      this.interval = interval(600000);
      this.interval.subscribe(() => {
        this.checkToken();
      });
    }
  }

  private api: SpotifyWebApi.SpotifyWebApiJs = null;

  public userId = null;

  getApi(): SpotifyWebApi.SpotifyWebApiJs {
    if (this.api == null) {
      this.api = new SpotifyWebApi();
      this.api.setAccessToken(StorageService.accessToken);
      this.api.getMe().then(value => this.userId = value.id);
    }

    return this.api;
  }

  private checkToken(): void {
    if (Date.now() >= StorageService.expiresAt) {
      this.requestRefreshToken();
    }
  }

  private requestRefreshToken(): void {
    const options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
        .append('Authorization', 'Basic ' + Base64.encode(this.clientId + ':' + this.clientSecret))
    };
    this.http.post('https://accounts.spotify.com/api/token', 'grant_type=refresh_token&refresh_token=' +
      StorageService.refreshToken, options).toPromise().then(response => {
      StorageService.expiresAt = Date.now() + 2940000;
      // @ts-ignore
      StorageService.accessToken = response.access_token;
    });
  }


}
