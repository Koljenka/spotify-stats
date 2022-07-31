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
import {ApiAlbum} from '../../stat-api-util/ApiAlbum';
import {ApiTrack} from '../../stat-api-util/ApiTrack';
import {BoxStat} from '../stat-slider/stat-slider.component';
import {StorageService} from '../../storage.service';
import {DataSharingService} from '../../data-sharing.service';

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
  stats: BoxStat[] = [];
  trackId: string;
  contextUri: string;
  background: string;
  headerBackground: string;

  loaded = new BehaviorSubject<void>(null);

  private backgroundColor: { r: number; g: number; b: number };

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private titleService: Title,
              private http: HttpClient, private dataSharing: DataSharingService) {
    this.trackId = this.route.snapshot.params.trackId;
    this.contextUri = this.route.snapshot.params.contextUri;
  }

  ngOnInit(): void {
    this.loaded.toPromise().then(() => {
      this.http.post(environment.APP_SETTINGS.songStatApiBasePath + '/stats', {
        accessToken: StorageService.accessToken,
        album: ApiAlbum.fromSpotifyAlbum(this.album),
        track: ApiTrack.fromSpotifyTrack(this.track)
      })
        .subscribe(val => {
          // @ts-ignore
          if (val.message === 'BoxStatResponse') {
            // @ts-ignore
            this.stats.push(...val.content);
          }
        });

      this.http.post(environment.APP_SETTINGS.songStatApiBasePath + '/slowStats', {
        accessToken: StorageService.accessToken,
        album: ApiAlbum.fromSpotifyAlbum(this.album),
        track: ApiTrack.fromSpotifyTrack(this.track)
      })
        .subscribe(val => {
          // @ts-ignore
          if (val.message === 'BoxStatResponse') {
            // @ts-ignore
            this.stats.push(...val.content);
          }
        });
    });
    this.dataSharing.getFullTrack(this.trackId)
      .then(track => {
        this.track = track;
        this.titleService.setTitle(this.track.name + ' - SpotifyStats');
        this.getBackground();
        return this.dataSharing.getFullAlbum(track.album.id, track.album.uri);
      })
      .then(album => {
        this.album = album;
        return this.dataSharing.getFullArtists(this.track.artists.map(a => a.id));
      })
      .then(artists => {
        this.artists = artists;
        return this.dataSharing.getFullAudioFeatures([this.track.id]);
      })
      .then(aF => {
        this.audioFeatures = aF[0];
        this.loaded.complete();
      });
  }

  getTextColor(): string {
    if (this.backgroundColor) {
      return Util.getTextColorForBackground(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
    } else {
      return 'unset';
    }
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
