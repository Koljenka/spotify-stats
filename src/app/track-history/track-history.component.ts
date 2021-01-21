import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ContextObjectFull, DataSharingService} from '../data-sharing.service';
import {TrackListComponent} from '../track-list/track-list.component';
import {BehaviorSubject} from 'rxjs';
import SavedTrackObject = SpotifyApi.SavedTrackObject;
import AudioFeaturesObject = SpotifyApi.AudioFeaturesObject;

@Component({
  selector: 'app-track-history',
  templateUrl: './track-history.component.html',
  styleUrls: ['./track-history.component.css']
})
export class TrackHistoryComponent implements OnInit, AfterViewInit {
  private playbackHistorySource = new BehaviorSubject(new Array<PlayHistoryObjectFull>());
  didLoadTracks = false;

  @ViewChild(TrackListComponent, {static: true}) trackListComponent: TrackListComponent;

  constructor(public dataSharing: DataSharingService) {
  }

  ngOnInit(): void {
    this.trackListComponent.data = this.playbackHistorySource.asObservable();
    this.trackListComponent.setTitle('Playback History - SpotifyStats');
  }


  ngAfterViewInit(): void {
    this.dataSharing.playbackHistory.toPromise().then(() => {
      this.playbackHistorySource.next(this.dataSharing.getSavedTracks());
      this.didLoadTracks = true;
      this.playbackHistorySource.complete();
    });
  }
}

export interface PlaybackHistory {
  trackid: string;
  played_at: number;
  contexturi: string;
}

export interface PlayHistoryObjectFull extends SavedTrackObject {
  context: ContextObjectFull;
  audioFeatures: AudioFeaturesObject;
}
