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
  themeIsDark = false;
  topArtistAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topAlbumAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topTrackAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  topContextAvgColor: RGBColor = {r: 255, g: 255, b: 255};
  smallStatCardStats: SmallCardStat[] = [];
  range = new FormGroup({
    start: new FormControl(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay() + 1)),
    end: new FormControl(new Date())
  });
  links = ['Last 7 days', 'Last month', 'Last year', 'All time'];
  lastLink = 'latLink';
  activeLink = this.links[0];
  options: any;
  isLoadingGraph = true;
  clockGraphData: any;
  isLoadingClockGraph = true;
  private isFirstCallback = true;

  @ViewChild('picker') picker: MatDateRangeInput<Date>;

  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title, private api: ApiConnectionService,
              private styleService: StyleManagerService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./history-stats.worker', {type: 'module'}),
        this.worker.onmessage = ({data}) => this.workerCallback(data);
    }
  }

  ngOnInit(): void {
    this.clearStats();
    this.titleService.setTitle('History Statistics - SpotifyStats');
    this.styleService.currentTheme.subscribe(value => {
      this.theme = value;
      this.themeIsDark = this.styleService.isDarkStyleActive();
    });

    this.dataSharing.playbackHistory.toPromise().then(() => {
      this.playbackHistory = this.dataSharing.getSavedTracks();
      this.didLoadTracks = this.dataSharing.didFinishLoadingHistory;
      this.onLinkChanged();
    });
    this.range.valueChanges.pipe(debounceTime(200)).subscribe(this.onRangeChanged);
  }

  onLinkChanged(): void {
    const timeframe = {start: 0, end: Date.now()};
    const prevTimeframe = {start: 0, end: 0};
    this.clearStats();
    switch (this.activeLink) {
      case this.links[3]:
        timeframe.start = parseInt(this.playbackHistory[this.playbackHistory.length - 1].added_at, 10);
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
        prevTimeframe.start = new Date(new Date((timeframe.start - 1) - (timeframe.end - (timeframe.start - 1))).toDateString()).valueOf();
        if (timeframe.start === timeframe.end) {
          timeframe.end = timeframe.start + 86399000;
        }
        break;
    }
    prevTimeframe.end = timeframe.start - 1;
    this.loadStatsForTimeframe(timeframe.start, timeframe.end, prevTimeframe.start, prevTimeframe.end);
  }

  private onRangeChanged(value): void {
    if (!this.isFirstCallback &&
      value.end != null && value.start != null &&
      value.start._isValid && value.end._isValid &&
      value.start <= value.end) {
      this.clearStats();
      const prevTimeframe = {start: 0, end: 0};
      prevTimeframe.start = new Date(new Date((value.start - 1) - (value.end - (value.start - 1))).toDateString()).valueOf();
      prevTimeframe.end = value.start - 1;
      let end = value.end.valueOf();
      if (value.start.valueOf() === value.end.valueOf()) {
        end = value.start.valueOf() + 86399000;
      }
      this.loadStatsForTimeframe(value.start.valueOf(), end.valueOf(), prevTimeframe.start, prevTimeframe.end);
    }
    this.isFirstCallback = false;
  }

  private clearStats(): void {
    this.topArtists = this.topAlbums = this.topTracks = this.topContexts = [];
    this.smallStatCardStats = [];
    for (let i = 0; i < 9; i++) {
      this.smallStatCardStats.push({
        id: i, heading: '', icon: '', stat: {prevTimeframe: {end: 0, start: 0}, prevValue: 0, value: null}
      });
    }
    this.isLoadingGraph = true;
    this.isLoadingClockGraph = true;
  }

  private loadStatsForTimeframe(from: number, to: number, previousFrom: number, previousTo: number): void {
    this.getClockGraphData(from, to);
    this.worker.postMessage({
      playHistory: this.playbackHistory,
      token: StorageService.accessToken,
      timeframe: {start: from, end: to},
      prevTimeframe: {start: previousFrom, end: previousTo}
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
      case 'new_smallCardStats':
        this.smallStatCardStats[data.content.id] = data.content;
        break;
      case 'graph': {
        this.options = data.content;
        this.isLoadingGraph = false;
        break;
      }
    }
  }

  private getClockGraphData(from: number, to: number): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/listeningClock', {
      access_token: StorageService.accessToken,
      from: from / 1000,
      to: to / 1000
    })
      .subscribe(value => {
        const temp = {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
          12: 0,
          13: 0,
          14: 0,
          15: 0,
          16: 0,
          17: 0,
          18: 0,
          19: 0,
          20: 0,
          21: 0,
          22: 0,
          23: 0
        };
        // @ts-ignore
        value.forEach(val => temp[parseInt(val.hour, 10)] = val.count);
        this.clockGraphData = {
          title: {
            text: 'Listening Clock'
          },
          toolbox: {
            show: true,
            feature: {
              saveAsImage: {title: 'Save as Image'}
            }
          },
          backgroundColor: '#00000000',
          angleAxis: {
            type: 'category',
            data: Object.keys(temp)
          },
          tooltip: {
            show: true,

          },
          radiusAxis: {},
          polar: {},
          series: [{
            type: 'bar',
            data: Object.values(temp),
            coordinateSystem: 'polar',
            name: 'Songs played',
          }]
        };
      });
    this.isLoadingClockGraph = false;
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
    const contextId = context.content.id;
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
      return item.context.content.uri;
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
  id: number;
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
