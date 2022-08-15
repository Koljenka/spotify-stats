import {Component, Input, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {BoxStat} from '@kn685832/spotify-api';

@Component({
  selector: 'app-stat-slider',
  templateUrl: './stat-slider.component.html',
  styleUrls: ['./stat-slider.component.scss'],
  animations: [
    trigger('openClose', [
      state('open', style({
        transform: '*',
        opacity: 1
      })),
      state('closed', style({
        transform: 'translateX(-75%)',
        opacity: 0
      })),
      transition('* => *', [
        animate('0.6s ease-in-out')
      ]),
    ]),
  ],
})
export class StatSliderComponent implements OnInit {

  @Input() stats: BoxStat[];

  currentSlideIndex = -1;
  private intervalId = -1;

  constructor() {
  }

  ngOnInit(): void {
    this.currentSlideIndex++;
    this.resetInterval();
  }

  getTransform(): string {
    return `translateX(-${this.currentSlideIndex * (100 / this.stats.length)}%)`;
  }

  slide(direction: number) {
    this.currentSlideIndex = (this.currentSlideIndex + direction + this.stats.length) % this.stats.length;
    this.resetInterval();
  }

  private resetInterval() {
    if (this.intervalId !== -1) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => this.slide(1), 10000);
  }
}
