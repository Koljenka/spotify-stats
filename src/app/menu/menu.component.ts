import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Option} from '../option.model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  @Input() theme: Option;
  @Input() options: Array<Option>;
  @Output() themeChange: EventEmitter<Option> = new EventEmitter<Option>();

  changeTheme(themeToSet: Option): void {
    this.themeChange.emit(themeToSet);
  }
}
