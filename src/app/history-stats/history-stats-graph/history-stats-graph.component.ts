import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {DataSharingService} from '../../data-sharing.service';
import {EChartsOption} from 'echarts';
import {HttpClient} from '@angular/common/http';
import {StyleManagerService} from '../../style-manager.service';
import {environment} from '../../../environments/environment';
import {StorageService} from '../../storage.service';
import {HistoryStatsData, Timeframe} from '../history-stats.component';

@Component({
  selector: 'app-history-stats-graph',
  templateUrl: './history-stats-graph.component.html',
  styleUrls: ['./history-stats-graph.component.css']
})
export class HistoryStatsGraphComponent implements OnInit {
  @Input() historyStatsData: Observable<HistoryStatsData>;
  timeframe: Timeframe;

  themeIsDark = this.styleService.isDarkStyleActive();
  worker: Worker;

  audioFeaturesOverTimeGraphData: EChartsOption;
  isLoadingAudioFeaturesOverTimeGraphData = true;
  clockGraphData: EChartsOption;
  isLoadingClockGraph = true;
  keyDistributionGraphData: EChartsOption;
  isLoadingKeyGraphData = true;

  constructor(private http: HttpClient, private styleService: StyleManagerService) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./history-stats-graph.worker', import.meta.url), {type: 'module'});
      this.worker.onmessage = ({data}) => this.workerCallback(data);
    }
  }

  ngOnInit(): void {
    this.styleService.currentTheme.subscribe(() => this.themeIsDark = this.styleService.isDarkStyleActive());
    this.historyStatsData.subscribe(historyStatsData => {
      this.isLoadingClockGraph = this.isLoadingAudioFeaturesOverTimeGraphData = this.isLoadingKeyGraphData = true;
      this.timeframe = historyStatsData.timeframe;
      this.worker.postMessage({
        playHistory: historyStatsData.playbackHistory,
        token: StorageService.accessToken,
        timeframe: this.timeframe
      });
      this.getClockGraphData();
    });
  }

  private workerCallback(data: any) {
    switch (data.type) {
      case 'audioFeaturesOverTime': {
        this.audioFeaturesOverTimeGraphData = data.content;
        this.isLoadingAudioFeaturesOverTimeGraphData = false;
        break;
      }
      case 'keyDistribution': {
        this.createKeyDistributionData(data.content);
        break;
      }
    }
  }

  private getClockGraphData(): void {
    this.http.post(environment.APP_SETTINGS.playbackApiBasePath + '/listeningClock', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      access_token: StorageService.accessToken,
      from: this.timeframe.start / 1000,
      to: this.timeframe.end / 1000
    }).subscribe(value => {
      const temp = {};
      for (let i = 0; i < 24; i++) {
        temp[i] = 0;
      }
      let maxRadius = 15;
      // @ts-ignore
      value.forEach(val => {
        if (val.count > maxRadius) {
          maxRadius = Math.ceil(val.count);
        }
        return temp[parseInt(val.hour, 10)] = val.count.toFixed(2);
      });

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
          startAngle: 97.5,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dotted'
            }
          },
          axisTick: {
            alignWithLabel: false,
          }
        },
        tooltip: {
          show: true,
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: '{b}: {c}%'
        },
        radiusAxis: {
          max: maxRadius,
          axisLabel: {
            formatter: '{value}%'
          },
          z: 5
        },
        polar: {
          radius: ['15%', '85%']
        },
        series: [{
          type: 'bar',
          data: Object.values(temp),
          coordinateSystem: 'polar',
          name: 'Songs played',
        }]
      };
      this.isLoadingClockGraph = false;
    });
  }

  private createKeyDistributionData(keyDist: { value: number; name: string }[]): void {
    this.keyDistributionGraphData = {
      title: {
        text: 'Key Distribution'
      },
      backgroundColor: '#00000000',
      toolbox: {
        show: true,
        feature: {
          saveAsImage: {title: 'Save as Image'}
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: params => {
          let tip = `<span style="display:inline-block;
                margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>`;
          tip += `<span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${params.name}</span>`;
          tip += `<span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${params.percent}%</span>`;
          return tip;
        }
      },
      series: [
        {
          type: 'pie',
          radius: '85%',
          label: {
            textBorderColor: '#000',
            textBorderWidth: 0,
          },
          data: keyDist
        }
      ],
    };
    this.isLoadingKeyGraphData = false;
  }
}
