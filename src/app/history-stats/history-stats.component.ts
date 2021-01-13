import {Component, OnInit, ViewChild} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {Title} from '@angular/platform-browser';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {ApiConnectionService} from '../api-connection.service';
import {environment} from '../../environments/environment';
import {StorageService} from '../storage.service';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDateRangeInput} from '@angular/material/datepicker';
import {FormControl, FormGroup} from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter} from '@angular/material-moment-adapter';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;

@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'de-DE'},
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
  ]
})
export class HistoryStatsComponent implements OnInit {
  playbackHistory: PlayHistoryObjectFull[];
  worker: Worker;
  didLoadTracks = false;
  topArtists: CountedArtistObject[] = [];
  topAlbums: CountedAlbumObject[] = [];
  topTracks: CountedTrackObject[] = [];
  topContexts: CountedContextObject[] = [];
  topArtistAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topAlbumAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topTrackAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topContextAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });

  @ViewChild('picker') picker: MatDateRangeInput<Date>;

  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title, private api: ApiConnectionService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./history-stats.worker', {type: 'module'});
      this.worker.onmessage = ({data}) => this.workerCallback(data);
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('History Statistics - SpotifyStats');
    this.dataSharing.playbackHistory.toPromise().then(() => {
      this.playbackHistory = this.dataSharing.getSavedTracks();
      this.didLoadTracks = this.dataSharing.didFinishLoadingHistory;
      this.worker.postMessage({
        playHistory: this.playbackHistory,
        token: StorageService.accessToken
      });
    });
    this.range.valueChanges.pipe(debounceTime(200)).subscribe(value => {
      if (value.end != null && value.start != null) {
        this.topArtists = this.topAlbums = this.topTracks = this.topContexts = [];
        this.worker.postMessage({
          playHistory: this.playbackHistory.filter(
            v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()) >= value.start &&
              new Date(new Date(parseInt(v.added_at, 10)).toDateString()) <= value.end.valueOf()),
          token: StorageService.accessToken
        });
      }
    });
  }

  workerCallback(data): void {
    switch (data.type) {
      case 'topArtists':
        this.topArtists = data.content;
        this.getTopArtistAvgColor();
        break;
      case 'topAlbums':
        this.topAlbums = data.content;
        this.getTopAlbumAvgColor();
        break;
      case 'topTracks':
        this.topTracks = data.content;
        this.getTopTrackAvgColor();
        break;
      case 'topContexts':
        this.topContexts = data.content;
        this.getTopContextAvgColor();
    }
  }

  getTopArtistAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topArtists[0].artist.images[0].url)
      .subscribe(value => {
        // @ts-ignore
        this.topArtistAvgColor = value;
      });
  }

  getTopAlbumAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topAlbums[0].album.images[0].url)
      .subscribe(value => {
        // @ts-ignore
        this.topAlbumAvgColor = value;
      });
  }

  getTopTrackAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topTracks[0].track.album.images[0].url)
      .subscribe(value => {
        // @ts-ignore
        this.topTrackAvgColor = value;
      });
  }

  getTopContextAvgColor(): void {
    this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topContexts[0].context.content.images[0].url)
      .subscribe(value => {
        // @ts-ignore
        this.topContextAvgColor = value;
      });
  }

  getContextRouterLink(context: ContextObjectFull): string[] {
    const contextId = context.contextUri.match(/(?<=spotify:\w*:).*/)[0];
    switch (context.contextType) {
      case 'playlist':
        return ['/playlist-track-list', contextId];
      case 'album':
        return ['/album-track-list', contextId];
      case 'artist':
      default:
        return [];
    }

  }

  // tslint:disable-next-line:typedef
  trackByFunction(index, item) {
    if ('artist' in item) {
      return item.artist.id;
    } else if ('album' in item) {
      return item.album.id;
    } else if ('track' in item) {
      return item.track.id;
    } else if ('context' in item) {
      return item.context.contextUri;
    }
    return index;
  }
}

export interface CountedTrackObject {
  timesPlayed: number;
  track: TrackObjectFull;
}

export interface CountedAlbumObject {
  timesPlayed: number;
  album: AlbumObjectFull;
}

export interface CountedArtistObject {
  timesPlayed: number;
  artist: ArtistObjectFull;
}

export interface CountedContextObject {
  timesPlayed: number;
  context: ContextObjectFull;
}


export interface RGBColor {
  r: number;
  g: number;
  b: number;
}
