import {Component, Input, OnInit} from '@angular/core';
import {RGBColor} from '../history-stats.component';
import {Observable} from 'rxjs';
import {ColorService} from '@kn685832/spotify-api';

@Component({
  selector: 'app-history-stats-top-content-list',
  templateUrl: './history-stats-top-content-list.component.html',
  styleUrls: ['./history-stats-top-content-list.component.scss']
})
export class HistoryStatsTopContentListComponent implements OnInit {
  @Input() contentList$: Observable<TopContent[]>;
  @Input() circularImage = false;
  contentList: TopContent[] = [];
  topContentAvgColor: RGBColor = null;

  constructor(private colorApi: ColorService) {
  }

  ngOnInit(): void {
    this.contentList$.subscribe(value => {
      this.contentList = value;
      this.getTopContentAvgColor();
    });
  }

  rgbToString(rgb: RGBColor, a: number = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  createLinearGradient(color1: string, color2: string) {
    return `linear-gradient(${color1}, ${color2})`;
  }

  getImageUrl(content: TopContent) {
    return `url(${content.imageUrl})`;
  }

  topContentTrackBy(index: number, item: TopContent): string {
    return item.id;
  }

  getTopContentAvgColor(): void {
    if (this.contentList.length > 0) {
      this.colorApi.getAverageColor(this.contentList[0].imageUrl)
        .subscribe(value => {
          this.topContentAvgColor = value as RGBColor;
        });
    }
  }
}

export interface TopContent {
  id: string;
  routerLink: any[];
  imageUrl: string;
  title: string;
  subtitle: string;
  timesPlayed: number;
}
