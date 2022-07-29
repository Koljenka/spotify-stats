import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';
import {Observable} from 'rxjs';
import {StorageService} from './storage.service';
import {Timeframe} from './history-stats/history-stats.component';

@Injectable({
  providedIn: 'root'
})
export class PlaybackApiService {

  private defaultBody: Body = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    access_token: StorageService.accessToken
  };

  constructor(private http: HttpClient) {
  }

  public callApi<T>(endpoint: string, body: Body = {}): Observable<T> {
    body = {...this.defaultBody, ...body};
    return this.http.post<T>(`${environment.APP_SETTINGS.playbackApiBasePath}/${endpoint}`, body);
  }

  public callApiWithTimeframe<T>(endpoint: string, timeframe: Timeframe, body: Body = {}): Observable<T> {
    body = {...this.defaultBody, ...body};
    body.from = timeframe.start / 1000;
    body.to = timeframe.end / 1000;
    return this.callApi<T>(endpoint, body);
  }
}

export type CountApiResponse = Array<{ count: number }>;

export type MostActiveDayApiResponse = Array<{ date: string; count: number }>;

export type StreakApiResponse = Array<{days: number; start: string; end: string}>;

export type TopTracksApiResponse = Array<{trackId: string; count: number }>;

interface Body{
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token?: string;
  trackId?: string;
  from?: number;
  to?: number;
}
