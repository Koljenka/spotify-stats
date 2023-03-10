import {Component, OnInit} from '@angular/core';
import {environment} from '../../../environments/environment';
import {StorageService} from '../../storage.service';
import {ApiConnectionService} from '../../api-connection.service';
import {DataSharingService} from '../../data-sharing.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TrackService} from '@kn685832/spotify-api';
import {lastValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrls: ['./actions.component.css']
})
export class ActionsComponent implements OnInit {
  private monthlyTopSongsPlaylistTitle = 'Monthly Top Songs';

  private base64Img;

  constructor(private http: HttpClient, private api: ApiConnectionService,
              private dataSharing: DataSharingService, private snackbar: MatSnackBar, private trackApi: TrackService) {
  }

  ngOnInit(): void {
    this.getMonthlyTopSongsPlaylistImage();
  }


  async createMonthlyTopPlaylist(): Promise<void> {
    const monthlyTopTracks = await lastValueFrom(this.trackApi.getTopTrackForEachMonth(StorageService.accessToken));

    const monthlyTopTrackIds: string[] = [...new Set(monthlyTopTracks.map(t => 'spotify:track:' + t.trackId))];
    const monthlyTopPlaylistId = await this.getMonthlyTopPlaylistId();
    await this.api.getApi().replaceTracksInPlaylist(monthlyTopPlaylistId, monthlyTopTrackIds);
    await this.api.getApi().uploadCustomPlaylistCoverImage(monthlyTopPlaylistId, this.base64Img);
    this.snackbar.open(`Playlist '${this.monthlyTopSongsPlaylistTitle}' was created.`, 'Close');
  }

  private async getMonthlyTopPlaylistId(): Promise<string> {
    const playlists = await this.dataSharing.getAllUserPlaylists();
    let topPlaylist = playlists.find(p => p.name === this.monthlyTopSongsPlaylistTitle);
    if (topPlaylist === undefined) {
      topPlaylist = await this.api.getApi().createPlaylist(this.api.userId, {
        name: this.monthlyTopSongsPlaylistTitle,
        public: false,
        description: 'All your top songs from each month in one place'
      });
    }
    return topPlaylist.id;
  }

  private getMonthlyTopSongsPlaylistImage() {
    this.http.get(`${environment.APP_SETTINGS.assetsBasePath}monthly-top.jpg`, {responseType: 'blob'})
      .subscribe(data => {
        reader.onload = (event) => {
          this.base64Img = event.target.result;
        };
        // @ts-ignore
        reader.readAsDataURL(data);
      });

    const reader = new FileReader();
  }
}
