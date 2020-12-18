import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {StorageService} from './storage.service';
import {PlaybackHistory, PlayHistoryObjectFull} from './track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from './api-connection.service';
import SavedTrackObject = SpotifyApi.SavedTrackObject;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  private savedTracks: PlayHistoryObjectFull[] = [];
  private historyLength = 0;
  private playbackHistorySource = new BehaviorSubject(new Array<PlayHistoryObjectFull>());

  get playbackHistory(): Observable<PlayHistoryObjectFull[]> {
    if (this.playbackHistorySource.value === null || this.playbackHistorySource.value === undefined ||
      this.playbackHistorySource.value.length <= 0) {
      this.loadPlaybackHistory();
    }
    return this.playbackHistorySource.asObservable();
  }

  getPlaybackHistoryPart(from: number, to: number): PlayHistoryObjectFull[] {
    return this.savedTracks.slice(from, to);
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
    this.http.post('https://kolkie.de/spotify-playback-api/history', {access_token: StorageService.accessToken}).subscribe(value => {
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
      ids.forEach(historyTrack => {
        const track = value.tracks.find(tr => tr.id === historyTrack.trackid);
        this.savedTracks.push({added_at: (historyTrack.played_at * 1000) + '', track, contextUri: historyTrack.contexturi});
      });
      this.savedTracks.sort((a, b) => (parseInt(a.added_at, 10) - parseInt(b.added_at, 10)) * -1);
      this.playbackHistorySource.next(this.savedTracks);
    }).catch(reason => {
      if (reason.status === 429) {
        setTimeout(() => {
          this.getTracks(ids);
        }, 1000);
      }
    });
  }
}
