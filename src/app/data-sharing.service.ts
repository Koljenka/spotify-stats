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
import PlaylistObjectSimplified = SpotifyApi.PlaylistObjectSimplified;

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  private savedTracks: PlayHistoryObjectFull[] = [];
  private contexts: ContextObjectFull[] = [];
  private tracks: TrackObjectFull[] = [];
  private audioFeatures: AudioFeaturesObject[] = [];
  private uniqueTrackIds: string[] = [];
  private didStartLoading = false;
  private playbackHistorySource = new BehaviorSubject(new Array<PlayHistoryObjectFull>());
  private totalContextCount = 0;
  private loadedContexts = 0;

  constructor(private http: HttpClient, private api: ApiConnectionService) {
  }


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


  public static delay(s: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
  }

  public getSavedTracks(): PlayHistoryObjectFull[] {
    return this.savedTracks;
  }

  public async getAllUserPlaylists(): Promise<PlaylistObjectSimplified[]> {
    // @ts-ignore
    const response = await this.getAllPages(this.api.getApi().getUserPlaylists({limit: 50}));
    return response.items;
  }

  private loadPlaybackHistory(): void {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/history', {access_token: StorageService.accessToken})
      .subscribe(value => {
        const playbackHistory = (value as PlaybackHistory[]);
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
        context = {type: 'context', contextType: null, content: null};
      }
      // eslint-disable-next-line @typescript-eslint/naming-convention
      this.savedTracks.push({audioFeatures, added_at: (historyTrack.played_at * 1000) + '', track, context});
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
    await Promise.all(promises);
    return this.tracks;
  }

  private async getAllAudioFeatures(): Promise<AudioFeaturesObject[]> {
    const promises = [];
    for (let i = 0; i <= Math.ceil(this.uniqueTrackIds.length / 100); i++) {
      const trackIds = this.uniqueTrackIds.slice(i * 100, (i + 1) * 100);
      if (trackIds.length > 0) {
        promises.push(this.getAudioFeatures(trackIds));
      }
    }
    await Promise.all(promises);
    return this.audioFeatures;
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

    return Promise.all(promises).then(() => Promise.resolve(this.contexts));
  }

  private async getArtists(artistIds: string[]): Promise<void> {
    try {
      const response = await this.api.getApi().getArtists(artistIds);
      response.artists.forEach(artist => {
        this.contexts.push({type: 'context', contextType: 'artist', content: artist});
        this.loadedContexts = this.contexts.length;
      });
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return await this.getArtists(artistIds);
      }
    }
  }

  private async getAlbums(albumIds: string[]): Promise<void> {
    try {
      const response = await this.api.getApi().getAlbums(albumIds);
      response.albums.forEach(album => {
        this.contexts.push({type: 'context', contextType: 'album', content: album});
        this.loadedContexts = this.contexts.length;
      });
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return await this.getAlbums(albumIds);
      }
    }
  }

  private async getPlaylist(playlistId: string, playlistUri: string): Promise<void> {
    try {
      const playlist = await this.api.getApi().getPlaylist(playlistId);
      this.contexts.push({type: 'context', contextType: 'playlist', content: playlist});
      this.loadedContexts = this.contexts.length;
    } catch (reason) {
      if (reason.status === 429) {
        if (reason.getAllResponseHeaders().toLowerCase().includes('Retry-After')) {
          await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
          return await this.getPlaylist(playlistId, playlistUri);
        } else {
          this.totalContextCount--;
        }
      } else {
        this.totalContextCount--;
      }
    }
  }

  private async getTracks(ids: string[]): Promise<void> {
    try {
      const tracks = await this.api.getApi().getTracks(ids);
      this.tracks.push(...tracks.tracks);
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return await this.getTracks(ids);
      } else if (reason.status === 500) {
        console.log(reason);
        console.log(ids);
        //const promises = [];
        //ids.forEach(id => promises.push(this.getTracks([id])));
        //return Promise.all(promises).then(() => Promise.resolve());
      } else if (reason.status === 503) {
        console.log(ids);
      }
    }
  }

  private async getAudioFeatures(ids: string[]): Promise<void> {
    try {
      const response = await this.api.getApi().getAudioFeaturesForTracks(ids);
      this.audioFeatures.push(...response.audio_features);
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return await this.getAudioFeatures(ids);
      }
    }
  }

  private async getAllPages<T extends Pagination>(request: Promise<T>): Promise<T> {
    const paginatedResponse = await request;

    let currentResponse = paginatedResponse;

    while (currentResponse.next) {
      currentResponse = await this.api.getApi().getGeneric(currentResponse.next) as T;
      paginatedResponse.items = paginatedResponse.items.concat(currentResponse.items);
    }

    return paginatedResponse;
  }
}

export interface ContextObjectFull {
  type: 'context';
  contextType: ContextObjectType;
  content: AlbumObjectFull | PlaylistObjectFull | ArtistObjectFull;
}

interface Pagination {
  next?: string;
  items: any[];
}
