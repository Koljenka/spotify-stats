import {Component, OnInit, ViewChild} from '@angular/core';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {ApiConnectionService} from '../api-connection.service';
import {TrackListComponent} from '../track-list/track-list.component';

@Component({
  selector: 'app-saved-track-list',
  templateUrl: './saved-track-list.component.html',
  styleUrls: ['./saved-track-list.component.css']
})
export class SavedTrackListComponent implements OnInit {
  savedTracks: SavedTrackObject[] = [];

  @ViewChild(TrackListComponent, {static: true}) trackListComponent: TrackListComponent;

  constructor(private api: ApiConnectionService) {
  }

  ngOnInit(): void {
    this.trackListComponent.setTitle('My Library - SpotifyStats');
    this.getSavedTracks(0, 50).then(() => {
      this.trackListComponent.setDidFinishLoading(true);
    });
  }

  async getSavedTracks(offset: number, limit: number): Promise<void> {
    await this.api.getApi().getMySavedTracks({offset, limit}).then(value => {
      this.savedTracks.push(...value.items);
      this.trackListComponent.setListData(this.savedTracks);
      if (value.next != null) {
        const parts = value.next.split(/=|&|\?/);
        return this.getSavedTracks(parseInt(parts[parts.indexOf('offset') + 1], 10), parseInt(parts[parts.indexOf('limit') + 1], 10));
      } else {
        return Promise.resolve();
      }
    });
  }
}

