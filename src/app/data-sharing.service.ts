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
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  get playbackHistory(): Observable<PlayHistoryObjectFull[]> {
    if ((this.playbackHistorySource.value === null || this.playbackHistorySource.value === undefined ||
      this.playbackHistorySource.value.length <= 0) && !this.didStartLoading) {
      this.didStartLoading = true;
      this.loadPlaybackHistory();
    }

    return this.playbackHistorySource.asObservable();
  }

  get historyLoadingProgress(): number {
    if (this.tracks.length + this.loadedContexts + this.audioFeatures.length === 0) {
      return 0;
    } else {
      return (this.tracks.length + this.loadedContexts + this.audioFeatures.length) /
        (this.uniqueTrackIds.length * 2 + this.totalContextCount);
    }
  }

  get didFinishLoadingHistory(): boolean {
    return this.historyLoadingProgress === 1;
  }

  constructor(private http: HttpClient, private api: ApiConnectionService) {
  }

  private savedTracks: PlayHistoryObjectFull[] = [];
  private contexts: ContextObjectFull[] = [];
  private tracks: TrackObjectFull[] = [];
  private audioFeatures: AudioFeaturesObject[] = [];
  private historyLength = 0;
  private uniqueTrackIds: string[] = [];
  private didStartLoading = false;
  private playbackHistorySource = new BehaviorSubject(new Array<PlayHistoryObjectFull>());
  private totalContextCount = 0;
  private loadedContexts = 0;

  public getSavedTracks(): PlayHistoryObjectFull[] {
    return this.savedTracks;
  }


  private loadPlaybackHistory(): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/history', {access_token: StorageService.accessToken})
      .subscribe(value => {
        const playbackHistory = (value as PlaybackHistory[]);
        this.historyLength = playbackHistory.length;
        this.uniqueTrackIds = this.getUniqueTrackIds(playbackHistory);
        Promise.all([this.getContexts(playbackHistory), this.getAllTracks(), this.getAllAudioFeatures()]).then(() => {
          this.matchTracks(playbackHistory);
        });
      });
  }

  private getUniqueTrackIds(history: PlaybackHistory[]): string[] {
    const uniqueTracks = [];
    history.map(val => val.trackid).forEach(id => {
      if (!uniqueTracks.includes(id)) {
        uniqueTracks.push(id);
      }
    });
    return uniqueTracks;
  }

  private matchTracks(history: PlaybackHistory[]): void {
    const playbackHistoryTracks: PlayHistoryObjectFull[] = [];
    history.forEach(historyTrack => {
      const track = this.tracks.find(tr => tr.id === historyTrack.trackid);
      const audioFeatures = this.audioFeatures.find(af => af != null && af.id === historyTrack.trackid);
      let context = this.contexts.find(ct => ct.content.uri === historyTrack.contexturi);
      if (context === undefined) {
        context = {contextType: null, content: null};
      }
      this.savedTracks.push({audioFeatures, added_at: (historyTrack.played_at * 1000) + '', track, context});
      playbackHistoryTracks.push({audioFeatures, added_at: (historyTrack.played_at * 1000) + '', track, context});
    });
    this.playbackHistorySource.next(playbackHistoryTracks);
    if (this.didFinishLoadingHistory) {
      this.playbackHistorySource.complete();
    }
  }

  private async getAllTracks(): Promise<TrackObjectFull[]> {
    const promises = [];
    for (let i = 0; i <= Math.ceil(this.uniqueTrackIds.length / 50); i++) {
      const trackIds = this.uniqueTrackIds.slice(i * 50, (i + 1) * 50);
      if (trackIds.length > 0) {
        promises.push(this.getTracks(trackIds));
      }
    }

    return Promise.all(promises).then(() => {
      return Promise.resolve(this.tracks);
    });
  }

  private async getAllAudioFeatures(): Promise<AudioFeaturesObject[]> {
    const promises = [];
    for (let i = 0; i <= Math.ceil(this.uniqueTrackIds.length / 100); i++) {
      const trackIds = this.uniqueTrackIds.slice(i * 100, (i + 1) * 100);
      if (trackIds.length > 0) {
        promises.push(this.getAudioFeatures(trackIds));
      }
    }

    return Promise.all(promises).then(() => {
      return Promise.resolve(this.audioFeatures);
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

    for (let i = 0; i <= Math.ceil(albums.length / 20); i++) {
      const albumIds = albums.slice(i * 20, (i + 1) * 20).map(v => v.match(/(?<=spotify:\w*:)[^:]*/)[0]);
      if (albumIds.length > 0) {
        promises.push(this.getAlbums(albumIds));
      }
    }

    for (let i = 0; i <= Math.ceil(artists.length / 50); i++) {
      const artistIds = artists.slice(i * 50, (i + 1) * 50).map(v => v.match(/(?<=spotify:\w*:)[^:]*/)[0]);
      if (artistIds.length > 0) {
        promises.push(this.getArtists(artistIds));
      }
    }

    return Promise.all(promises).then(() => {
      return Promise.resolve(this.contexts);
    });
  }

  private getArtists(artistIds: string[]): Promise<void> {
    return this.api.getApi().getArtists(artistIds).then(response => {
      response.artists.forEach(artist => {
        this.contexts.push({contextType: 'artist', content: artist});
        this.loadedContexts = this.contexts.length;
      });
    }).catch(reason => {
      if (reason.status === 429) {
        return this.delay(reason.getResponseHeader('Retry-After')).then(() =>
          this.getArtists(artistIds)
        );
      }
    });
  }

  private getAlbums(albumIds: string[]): Promise<void> {
    return this.api.getApi().getAlbums(albumIds).then(response => {
      response.albums.forEach(album => {
        this.contexts.push({contextType: 'album', content: album});
        this.loadedContexts = this.contexts.length;
      });
    }).catch(reason => {
      if (reason.status === 429) {
        return this.delay(reason.getResponseHeader('Retry-After')).then(() =>
          this.getAlbums(albumIds)
        );
      }
    });
  }

  private getPlaylist(playlistId: string, playlistUri: string): Promise<void> {
    return this.api.getApi().getPlaylist(playlistId).then(playlist => {
      this.contexts.push({contextType: 'playlist', content: playlist});
      this.loadedContexts = this.contexts.length;
    }).catch(reason => {
      if (reason.status === 429) {
        return this.delay(reason.getResponseHeader('Retry-After')).then(() =>
          this.getPlaylist(playlistId, playlistUri)
        );
      } else {
        this.totalContextCount--;
      }
    });
  }

  private getTracks(ids: string[]): Promise<void> {
    return this.api.getApi().getTracks(ids).then(tracks => {
      this.tracks.push(...tracks.tracks);
    }).catch(reason => {
      if (reason.status === 429) {
        return this.delay(reason.getResponseHeader('Retry-After')).then(() =>
          this.getTracks(ids)
        );
      }
    });
  }

  private getAudioFeatures(ids: string[]): Promise<void> {
    return this.api.getApi().getAudioFeaturesForTracks(ids).then(response => {
      this.audioFeatures.push(...response.audio_features);
    }).catch(reason => {
      if (reason.status === 429) {
        return this.delay(reason.getResponseHeader('Retry-After')).then(() =>
          this.getAudioFeatures(ids)
        );
      }
    });
  }

  private delay(s: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
  }
}

export interface ContextObjectFull {
  contextType: ContextObjectType;
  content: AlbumObjectFull | PlaylistObjectFull | ArtistObjectFull;
}
