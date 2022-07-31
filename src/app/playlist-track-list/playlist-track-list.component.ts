import {Component, OnInit} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import {BehaviorSubject} from 'rxjs';
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import {Title} from '@angular/platform-browser';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';

@Component({
  selector: 'app-playlist-track-list',
  templateUrl: './playlist-track-list.component.html',
  styleUrls: ['./playlist-track-list.component.css']
})
export class PlaylistTrackListComponent implements OnInit {
  playlist: PlaylistObjectFull;
  context = new BehaviorSubject<ContextObjectFull>(null);
  backgroundColor = 'unset';
  playlistTracksSource = new BehaviorSubject(new Array<PlaylistTrackObject>());

  private playlistId: string;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private titleService: Title,
              private dataSharing: DataSharingService) {
    this.playlistId = this.route.snapshot.params.playlistId;
  }

  ngOnInit(): void {
    this.dataSharing.getFullPlaylist(this.playlistId, `spotify:playlist:${this.playlistId}`).then(value => {
      this.playlist = value;
      this.context.next({type: 'context', contextType: 'playlist', content: this.playlist});
      this.context.complete();
      this.titleService.setTitle(value.name + ' - SpotifyStats');
      this.playlistTracksSource.next(this.playlist.tracks.items);
      if (this.playlist.tracks.next != null) {
        this.getALlPlaylistTracks(100, 100);
      }
    });
  }

  private getALlPlaylistTracks(offset: number = 0, limit: number = 100): void {
    this.api.getApi().getPlaylistTracks(this.playlistId, {offset, limit}).then(value => {
      this.playlistTracksSource.next(value.items.filter(v => v.track != null));
      if (value.next != null) {
        const parts = value.next.split(/[=&?]/);
        this.getALlPlaylistTracks(parseInt(parts[parts.indexOf('offset') + 1], 10),
          parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        this.playlistTracksSource.complete();
      }
    });
  }
}
