import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LOCALE_ID, NgModule} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {HttpClientModule} from '@angular/common/http';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {AppRoutingModule} from './app-routing.module';
import {CommonModule, LocationStrategy, PathLocationStrategy, registerLocaleData} from '@angular/common';
import {OverviewComponent} from './overview/overview.component';
import {HomeComponent} from './home/home.component';
import {CallbackComponent} from './callback/callback.component';
import {TrackOldComponent} from './track-old/track-old.component';
import {SavedTrackListComponent} from './saved-track-list/saved-track-list.component';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSortModule} from '@angular/material/sort';
import {MatNativeDateModule, MatRippleModule} from '@angular/material/core';
import {PlaylistTrackListComponent} from './playlist-track-list/playlist-track-list.component';
import {MatDividerModule} from '@angular/material/divider';
import {TrackHistoryComponent} from './track-history/track-history.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgxEchartsModule} from 'ngx-echarts';
import {HistoryStatsComponent} from './history-stats/history-stats.component';
import {MatGridListModule} from '@angular/material/grid-list';
import {LayoutModule} from '@angular/cdk/layout';
import {MatListModule} from '@angular/material/list';
import {LoginGuard} from './login.guard';
import {MenuComponent} from './menu/menu.component';
import {StyleManagerService} from './style-manager.service';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {PlaylistCardComponent} from './playlist-card/playlist-card.component';
import {AlbumCardComponent} from './album-card/album-card.component';
import {TrackListComponent} from './track-list/track-list.component';
import {AlbumTrackListComponent} from './album-track-list/album-track-list.component';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {ReactiveFormsModule} from '@angular/forms';
import {MatTabsModule} from '@angular/material/tabs';
import localeDe from '@angular/common/locales/de';
import { TrackListHeaderComponent } from './track-list-header/track-list-header.component';
import {NgScrollbarModule} from 'ngx-scrollbar';
import { TrackMainComponent } from './track/main/track-main.component';
import { TrackHeaderComponent } from './track/track-header/track-header.component';

registerLocaleData(localeDe);

@NgModule({
  declarations: [
    OverviewComponent,
    HomeComponent,
    CallbackComponent,
    TrackOldComponent,
    SavedTrackListComponent,
    PlaylistTrackListComponent,
    TrackHistoryComponent,
    HistoryStatsComponent,
    MenuComponent,
    PlaylistCardComponent,
    AlbumCardComponent,
    TrackListComponent,
    AlbumTrackListComponent,
    TrackListHeaderComponent,
    TrackMainComponent,
    TrackHeaderComponent,
  ],
  imports: [
    BrowserModule,
    LayoutModule,
    CommonModule,
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
    MatTabsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatRippleModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
    MatDatepickerModule,
    NgxEchartsModule.forRoot({echarts: () => import('echarts')}),
    BrowserAnimationsModule,
    MatListModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    NgScrollbarModule,
  ],
  providers: [
    {provide: LocationStrategy, useClass: PathLocationStrategy},
    LoginGuard,
    StyleManagerService,
    {provide: LOCALE_ID, useValue: 'de'}
  ],
  bootstrap: [OverviewComponent]
})
export class AppModule {
}
