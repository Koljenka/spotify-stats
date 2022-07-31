import {Component, Input, OnInit} from '@angular/core';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;
import {Util} from '../../util';
import {environment} from '../../../environments/environment';
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;
import {KeyHelper} from '../../key-helper';
import {CountApiResponse, PlaybackApiService} from '../../playback-api.service';

@Component({
  selector: 'app-track-header',
  templateUrl: './track-header.component.html',
  styleUrls: ['./track-header.component.scss']
})
export class TrackHeaderComponent implements OnInit {

  @Input() track: TrackObjectFull;
  @Input() album: AlbumObjectFull;
  @Input() artists: ArtistObjectFull[];
  @Input() audioFeatures: AudioFeaturesObject;
  @Input() background = 'unset';
  @Input() color: string;
  @Input() loaded: Promise<void>;

  playCount: number;

  constructor(private playbackApi: PlaybackApiService) {
  }

  ngOnInit(): void {
    this.loaded.then(() => {
      this.getPlayedCount();
    });
  }

  getTrackLength(): string {
    return Util.toHoursMinutesSeconds(this.track.duration_ms / 1000, false);
  }

  getAlbumLength(): string {
    const ms = this.album.tracks.items.map(v => v.duration_ms).reduce((a, b) => a + b);
    return Util.toHoursMinutesSeconds(ms / 1000, false);
  }

  getLeft(index: number): string {
    return `calc(${index + 1} * (120% / ${this.artists.length + 1}) - 125px / 2 - 10%)`;
  }

  getImgSrc(url) {
    return url ?? environment.APP_SETTINGS.assetsBasePath + '/artist-placeholder.png';
  }

  getKey(value: number): string {
    return KeyHelper.getKey(value);
  }

  getMode(value: number): string {
    return value === 1 ? 'Major' : 'Minor';
  }

  getDividerColor(): string {
    if (this.color === 'white') {
      return 'rgba(255, 255, 255, .24)';
    }
    return 'rgba(0, 0, 0, .24)';
  }

  getScreenWidth(): number {
    return window.innerWidth;
  }

  private getPlayedCount(): void {
    this.playbackApi.callApi<CountApiResponse>('trackPlayedCount', {trackId: this.track.id})
      .subscribe(value => this.playCount = value[0]?.count ?? 0);
  }
}
