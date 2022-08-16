import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ColorService, RGB} from '@kn685832/spotify-api';

@Component({
  selector: 'app-history-stats-top-content-list',
  templateUrl: './history-stats-top-content-list.component.html',
  styleUrls: ['./history-stats-top-content-list.component.scss']
})
export class HistoryStatsTopContentListComponent implements OnInit {
  @Input() contentList$: Observable<MostListenedContent[]>;
  @Input() circularImage = false;
  contentList: MostListenedContent[] = [];
  topContentAvgColor: RGB = null;

  constructor(private colorApi: ColorService) {
  }

  ngOnInit(): void {
    this.contentList$.subscribe(value => {
      this.contentList = value;
      this.getTopContentAvgColor();
    });
  }

  rgbToString(rgb: RGB, a: number = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  createLinearGradient(color1: string, color2: string) {
    return `linear-gradient(${color1}, ${color2})`;
  }

  getImageUrl(content: MostListenedContent) {
    return `url(${content.imageUrl})`;
  }

  topContentTrackBy(index: number, item: MostListenedContent): string {
    return item.id;
  }

  getTopContentAvgColor(): void {
    if (this.contentList.length > 0) {
      this.colorApi.getAverageColor(this.contentList[0].imageUrl)
        .subscribe(color => {
          this.topContentAvgColor = color ;
        });
    }
  }
}

export interface MostListenedContent {
  id: string;
  routerLink: any[];
  imageUrl: string;
  title: string;
  subtitle: string;
  timesPlayed: number;
}
