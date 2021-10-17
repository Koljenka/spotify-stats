import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;
import {BehaviorSubject} from 'rxjs';
import PlaylistObjectFull = SpotifyApi.PlaylistObjectFull;
import {Title} from '@angular/platform-browser';
import {ContextObjectFull} from '../data-sharing.service';

@Component({
  selector: 'app-playlist-track-list',
  templateUrl: './playlist-track-list.component.html',
  styleUrls: ['./playlist-track-list.component.css']
})
export class PlaylistTrackListComponent implements OnInit, AfterViewInit {
  playlist: PlaylistObjectFull;
  backgroundColor = 'unset';
  playlistTracksSource = new BehaviorSubject(new Array<PlaylistTrackObject>());

  private playlistId: string;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private titleService: Title) {
    this.playlistId = this.route.snapshot.params.playlistId;
  }

  ngOnInit(): void {
    this.api.getApi().getPlaylist(this.playlistId).then(value => {
      this.playlist = value;
      this.titleService.setTitle(value.name + ' - SpotifyStats');
    });
  }

  ngAfterViewInit(): void {
    this.getALlPlaylistTracks();
  }

  getContextObject(): ContextObjectFull {
    return {contextType: 'playlist', content: this.playlist};
  }

  private getALlPlaylistTracks(offset: number = 0, limit: number = 50): void {
    this.api.getApi().getPlaylistTracks(this.playlistId, {offset, limit}).then(value => {
      this.playlistTracksSource.next(value.items);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        this.getALlPlaylistTracks(parseInt(parts[parts.indexOf('offset') + 1], 10),
          parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        this.playlistTracksSource.complete();
      }
    });
  }
}
