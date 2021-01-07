import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {StorageService} from './storage.service';
import {PlaybackHistory, PlayHistoryObjectFull} from './track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from './api-connection.service';
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

  get playbackHistory(): Observable<PlayHistoryObjectFull[]> {
    if ((this.playbackHistorySource.value === null || this.playbackHistorySource.value === undefined ||
      this.playbackHistorySource.value.length <= 0) && !this.didStartLoading) {
      this.didStartLoading = true;
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

  public getSavedTracks(): PlayHistoryObjectFull[] {
    return this.savedTracks;
  }

  constructor(private http: HttpClient, private api: ApiConnectionService) {
  }


  loadPlaybackHistory(): void {
    this.http.post('https://kolkie.de/spotify-playback-api/history', {access_token: StorageService.accessToken}).subscribe(value => {
      const playbackHistory = value as PlaybackHistory[];
      this.getContexts(playbackHistory).then(contexts => {
        this.contexts = contexts;
        this.historyLength = playbackHistory.length;
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
    const contexts: ContextObjectFull[] = [];
    const promises = [];
    historyTracks.forEach(historyTrack => {
      if (historyTrack.contexturi?.match(/(?<=spotify:playlist:)\w*/) && !playlists.includes(historyTrack.contexturi)) {
        playlists.push(historyTrack.contexturi);
      } else if (historyTrack.contexturi?.match(/(?<=spotify:album:)\w*/) && !albums.includes(historyTrack.contexturi)) {
        albums.push(historyTrack.contexturi);
      } else if (historyTrack.contexturi?.match(/(?<=spotify:artist:)\w*/) && !artists.includes(historyTrack.contexturi)) {
        artists.push(historyTrack.contexturi);
      }
    });
    for (const playlistUri of playlists) {
      const playlistId = playlistUri.match(/(?<=spotify:\w*:)[^:]*/)[0];
      promises.push(
        this.api.getApi().getPlaylist(playlistId).then(playlist => {
          contexts.push({contextType: 'playlist', contextUri: playlistUri, content: playlist});
        }).catch(console.log));
    }
    for (const albumUri of albums) {
      const albumId = albumUri.match(/(?<=spotify:\w*:)[^:]*/)[0];
      promises.push(
        this.api.getApi().getAlbum(albumId).then(album => {
          contexts.push({contextType: 'album', contextUri: albumUri, content: album});
        }).catch(console.log));
    }
    for (const artistUri of artists) {
      const artistId = artistUri.match(/(?<=spotify:\w*:)[^:]*/)[0];
      promises.push(
        this.api.getApi().getArtist(artistId).then(artist => {
          contexts.push({contextType: 'artist', contextUri: artistUri, content: artist});
        }).catch(console.log));
    }

    return Promise.all(promises).then(() => {
      return Promise.resolve(contexts);
    });
  }

}

export interface ContextObjectFull {
  contextType: ContextObjectType;
  contextUri: string;
  content: AlbumObjectFull | PlaylistObjectFull | ArtistObjectFull;
}
