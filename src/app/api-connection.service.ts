import {StorageService} from './storage.service';
import SpotifyWebApi from 'spotify-web-api-js';

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../environments/environment';
import {Base64} from 'js-base64';

@Injectable({
  providedIn: 'root',
})
export class ApiConnectionService {

  private constructor(private http: HttpClient) {
  }

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

  private get hasValidToken(): boolean {
    return StorageService.accessToken != null && Date.now() < StorageService.expiresAt;
  }

  private api: SpotifyWebApi.SpotifyWebApiJs = null;

  public userId = null;

  public checkToken(): void {
    if (!this.hasValidToken) {
      this.requestRefreshToken();
    }
  }

  public async waitForApi(): Promise<SpotifyWebApi.SpotifyWebApiJs> {
    if (this.api == null || !this.hasValidToken) {
      await this.requestRefreshToken();
    }
    return Promise.resolve(this.api);
  }

  private async requestRefreshToken(): Promise<void> {
    const opt = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
        .append('Authorization', 'Basic ' + Base64.encode(this.clientId + ':' + this.clientSecret))
    };
    return this.http.post('https://accounts.spotify.com/api/token', 'grant_type=refresh_token&refresh_token=' +
      StorageService.refreshToken, opt).toPromise().then(response => {
      StorageService.expiresAt = Date.now() + 2400000;
      // @ts-ignore
      StorageService.accessToken = response.access_token;
      this.refreshApi();
    });
  }

  private refreshApi(): void {
    if (this.api == null) {
      this.api = new SpotifyWebApi();
    }
    this.api.setAccessToken(StorageService.accessToken);
    if (this.userId == null) {
      this.api.getMe().then(value => this.userId = value.id);
    }
  }

  getApi(): SpotifyWebApi.SpotifyWebApiJs {
    if (this.api == null) {
      this.api = new SpotifyWebApi();
      this.api.setAccessToken(StorageService.accessToken);
      if (this.userId == null) {
        this.api.getMe().then(value => this.userId = value.id);
      }
    }
    return this.api;
  }
}
