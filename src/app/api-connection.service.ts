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

  public userId = null;
  public displayName = null;
  private api: SpotifyWebApi.SpotifyWebApiJs = null;

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

  public checkToken(): void {
    if (!this.hasValidToken) {
      this.requestRefreshToken().then();
    }
  }

  public async waitForApi(): Promise<SpotifyWebApi.SpotifyWebApiJs> {
    if (this.api == null) {
      if (!this.hasValidToken) {
        await this.requestRefreshToken();
      }
      this.refreshApi();
    }
    return Promise.resolve(this.api);
  }

  getApi(): SpotifyWebApi.SpotifyWebApiJs {
    if (this.api == null) {
      this.api = new SpotifyWebApi();
      this.api.setAccessToken(StorageService.accessToken);
      if (this.userId == null) {
        this.getMe();
      }
    }
    return this.api;
  }

  private getMe() {
    this.api.getMe()
      .then(value => {
        this.userId = value.id;
        this.displayName = value.display_name;
      })
      .catch(reason => {
        if (reason.status === 429) {
          setTimeout(() => this.getMe(), reason.getResponseHeader('Retry-After') * 1000);
        }
      });
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
      this.getMe();
    }
  }
}
