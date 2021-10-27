import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {CallbackComponent} from './callback/callback.component';
import {TrackOldComponent} from './track-old/track-old.component';
import {SavedTrackListComponent} from './saved-track-list/saved-track-list.component';
import {PlaylistTrackListComponent} from './playlist-track-list/playlist-track-list.component';
import {TrackHistoryComponent} from './track-history/track-history.component';
import {HistoryStatsComponent} from './history-stats/history-stats.component';
import {LoginGuard} from './login.guard';
import {AlbumTrackListComponent} from './album-track-list/album-track-list.component';
import {TrackMainComponent} from './track/main/track-main.component';

const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'callback', component: CallbackComponent},
  {path: 'track/:trackId', component: TrackMainComponent, canActivate: [LoginGuard]},
  {path: 'track/:trackId/:contextUri', component: TrackMainComponent, canActivate: [LoginGuard]},
  {path: 'track-history', component: TrackHistoryComponent, canActivate: [LoginGuard]},
  {path: 'saved-track-list', component: SavedTrackListComponent, canActivate: [LoginGuard]},
  {path: 'history-stats', component: HistoryStatsComponent, canActivate: [LoginGuard]},
  {path: 'playlist-track-list/:playlistId', component: PlaylistTrackListComponent, canActivate: [LoginGuard]},
  {path: 'album-track-list/:albumId', component: AlbumTrackListComponent, canActivate: [LoginGuard]},
  {path: '**', redirectTo: '/home', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
