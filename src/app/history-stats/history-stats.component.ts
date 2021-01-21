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
import {Option} from '../option.model';
import {StyleManagerService} from '../style-manager.service';
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
  theme: Option;
  topArtistAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topAlbumAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topTrackAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topContextAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  smallStatCardStats: SmallCardStat[] = [];
  total: SmallCardStat;
  range = new FormGroup({
    start: new FormControl(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay() + 1)),
    end: new FormControl(new Date())
  });
  links = ['Last 7 days', 'Last month', 'Last year', 'All time'];
  lastLink = 'latLink';
  activeLink = this.links[0];
  private isFirstCallback = true;

  @ViewChild('picker') picker: MatDateRangeInput<Date>;

  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title, private api: ApiConnectionService,
              private styleService: StyleManagerService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./history-stats.worker', {type: 'module'});
      this.worker.onmessage = ({data}) => this.workerCallback(data);
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('History Statistics - SpotifyStats');
    this.styleService.currentTheme.subscribe(value => {
      this.theme = value;
    });

    this.dataSharing.playbackHistory.toPromise().then(() => {
      this.playbackHistory = this.dataSharing.getSavedTracks();
      this.didLoadTracks = this.dataSharing.didFinishLoadingHistory;
      this.onLinkChanged();
    });
    this.range.valueChanges.pipe(debounceTime(200)).subscribe(value => {
      if (!this.isFirstCallback &&
        value.end != null && value.start != null &&
        value.start._isValid && value.end._isValid &&
        value.start <= value.end) {
        this.topArtists = this.topAlbums = this.topTracks = this.topContexts = [];
        const prevTimeframe = {start: 0, end: 0};
        prevTimeframe.start = new Date(new Date(value.start - (value.end - value.start)).toDateString()).valueOf();
        prevTimeframe.end = value.start - 1;
        this.worker.postMessage({
          playHistory: this.playbackHistory,
          token: StorageService.accessToken,
          timeframe: {start: value.start.valueOf(), end: value.end.valueOf()},
          prevTimeframe
        });
      }
      this.isFirstCallback = false;
    });
  }

  onLinkChanged(): void {
    const timeframe = {start: 0, end: Date.now()};
    const prevTimeframe = {start: 0, end: 0};
    this.topArtists = this.topAlbums = this.topTracks = this.topContexts = [];
    switch (this.activeLink) {
      case this.links[3]:
        timeframe.start = 0;
        timeframe.end = Date.now();
        break;
      case this.links[2]:
        timeframe.start = new Date(new Date().getFullYear() - 1, 0, 1).valueOf();
        timeframe.end = new Date(new Date().getFullYear() - 1, 11, 31, 23, 59, 59).valueOf();
        prevTimeframe.start = new Date(new Date().getFullYear() - 2, 0, 1).valueOf();
        break;
      case this.links[1]:
        timeframe.start = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).valueOf();
        timeframe.end = new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 29).valueOf();
        prevTimeframe.start = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).valueOf();
        break;
      case this.links[0]:
        let start = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7);
        timeframe.start = start.valueOf();
        timeframe.end = Date.now();
        start = new Date(start.valueOf() - 1);
        prevTimeframe.start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7).valueOf();
        break;
      case this.lastLink:
        timeframe.start = this.range.value.start.valueOf();
        timeframe.end = this.range.value.end.valueOf();
        prevTimeframe.start = new Date(new Date(timeframe.start - (timeframe.end - timeframe.start)).toDateString()).valueOf();
        break;
    }
    prevTimeframe.end = timeframe.start - 1;
    this.worker.postMessage({
      playHistory: this.playbackHistory,
      token: StorageService.accessToken,
      timeframe,
      prevTimeframe
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
        break;
      case 'smallCardStats':
        this.smallStatCardStats = data.content;
        break;
    }
  }

  getTopArtistAvgColor(): void {
    if (this.topArtists.length > 0) {
      this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topArtists[0].artist.images[0].url)
        .subscribe(value => {
          // @ts-ignore
          this.topArtistAvgColor = value;
        });
    }
  }

  getTopAlbumAvgColor(): void {
    if (this.topAlbums.length > 0) {
      this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topAlbums[0].album.images[0].url)
        .subscribe(value => {
          // @ts-ignore
          this.topAlbumAvgColor = value;
        });
    }
  }

  getTopTrackAvgColor(): void {
    if (this.topTracks.length > 0) {
      this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topTracks[0].track.album.images[0].url)
        .subscribe(value => {
          // @ts-ignore
          this.topTrackAvgColor = value;
        });
    }
  }

  getTopContextAvgColor(): void {
    if (this.topContexts.length > 0) {
      this.http.get(environment.APP_SETTINGS.avgColorApiBasePath + '/?img=' + this.topContexts[0].context.content.images[0].url)
        .subscribe(value => {
          // @ts-ignore
          this.topContextAvgColor = value;
        });
    }
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

export interface SmallCardStat {
  heading: string;
  icon: string;
  stat: {
    value: number | string;
    prevTimeframe: {
      start: number;
      end: number;
    };
    prevValue: number;
  };
}
