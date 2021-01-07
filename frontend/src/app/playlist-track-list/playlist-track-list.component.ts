import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import {TrackListComponent} from '../track-list/track-list.component';
import {BehaviorSubject} from 'rxjs';
import {PlayHistoryObjectFull} from '../track-history/track-history.component';

@Component({
  selector: 'app-playlist-track-list',
  templateUrl: './playlist-track-list.component.html',
  styleUrls: ['./playlist-track-list.component.css']
})
export class PlaylistTrackListComponent implements OnInit, AfterViewInit {
  private playlistId: string;
  private playlistTracks: PlaylistTrackObject[] = [];
  private playlistTracksSource = new BehaviorSubject(new Array<PlaylistTrackObject>());

  @ViewChild(TrackListComponent, {static: true}) trackListComponent: TrackListComponent;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute) {
    this.playlistId = this.route.snapshot.params.playlistId;
  }

  ngOnInit(): void {
    this.trackListComponent.data = this.playlistTracksSource.asObservable();
    this.api.getApi().getPlaylist(this.playlistId).then(value => {
      this.trackListComponent.setTitle(value.name + ' - SpotifyStats');
    });
  }

  ngAfterViewInit(): void {
    this.getPlaylistTracksTracks(0, 50).then(() => {
      this.playlistTracksSource.next(this.playlistTracks);
      this.playlistTracksSource.complete();
    });
  }

  async getPlaylistTracksTracks(offset: number, limit: number): Promise<void> {
    await this.api.getApi().getPlaylistTracks(this.playlistId, {offset, limit}).then(value => {
      this.playlistTracks.push(...value.items);
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
