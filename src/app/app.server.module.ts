import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import {OverviewComponent} from './overview/overview.component';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
  ],
  bootstrap: [OverviewComponent],
})
export class AppServerModule {}
