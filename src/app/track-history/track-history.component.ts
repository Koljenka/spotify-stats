import {Component, OnInit, ViewChild} from '@angular/core';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import {DataSharingService} from '../data-sharing.service';
import {TrackListComponent} from '../track-list/track-list.component';

@Component({
  selector: 'app-track-history',
  templateUrl: './track-history.component.html',
  styleUrls: ['./track-history.component.css']
})
export class TrackHistoryComponent implements OnInit {
  savedTracks: PlayHistoryObjectFull[] = [];

  @ViewChild(TrackListComponent, {static: true}) trackListComponent: TrackListComponent;

  constructor(private dataSharing: DataSharingService) {
  }

  ngOnInit(): void {
    this.trackListComponent.setTitle('Playback History - SpotifyStats');
    if (this.dataSharing.didFinishLoadingHistory) {
      this.savedTracks = this.dataSharing.getPlaybackHistoryPart(0, 200);
      this.trackListComponent.setListData(this.savedTracks);
      this.trackListComponent.setDidFinishLoading(true);
    } else {
      this.dataSharing.playbackHistory.subscribe(history => {
        this.savedTracks = history;
        this.trackListComponent.setListData(this.savedTracks);
        this.trackListComponent.setDidFinishLoading(this.dataSharing.didFinishLoadingHistory);
      });
    }
  }
}

export interface PlaybackHistory {
  trackid: string;
  played_at: number;
  contexturi: string;
}

export interface PlayHistoryObjectFull extends SavedTrackObject {
  contextUri: string;
}
