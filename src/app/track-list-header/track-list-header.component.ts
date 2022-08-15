import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {AlbumTrackObject} from '../album-track-list/album-track-list.component';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import {Util} from '../util';
import {StorageService} from '../storage.service';
import {ColorService, ContextService, RGB} from '@kn685832/spotify-api';

@Component({
  selector: 'app-track-list-header',
  templateUrl: './track-list-header.component.html',
  styleUrls: ['./track-list-header.component.css']
})
export class TrackListHeaderComponent implements OnInit {
  @Input() contextObjectObs: Observable<any>;
  @Input() tracksSource: Observable<any[]>;

  @Output() backgroundColorChanged = new EventEmitter<string>();

  contextObject: any;
  tracks: (PlaylistTrackObject | SavedTrackObject | PlayHistoryObjectFull | AlbumTrackObject)[] = [];
  playedCount = 0;
  playlistLength = '';

  private backgroundColor: RGB;

  constructor(private contextApi: ContextService, private colorApi: ColorService) {
  }

  ngOnInit() {
    this.tracksSource.subscribe(value => this.tracks.push(...value));
    this.tracksSource.toPromise().then(() => this.getPlaylistLength());
    this.contextObjectObs.subscribe(value => {
      if (value) {
        this.contextObject = value;
        this.getPlayedCount();
        this.getBackground();
      }
    });
  }

  getTextColor(): string {
    if (this.backgroundColor) {
      return Util.getTextColorForBackground(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
    } else {
      return 'unset';
    }
  }

  getPlaylistLength() {
    this.playlistLength = Util.toHoursMinutesSeconds(this.tracks.map(t => t.track.duration_ms).reduce((a, b) => a + b) / 1000, false);
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

  private getBackground(): void {
    this.colorApi.getAverageColor(this.contextObject.content.images[0].url)
      .subscribe(color => {
        this.backgroundColor = color;
        this.backgroundColorChanged.emit(`linear-gradient(rgba(${this.backgroundColor.r},
          ${this.backgroundColor.g}, ${this.backgroundColor.b}, 255) 15%, transparent)`);
      });
  }

  private getPlayedCount(): void {
    this.contextApi.getContextPlayCount(StorageService.accessToken, this.contextObject.content.uri)
      .subscribe(value => {
          this.playedCount = value.count;
        }
      );
  }

}
