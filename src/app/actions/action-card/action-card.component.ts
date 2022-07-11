import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-action-card',
  templateUrl: './action-card.component.html',
  styleUrls: ['./action-card.component.css']
})
export class ActionCardComponent implements OnInit {
  @Input() title: string;
  @Input() description: string;
  @Input() showNegativeAction = false;
  @Input() positiveActionTitle = 'Create';
  @Input() negativeActionTitle = 'Delete';

  @Output() positiveAction = new EventEmitter<void>();
  @Output() negativeAction = new EventEmitter<void>();

  constructor() {
  }

  ngOnInit(): void {
  }
}
