import {Injectable} from '@angular/core';
import {PlayHistoryObjectFull} from './track-history/track-history.component';
import {ApiConnectionService} from './api-connection.service';
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ContextObjectType = SpotifyApi.ContextObjectType;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import PlaylistObjectSimplified = SpotifyApi.PlaylistObjectSimplified;
import {PlaybackService, PlayHistory} from '@kn685832/spotify-api';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  public trackMap: Map<string, TrackObjectFull> = new Map();
  public artistMap: Map<string, ArtistObjectFull> = new Map();
  public contextMap: Map<string, ContextObjectFull> = new Map();
  public audioFeaturesMap: Map<string, AudioFeaturesObject> = new Map();

  private playbackHistorySource: PlayHistory[] = [];
  private playbackHistoryPromise: Promise<PlayHistory[]> = null;

  constructor(private api: ApiConnectionService, private playbackApi: PlaybackService) {
  }

  get playbackHistory(): Promise<PlayHistory[]> {
    if (this.playbackHistoryPromise === null) {
      this.playbackHistoryPromise = this.loadPlaybackHistory();
    }

    return this.playbackHistoryPromise;
  }

  public static delay(s: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
  }

  public async getAllUserPlaylists(): Promise<PlaylistObjectSimplified[]> {
    // @ts-ignore
    const response = await this.getAllPages(this.api.getApi().getUserPlaylists({limit: 50}));
    return response.items;
  }

  public async getFullAlbum(id: string, uri: string): Promise<AlbumObjectFull> {
    if (!this.contextMap.has(uri)) {
      await this.getAlbums([id]);
    }
    return this.contextMap.get(uri).content as AlbumObjectFull;
  }

  public async getFullPlaylist(id: string, uri: string): Promise<PlaylistObjectFull> {
    if (!this.contextMap.has(uri)) {
      await this.getPlaylist(id, uri);
    }
    return this.contextMap.get(uri).content as PlaylistObjectFull;
  }

  public async getFullTrack(id: string): Promise<TrackObjectFull> {
    if (this.trackMap.has(id)) {
      return this.trackMap.get(id);
    }
    return this.api.getApi().getTrack(id).then(track => {
      this.trackMap.set(track.id, track);
      return track;
    }).catch(async reason => {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return this.getFullTrack(id);
      }
    });
  }

  public async getFullTracks(ids: string[]): Promise<TrackObjectFull[]> {
    const missingIds = ids.filter(i => !this.trackMap.has(i));
    if (missingIds.length > 0) {
      const uniqueIds = [...new Set(ids)];
      const promises = [];
      for (let i = 0; i <= Math.ceil(uniqueIds.length / 50); i++) {
        const trackIds = uniqueIds.slice(i * 50, (i + 1) * 50);
        if (trackIds.length > 0) {
          promises.push(this.putTracksInMap(trackIds));
        }
      }
      await Promise.all(promises);
    }
    return ids.map(id => this.trackMap.get(id));
  }

  public async getFullArtists(ids: string[]): Promise<ArtistObjectFull[]> {
    const missingIds = ids.filter(i => !this.artistMap.has(i));
    if (missingIds.length > 0) {
      const uniqueIds = [...new Set(ids)];
      const promises = [];
      if (uniqueIds.length > 50) {
        for (let i = 0; i <= Math.ceil(uniqueIds.length / 50); i++) {
          const trackIds = uniqueIds.slice(i * 50, (i + 1) * 50);
          if (trackIds.length > 0) {
            promises.push(this.getArtists(trackIds));
          }
        }
      } else {
        promises.push(this.getArtists(uniqueIds));
      }
      await Promise.all(promises);
    }
    return ids.map(id => this.artistMap.get(id));
  }

  public async getFullContextForTrack(track: PlayHistory): Promise<ContextObjectFull> {
    if (!this.contextMap.has(track.contextUri)) {
      await this.getFullContextsForTracks([track]);
    }
    return this.contextMap.get(track.contextUri);
  }

  public async getFullContextsForTracks(tracks: PlayHistory[]): Promise<ContextObjectFull[]> {
    return this.getFullContexts(tracks.map(t => t.contextUri));
  }

  public async getFullContexts(contextUris: string[]): Promise<ContextObjectFull[]> {
    const missingContexts = contextUris.filter(i => !this.contextMap.has(i));
    if (missingContexts.length > 0) {
      const uniqueContextUris = [...new Set(missingContexts)];
      await this.getContexts(uniqueContextUris);
    }
    return contextUris.map(uri => this.contextMap.get(uri));
  }

  public async getFullAudioFeatures(ids: string[]): Promise<AudioFeaturesObject[]> {
    const missingIds = ids.filter(i => !this.audioFeaturesMap.has(i));
    if (missingIds.length > 0) {
      const uniqueIds = [...new Set(missingIds)];
      const promises = [];
      for (let i = 0; i <= Math.ceil(uniqueIds.length / 100); i++) {
        const trackIds = uniqueIds.slice(i * 100, (i + 1) * 100);
        if (trackIds.length > 0) {
          promises.push(this.getAudioFeatures(trackIds));
        }
      }
      await Promise.all(promises);
    }
    return ids.map(id => this.audioFeaturesMap.get(id));
  }

  public async getHistoryObjectFull(tracks: PlayHistory[], withContexts: boolean = false): Promise<PlayHistoryObjectFull[]> {
    const trackIds = tracks.map(t => t.trackId);
    await this.getFullTracks(trackIds);
    if (withContexts) {
      await this.getFullContextsForTracks(tracks);
    }
    await this.getFullAudioFeatures(trackIds);
    const playHistoryObjectsFull: PlayHistoryObjectFull[] = [];
    tracks.forEach(t => {
      const context: ContextObjectFull = {
        type: 'context',
        contextType: null,
        content: null
      };
      playHistoryObjectsFull.push({
        track: this.trackMap.get(t.trackId),
        audioFeatures: this.audioFeaturesMap.get(t.trackId),
        context: withContexts ? this.contextMap.get(t.contextUri) : context,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        added_at: t.playedAt.toString(10)
      });
    });
    return playHistoryObjectsFull;
  }

  private async loadPlaybackHistory(): Promise<PlayHistory[]> {
    return new Promise<PlayHistory[]>(resolve => {
      this.playbackApi.getPlaybackHistory(StorageService.accessToken).subscribe(value => {
        value.forEach(t => t.playedAt *= 1000);
        this.playbackHistorySource = value;
        resolve(value);
      });
    });
  }

  private async getContexts(contextUri: string[]): Promise<void> {
    const playlists: string[] = [];
    const albums: string[] = [];
    const artists: string[] = [];
    const promises = [];
    contextUri.forEach(uri => {
      if (uri?.match(/(?<=spotify:playlist:)\w*/) && !playlists.includes(uri)) {
        playlists.push(uri);
      } else if (uri?.match(/(?<=spotify:album:)\w*/) && !albums.includes(uri)) {
        albums.push(uri);
      } else if (uri?.match(/(?<=spotify:artist:)\w*/) && !artists.includes(uri)) {
        artists.push(uri);
      }
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

    await Promise.all(promises);
  }

  private async getArtists(artistIds: string[]): Promise<void> {
    try {
      const response = await this.api.getApi().getArtists(artistIds);
      response.artists.forEach(artist => {
        const context: ContextObjectFull = {type: 'context', contextType: 'artist', content: artist};
        this.contextMap.set(artist.uri, context);
        this.artistMap.set(artist.id, artist);
      });
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return this.getArtists(artistIds);
      }
    }
  }

  private async getAlbums(albumIds: string[]): Promise<void> {
    try {
      const response = await this.api.getApi().getAlbums(albumIds);
      response.albums.forEach(album => {
        const context: ContextObjectFull = {type: 'context', contextType: 'album', content: album};
        this.contextMap.set(album.uri, context);
      });
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return this.getAlbums(albumIds);
      }
    }
  }

  private async getPlaylist(playlistId: string, playlistUri: string): Promise<void> {
    try {
      const playlist = await this.api.getApi().getPlaylist(playlistId);
      const context: ContextObjectFull = {type: 'context', contextType: 'playlist', content: playlist};
      this.contextMap.set(playlist.uri, context);
    } catch (reason) {
      if (reason.status === 429) {
        if (reason.getAllResponseHeaders().toLowerCase().includes('retry-after')) {
          await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
          return this.getPlaylist(playlistId, playlistUri);
        }
      }
    }
  }

  private async putTracksInMap(ids: string[]): Promise<void> {
    try {
      const tracks = await this.api.getApi().getTracks(ids);
      tracks.tracks.forEach(track => {
        this.trackMap.set(track.id, track);
      });
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return this.putTracksInMap(ids);
      }
    }
  }

  private async getAudioFeatures(ids: string[]): Promise<void> {
    try {
      const response = await this.api.getApi().getAudioFeaturesForTracks(ids);
      response.audio_features.forEach(aF => {
        this.audioFeaturesMap.set(aF.id, aF);
      });
    } catch (reason) {
      if (reason.status === 429) {
        await DataSharingService.delay(reason.getResponseHeader('Retry-After'));
        return this.getAudioFeatures(ids);
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
