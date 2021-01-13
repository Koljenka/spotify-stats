import {StorageService} from './storage.service';
import SpotifyWebApi from 'spotify-web-api-js';

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
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

  private constructor(private http: HttpClient) {

  }

  private api: SpotifyWebApi.SpotifyWebApiJs = null;

  public userId = null;

  refreshApi(): void {
    this.api.setAccessToken(StorageService.accessToken);
    this.api.getMe().then(value => this.userId = value.id);
  }

  getApi(): SpotifyWebApi.SpotifyWebApiJs {
    if (this.api == null) {
      this.api = new SpotifyWebApi();
      this.api.setAccessToken(StorageService.accessToken);
      this.api.getMe().then(value => this.userId = value.id);
    }

    return this.api;
  }
}
