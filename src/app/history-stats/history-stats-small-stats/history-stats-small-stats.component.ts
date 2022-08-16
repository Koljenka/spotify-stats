import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {HistoryStatsData} from '../history-stats.component';
import {StyleManagerService} from '../../style-manager.service';
import {Option} from '../../option.model';
import {StorageService} from '../../storage.service';
import {
  SmallStat,
  SmallStatRequest,
  SmallStatsService,
  StatisticsService,
  Timeframe,
  TrackService
} from '@kn685832/spotify-api';
import {fromSpotifyPlaybackHistoryObject} from '../../stat-api-util/ApiPlaybackHistoryObject';

@Component({
  selector: 'app-history-stats-small-stats',
  templateUrl: './history-stats-small-stats.component.html',
  styleUrls: ['./history-stats-small-stats.component.css']
})
export class HistoryStatsSmallStatsComponent implements OnInit {
  @Input() historyStatsData: Observable<HistoryStatsData>;

  smallStatCardStats: SmallCardStat[] = [];
  theme: Option;


  constructor(private statsApi: StatisticsService, private smallStatApi: SmallStatsService, private trackApi: TrackService,
              private styleService: StyleManagerService) {
    this.clearStats();
  }

  ngOnInit(): void {
    this.styleService.currentTheme.subscribe(theme => this.theme = theme);
    this.historyStatsData.subscribe(historyData => {
      this.clearStats();
      if (historyData === null) {
        return;
      }
      this.getSmallStats(historyData);
      this.getStreak(historyData.timeframe);
    });
  }

  private clearStats() {
    this.smallStatCardStats = [];
    for (let i = 0; i < 10; i++) {
      this.smallStatCardStats.push({
        id: i, heading: '', icon: '', stat: {prevTimeframe: {end: 0, start: 0}, prevValue: '0', value: null}
      });
    }
  }

  private getSmallStats({playbackHistory, prevPlaybackHistory, prevTimeframe, timeframe}: HistoryStatsData) {
    const sTimeframe = this.msTimeframeToS(timeframe);
    const prevSTimeframe = this.msTimeframeToS(prevTimeframe);
    this.getTotalTracksStat(sTimeframe, prevSTimeframe);
    this.getUniqueTracksStat(sTimeframe, prevSTimeframe);
    this.getMostActiveDay(sTimeframe, prevSTimeframe);
    const fullHistory = (playbackHistory.concat(...prevPlaybackHistory)).map(ph => fromSpotifyPlaybackHistoryObject(ph));
    const smallStatRequest: SmallStatRequest = {
      playbackHistory: fullHistory,
      prevTimeframe,
      timeframe,
      accessToken: StorageService.accessToken
    };
    this.smallStatApi.getTimeSpent(smallStatRequest).subscribe(this.smallStatObserver.bind(this));
    this.smallStatApi.getListeningTime(smallStatRequest).subscribe(this.smallStatObserver.bind(this));
    this.smallStatApi.getUniqueArtistStat(smallStatRequest).subscribe(this.smallStatObserver.bind(this));
    this.smallStatApi.getAverageFeatureStat('danceability', smallStatRequest).subscribe(this.smallStatObserver.bind(this));
    this.smallStatApi.getAverageFeatureStat('energy', smallStatRequest).subscribe(this.smallStatObserver.bind(this));
    this.smallStatApi.getAverageFeatureStat('valence', smallStatRequest).subscribe(this.smallStatObserver.bind(this));
  }

  private smallStatObserver(stat: SmallStat) {
    this.smallStatCardStats[stat.id] = stat;
  }

  private getTotalTracksStat(timeframe: Timeframe, prevTimeframe: Timeframe): void {
    this.smallStatCardStats[0] = {
      id: 0,
      heading: 'Total Tracks',
      icon: 'music_note',
      stat: {
        value: '-',
        prevTimeframe,
        prevValue: '-'
      }
    };

    this.trackApi.getTotalTracks(StorageService.accessToken, timeframe.start, timeframe.end)
      .subscribe(value => this.smallStatCardStats[0].stat.value = value.count.toString(10));

    this.trackApi.getTotalTracks(StorageService.accessToken, prevTimeframe.start, prevTimeframe.end)
      .subscribe(value => this.smallStatCardStats[0].stat.prevValue = 'vs. ' + value.count);
  }

  private getUniqueTracksStat(timeframe: Timeframe, prevTimeframe: Timeframe): void {
    this.smallStatCardStats[1] = {
      id: 1,
      heading: 'Unique Tracks',
      icon: 'music_note',
      stat: {
        value: '-',
        prevTimeframe,
        prevValue: '-'
      }
    };

    this.trackApi.getUniqueTracks(StorageService.accessToken, timeframe.start, timeframe.end)
      .subscribe(value => this.smallStatCardStats[1].stat.value = value.count.toString(10));

    this.trackApi.getUniqueTracks(StorageService.accessToken, prevTimeframe.start, prevTimeframe.end)
      .subscribe(value => this.smallStatCardStats[1].stat.prevValue = 'vs. ' + value.count);
  }

  private getMostActiveDay(timeframe: Timeframe, prevTimeframe: Timeframe): void {
    this.smallStatCardStats[5] = {
      id: 5,
      heading: 'Most Active Day',
      icon: 'event',
      stat: {
        value: '-',
        prevTimeframe,
        prevValue: '-'
      }
    };

    this.statsApi.getMostActiveDay(StorageService.accessToken, timeframe.start, timeframe.end)
      .subscribe(value => this.smallStatCardStats[5].stat.value = value.date + ' (' + value.count + ')');

    this.statsApi.getMostActiveDay(StorageService.accessToken, prevTimeframe.start, prevTimeframe.end)
      .subscribe(value => this.smallStatCardStats[5].stat.prevValue = 'vs. ' + value.date + ' (' + value.count + ')');
  }

  private getStreak(timeframe: Timeframe): void {
    timeframe = this.msTimeframeToS(timeframe);
    this.statsApi.getStreak(StorageService.accessToken, timeframe.start, timeframe.end).subscribe(value => {
      this.smallStatCardStats[9] = {
        id: 9,
        heading: 'Longest Streak',
        icon: 'date_range',
        stat: {
          value: value.days + ' days',
          prevTimeframe: {start: 10, end: 10},
          prevValue: new Date(value.start).toLocaleDateString() + ' - ' + new Date(value.end).toLocaleDateString()
        }
      };
    });
  }

  private msTimeframeToS(timeframe: Timeframe): Timeframe {
    return {start: Math.round(timeframe.start ), end: Math.round(timeframe.end)};
  }
}

export type SmallCardStat = SmallStat;
