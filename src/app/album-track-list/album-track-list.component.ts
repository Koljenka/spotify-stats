import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {TrackListComponent} from '../track-list/track-list.component';
import {ApiConnectionService} from '../api-connection.service';
import {ActivatedRoute} from '@angular/router';
import TrackObjectSimplified = SpotifyApi.TrackObjectSimplified;

@Component({
  selector: 'app-album-track-list',
  templateUrl: './album-track-list.component.html',
  styleUrls: ['./album-track-list.component.css']
})
export class AlbumTrackListComponent implements OnInit, AfterViewInit {

  private albumId: string;
  private albumTracks: AlbumTrackObject[] = [];
  private albumTracksSource = new BehaviorSubject(new Array<AlbumTrackObject>());

  @ViewChild(TrackListComponent, {static: true}) trackListComponent: TrackListComponent;

  constructor(private api: ApiConnectionService, private route: ActivatedRoute) {
    this.albumId = this.route.snapshot.params.albumId;
  }

  ngOnInit(): void {
    this.trackListComponent.data = this.albumTracksSource.asObservable();
    this.api.getApi().getAlbum(this.albumId).then(value => {
      this.trackListComponent.setTitle(value.name + ' - SpotifyStats');
    });
  }

  ngAfterViewInit(): void {
    this.getAlbumTracks(0, 50).then(() => {
      this.albumTracksSource.next(this.albumTracks);
      this.albumTracksSource.complete();
    });
  }

  async getAlbumTracks(offset: number, limit: number): Promise<void> {
    await this.api.getApi().getAlbumTracks(this.albumId, {offset, limit}).then(value => {

      this.albumTracks.push(...value.items.map(val => {
        return {track: val};
      }));
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        return this.getAlbumTracks(parseInt(parts[parts.indexOf('offset') + 1], 10),
          parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        return Promise.resolve();
      }
    });
  }

}

export interface AlbumTrackObject {
  track: TrackObjectSimplified;
}
