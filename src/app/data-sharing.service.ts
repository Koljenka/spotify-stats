import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {StorageService} from './storage.service';
import {PlaybackHistory, PlayHistoryObjectFull} from './track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from './api-connection.service';
import {environment} from '../environments/environment';
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ContextObjectType = SpotifyApi.ContextObjectType;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  private savedTracks: PlayHistoryObjectFull[] = [];
  private contexts: ContextObjectFull[] = [];
  private historyLength = 0;
  private didStartLoading = false;
  private playbackHistorySource = new BehaviorSubject(new Array<PlayHistoryObjectFull>());
  private totalContextCount = 0;
  private loadedContexts = 0;

  get playbackHistory(): Observable<PlayHistoryObjectFull[]> {
    if ((this.playbackHistorySource.value === null || this.playbackHistorySource.value === undefined ||
      this.playbackHistorySource.value.length <= 0) && !this.didStartLoading) {
      this.didStartLoading = true;
      this.loadPlaybackHistory();
    }

    return this.playbackHistorySource.asObservable();
  }

  get historyLoadingProgress(): number {
    if (this.historyLength + this.loadedContexts === 0) {
      return 0;
    } else {
      return (this.savedTracks.length + this.loadedContexts) / (this.historyLength + this.totalContextCount);
    }
  }

  get didFinishLoadingHistory(): boolean {
    return this.historyLoadingProgress === 1;
  }

  public getSavedTracks(): PlayHistoryObjectFull[] {
    return this.savedTracks;
  }

  constructor(private http: HttpClient, private api: ApiConnectionService) {
  }


  loadPlaybackHistory(): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/history', {access_token: StorageService.accessToken})
      .subscribe(value => {
        const playbackHistory = value as PlaybackHistory[];
        this.historyLength = playbackHistory.length;
        this.getContexts(playbackHistory).then(contexts => {
          this.contexts = contexts;
          for (let i = 0; i <= Math.ceil(playbackHistory.length / 50); i++) {
            const trackIds = playbackHistory.slice(i * 50, (i + 1) * 50);
            if (trackIds.length > 0) {
              this.getTracks(trackIds);
            }
          }
        });
      });
  }


  private getTracks(ids: PlaybackHistory[]): void {
    this.api.getApi().getTracks(ids.map(i => i.trackid)).then(trackResponse => {
      const playbackHistoryTracks: PlayHistoryObjectFull[] = [];
      ids.forEach(historyTrack => {
        const track = trackResponse.tracks.find(tr => tr.id === historyTrack.trackid);
        let context = this.contexts.find(ct => ct.contextUri === historyTrack.contexturi);
        if (context === undefined) {
          context = {contextType: null, contextUri: null, content: null};
        }
        this.savedTracks.push({added_at: (historyTrack.played_at * 1000) + '', track, context});
        playbackHistoryTracks.push({added_at: (historyTrack.played_at * 1000) + '', track, context});
      });
      this.playbackHistorySource.next(playbackHistoryTracks);
      if (this.didFinishLoadingHistory) {
        this.playbackHistorySource.complete();
      }
    }).catch(reason => {
      if (reason.status === 429) {
        setTimeout(() => {
          this.getTracks(ids);
        }, 1000);
      }
    });
  }

  private async getContexts(historyTracks: PlaybackHistory[]): Promise<ContextObjectFull[]> {
    const playlists: string[] = [];
    const albums: string[] = [];
    const artists: string[] = [];
    const promises = [];
    historyTracks.forEach(historyTrack => {
      if (historyTrack.contexturi?.match(/(?<=spotify:playlist:)\w*/) && !playlists.includes(historyTrack.contexturi)) {
        playlists.push(historyTrack.contexturi);
      } else if (historyTrack.contexturi?.match(/(?<=spotify:album:)\w*/) && !albums.includes(historyTrack.contexturi)) {
        albums.push(historyTrack.contexturi);
      } else if (historyTrack.contexturi?.match(/(?<=spotify:artist:)\w*/) && !artists.includes(historyTrack.contexturi)) {
        artists.push(historyTrack.contexturi);
      }
      this.totalContextCount = playlists.length + albums.length + artists.length;
    });
    for (const playlistUri of playlists) {
      const playlistId = playlistUri.match(/(?<=spotify:\w*:)[^:]*/)[0];
      promises.push(this.getPlaylist(playlistId, playlistUri));
    }
    for (const albumUri of albums) {
      const albumId = albumUri.match(/(?<=spotify:\w*:)[^:]*/)[0];
      promises.push(this.getAlbum(albumId, albumUri));
    }
    for (const artistUri of artists) {
      const artistId = artistUri.match(/(?<=spotify:\w*:)[^:]*/)[0];
      promises.push(this.getArtist(artistId, artistUri));
    }

    return Promise.all(promises).then(() => {
      return Promise.resolve(this.contexts);
    });
  }

  private getArtist(artistId: string, artistUri: string): Promise<void> {
    return this.api.getApi().getArtist(artistId).then(artist => {
      this.contexts.push({contextType: 'artist', contextUri: artistUri, content: artist});
      this.loadedContexts = this.contexts.length;
    }).catch(() => {
      return this.getArtist(artistId, artistUri);
    });
  }

  private getAlbum(albumId: string, albumUri: string): Promise<void> {
    return this.api.getApi().getAlbum(albumId).then(album => {
      this.contexts.push({contextType: 'album', contextUri: albumUri, content: album});
      this.loadedContexts = this.contexts.length;
    }).catch(() => {
      return this.getAlbum(albumId, albumUri);
    });
  }

  private getPlaylist(playlistId: string, playlistUri: string): Promise<void> {
    return this.api.getApi().getPlaylist(playlistId).then(playlist => {
      this.contexts.push({contextType: 'playlist', contextUri: playlistUri, content: playlist});
      this.loadedContexts = this.contexts.length;
    }).catch(() => {
      return this.getPlaylist(playlistId, playlistUri);
    });
  }
}

export interface ContextObjectFull {
  contextType: ContextObjectType;
  contextUri: string;
  content: AlbumObjectFull | PlaylistObjectFull | ArtistObjectFull;
}
