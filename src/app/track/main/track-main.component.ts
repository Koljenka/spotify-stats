import {Component, OnInit} from '@angular/core';
import {ApiConnectionService} from '../../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import {Util} from '../../util';
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'app-track',
  templateUrl: './track-main.component.html',
  styleUrls: ['./track-main.component.css']
})
export class TrackMainComponent implements OnInit {
  track: TrackObjectFull;
  album: AlbumObjectFull;
  artists: ArtistObjectFull[];
  audioFeatures: AudioFeaturesObject;
  trackId: string;
  contextUri: string;
  background: string;
  headerBackground: string;

  loaded = new BehaviorSubject<void>(null);

  private backgroundColor: { r: number; g: number; b: number };

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private titleService: Title,
              private http: HttpClient) {
    this.trackId = this.route.snapshot.params.trackId;
    this.contextUri = this.route.snapshot.params.contextUri;
  }

  ngOnInit(): void {
    this.getTrack();
    this.getAudioFeatures();
  }

  getTextColor(): string {
    if (this.backgroundColor) {
      return Util.getTextColorForBackground(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
    } else {
      return 'unset';
    }
  }

  private getTrack(): void {
    this.api.getApi().getTrack(this.trackId).then(value => {
      this.track = value;
      this.titleService.setTitle(this.track.name + ' - SpotifyStats');
      this.getBackground();
      this.getAlbum();
      this.getArtists();
    });
  }

  private getAlbum(): void {
    this.api.getApi().getAlbum(this.track.album.id).then(value => {
      this.album = value;
      if (this.artists && this.audioFeatures) {
        this.loaded.complete();
      }
    });
  }

  private getArtists(): void {
    const ids = this.track.artists.map(value => value.id);
    this.api.getApi().getArtists(ids).then(value => {
      this.artists = value.artists;
      if (this.album && this.audioFeatures) {
        this.loaded.complete();
      }
    });
  }

  private getAudioFeatures(): void {
    this.api.getApi().getAudioFeaturesForTrack(this.trackId).then(value => {
      this.audioFeatures = value;
      if (this.artists && this.album) {
        this.loaded.complete();
      }
    });
  }

  private getBackground(): void {
    const url = this.track.album.images[this.track.album.images.length - 1].url;
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/palette?img=' + url)
      .subscribe(color => {
        // @ts-ignore
        this.backgroundColor = color[0];
        this.background = `linear-gradient(
        rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, 255) 75%,
        rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, 0.3))`;

        this.headerBackground = `linear-gradient(
        rgb(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}) 50%,
        rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, 0.25))`;
      });
  }
}
