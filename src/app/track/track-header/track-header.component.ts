import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;
import {HttpClient} from '@angular/common/http';
import {Util} from '../../util';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-track-header',
  templateUrl: './track-header.component.html',
  styleUrls: ['./track-header.component.css']
})
export class TrackHeaderComponent implements OnInit {

  @Input() track: TrackObjectFull;
  @Input() album: AlbumObjectFull;
  @Input() artists: ArtistObjectFull[];
  @Input() background = 'unset';
  @Input() color: string;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
  }

  getTrackLength(): string {
    return Util.toHoursMinutesSeconds(this.track.duration_ms / 1000, false);
  }

  getLeft(index: number): string {
    return `calc(${index + 1} * (120% / ${this.artists.length + 1}) - 125px / 2 - 10%)`;
  }

  getImgSrc(url) {
    return url ?? environment.APP_SETTINGS.assetsBasePath + '/artist-placeholder.png';
  }

}
