import {AfterViewInit, Component, Input, Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {AlbumTrackObject} from '../album-track-list/album-track-list.component';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import {Util} from '../util';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../storage.service';

@Component({
  selector: 'app-track-list-header',
  templateUrl: './track-list-header.component.html',
  styleUrls: ['./track-list-header.component.css']
})
export class TrackListHeaderComponent implements AfterViewInit {
  @Input() contextObject: any;
  @Input() tracksSource: Observable<any[]>;

  @Output() backgroundColorChanged = new EventEmitter<string>();

  tracks: (PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject)[] = [];
  playedCount = 0;

  private backgroundColor: { r: number; g: number; b: number };

  constructor(private http: HttpClient) {
  }

  ngAfterViewInit(): void {
    this.tracksSource.subscribe(value => this.tracks.push(...value));
    this.tracksSource.toPromise().then(() => {
      this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.contextObject.content.images[0].url)
        .subscribe(color => {
          // @ts-ignore
          this.backgroundColor = color;
          this.backgroundColorChanged.emit(`linear-gradient(rgba(${this.backgroundColor.r},
          ${this.backgroundColor.g}, ${this.backgroundColor.b}, 255) 15%, transparent)`);
        });
      this.getPlayedCount();
    });
  }

  getTextColor(): string {
    if (this.backgroundColor) {
      return Util.getTextColorForBackground(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
    } else {
      return 'unset';
    }
  }

  getPlaylistLength(): string {
    return Util.toHoursMinutesSeconds(this.tracks.map(t => t.track.duration_ms).reduce((a, b) => a + b) / 1000, false);
  }

  getUsername(): string {
    switch (this.contextObject?.contextType) {
      case 'album':
        return this.contextObject.content.artists[0].name;
      case 'artist':
      default:
        return '';
      case 'playlist':
        return this.contextObject.content.owner.display_name;
    }
  }

  private getPlayedCount(): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/contextPlayedCount', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      contextUri: this.contextObject.content.uri
    }).subscribe(value => {
        this.playedCount = value[0]?.count;
      }
    );
  }

}
