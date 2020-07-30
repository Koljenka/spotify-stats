import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {HttpClientModule} from '@angular/common/http';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {AppRoutingModule} from './app-routing.module';
import {LocationStrategy, PathLocationStrategy} from '@angular/common';
import {OverviewComponent} from './overview/overview.component';
import {HomeComponent} from './home/home.component';
import {CallbackComponent} from './callback/callback.component';
import {TrackComponent} from './track/track.component';
import {SavedTrackListComponent} from './saved-track-list/saved-track-list.component';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSortModule} from '@angular/material/sort';
import {MatRippleModule} from '@angular/material/core';
import {PlaylistTrackListComponent} from './playlist-track-list/playlist-track-list.component';
import {MatDividerModule} from '@angular/material/divider';
import {TrackHistoryComponent} from './track-history/track-history.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgxEchartsModule} from 'ngx-echarts';
import {HistoryStatsComponent} from './history-stats/history-stats.component';
import {MatGridListModule} from '@angular/material/grid-list';
import {LayoutModule} from '@angular/cdk/layout';

@NgModule({
  declarations: [
    OverviewComponent,
    HomeComponent,
    CallbackComponent,
    TrackComponent,
    SavedTrackListComponent,
    PlaylistTrackListComponent,
    TrackHistoryComponent,
    HistoryStatsComponent
  ],
  imports: [
    BrowserModule,
    LayoutModule,
    AppRoutingModule,
    HttpClientModule,
    MatButtonModule,
    MatGridListModule,
    MatToolbarModule,
    MatTooltipModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatRippleModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    NgxEchartsModule.forRoot({echarts: () => import('echarts')}),
    BrowserAnimationsModule,
  ],
  providers: [{provide: LocationStrategy, useClass: PathLocationStrategy}],
  bootstrap: [OverviewComponent]
})
export class AppModule {
}
