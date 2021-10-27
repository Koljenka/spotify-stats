import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';

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

  currentSlideIndex = -1;

  constructor() {
  }

  ngOnInit(): void {
    this.currentSlideIndex++;
  }

  getTransform(): string {
    return `translateX(-${this.currentSlideIndex * 20}%)`;
  }

  slide(direction: number) {
    this.currentSlideIndex = (this.currentSlideIndex + direction + 5) % 5;
  }

}
