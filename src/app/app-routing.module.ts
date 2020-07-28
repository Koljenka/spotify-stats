import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {CallbackComponent} from './callback/callback.component';
import {TrackComponent} from './track/track.component';
import {SavedTrackListComponent} from './saved-track-list/saved-track-list.component';
import {PlaylistTrackListComponent} from './playlist-track-list/playlist-track-list.component';
import {TrackHistoryComponent} from './track-history/track-history.component';

const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'callback', component: CallbackComponent},
  {path: 'track/:trackId', component: TrackComponent},
  {path: 'track-history', component: TrackHistoryComponent},
  {path: 'saved-track-list', component: SavedTrackListComponent},
  {path: 'playlist-track-list/:playlistId', component: PlaylistTrackListComponent},
  {path: '**', redirectTo: '/home', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
