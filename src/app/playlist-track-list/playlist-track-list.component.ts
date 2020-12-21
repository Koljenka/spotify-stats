import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import {TrackListComponent} from '../track-list/track-list.component';

@Component({
  selector: 'app-playlist-track-list',
  templateUrl: './playlist-track-list.component.html',
  styleUrls: ['./playlist-track-list.component.css']
})
export class PlaylistTrackListComponent implements OnInit {
  playlistId: string;
  playlistTracks: PlaylistTrackObject[] = [];

  @ViewChild(TrackListComponent, {static: true}) trackListComponent: TrackListComponent;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute) {
    this.playlistId = this.route.snapshot.params.playlistId;
  }

  ngOnInit(): void {
    this.api.getApi().getPlaylist(this.playlistId).then(value => {
      this.trackListComponent.setTitle(value.name + ' - SpotifyStats');
    });

    this.getPlaylistTracksTracks(0, 50).then(() => {
      this.trackListComponent.setDidFinishLoading(true);
    });
  }

  async getPlaylistTracksTracks(offset: number, limit: number): Promise<void> {
    await this.api.getApi().getPlaylistTracks(this.playlistId, {offset, limit}).then(value => {
      this.playlistTracks.push(...value.items);
      this.trackListComponent.setListData(this.playlistTracks);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        return this.getPlaylistTracksTracks(parseInt(parts[parts.indexOf('offset') + 1], 10),
          parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        return Promise.resolve();
      }
    });
  }
}
