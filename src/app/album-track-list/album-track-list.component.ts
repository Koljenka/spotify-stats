import {AfterViewInit, Component, OnInit} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;
import AlbumObjectFull = SpotifyApi.AlbumObjectFull;
import {Title} from '@angular/platform-browser';
import {ContextObjectFull} from '../data-sharing.service';

@Component({
  selector: 'app-album-track-list',
  templateUrl: './album-track-list.component.html',
  styleUrls: ['./album-track-list.component.css']
})
export class AlbumTrackListComponent implements OnInit, AfterViewInit {
  album: AlbumObjectFull;
  context = new BehaviorSubject<ContextObjectFull>(null);
  backgroundColor = 'unset';
  albumTracksSource = new BehaviorSubject(new Array<AlbumTrackObject>());

  private albumId: string;


  constructor(private api: ApiConnectionService, private route: ActivatedRoute, private titleService: Title) {
    this.albumId = this.route.snapshot.params.albumId;
  }

  ngOnInit(): void {
    this.api.getApi().getAlbum(this.albumId).then(value => {
      this.album = value;
      this.context.next({type: 'context', contextType: 'album', content: this.album});
      this.context.complete();
      this.titleService.setTitle(value.name + ' - SpotifyStats');
    });
  }

  ngAfterViewInit(): void {
    this.getAlbumTracks();
  }

  private getAlbumTracks(offset: number = 0, limit: number = 50): void {
    this.api.getApi().getAlbumTracks(this.albumId, {offset, limit}).then(value => {
      this.albumTracksSource.next(value.items.map(val => ({track: val})));
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        this.getAlbumTracks(parseInt(parts[parts.indexOf('offset') + 1], 10), parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        this.albumTracksSource.complete();
      }
    });
  }

}

export interface AlbumTrackObject {
  track: TrackObjectSimplified;
}
