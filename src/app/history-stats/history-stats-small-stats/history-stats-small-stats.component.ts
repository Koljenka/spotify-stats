import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {HistoryStatsData, Timeframe} from '../history-stats.component';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {StorageService} from '../../storage.service';
import {ApiPlaybackHistoryObject} from '../../stat-api-util/ApiPlaybackHistoryObject';
import {StyleManagerService} from '../../style-manager.service';
import {Option} from '../../option.model';
import {
  CountApiResponse,
  MostActiveDayApiResponse,
  PlaybackApiService,
  StreakApiResponse
} from '../../playback-api.service';

@Component({
  selector: 'app-history-stats-small-stats',
  templateUrl: './history-stats-small-stats.component.html',
  styleUrls: ['./history-stats-small-stats.component.css']
})
export class HistoryStatsSmallStatsComponent implements OnInit {
  @Input() historyStatsData: Observable<HistoryStatsData>;
  smallStatCardStats: SmallCardStat[] = [];
  theme: Option;


  constructor(private playbackApi: PlaybackApiService, private http: HttpClient, private styleService: StyleManagerService) {
    this.clearStats();
  }

  ngOnInit(): void {
    this.styleService.currentTheme.subscribe(theme => this.theme = theme);
    this.historyStatsData.subscribe(historyData => {
      this.clearStats();
      this.getSmallStats(historyData);
      this.getStreak(historyData.timeframe);
    });
  }

  private clearStats() {
    this.smallStatCardStats = [];
    for (let i = 0; i < 10; i++) {
      this.smallStatCardStats.push({
        id: i, heading: '', icon: '', stat: {prevTimeframe: {end: 0, start: 0}, prevValue: 0, value: null}
      });
    }
  }

  private getSmallStats({playbackHistory, prevPlaybackHistory, prevTimeframe, timeframe}: HistoryStatsData) {
    this.getTotalTracksStat(timeframe, prevTimeframe);
    this.getUniqueTracksStat(timeframe, prevTimeframe);
    this.getMostActiveDay(timeframe, prevTimeframe);
    this.http.post(environment.APP_SETTINGS.songStatApiBasePath + '/smallStats', {
      accessToken: StorageService.accessToken,
      playbackHistory: playbackHistory.concat(...prevPlaybackHistory)
        .map(pb => ApiPlaybackHistoryObject.fromSpotifyPlaybackHistoryObject(pb)),
      prevTimeframe,
      timeframe,

    })
      .subscribe(response => {
        console.log(response);
        // @ts-ignore
        for (const stat of response.content) {
          this.smallStatCardStats[stat.id] = stat;
        }
      });
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

    this.playbackApi.callApiWithTimeframe<CountApiResponse>('totalTracks', timeframe)
      .subscribe(value => this.smallStatCardStats[0].stat.value = value[0].count);

    this.playbackApi.callApiWithTimeframe<CountApiResponse>('totalTracks', prevTimeframe)
      .subscribe(value => this.smallStatCardStats[0].stat.prevValue = 'vs. ' + value[0].count);
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

    this.playbackApi.callApiWithTimeframe<CountApiResponse>('uniqueTracks', timeframe)
      .subscribe(value => this.smallStatCardStats[1].stat.value = value[0].count);

    this.playbackApi.callApiWithTimeframe<CountApiResponse>('uniqueTracks', prevTimeframe)
      .subscribe(value => this.smallStatCardStats[1].stat.prevValue = 'vs. ' + value[0].count);
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

    this.playbackApi.callApiWithTimeframe<MostActiveDayApiResponse>('mostActiveDay', timeframe)
      .subscribe(value => this.smallStatCardStats[5].stat.value = value[0].date + ' (' + value[0].count + ')');

    this.playbackApi.callApiWithTimeframe<MostActiveDayApiResponse>('mostActiveDay', prevTimeframe)
      .subscribe(value => this.smallStatCardStats[5].stat.prevValue = 'vs. ' + value[0].date + ' (' + value[0].count + ')');
  }

  private getStreak(timeframe: Timeframe): void {
    this.playbackApi.callApiWithTimeframe<StreakApiResponse>('streak', timeframe).subscribe(value => {
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
    });
  }
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
