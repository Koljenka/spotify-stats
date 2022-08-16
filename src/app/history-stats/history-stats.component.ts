import {Component, OnInit, ViewChild} from '@angular/core';
import {ContextObjectFull, DataSharingService, PlayHistoryObjectFull} from '../data-sharing.service';
import {Title} from '@angular/platform-browser';
import {StorageService} from '../storage.service';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MatDateRangeInput} from '@angular/material/datepicker';
import {FormControl, FormGroup} from '@angular/forms';
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
import {lastValueFrom, Subject} from 'rxjs';
import {MostListenedContent} from './history-stats-top-content-list/history-stats-top-content-list.component';
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import ImageObject = SpotifyApi.ImageObject;
import {
  PlayHistory,
  StatisticsService, Timeframe
} from '@kn685832/spotify-api';
import moment, {Moment} from 'moment';


@Component({
  selector: 'app-history-stats',
  templateUrl: './history-stats.component.html',
  styleUrls: ['./history-stats.component.css'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'de'},
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

  playbackHistory: PlayHistory[];
  historyStatsData = new Subject<HistoryStatsData>();

  worker: Worker;
  topArtists = new Subject<MostListenedContent[]>();
  topAlbums = new Subject<MostListenedContent[]>();
  topTracks = new Subject<MostListenedContent[]>();
  topContexts = new Subject<MostListenedContent[]>();
  theme: Option;
  themeIsDark = false;
  range = new FormGroup({
    start: new FormControl<Moment>(moment().startOf('isoWeek')),
    end: new FormControl<Moment>(moment())
  });
  links = ['Last 7 days', 'Last month', 'Last year', 'All time'];
  lastLink = 'latLink';
  activeLink = this.links[0];
  dateRange: {start: Moment; end: Moment} = null;
  prevDateRange: {start: Moment; end: Moment} = null;

  private isInitialized = false;
  private isFirstCallback = true;

  constructor(public dataSharing: DataSharingService,
              private titleService: Title,
              private styleService: StyleManagerService,
              private statsApi: StatisticsService) {
    if (typeof Worker !== 'undefined') {
      moment.locale('de');
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

    this.dataSharing.playbackHistory.then(history => {
      this.playbackHistory = history;
      this.onLinkChanged();
    });

    this.range.valueChanges.pipe(debounceTime(200)).subscribe(this.onRangeChanged.bind(this));
    this.isInitialized = true;
  }

  onLinkChanged(): void {
    let start = moment();
    let end = moment();
    let prevStart = null;
    this.clearStats();
    switch (this.activeLink) {
      case this.links[0]:
        start.subtract(7, 'days').startOf('day');
        prevStart = moment(start).subtract(7, 'days');
        break;
      case this.links[1]:
        start.subtract(1, 'month').startOf('month');
        end = moment(start).endOf('month');
        prevStart = moment(start).subtract(1, 'month');
        break;
      case this.links[2]:
        start.subtract(1, 'year').startOf('year');
        end = moment(start).endOf('year');
        prevStart = moment(start).subtract(1, 'year');
        break;
      case this.links[3]:
        start = moment.unix(this.playbackHistory[this.playbackHistory.length - 1].playedAt);
        break;
      case this.lastLink:
        this.onRangeChanged(this.range.value);
        return;
    }
    this.dateRange = {start, end};
    const timeframe: Timeframe = {start: start.unix(), end: end.unix()};
    const prevTimeframe = {start: 0, end: 0};
    if (prevStart !== null) {
      prevTimeframe.start = prevStart.unix();
      prevTimeframe.end = moment(start).subtract(1, 'minute').unix();
      this.prevDateRange = {start: prevStart, end: moment(start).subtract(1, 'minute')};
    }
    this.loadStatsForTimeframe(timeframe, prevTimeframe);
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

  private clearStats(): void {
    this.historyStatsData.next(null);
    this.topArtists.next([]);
    this.topAlbums.next([]);
    this.topTracks.next([]);
    this.topContexts.next([]);
  }

  private onRangeChanged({start, end}: { start?: Moment; end?: Moment }): void {
    if (this.isInitialized && !this.isFirstCallback &&
      end != null && start != null &&
      start.isValid() && end.isValid() &&
      start.isBefore(end)) {
      this.clearStats();
      end.endOf('day');
      const prevDateFrame = {
        start: moment(start).subtract(end.diff(start, 'days') + 1, 'days'),
        end: moment(start).subtract(1, 'day').endOf('day')
      };
      const prevTimeframe = {start: 0, end: 0};
      prevTimeframe.start = prevDateFrame.start.unix();
      prevTimeframe.end = prevDateFrame.end.unix();

      this.loadStatsForTimeframe({start: start.unix(), end: end.unix()}, prevTimeframe);
    }
    this.isFirstCallback = false;
  }

  private async loadStatsForTimeframe(timeframe: Timeframe, prevTimeframe: Timeframe): Promise<void> {
    const playHistory = this.playbackHistory.filter(v => v.playedAt >= timeframe.start && v.playedAt <= timeframe.end);
    const prevPlaybackHistory = this.playbackHistory.filter(v => v.playedAt >= prevTimeframe.start && v.playedAt <= prevTimeframe.end);

    await this.getTopTracks(timeframe);
    await this.getTopContexts(timeframe);
    await this.getTopArtists(timeframe);

    await this.dataSharing.getHistoryObjectFull(playHistory.concat(...prevPlaybackHistory));

    const playbackHistoryFull: PlayHistoryObjectFull[] = await this.dataSharing.getHistoryObjectFull(playHistory);

    this.worker.postMessage({
      tracks: playbackHistoryFull.map(t => t.track),
      token: StorageService.accessToken,
    });

    this.historyStatsData.next({
      playbackHistory: playbackHistoryFull,
      prevPlaybackHistory: await this.dataSharing.getHistoryObjectFull(prevPlaybackHistory),
      timeframe,
      prevTimeframe
    });
  }

  private async getTopTracks(timeframe: Timeframe): Promise<void> {
    const topTrackIds = await lastValueFrom(this.statsApi.getTopTracks(StorageService.accessToken, timeframe.start, timeframe.end));
    await this.dataSharing.getFullTracks(topTrackIds.map(v => v.id));
    const topTracksContent = topTrackIds.map(v => this.contentObjectToTopContent(this.dataSharing.trackMap.get(v.id), v.count));
    this.topTracks.next(topTracksContent);
  }

  private async getTopContexts(timeframe: Timeframe): Promise<void> {
    const topContextIds = await lastValueFrom(this.statsApi.getTopContexts(StorageService.accessToken, timeframe.start, timeframe.end));
    await this.dataSharing.getFullContexts(topContextIds.map(v => v.id));
    const topContextContent = topContextIds.map(v => this.contentObjectToTopContent(this.dataSharing.contextMap.get(v.id), v.count));
    this.topContexts.next(topContextContent);
  }

  private async getTopArtists(timeframe: Timeframe): Promise<void> {
    const topArtistIds = await lastValueFrom(this.statsApi.getTopArtists(StorageService.accessToken, timeframe.start, timeframe.end));
    await this.dataSharing.getFullArtists(topArtistIds.map(v => v.id));
    const topArtistsContent = topArtistIds.map(v => this.contentObjectToTopContent(this.dataSharing.artistMap.get(v.id), v.count));
    this.topArtists.next(topArtistsContent);
  }

  private workerCallback(data): void {
    const top = data.map(v => this.contentObjectToTopContent(v.obj, v.count));
    this.topAlbums.next(top);
  }

  private contentObjectToTopContent(obj: ContentObject | ContextObjectFull, timesPlayed: number): MostListenedContent {
    const top = {} as MostListenedContent;
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

type ContentObject = TrackObjectFull | AlbumObjectFull | ArtistObjectFull | PlaylistObjectFull;

export interface HistoryStatsData {
  playbackHistory: PlayHistoryObjectFull[];
  prevPlaybackHistory: PlayHistoryObjectFull[];
  timeframe: Timeframe;
  prevTimeframe: Timeframe;
}
