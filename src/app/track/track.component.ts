import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiConnectionService} from '../api-connection.service';
import {DomSanitizer, Title} from '@angular/platform-browser';
import {KeyHelper} from '../key-helper';
import {StyleManagerService} from '../style-manager.service';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../storage.service';
import {environment} from '../../environments/environment';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import ArtistObjectSimplified = SpotifyApi.ArtistObjectSimplified;
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;

@Component({
  selector: 'app-track-view',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.css']
})
export class TrackComponent implements OnInit {
  track: TrackObjectFull;
  trackAudioFeatures: AudioFeaturesObject;
  trackId: string;
  contextUri: string;
  didLoadTrack = false;
  didLoadAudioFeatures = false;
  didLoadContext = false;
  contextType = '';
  context: PlaylistObjectFull | AlbumObjectFull;
  lyrics: string;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, public sanitizer: DomSanitizer,
              private titleService: Title, private readonly styleService: StyleManagerService,
              private http: HttpClient) {
    this.trackId = this.route.snapshot.params.trackId;
    this.contextUri = this.route.snapshot.params.contextUri;
  }

  public getArtists(artists: ArtistObjectSimplified[]): string {
    return artists.map(a => a.name).join(', ');
  }

  ngOnInit(): void {
    this.api.getApi().getTrack(this.trackId).then(value => {
      this.track = value;
      this.didLoadTrack = true;
      this.titleService.setTitle(this.track.name + ' - SpotifyStats');
      this.http.get('https://api.happi.dev/v1/music?limit=1&apikey=9b41f9znvgFEpXr8UVmCQdtPNzHXrEBfxC6gEFChaoD8FedRoma6vyzA&type=track&q='
        + value.artists[0].name + ' ' + value.name).subscribe(val => {
        // @ts-ignore
        if (val.length > 0) {
          // @ts-ignore
          this.http.get(val.result[0].api_lyrics + '?apikey=9b41f9znvgFEpXr8UVmCQdtPNzHXrEBfxC6gEFChaoD8FedRoma6vyzA').subscribe(lyrics => {
            // @ts-ignore
            this.lyrics = lyrics.result.lyrics;
          });
        }
      });
    });
    this.api.getApi().getAudioFeaturesForTrack(this.trackId).then(value => {
      this.trackAudioFeatures = value;
      this.didLoadAudioFeatures = true;
    });
    if (this.contextUri != null) {
      this.resolveContextUri().then(value => {
        this.context = value;
        this.didLoadContext = true;
      }).catch(console.log);
    }
  }

  getContextsOfTrack(): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/contextOfTrack', {
      access_token: StorageService.accessToken,
      track_id: this.trackId
    }).subscribe(value => {
      console.log(value);
    });
  }

  async resolveContextUri(): Promise<PlaylistObjectFull | AlbumObjectFull> {
    const contextType = this.contextUri.match(/(?<=spotify:)\w*/)[0];
    const contextId = this.contextUri.match(/(?<=spotify:\w*:).*/)[0];
    this.contextType = contextType;
    if (contextType === 'playlist') {
      return this.api.getApi().getPlaylist(contextId);
    } else if (contextType === 'album') {
      return this.api.getApi().getAlbum(contextId);
    } else {
      return Promise.reject(`Context ${contextType} is not supported`);
    }

  }

  public getKey(value: number): string {
    return KeyHelper.getKey(value);
  }

  public getMode(value: number): string {
    return value === 1 ? 'Major' : 'Minor';
  }

  public getTabImgSrc(key: number, mode: number): string {
    return KeyHelper.getTabForKeyAndMode(key, mode);
  }

  public isSmallScreen(): boolean {
    return window.screen.width < 800;
  }

  public getSvgStyle(): string {
    return this.styleService.isDarkStyleActive() ? 'filter: invert(var(--value, 100%)); height: 200px; width: 200px;' : 'height: 200px; width: 200px;';
  }
}
