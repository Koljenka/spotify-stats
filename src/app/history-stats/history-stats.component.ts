/* eslint-disable @typescript-eslint/naming-convention */
import {Component, OnInit, ViewChild} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {Title} from '@angular/platform-browser';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '../storage.service';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDateRangeInput} from '@angular/material/datepicker';
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {debounceTime} from 'rxjs/operators';
import {
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
  MAT_MOMENT_DATE_FORMATS,
  MomentDateAdapter
} from '@angular/material-moment-adapter';
import {Option} from '../option.model';
import {StyleManagerService} from '../style-manager.service';
import TrackObjectFull = SpotifyApi.TrackObjectFull;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import ArtistObjectFull = SpotifyApi.ArtistObjectFull;
import {BehaviorSubject, Subject} from 'rxjs';
import {TopContent} from './history-stats-top-content-list/history-stats-top-content-list.component';
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import ImageObject = SpotifyApi.ImageObject;
import {PlaybackApiService, TopTracksApiResponse} from '../playback-api.service';


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
  @ViewChild('picker') picker: MatDateRangeInput<Date>;

  playbackHistory: PlayHistoryObjectFull[];
  historyStatsData = new BehaviorSubject({} as HistoryStatsData);

  worker: Worker;
  didLoadTracks = false;
  topArtists = new Subject<TopContent[]>();
  topAlbums = new Subject<TopContent[]>();
  topTracks = new Subject<TopContent[]>();
  topContexts = new Subject<TopContent[]>();
  theme: Option;
  themeIsDark = false;
  range = new UntypedFormGroup({
    start: new UntypedFormControl(new Date(new Date().getFullYear(), new Date().getMonth(),
      new Date().getDate() - new Date().getDay() + 1)),
    end: new UntypedFormControl(new Date())
  });
  links = ['Last 7 days', 'Last month', 'Last year', 'All time'];
  lastLink = 'latLink';
  activeLink = this.links[0];

  private isInitialized = false;
  private isFirstCallback = true;

  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title,
              private styleService: StyleManagerService,
              private playbackApi: PlaybackApiService){
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./history-stats.worker', import.meta.url), {type: 'module'});
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
    this.range.valueChanges.pipe(debounceTime(200)).subscribe(this.onRangeChanged.bind(this));
    this.isInitialized = true;
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
    if (prevTimeframe.start !== 0) {
      prevTimeframe.end = timeframe.start - 1;
    }
    this.loadStatsForTimeframe(timeframe.start, timeframe.end, prevTimeframe.start, prevTimeframe.end);
  }

  getContextRouterLink(obj: ContentObject): string[] {
    switch (obj.type) {
      case 'artist':
        return [];
      case 'track':
        return ['/track', obj.id];
      case 'playlist':
      case 'album':
        return ['/' + obj.type + '-track-list', obj.id];
    }
  }

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

  private clearStats(): void {
    this.topArtists.next([]);
    this.topAlbums.next([]);
    this.topTracks.next([]);
    this.topContexts.next([]);
  }

  private onRangeChanged(value): void {
    if (this.isInitialized && !this.isFirstCallback &&
      value.end != null && value.start != null &&
      // eslint-disable-next-line no-underscore-dangle
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

  private loadStatsForTimeframe(from: number, to: number, previousFrom: number, previousTo: number): void {
    const playHistory = this.playbackHistory.filter(
      v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= from &&
        new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= to);
    const prevPlaybackHistory = this.playbackHistory.filter(
      v => new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() >= previousFrom &&
        new Date(new Date(parseInt(v.added_at, 10)).toDateString()).valueOf() <= previousTo);
    const timeframe = {start: from, end: to};
    const prevTimeframe = {start: previousFrom, end: previousTo};
    this.historyStatsData.next({playbackHistory: playHistory, prevPlaybackHistory, timeframe, prevTimeframe});

    this.worker.postMessage({
      playHistory: this.playbackHistory,
      token: StorageService.accessToken,
      timeframe,
      prevTimeframe
    });

    this.playbackApi.callApiWithTimeframe<TopTracksApiResponse>('topTrack', timeframe).subscribe(value => {
      const topTracks = value.map(v =>
        this.contentObjectToTopContent(this.playbackHistory.find(t => t.track.id === v.trackId).track, v.count));
      this.topTracks.next(topTracks);
    });
  }

  private workerCallback(data): void {

    const top = data.content.map(v => this.contentObjectToTopContent(v.obj, v.count));
    if (data.type === 'topTracks') {
      console.log('worker', top);
    }
    this[data.type].next(top);

  }

  private contentObjectToTopContent(obj: ContentObject | ContextObjectFull, timesPlayed: number): TopContent {
    const top = {} as TopContent;
    if (obj.type === 'context') {
      obj = obj.content;
    }

    let images: ImageObject[];
    if (obj.type === 'track') {
      images = obj.album.images;
    } else {
      images = obj.images;
    }
    top.imageUrl = images[0]?.url;

    top.title = obj.name;
    top.id = obj.id;
    top.routerLink = this.getContextRouterLink(obj);

    switch (obj.type) {
      case 'artist':
        top.subtitle = null;
        break;
      case 'track':
      case 'album':
        top.subtitle = obj.artists[0].name;
        break;
      case 'playlist':
        top.subtitle = obj.owner.display_name ?? obj.owner.id;
        break;
    }

    top.timesPlayed = timesPlayed;
    return top;
  }
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

type ContentObject = TrackObjectFull | AlbumObjectFull | ArtistObjectFull | PlaylistObjectFull;

export interface Timeframe {
  start: number;
  end: number;
}

export interface HistoryStatsData {
  playbackHistory: PlayHistoryObjectFull[];
  prevPlaybackHistory: PlayHistoryObjectFull[];
  timeframe: Timeframe;
  prevTimeframe: Timeframe;
}
