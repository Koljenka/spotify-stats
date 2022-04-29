import {Component, OnInit, ViewChild} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {Title} from '@angular/platform-browser';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
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
import {UnleashService} from '../unleash.service';
import {ApiPlaybackHistoryObject} from '../stat-api-util/ApiPlaybackHistoryObject';


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
  mapGraphData: any;

  private isInitialized = false;
  private isFirstCallback = true;

  constructor(private http: HttpClient, public dataSharing: DataSharingService,
              private titleService: Title,
              private styleService: StyleManagerService,
              private toggle: UnleashService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./history-stats.worker', {type: 'module'});
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
    this.topArtists = this.topAlbums = this.topTracks = this.topContexts = [];
    this.smallStatCardStats = [];
    for (let i = 0; i < 10; i++) {
      this.smallStatCardStats.push({
        id: i, heading: '', icon: '', stat: {prevTimeframe: {end: 0, start: 0}, prevValue: 0, value: null}
      });
    }
    this.isLoadingGraph = true;
    this.isLoadingClockGraph = true;
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
    this.getSmallStats(from, to, previousFrom, previousTo);
    this.getClockGraphData(from, to);
    this.getStreak(from, to);
    this.worker.postMessage({
      playHistory: this.playbackHistory,
      token: StorageService.accessToken,
      timeframe: {start: from, end: to},
      prevTimeframe: {start: previousFrom, end: previousTo}
    });
    this.toggle.isEnabledAsync('artist_map').then(value => {
      if (value) {
        this.createMapGraph();
      }
    });
  }

  private workerCallback(data): void {
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
      case 'graph': {
        this.options = data.content;
        this.isLoadingGraph = false;
        break;
      }
    }
  }

  private getSmallStats(from: number, to: number, prevFrom: number, prevTo: number) {
    this.getTotalTracksStat(from, to, prevFrom, prevTo);
    this.getUniqueTracksStat(from, to, prevFrom, prevTo);
    this.getMostActiveDay(from, to, prevFrom, prevTo);
    this.http.post(environment.APP_SETTINGS.songStatApiBasePath + '/smallStats', {
      accessToken: StorageService.accessToken,
      playbackHistory: this.playbackHistory.map(pb => ApiPlaybackHistoryObject.fromSpotifyPlaybackHistoryObject(pb)),
      timeframe: {start: from, end: to},
      prevTimeframe: {start: prevFrom, end: prevTo}
    })
      .subscribe(response => {
        console.log(response);
        // @ts-ignore
        for (const stat of response.content) {
          this.smallStatCardStats[stat.id] = stat;
        }

      });
  }

  private getTotalTracksStat(from: number, to: number, prevFrom: number, prevTo: number): void {
    this.smallStatCardStats[0] = {
      id: 0,
      heading: 'Total Tracks',
      icon: 'music_note',
      stat: {
        value: '-',
        prevTimeframe: {start: prevFrom, end: prevTo},
        prevValue: '-'
      }
    };
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/totalTracks', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: from / 1000,
      to: to / 1000
    }).subscribe(value => {
      this.smallStatCardStats[0].stat.value = value[0].count;
      }
    );
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/totalTracks', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: prevFrom / 1000,
      to: prevTo / 1000
    }).subscribe(value => {
      this.smallStatCardStats[0].stat.prevValue = 'vs. ' + value[0].count;
      }
    );
  }

  private getUniqueTracksStat(from: number, to: number, prevFrom: number, prevTo: number): void {
    this.smallStatCardStats[1] = {
      id: 1,
      heading: 'Unique Tracks',
      icon: 'music_note',
      stat: {
        value: '-',
        prevTimeframe: {start: prevFrom, end: prevTo},
        prevValue: '-'
      }
    };
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/uniqueTracks', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: from / 1000,
      to: to / 1000
    }).subscribe(value => {
        this.smallStatCardStats[1].stat.value = value[0].count;
      }
    );
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/uniqueTracks', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: prevFrom / 1000,
      to: prevTo / 1000
    }).subscribe(value => {
        this.smallStatCardStats[1].stat.prevValue = 'vs. ' + value[0].count;
      }
    );
  }

  private getMostActiveDay(from: number, to: number, prevFrom: number, prevTo: number): void {
    this.smallStatCardStats[5] = {
      id: 5,
      heading: 'Most Active Day',
      icon: 'event',
      stat: {
        value: '-',
        prevTimeframe: {start: prevFrom, end: prevTo},
        prevValue: '-'
      }
    };
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/mostActiveDay', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: from / 1000,
      to: to / 1000
    }).subscribe(value => {
        this.smallStatCardStats[5].stat.value = value[0].date + ' (' + value[0].count + ')';
      }
    );
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/mostActiveDay', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: prevFrom / 1000,
      to: prevTo / 1000
    }).subscribe(value => {
        this.smallStatCardStats[5].stat.prevValue = 'vs. ' + value[0].date + ' (' + value[0].count + ')';
      }
    );
  }

  private getStreak(from: number, to: number): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/streak', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: from / 1000,
      to: to / 1000
    }).subscribe(value => {
        this.smallStatCardStats[9] = {
          id: 9,
          heading: 'Longest Streak',
          icon: 'date_range',
          stat: {
            value: value[0].days + ' days',
            prevTimeframe: {start: 10, end: 10},
            prevValue: new Date(value[0].start).toLocaleDateString() + ' - ' + new Date(value[0].end).toLocaleDateString()
          }
        };
      }
    );
  }

  private getClockGraphData(from: number, to: number): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/listeningClock', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: from / 1000,
      to: to / 1000
    }).subscribe(value => {
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
          data: Object.keys(temp),
        },
        tooltip: {
          show: true,
        },
        radiusAxis: {
          z: 5
        },
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

  private createMapGraph(): void {
    const artists = [];
    const links = [];
    let currInd = 0;
    const trackArtists = this.playbackHistory.filter(val => val.track.artists.length > 1).map(a => a.track.artists);
    trackArtists.forEach(artistsOfTrack => {
      artistsOfTrack.forEach(artist => {
        if (!artists.map(va => va.artistId).includes(artist.id)) {
          artists.push({
            id: currInd++,
            artistId: artist.id,
            name: artist.name,
            value: 0
          });
        }
      });
    });
    trackArtists.forEach(artistsOfTrack => {
      const tempLinks = artistsOfTrack.sort().reduce(
        (acc, item, i, arr) => acc.concat(
          arr.slice(i + 1).map(secondItem => [item, secondItem])
        ), []);
      tempLinks.forEach(lin => {
        const artist1 = artists.filter(artist => artist.artistId === lin[0].id)[0];
        const artist2 = artists.filter(artist => artist.artistId === lin[1].id)[0];
        const tempLink = artist1.id + '|' + artist2.id;
        const inverse = artist2.id + '|' + artist1.id;

        if (!links.includes(tempLink) && !links.includes(inverse)) {
          artist1.value++;
          artist2.value++;
          links.push(tempLink);
        }

      });
    });
    const edges = links.map(a => (
      {
        source: a.split('|')[0],
        target: a.split('|')[1]
      }
    ));
    this.mapGraphData = {
      backgroundColor: '#00000000',
      title: {
        text: 'Artist Map'
      },
      tooltip: {},
      series: [{
        type: 'graph',
        layout: 'force',
        animation: false,
        roam: true,
        draggable: false,
        data: artists,
        force: {
          edgeLength: 2,
          friction: 0.5,
          repulsion: 50,
        },
        edges
      }]
    };
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
    prevValue: number | string;
  };
}
