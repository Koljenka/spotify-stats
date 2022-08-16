import {Component, OnInit} from '@angular/core';
import {ApiConnectionService} from '../../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import {Title} from '@angular/platform-browser';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import {Util} from '../../util';
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import {BehaviorSubject, lastValueFrom} from 'rxjs';
import {fromSpotifyAlbum} from '../../stat-api-util/ApiAlbum';
import {fromSpotifyTrack} from '../../stat-api-util/ApiTrack';
import {StorageService} from '../../storage.service';
import {DataSharingService} from '../../data-sharing.service';
import {BoxStat, ColorService, RGB, StatisticsService} from '@kn685832/spotify-api';

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

  private backgroundColor: RGB;

  constructor(private api: ApiConnectionService, private colorApi: ColorService, private route: ActivatedRoute, private titleService: Title,
              private dataSharing: DataSharingService, private statsApi: StatisticsService) {
    this.trackId = this.route.snapshot.params.trackId;
    this.contextUri = this.route.snapshot.params.contextUri;
  }

  ngOnInit(): void {
    this.loaded.toPromise().then(() => {
      this.statsApi.getNormalBoxStats({
        accessToken: StorageService.accessToken,
        album: fromSpotifyAlbum(this.album),
        track: fromSpotifyTrack(this.track)
      }).subscribe(val => {
        this.stats.push(...val);
      });

      this.statsApi.getSlowBoxStats({
        accessToken: StorageService.accessToken,
        track: fromSpotifyTrack(this.track)
      }).subscribe(val => {
        this.stats.push(...val);
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
    lastValueFrom(this.colorApi.getColorPalette(url))
      .then(color => {
        const fr = new FileReader();
        fr.onload = e => {
          // @ts-ignore
          color = JSON.parse(e.target.result);
          this.backgroundColor = color[0];
          this.background = `linear-gradient(
        rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, 255) 75%,
        rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, 0.3))`;

          this.headerBackground = `linear-gradient(
        rgb(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}) 50%,
        rgba(${this.backgroundColor.r}, ${this.backgroundColor.g}, ${this.backgroundColor.b}, 0.25))`;
        };
        // @ts-ignore
        fr.readAsText(color);


      });
  }
}
