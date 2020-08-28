import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {StorageService} from './storage.service';
import {PlaybackHistory} from './track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from './api-connection.service';
import SavedTrackObject = SpotifyApi.SavedTrackObject;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  private savedTracks: SavedTrackObject[] = [];
  private historyLength = 0;
  private playbackHistorySource = new BehaviorSubject(new Array<SavedTrackObject>());

  get playbackHistory(): Observable<SavedTrackObject[]> {
    if (this.playbackHistorySource.value === null || this.playbackHistorySource.value === undefined ||
      this.playbackHistorySource.value.length <= 0) {
      this.loadPlaybackHistory();
    }
    return this.playbackHistorySource.asObservable();
  }

  get historyLoadingProgress(): number {
    if (this.historyLength === 0) {
      return 0;
    } else {
      return this.savedTracks.length / this.historyLength;
    }
  }

  get didFinishLoadingHistory(): boolean {
    return this.historyLoadingProgress === 1;
  }

  constructor(private http: HttpClient, private api: ApiConnectionService) {
  }


  loadPlaybackHistory(): void {
    this.http.get('https://kolkie.de/spotify-playback-api/', {params: {access_token: StorageService.accessToken}}).subscribe(value => {
      const playbackHistory = value as PlaybackHistory[];
      this.historyLength = playbackHistory.length;
      for (let i = 0; i <= Math.ceil(playbackHistory.length / 50); i++) {
        const trackIds = playbackHistory.slice(i * 50, (i + 1) * 50);
        if (trackIds.length > 0) {
          this.getTracks(trackIds);
        }
      }
    });
  }


  private getTracks(ids: PlaybackHistory[]): void {
    this.api.getApi().getTracks(ids.map(i => i.trackid)).then(value => {
      value.tracks.forEach(value1 => {
        ids.filter(phO => phO.trackid === value1.id).forEach(value2 => {
          if (this.savedTracks.find(value3 => value3.added_at === (value2.played_at * 1000) + '') === undefined) {
            this.savedTracks.push({added_at: (value2.played_at * 1000) + '', track: value1});
          }
        });
      });
      this.savedTracks.sort((a, b) => (parseInt(a.added_at, 10) - parseInt(b.added_at, 10)) * -1);
      this.playbackHistorySource.next(this.savedTracks);
    });
  }
}
